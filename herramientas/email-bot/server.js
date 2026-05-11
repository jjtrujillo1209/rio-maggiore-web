/**
 * Through Air — Email Bot Server
 * Genera correos de prospección personalizados usando Claude
 */

require('dotenv').config();

const express   = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path      = require('path');
const fs        = require('fs');

const app    = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Auto-carga del CSV más reciente ─────────────────────────────────────────

app.get('/api/prospects', (req, res) => {
  const dir = path.join(__dirname, '../../estrategia/prospector');
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('prospectos-bogota-') && f.endsWith('.csv'))
      .sort()
      .reverse();
    if (!files.length) return res.status(404).json({ error: 'No se encontró el CSV en estrategia/prospector/' });
    const csv = fs.readFileSync(path.join(dir, files[0]), 'utf8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM = `Eres el asistente de ventas de Through Air, una agencia de marketing y tecnología digital con sede en Bogotá, Colombia.

SOBRE THROUGH AIR:
Ayudamos a pequeños y medianos negocios de Bogotá a crecer digitalmente. Nuestros servicios:
• Pautas Digitales — campañas Meta Ads / Google Ads desde $2.000.000/mes
• Redes Sociales — gestión de Instagram, Facebook, TikTok desde $3.500.000/mes
• Página Web profesional — desde $2.000.000 (pago único)
• E-Commerce — tienda online completa desde $3.900.000 (pago único)
• WhatsApp Bot — atención automatizada 24/7 desde $2.000.000 + $500.000/mes
• Lead Qualifier Bot — calificación automática de leads desde $2.000.000 + $500.000/mes
• Pack Mensual (web + redes + soporte) — desde $4.000.000/mes

TU MISIÓN: Redactar correos de prospección en español para dueños de negocios en Bogotá.

REGLAS OBLIGATORIAS:
1. La PRIMERA LÍNEA del correo debe ser: "Asunto: [texto del asunto]"
2. Luego una línea en blanco y el cuerpo del correo
3. Menciona el negocio por su nombre
4. Señala específicamente lo que les falta digitalmente (datos del perfil)
5. Presenta el beneficio concreto para ESE tipo de negocio — no características genéricas
6. Un único CTA al final, claro y específico
7. Firma: "Equipo Through Air | Tecnología que trabaja para tu negocio"
8. CERO asteriscos, CERO markdown — texto plano con saltos de línea solamente
9. Tono humano, no robótico
10. Respeta el límite de palabras indicado`;

// ─── Endpoint de generación (SSE streaming) ───────────────────────────────────

app.post('/api/generar', async (req, res) => {
  const { prospecto, tono, longitud, cta, nota } = req.body;
  if (!prospecto?.Nombre) return res.status(400).json({ error: 'Falta el prospecto' });

  // Analizar brechas digitales
  const gaps = [];
  if (prospecto['Sitio Web'] === 'No') gaps.push('no tiene sitio web');
  if (prospecto.Instagram        === 'No') gaps.push('no tiene presencia en Instagram');
  const resenas = parseInt(prospecto['Reseñas'] || 0);
  if (resenas < 10)      gaps.push(`solo ${resenas} reseñas en Google Maps (muy baja visibilidad)`);
  else if (resenas < 30) gaps.push(`${resenas} reseñas en Google (por debajo del promedio del sector)`);
  const rating = parseFloat(prospecto['Calificación Google'] || 0);
  if (rating > 0 && rating < 3.5)        gaps.push(`calificación baja de ${rating}/5.0 estrellas`);
  else if (rating > 0 && rating < 4.0)   gaps.push(`calificación de ${rating}/5.0 con margen de mejora`);
  if (!gaps.length) gaps.push('oportunidad de fortalecer su presencia digital');

  const maxPalabras = longitud === 'corto' ? '110 palabras máximo' : '270 palabras máximo';

  const tonoDesc = {
    formal:   'Usa USTED. Tono profesional, respetuoso y formal.',
    amigable: 'Usa TÚ. Tono cercano, cálido y conversacional.',
    directo:  'Usa TÚ. Tono directo, al grano, sin rodeos — pero cordial.',
  }[tono] || 'Usa TÚ. Tono amigable y conversacional.';

  const ctaDesc = {
    llamada:  'Invita a agendar una llamada de 15 minutos sin compromiso',
    whatsapp: 'Invita a escribirle por WhatsApp para resolver dudas',
    web:      'Invita a visitar throughair.co para ver casos de éxito similares',
    correo:   'Invita a responder este correo con cualquier pregunta',
  }[cta] || 'Invita a responder este correo';

  const msg = `Redacta un correo de prospección para:

PERFIL:
- Negocio: ${prospecto.Nombre}
- Tipo: ${prospecto.Tipo}
- Ubicación: ${prospecto.Barrio ? `${prospecto.Barrio}, ` : ''}${prospecto.Localidad || 'Bogotá'}
- Calificación Google: ${rating > 0 ? `${rating}/5.0 con ${resenas} reseñas` : 'sin datos'}
- Sitio web: ${prospecto['Sitio Web']}
- Instagram: ${prospecto.Instagram}
- Score de oportunidad digital: ${prospecto['Score Digital']}/90 — ${prospecto.Oportunidad}
- Brechas identificadas: ${gaps.join('; ')}
- Servicio recomendado: ${prospecto['Servicio Recomendado']}

CONFIGURACIÓN:
- Tono: ${tonoDesc}
- Extensión: ${maxPalabras}
- CTA: ${ctaDesc}
${nota ? `- Nota del vendedor: ${nota}` : ''}

Recuerda: primera línea = "Asunto: [asunto]", luego línea en blanco, luego el correo.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = client.messages.stream({
      model:     'claude-opus-4-6',
      max_tokens: 700,
      system:    SYSTEM,
      messages:  [{ role: 'user', content: msg }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  const ok = !!process.env.ANTHROPIC_API_KEY;
  console.log(`\nThrough Air — Email Bot`);
  console.log(`URL:     http://localhost:${PORT}`);
  console.log(`API Key: ${ok ? '✓ configurada' : '✗ FALTA  →  crea un archivo .env con ANTHROPIC_API_KEY=sk-ant-...'}\n`);
});
