const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = path.resolve(__dirname, 'graficas');

const FILES = [
  // Individuales
  { src: 'individuales/01-pautas-digitales.html', out: 'jpg/individuales/01-pautas-digitales.jpg' },
  { src: 'individuales/02-redes-sociales.html',   out: 'jpg/individuales/02-redes-sociales.jpg' },
  { src: 'individuales/03-pagina-web.html',        out: 'jpg/individuales/03-pagina-web.jpg' },
  { src: 'individuales/04-ecommerce.html',         out: 'jpg/individuales/04-ecommerce.jpg' },
  { src: 'individuales/05-whatsapp-bot.html',      out: 'jpg/individuales/05-whatsapp-bot.jpg' },
  { src: 'individuales/06-lead-qualifier.html',    out: 'jpg/individuales/06-lead-qualifier.jpg' },
  { src: 'individuales/07-ecommerce-bot.html',     out: 'jpg/individuales/07-ecommerce-bot.jpg' },
  { src: 'individuales/08-pack-mensual.html',      out: 'jpg/individuales/08-pack-mensual.jpg' },
  { src: 'individuales/09-bots-ia.html',           out: 'jpg/individuales/09-bots-ia.jpg' },
  { src: 'individuales/10-estrategia-digital.html',out: 'jpg/individuales/10-estrategia-digital.jpg' },
  // Combinadas
  { src: 'combinadas/01-servicios-grid.html',   out: 'jpg/combinadas/01-servicios-grid.jpg' },
  { src: 'combinadas/02-propuesta-valor.html',  out: 'jpg/combinadas/02-propuesta-valor.jpg' },
  { src: 'combinadas/03-como-funciona.html',    out: 'jpg/combinadas/03-como-funciona.jpg' },
  { src: 'combinadas/04-precios.html',          out: 'jpg/combinadas/04-precios.jpg' },
  { src: 'combinadas/05-manifiesto.html',       out: 'jpg/combinadas/05-manifiesto.jpg' },
];

async function exportAll() {
  // Ensure output dirs exist
  fs.mkdirSync(path.join(BASE, 'jpg/individuales'), { recursive: true });
  fs.mkdirSync(path.join(BASE, 'jpg/combinadas'), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to exactly 1080×1080
  await page.setViewportSize({ width: 1080, height: 1080 });

  for (const file of FILES) {
    const srcPath = `file://${path.join(BASE, file.src)}`;
    const outPath = path.join(BASE, file.out);

    process.stdout.write(`Exporting ${file.src} ...`);

    await page.goto(srcPath, { waitUntil: 'networkidle' });

    // Wait a bit for fonts and animations
    await page.waitForTimeout(800);

    await page.screenshot({
      path: outPath,
      type: 'jpeg',
      quality: 95,
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
    });

    console.log(` done -> ${file.out}`);
  }

  await browser.close();
  console.log(`\nExported ${FILES.length} files to graficas/jpg/`);
}

exportAll().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
