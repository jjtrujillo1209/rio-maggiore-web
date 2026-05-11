/**
 * Through Air — Prospector de Clientes Bogotá
 * Scraper de Google Maps para identificar negocios con oportunidades digitales.
 *
 * Uso:
 *   node index.js                     — Busca todos los tipos de negocio
 *   node index.js --tipo restaurante  — Busca solo ese tipo
 *   node index.js --max 50            — Limita a 50 resultados por búsqueda
 */

const { chromium } = require('playwright');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// ─── Configuración ────────────────────────────────────────────────────────────

const ZONA = 'Bogotá Colombia';

const TIPOS_NEGOCIO = [
  { tipo: 'restaurante',     servicio: 'Redes Sociales + WhatsApp Bot' },
  { tipo: 'peluquería',      servicio: 'Redes Sociales + WhatsApp Bot' },
  { tipo: 'estética',        servicio: 'Página Web + Redes Sociales' },
  { tipo: 'clínica dental',  servicio: 'Página Web + Lead Qualifier Bot' },
  { tipo: 'gym',             servicio: 'Redes Sociales + Lead Qualifier Bot' },
  { tipo: 'hotel',           servicio: 'E-Commerce + WhatsApp Bot' },
  { tipo: 'tienda ropa',     servicio: 'E-Commerce + Pautas Digitales' },
  { tipo: 'ferretería',      servicio: 'Página Web + WhatsApp Bot' },
  { tipo: 'veterinaria',     servicio: 'Página Web + WhatsApp Bot' },
  { tipo: 'cafetería',       servicio: 'Redes Sociales + Pautas Digitales' },
];

const MAX_POR_BUSQUEDA = 20; // Resultados a intentar extraer por tipo
const DELAY_MS = 1500;       // Pausa entre acciones (ms)

// ─── Scoring de oportunidad digital ──────────────────────────────────────────
// Score más alto = más oportunidad para Through Air

function calcularScore(negocio) {
  let score = 0;

  // Sin sitio web = oportunidad alta
  if (!negocio.sitioWeb) score += 40;

  // Pocas reseñas = baja presencia digital
  const reviews = parseInt(negocio.totalReviews) || 0;
  if (reviews < 10)   score += 30;
  else if (reviews < 50)  score += 20;
  else if (reviews < 100) score += 10;

  // Calificación media o baja = oportunidad de mejora
  const rating = parseFloat(negocio.calificacion) || 0;
  if (rating > 0 && rating < 3.5) score += 20;
  else if (rating >= 3.5 && rating < 4.0) score += 10;

  // Máximo 90 puntos
  return Math.min(score, 90);
}

function nivelOportunidad(score) {
  if (score >= 60) return 'ALTA';
  if (score >= 30) return 'MEDIA';
  return 'BAJA';
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

async function buscarNegocios(page, tipo) {
  const query = encodeURIComponent(`${tipo} en ${ZONA}`);
  const url = `https://www.google.com/maps/search/${query}`;

  console.log(`\n Buscando: ${tipo} en ${ZONA}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(DELAY_MS * 2);

  const resultados = [];

  // Scroll para cargar más resultados
  const scrollPanel = page.locator('[role="feed"]').first();
  for (let i = 0; i < 6; i++) {
    try {
      await scrollPanel.evaluate(el => el.scrollTop += 600);
      await page.waitForTimeout(DELAY_MS);
    } catch {}
  }

  // Obtener todos los resultados listados
  const items = await page.locator('[role="feed"] a[href*="/maps/place/"]').all();
  console.log(`   Encontrados: ${items.length} resultados`);

  const limite = Math.min(items.length, MAX_POR_BUSQUEDA);

  for (let i = 0; i < limite; i++) {
    try {
      const item = items[i];

      // Hacer click para abrir el detalle
      await item.click();
      await page.waitForTimeout(DELAY_MS * 1.5);

      // Extraer datos del panel lateral
      const datos = await page.evaluate(() => {
        const getText = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.textContent.trim() : '';
        };

        // Nombre
        const nombre = getText('h1.DUwDvf, h1[data-attrid="title"]') ||
                       getText('[data-item-id] h1') ||
                       document.querySelector('h1')?.textContent?.trim() || '';

        // Calificación y reseñas
        const ratingEl = document.querySelector('[role="img"][aria-label*="estrellas"], [role="img"][aria-label*="stars"]');
        const calificacion = ratingEl?.getAttribute('aria-label')?.match(/[\d.]+/)?.[0] || '';

        const reviewsEl = document.querySelector('button[aria-label*="reseña"], button[aria-label*="review"]');
        const totalReviews = reviewsEl?.textContent?.match(/\d+/)?.[0] || '0';

        // Dirección
        const dirEl = document.querySelector('[data-item-id*="address"] .Io6YTe, button[data-item-id*="address"]');
        const direccion = dirEl?.textContent?.trim() || '';

        // Teléfono
        const telEl = document.querySelector('[data-item-id*="phone"] .Io6YTe, button[data-item-id*="phone"] .Io6YTe');
        const telefono = telEl?.textContent?.trim() || '';

        // Sitio web
        const webEl = document.querySelector('a[data-item-id*="authority"], a[aria-label*="Sitio web"], a[aria-label*="Website"]');
        const sitioWeb = webEl ? 'Sí' : '';

        return { nombre, calificacion, totalReviews, direccion, telefono, sitioWeb };
      });

      if (!datos.nombre) continue;

      const negocio = {
        nombre: datos.nombre,
        tipo,
        direccion: datos.direccion,
        telefono: datos.telefono,
        sitioWeb: datos.sitioWeb === 'Sí',
        calificacion: datos.calificacion,
        totalReviews: datos.totalReviews,
      };

      negocio.score = calcularScore(negocio);
      negocio.oportunidad = nivelOportunidad(negocio.score);

      // Encontrar el servicio recomendado del tipo de negocio
      const tipoConfig = TIPOS_NEGOCIO.find(t => t.tipo === tipo);
      negocio.servicioRecomendado = tipoConfig?.servicio || 'Consultoría Digital';

      resultados.push(negocio);
      process.stdout.write('.');

    } catch (err) {
      process.stdout.write('x');
    }
  }

  console.log(` — ${resultados.length} extraídos`);
  return resultados;
}

// ─── Generar Excel ────────────────────────────────────────────────────────────

function generarExcel(negocios, outputPath) {
  // Ordenar por score descendente
  negocios.sort((a, b) => b.score - a.score);

  const rows = negocios.map((n, i) => ({
    '#': i + 1,
    'Nombre': n.nombre,
    'Tipo': n.tipo,
    'Dirección': n.direccion,
    'Teléfono': n.telefono,
    'Sitio Web': n.sitioWeb ? 'Sí' : 'No',
    'Calificación': n.calificacion || 'N/D',
    'Reseñas': n.totalReviews || '0',
    'Score Digital': n.score,
    'Oportunidad': n.oportunidad,
    'Servicio Recomendado': n.servicioRecomendado,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 4 },   // #
    { wch: 36 },  // Nombre
    { wch: 16 },  // Tipo
    { wch: 40 },  // Dirección
    { wch: 16 },  // Teléfono
    { wch: 10 },  // Sitio Web
    { wch: 12 },  // Calificación
    { wch: 10 },  // Reseñas
    { wch: 14 },  // Score Digital
    { wch: 12 },  // Oportunidad
    { wch: 36 },  // Servicio Recomendado
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Prospectos');

  // Hoja de resumen por oportunidad
  const alta    = negocios.filter(n => n.oportunidad === 'ALTA').length;
  const media   = negocios.filter(n => n.oportunidad === 'MEDIA').length;
  const baja    = negocios.filter(n => n.oportunidad === 'BAJA').length;
  const sinWeb  = negocios.filter(n => !n.sitioWeb).length;

  const resumen = [
    { Métrica: 'Total de negocios encontrados', Valor: negocios.length },
    { Métrica: 'Oportunidad ALTA (Score ≥ 60)', Valor: alta },
    { Métrica: 'Oportunidad MEDIA (Score 30-59)', Valor: media },
    { Métrica: 'Oportunidad BAJA (Score < 30)', Valor: baja },
    { Métrica: 'Sin sitio web (mayor oportunidad)', Valor: sinWeb },
    { Métrica: 'Fecha de búsqueda', Valor: new Date().toLocaleDateString('es-CO') },
    { Métrica: 'Zona buscada', Valor: ZONA },
  ];

  const wsResumen = XLSX.utils.json_to_sheet(resumen);
  wsResumen['!cols'] = [{ wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  XLSX.writeFile(wb, outputPath);
  return rows.length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const tipoArg = args[args.indexOf('--tipo') + 1];
  const maxArg  = args[args.indexOf('--max') + 1];
  if (maxArg) Object.assign({ MAX_POR_BUSQUEDA: parseInt(maxArg) });

  const tiposABuscar = tipoArg
    ? TIPOS_NEGOCIO.filter(t => t.tipo.includes(tipoArg))
    : TIPOS_NEGOCIO;

  if (tiposABuscar.length === 0) {
    console.error(`No se encontró el tipo: ${tipoArg}`);
    process.exit(1);
  }

  console.log('Through Air — Prospector de Clientes Bogotá');
  console.log(`Buscando ${tiposABuscar.length} tipos de negocio...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'es-CO',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0',
  });
  const page = await context.newPage();

  // Aceptar cookies si aparece el banner
  try {
    await page.goto('https://www.google.com/maps', { timeout: 15000 });
    const acceptBtn = page.locator('button:has-text("Accept all"), button:has-text("Aceptar todo")').first();
    if (await acceptBtn.isVisible({ timeout: 3000 })) await acceptBtn.click();
  } catch {}

  const todosLosNegocios = [];

  for (const { tipo } of tiposABuscar) {
    const negocios = await buscarNegocios(page, tipo);
    todosLosNegocios.push(...negocios);
    await page.waitForTimeout(DELAY_MS);
  }

  await browser.close();

  if (todosLosNegocios.length === 0) {
    console.log('\nNo se encontraron resultados.');
    return;
  }

  // Eliminar duplicados por nombre
  const vistos = new Set();
  const sinDuplicados = todosLosNegocios.filter(n => {
    const key = n.nombre.toLowerCase().trim();
    if (vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const outFile = path.join(__dirname, `prospectos-bogota-${timestamp}.xlsx`);

  const total = generarExcel(sinDuplicados, outFile);

  console.log('\n─────────────────────────────────────────');
  console.log(`Prospectos encontrados:  ${total}`);
  console.log(`Sin sitio web:           ${sinDuplicados.filter(n => !n.sitioWeb).length}`);
  console.log(`Oportunidad ALTA:        ${sinDuplicados.filter(n => n.oportunidad === 'ALTA').length}`);
  console.log(`Oportunidad MEDIA:       ${sinDuplicados.filter(n => n.oportunidad === 'MEDIA').length}`);
  console.log(`Archivo guardado en:     ${outFile}`);
  console.log('─────────────────────────────────────────');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
