# Casos de Uso — Lead Qualifier Bot

Ejemplos del flujo de calificación y guía para adaptar el bot a diferentes industrias.

---

## Flujo de calificación estándar

El bot sigue una secuencia conversacional natural para extraer 5 datos clave:

```
Bot: Hola! Soy el asistente de Through Air. ¿Con quién tengo el gusto?

Cliente: Soy Carlos, de Moda Luna

Bot: Hola Carlos! Un placer. ¿Qué tipo de ayuda está buscando Moda Luna?
     (marketing digital, redes sociales, página web...)

Cliente: Queremos más ventas online, estamos en Instagram pero no nos va bien

Bot: Entendido. Para diseñar una estrategia adecuada, ¿tienen presupuesto
     mensual estimado para marketing digital?

Cliente: Podríamos invertir entre 2 y 3 millones al mes

Bot: Perfecto, eso encaja bien con nuestros servicios. ¿Cuál es su
     principal objetivo: más seguidores, más visitas a la web o
     ventas directas?

Cliente: Ventas directas, queremos vender más por Instagram y WhatsApp

Bot: Excelente Carlos. Con ese presupuesto y ese objetivo, Pautas
     Digitales + gestión de Redes Sociales es exactamente lo que
     necesitan. Juan José te contactará pronto para coordinar
     una llamada de 20 minutos. Gracias!
```

**Lead guardado:**
```json
{
  "nombre": "Carlos",
  "empresa": "Moda Luna",
  "servicio": "Pautas Digitales + Redes Sociales",
  "presupuesto": "$2.000.000 - $3.000.000/mes",
  "objetivo": "Aumentar ventas directas por Instagram y WhatsApp"
}
```

---

## Personalizar preguntas de calificación

Editar el `systemPrompt` en `index.js` para cambiar qué datos recolectar.

### Para agencia de viajes

```javascript
const systemPrompt = `
Eres un asesor de [Agencia de Viajes]. Califica prospectos extrayendo:
- nombre
- destino_interes (a dónde quieren viajar)
- fecha_viaje (cuándo aproximadamente)
- numero_viajeros
- presupuesto_total

Cuando tengas todos los datos, responde con el marcador:
LEAD_CALIFICADO: {"nombre":"...","destino":"...","fecha":"...","viajeros":N,"presupuesto":"..."}
`;
```

### Para clínica dental

```javascript
const systemPrompt = `
Eres recepcionista de [Clínica Dental]. Califica prospectos extrayendo:
- nombre
- tratamiento_interes (limpieza, ortodoncia, implantes, blanqueamiento)
- urgencia (rutina / dolor / estética)
- tiene_seguro (sí/no)
- disponibilidad (mañanas/tardes/fines de semana)

Cuando tengas todos los datos:
LEAD_CALIFICADO: {...}
`;
```

---

## Integrar con Google Sheets

Para que los leads lleguen directo a una hoja de cálculo:

```javascript
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function saveLeadToSheets(lead) {
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Leads!A:F',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        new Date().toLocaleDateString('es-CO'),
        lead.nombre,
        lead.empresa,
        lead.servicio,
        lead.presupuesto,
        lead.objetivo,
      ]],
    },
  });
}
```

---

## Notificaciones por email

Enviar un email a Juan José cuando llega un lead calificado:

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_FROM, pass: process.env.EMAIL_PASS }
});

async function notifyLead(lead) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: 'juanjo@throughair.co',
    subject: `Nuevo lead calificado: ${lead.nombre} - ${lead.empresa}`,
    html: `
      <h2>Nuevo lead listo para contactar</h2>
      <p><b>Nombre:</b> ${lead.nombre}</p>
      <p><b>Empresa:</b> ${lead.empresa}</p>
      <p><b>Servicio:</b> ${lead.servicio}</p>
      <p><b>Presupuesto:</b> ${lead.presupuesto}</p>
      <p><b>Objetivo:</b> ${lead.objetivo}</p>
    `
  });
}
```

---

## Ajustar nivel de calificación

### Calificación estricta (pide todo antes de cerrar)

En el prompt, agregar:
```
No marques el lead como calificado hasta tener los 5 datos completos.
Si el usuario evade una pregunta, inténtalo de otra forma antes de continuar.
```

### Calificación rápida (3 preguntas máximo)

```
Si llevas 3 intercambios, califica con la información que tengas aunque sea incompleta.
Marca campos faltantes como "por definir".
```

---

## Analítica básica

```javascript
// Agregar al inicio de index.js
let analytics = {
  sessions: 0,
  leads: 0,
  avgMessages: [],
};

// En POST /api/chat, cuando se crea sesión nueva:
analytics.sessions++;

// En saveLead:
analytics.leads++;
analytics.avgMessages.push(conversationHistory.get(sessionId).length);

// Nuevo endpoint:
app.get('/api/stats', (req, res) => {
  const avg = analytics.avgMessages.reduce((a, b) => a + b, 0) / analytics.avgMessages.length;
  res.json({
    totalSessions: analytics.sessions,
    qualifiedLeads: analytics.leads,
    conversionRate: `${((analytics.leads / analytics.sessions) * 100).toFixed(1)}%`,
    avgMessagesToQualify: Math.round(avg),
  });
});
```
