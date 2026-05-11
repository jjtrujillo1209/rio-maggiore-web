/**
 * Through Air — Generador de base de datos de prospectos Bogotá
 * Genera ~1000 negocios con distribución realista de oportunidad digital
 */

const fs   = require('fs');
const path = require('path');

// ─── Seed para reproducibilidad ───────────────────────────────────────────────
let seed = 42;
function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }
function rInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function pickN(arr, n) {
  const a = [...arr]; const r = [];
  for (let i = 0; i < n; i++) { const j = rInt(0, a.length - 1); r.push(a.splice(j, 1)[0]); }
  return r;
}

// ─── Geografía ────────────────────────────────────────────────────────────────

const LOCALIDADES = [
  'Kennedy', 'Suba', 'Engativá', 'Bosa', 'Ciudad Bolívar', 'Usaquén',
  'Chapinero', 'Fontibón', 'Barrios Unidos', 'Teusaquillo', 'Puente Aranda',
  'Antonio Nariño', 'Rafael Uribe', 'San Cristóbal', 'Usme', 'Santa Fe',
  'Los Mártires', 'La Candelaria', 'Tunjuelito', 'Mártires',
];

const BARRIOS = {
  'Kennedy':        ['Kennedy Central','Timiza','Carvajal','Castilla','Américas','Patio Bonito','Villa Alsacia','El Tintal'],
  'Suba':           ['Suba Centro','Niza','Alhambra','La Floresta','Colina Campestre','Prado Veraniego','Rincón','Lisboa'],
  'Engativá':       ['Engativá','Álamos','Boyacá Real','Las Ferias','Garcés Navas','Minuto de Dios','Santa Helenita','Bolivia'],
  'Bosa':           ['Bosa Centro','El Porvenir','Apogeo','San Pablo','Olarte','El Recreo','San José','Occidental'],
  'Ciudad Bolívar': ['Lucero','El Tunal','Ismael Perdomo','Arborizadora','Jerusalem','Perdomo','Vista Hermosa','Perdomo Alto'],
  'Usaquén':        ['Usaquén','Santa Bárbara','Cedritos','Toberín','Los Cedros','Unicentro','Country Club','La Uribe'],
  'Chapinero':      ['Chapinero Alto','El Lago','Quinta Camacho','Rosales','Granada','Chicó Norte','Marly','Galerías'],
  'Fontibón':       ['Fontibón Centro','Modelia','Ciudad Salitre','El Dorado','San Pablo','Granjas','Capellanía','Zona Franca'],
  'Barrios Unidos': ['Doce de Octubre','Los Andes','La Castellana','Rionegro','Juan XXIII','El Triunfo','Provivienda','San Fernando'],
  'Teusaquillo':    ['Teusaquillo','Palermo','La Soledad','Nicolás de Federmán','Armenia','Marsella','Cundinamarca','Galerías'],
  'Puente Aranda':  ['Puente Aranda','Cundinamarca','Salazar Gómez','Ciudad Montes','Muzú','Zona Industrial','Alcázares','Pensilvania'],
  'Antonio Nariño': ['Antonio Nariño','Restrepo','Ciudad Jardín','Quiroga','Marco Fidel','San Antonio','Ilarco','Policarpa'],
  'Rafael Uribe':   ['Bravo Páez','Quiroga','Marruecos','Marco Fidel','La Picota','Olaya','Diana Turbay','Chiguaza'],
  'San Cristóbal':  ['San Cristóbal','La Victoria','Altamira','Veinte de Julio','Sosiego','La Gloria','Los Libertadores','Bello Horizonte'],
  'Usme':           ['Usme Centro','Alfonso López','Comuneros','Gran Yomasa','La Flora','Parque Entrenubes','Danubio','Chuniza'],
  'Santa Fe':       ['Santa Fe','La Macarena','La Candelaria','Las Cruces','Lourdes','Las Nieves','Voto Nacional','La Alameda'],
  'Los Mártires':   ['Los Mártires','Santa Isabel','La Favorita','Eduardo Santos','El Listón','Ricaurte','Paloquemao','Samper Mendoza'],
  'La Candelaria':  ['La Candelaria','Centro Histórico','Las Aguas','Egipto'],
  'Tunjuelito':     ['Tunjuelito','Abraham Lincoln','Venecia','San Benito','El Tunal','Fátima','Samore','Santa Lucía'],
  'Mártires':       ['Mártires','La Pepita','Eduardo Santos','Ricaurte'],
};

function getBarrio(localidad) {
  const b = BARRIOS[localidad];
  return b ? pick(b) : localidad;
}

function getDireccion(localidad) {
  const tipo = pick(['Cl','Cr','Tv','Dg','Av']);
  const num1 = rInt(1, 180);
  const num2 = rInt(1, 150);
  const num3 = rInt(1, 99);
  const sur  = ['Kennedy','Bosa','Ciudad Bolívar','Rafael Uribe','San Cristóbal','Usme','Tunjuelito'].includes(localidad) && rand() > 0.5 ? ' Sur' : '';
  return `${tipo} ${num1} #${num2}-${num3}${sur}`;
}

function getTelefono() {
  const prefijos = ['300','301','302','303','304','305','310','311','312','313','314','315','316','317','318','319','320','321','322','323','324'];
  return pick(prefijos) + rInt(1000000, 9999999);
}

function getTelefonoFijo() {
  // Líneas fijas Bogotá: indicativo 601 + 7 dígitos
  if (rand() < 0.4) return '601' + rInt(2000000, 7999999);
  return '';
}

function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '.')                      // reemplaza espacios/símbolos por punto
    .replace(/^\.+|\.+$/g, '')                        // quita puntos al inicio/fin
    .substring(0, 24);
}

function getEmail(nombre) {
  const dominios = ['gmail.com','hotmail.com','outlook.com','yahoo.com','gmail.com','gmail.com'];
  const slug     = slugify(nombre);
  const sufijos  = ['', rInt(1, 9), rInt(10, 99), '.bogota', '.col'];
  const sufijo   = pick(sufijos);
  return `${slug}${sufijo}@${pick(dominios)}`;
}

// ─── Tipos de negocio ─────────────────────────────────────────────────────────

const TIPOS = [
  {
    tipo: 'Restaurante', cantidad: 120,
    prefijos: ['Restaurante','Asadero','Cocina','Fritanga','Parrilla','Ajiaco','El Sabor de','Donde','Sazón','Rincón','Comidas'],
    nombres: ['El Corral','Mi Tolima','Doña Rosa','El Paisa','La Costa','Los Andes','El Llano','La Abuela','El Puerto','Don Carlos','La Hacienda','El Rancho','Mamá Lola','El Paraíso','Cielo Verde','Los Compadres','La Mesa Grande','El Buen Gusto','La Preferida','El Bodegón','El Arepazo','La Fogata','La Cazuela','El Jardín','Los Girasoles'],
    servicio: 'Redes Sociales + WhatsApp Bot',
  },
  {
    tipo: 'Cafetería', cantidad: 80,
    prefijos: ['Café','Cafetería','Coffee','Tostado','El Café de'],
    nombres: ['La Esquina','El Grano','Aroma','El Descanso','La Pausa','La Taza','El Molino','La Brisa','El Rincón','Bonito','El Barista','Cafeína','El Expreso','Punto Café','El Sabor','La Canela','El Merengue','Ritual','El Origen','Los Aromas'],
    servicio: 'Redes Sociales + Pautas Digitales',
  },
  {
    tipo: 'Peluquería', cantidad: 90,
    prefijos: ['Peluquería','Barber','Barbería','Corte','Studio Hair'],
    nombres: ['Estilo Único','La Tijera','El Original','King','Pro','La Moda','El Maestro','Classics','Bros','El As','Top Style','Fresh Cut','El Experto','Nueva Imagen','El Crack','Corte Real','Precision','Urban','El Maestro','Las Tijeras'],
    servicio: 'Redes Sociales + WhatsApp Bot',
  },
  {
    tipo: 'Estética', cantidad: 80,
    prefijos: ['Estética','Centro de Estética','Salón','Spa','Beauty','Studio','Nails'],
    nombres: ['Belleza Total','Glamour','Renew','Lorena','Renata','D\'Lujo','Top Model','Divina','Bella Vista','Chic','La Belleza','La Perla','Platino','Divine','Star','Bloom','Éclat','Aura','Elite','La Esencia'],
    servicio: 'Página Web + Redes Sociales',
  },
  {
    tipo: 'Clínica dental', cantidad: 80,
    prefijos: ['Clínica Dental','Odontología','Odonto','Centro Odontológico','Sonrisas'],
    nombres: ['Sonrisa Sana','Express','Los Pinos','Perfectas','Del Norte','Plus','Brillante','Nueva Sonrisa','Salud Oral','Dental Care','Blanca Sonrisa','Tu Sonrisa','Dental Plus','Orto Center','Smile','Activa','Integral','Avanzada','Moderna','La Cura'],
    servicio: 'Página Web + Lead Qualifier Bot',
  },
  {
    tipo: 'Gimnasio', cantidad: 70,
    prefijos: ['Gym','Gimnasio','CrossFit','Fitness','Centro Fitness','Body','Funcional'],
    nombres: ['Fuerza y Vida','Power','Shape','El Campeón','Bogotá Sur','Iron','Fit','El Titán','Activo','Pro','Gold','Plus','Center','Total','Max','Strong','Alpha','Ultra','Prime','Elite'],
    servicio: 'Redes Sociales + Lead Qualifier Bot',
  },
  {
    tipo: 'Veterinaria', cantidad: 60,
    prefijos: ['Veterinaria','Clínica Veterinaria','Pet','Centro Veterinario','Animal'],
    nombres: ['Animal Feliz','Huellitas','El Cuidado','Las Mascotas','Patitas','Amigos','San Francisco','La Salud','Bienestar','Happy Pet','Tu Mascota','El Nido','Peludo','El Arca','Zoovet','Animal Care','Fiel Amigo','Cuatro Patas','Mi Mascota','Salud Animal'],
    servicio: 'Página Web + WhatsApp Bot',
  },
  {
    tipo: 'Ferretería', cantidad: 60,
    prefijos: ['Ferretería','Ferrelectricos','Materiales','Constructor','El Tornillo'],
    nombres: ['El Constructor','La Herramienta','Don Tulio','El Clavo','El Martillo','El Tubo','El Ladrillo','Los Materiales','La Obra','La Varilla','El Cemento','La Pintura','Construya Ya','La Ferretería','El Perno','El Alambre','La Grapa','El Nivel','La Escuadra','El Bisagra'],
    servicio: 'Página Web + WhatsApp Bot',
  },
  {
    tipo: 'Tienda de ropa', cantidad: 80,
    prefijos: ['Boutique','Tienda','Fashion','Moda','Ropa'],
    nombres: ['Stilo','Glamour','Tendencia','La Moda','Chic','El Look','Fashion','Style','Vogue','Trendy','La Vitrina','New Style','Couture','Urban','Casual','La Pasarela','El Guardarropa','Tu Estilo','Chica','El Outfit'],
    servicio: 'E-Commerce + Pautas Digitales',
  },
  {
    tipo: 'Hotel', cantidad: 40,
    prefijos: ['Hotel','Hostal','Residencias','Suites','Apart Hotel'],
    nombres: ['El Dorado','La Sabana','Bogotá Real','El Centro','La Floresta','Los Andes','El Portal','El Viajero','La Cumbre','El Descanso','La Montaña','Colonial','El Remanso','Estelar','Villa Real','La Ceiba','El Prado','Confort','La Ruta','El Campanario'],
    servicio: 'E-Commerce + WhatsApp Bot',
  },
  {
    tipo: 'Papelería', cantidad: 50,
    prefijos: ['Papelería','Miscelánea','Útiles','Copias'],
    nombres: ['El Lápiz','La Página','La Hoja','El Libro','El Cuaderno','La Tinta','Escolar','El Borrador','La Pluma','La Regla','Estudiantil','La Resma','El Marcador','El Bolígrafo','Rápida','El Archivo','La Carpeta','La Agenda','El Arte','El Estudio'],
    servicio: 'Redes Sociales + WhatsApp Bot',
  },
  {
    tipo: 'Taller mecánico', cantidad: 60,
    prefijos: ['Taller','Mecánica','Servicio','Automotriz','Reparaciones'],
    nombres: ['El Motor','El Pistón','El Freno','La Transmisión','El Turbo','El Diferencial','El Tornillo','La Tuerca','El Cilindro','El Carburador','Auto Service','Car Fix','El Mecánico','El As del Motor','Pro Auto','El Especialista','La Herramienta','Quick Fix','El Técnico','El Diagnóstico'],
    servicio: 'Página Web + WhatsApp Bot',
  },
  {
    tipo: 'Farmacia', cantidad: 50,
    prefijos: ['Droguería','Farmacia','Salud','Medicamentos'],
    nombres: ['La Salud','La Cruz Verde','El Bienestar','La Vida','La Cura','Del Norte','Del Sur','Popular','La Esperanza','Central','Económica','La Mejor','El Remedio','La Pastilla','La Vitamina','Rápida','El Alivio','Tu Salud','Pronto','El Doctor'],
    servicio: 'Página Web + WhatsApp Bot',
  },
  {
    tipo: 'Jardín infantil', cantidad: 40,
    prefijos: ['Jardín Infantil','Colegio','Centro de Desarrollo','Preescolar','Nido'],
    nombres: ['Los Pequeños','Las Estrellas','El Arco Iris','El Girasol','Los Pollitos','La Semilla','El Paraíso','Los Sueños','La Luna','El Sol','Las Mariposas','Los Ositos','La Hormiguita','Los Patitos','El Rincón Mágico','Los Duendes','La Colmena','Las Hadas','El Bosque','El Jardín'],
    servicio: 'Página Web + Redes Sociales',
  },
  {
    tipo: 'Academia', cantidad: 50,
    prefijos: ['Academia','Instituto','Centro de Formación','Escuela','Clases'],
    nombres: ['Del Futuro','El Saber','La Excelencia','El Conocimiento','Integral','Digital','La Técnica','El Talento','Pro','Superior','Moderna','Del Arte','Musical','De Idiomas','Del Deporte','Emprendedores','Creativa','El Aprendizaje','La Mente','El Éxito'],
    servicio: 'Página Web + Lead Qualifier Bot',
  },
  {
    tipo: 'Lavandería', cantidad: 40,
    prefijos: ['Lavandería','Lavado','Servicio de Lavado','Clean','Lavanderías'],
    nombres: ['Express','La Espuma','El Jabón','Rapid Clean','La Burbuja','El Blanqueador','Súper Limpio','La Nube','Crystal','Fresh','La Plancha','El Vapor','Pro Clean','La Tina','El Remolino','Reluciente','La Centrifuga','Inmaculado','Listo','El Detergente'],
    servicio: 'Redes Sociales + WhatsApp Bot',
  },
  {
    tipo: 'Tienda naturista', cantidad: 30,
    prefijos: ['Tienda Naturista','Naturalmente','Verde','Orgánico','Bienestar'],
    nombres: ['La Naturaleza','El Árbol','La Raíz','El Aloe','La Semilla','El Germen','Verde Vida','Natural Plus','La Hierba','El Romero','La Manzanilla','Pura Vida','El Girasol','La Espirulina','Orgánica','La Planta','La Hoja Verde','La Hierba Santa','El Noni','La Moringa'],
    servicio: 'E-Commerce + Redes Sociales',
  },
  {
    tipo: 'Sala de belleza', cantidad: 50,
    prefijos: ['Sala de Belleza','Centro de Belleza','Beauty Room','Glam'],
    nombres: ['Exclusiva','Divina','Perfecta','Única','Selecta','Elegante','Sensación','Imagen Total','Bella','Radiante','Stunning','Luce Bien','La Imagen','El Brillo','La Estrella','Metamorfosis','Transformación','El Secreto','La Magia','El Arte'],
    servicio: 'Redes Sociales + WhatsApp Bot',
  },
  {
    tipo: 'Pizzería', cantidad: 30,
    prefijos: ['Pizzería','Pizza','La Pizza de','Pizza House'],
    nombres: ['La Italiana','Napoli','Roma','El Horno','La Leña','La Mozzarella','La Masa','Artesanal','Il Forno','La Nápoles','La Calabresa','Don Pizza','Pizza King','La Pepperoni','La Margherita','Express','Di Notte','La Caprese','El Queso','La Rúcula'],
    servicio: 'Redes Sociales + WhatsApp Bot',
  },
  {
    tipo: 'Heladería', cantidad: 20,
    prefijos: ['Heladería','Helados','Ice Cream','Frío y Rico'],
    nombres: ['La Fresa','El Copo','Frío Total','La Bola','Sweet','El Cono','La Crema','El Barquillo','Dulce Frío','Cool','El Granizado','La Paleta','Congelados','Frío Express','La Vainilla','El Chocolate','Sundae','La Taza','La Copa','El Waffle'],
    servicio: 'Redes Sociales + Pautas Digitales',
  },
];

// ─── Servicios ─────────────────────────────────────────────────────────────────

// ─── Scoring ──────────────────────────────────────────────────────────────────

function calcularScore(n) {
  let s = 0;
  if (n.sitio_web === 'No') s += 40;
  if (n.instagram === 'No') s += 20;
  const r = parseInt(n.resenas) || 0;
  if (r < 10)       s += 25;
  else if (r < 30)  s += 15;
  else if (r < 60)  s += 8;
  const rating = parseFloat(n.calificacion) || 0;
  if (rating > 0 && rating < 3.5) s += 15;
  else if (rating < 4.0)          s += 5;
  return Math.min(s, 90);
}

function nivelOportunidad(score) {
  if (score >= 60) return 'ALTA';
  if (score >= 35) return 'MEDIA';
  return 'BAJA';
}

// ─── Generación de negocios ───────────────────────────────────────────────────

function generarNombre(tipo) {
  const t = TIPOS.find(t => t.tipo === tipo);
  if (!t) return tipo;
  const prefijo = pick(t.prefijos);
  const nombre  = pick(t.nombres);
  return `${prefijo} ${nombre}`;
}

function generarCalificacion() {
  // Distribución realista: mayoría entre 3.5 y 4.7
  const base = rand();
  if (base < 0.05) return (2.5 + rand() * 0.9).toFixed(1);      // 5%  malo  2.5–3.4
  if (base < 0.30) return (3.5 + rand() * 0.4).toFixed(1);      // 25% regular 3.5–3.9
  if (base < 0.75) return (4.0 + rand() * 0.6).toFixed(1);      // 45% bueno 4.0–4.6
  return (4.7 + rand() * 0.3).toFixed(1);                        // 25% excelente 4.7–5.0
}

function generarResenas() {
  const base = rand();
  if (base < 0.35) return rInt(0, 9);     // 35% muy pocas
  if (base < 0.65) return rInt(10, 39);   // 30% pocas
  if (base < 0.85) return rInt(40, 99);   // 20% medias
  if (base < 0.95) return rInt(100, 299); // 10% muchas
  return rInt(300, 800);                   //  5% gran volumen
}

function generarPresenciaDigital() {
  // 75% sin web, 55% sin instagram — realidad de pymes en Bogotá
  const web  = rand() < 0.75 ? 'No' : 'Si';
  const insta = rand() < 0.55 ? 'No' : 'Si';
  return { web, insta };
}

// Nombres usados para evitar duplicados
const nombresUsados = new Set();

function generarNombreUnico(tipo) {
  let nombre;
  let intentos = 0;
  do {
    nombre = generarNombre(tipo);
    intentos++;
    if (intentos > 50) {
      nombre = `${nombre} ${rInt(2, 9)}`; // sufijo numérico como fallback
      break;
    }
  } while (nombresUsados.has(nombre));
  nombresUsados.add(nombre);
  return nombre;
}

const todos = [];

for (const config of TIPOS) {
  for (let i = 0; i < config.cantidad; i++) {
    const localidad  = pick(LOCALIDADES);
    const barrio     = getBarrio(localidad);
    const direccion  = getDireccion(localidad);
    const { web, insta } = generarPresenciaDigital();
    const calificacion = generarCalificacion();
    const resenas    = generarResenas();

    const nombreNeg = generarNombreUnico(config.tipo);
    const celular   = getTelefono();
    const negocio = {
      nombre:          nombreNeg,
      tipo:            config.tipo,
      localidad,
      barrio,
      direccion:       `${direccion}, ${barrio}`,
      celular,
      telefono_fijo:   getTelefonoFijo(),
      email:           getEmail(nombreNeg),
      sitio_web:       web,
      instagram:       insta,
      calificacion,
      resenas,
      servicio:        config.servicio,
    };

    negocio.score       = calcularScore(negocio);
    negocio.oportunidad = nivelOportunidad(negocio.score);

    todos.push(negocio);
  }
}

// ─── Ordenar: ALTA → MEDIA → BAJA, luego por score desc ──────────────────────

const ORDEN = { 'ALTA': 0, 'MEDIA': 1, 'BAJA': 2 };
todos.sort((a, b) =>
  ORDEN[a.oportunidad] - ORDEN[b.oportunidad] || b.score - a.score
);

// ─── Generar CSV ──────────────────────────────────────────────────────────────

const HEADERS = [
  '#', 'Nombre', 'Tipo', 'Localidad', 'Barrio', 'Dirección',
  'Celular', 'Teléfono Fijo', 'Email',
  'Sitio Web', 'Instagram', 'Calificación Google', 'Reseñas',
  'Score Digital', 'Oportunidad', 'Servicio Recomendado',
  'Estado', 'Contactado', 'Fecha Contacto', 'Notas',
];

function escapeCsv(val) {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

const rows = todos.map((n, i) => [
  i + 1,
  n.nombre,
  n.tipo,
  n.localidad,
  n.barrio,
  n.direccion,
  n.celular,
  n.telefono_fijo,
  n.email,
  n.sitio_web,
  n.instagram,
  n.calificacion,
  n.resenas,
  n.score,
  n.oportunidad,
  n.servicio,
  'Pendiente',
  'No',
  '',
  '',
].map(escapeCsv).join(','));

const csv = '\uFEFF' + HEADERS.map(escapeCsv).join(',') + '\n' + rows.join('\n') + '\n';

const timestamp = new Date().toISOString().slice(0, 10);
const outFile   = path.join(__dirname, `prospectos-bogota-${timestamp}.csv`);

fs.writeFileSync(outFile, csv, 'utf8');

// ─── Resumen ──────────────────────────────────────────────────────────────────

const alta  = todos.filter(n => n.oportunidad === 'ALTA').length;
const media = todos.filter(n => n.oportunidad === 'MEDIA').length;
const baja  = todos.filter(n => n.oportunidad === 'BAJA').length;
const sinWeb   = todos.filter(n => n.sitio_web === 'No').length;
const sinInsta = todos.filter(n => n.instagram  === 'No').length;

console.log('Through Air — Base de Datos Prospectos Bogotá');
console.log('════════════════════════════════════════════════');
console.log(`Total de negocios:      ${todos.length}`);
console.log(`Oportunidad ALTA:       ${alta}`);
console.log(`Oportunidad MEDIA:      ${media}`);
console.log(`Oportunidad BAJA:       ${baja}`);
console.log(`Sin sitio web:          ${sinWeb} (${Math.round(sinWeb/todos.length*100)}%)`);
console.log(`Sin Instagram:          ${sinInsta} (${Math.round(sinInsta/todos.length*100)}%)`);
console.log('');
console.log(`Archivo:  ${outFile}`);
console.log('════════════════════════════════════════════════');

// Resumen por tipo
console.log('\nDistribución por tipo:');
const porTipo = {};
todos.forEach(n => { porTipo[n.tipo] = (porTipo[n.tipo] || 0) + 1; });
Object.entries(porTipo)
  .sort((a, b) => b[1] - a[1])
  .forEach(([tipo, cnt]) => console.log(`  ${tipo.padEnd(20)} ${cnt}`));
