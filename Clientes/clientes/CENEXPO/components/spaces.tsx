'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type SpaceGalleryImage = {
  src: string;
  alt: string;
  caption: string;
};

type Space = {
  title: string;
  capacity: string;
  area: string;
  type: string;
  description: string;
  features: string[];
  porHora: string;
  minHoras: string;
  porDia: string;
  mapImage: string;
  mapAlt: string;
  galleryImages?: SpaceGalleryImage[];
};

const spaces: Space[] = [
  {
    title: 'Coliseo Gran Riviera',
    capacity: '10,000',
    area: '18,000 m²',
    type: 'Coliseo',
    description: 'Gran coliseo multipropósito para conciertos, ferias nacionales, convenciones y eventos deportivos de gran escala. Infraestructura técnica de clase mundial con acceso de carga y amplio parqueadero.',
    features: ['Sonido profesional', 'Pantallas gigantes', 'Camerinos VIP', 'Acceso de carga'],
    porHora: '$4.500.000',
    minHoras: '4',
    porDia: '$22.000.000',
    mapImage: '/cenexpo-map-segments/coliseo-gran-riviera.webp',
    mapAlt: 'Segmento del plano de aforos para Coliseo Gran Riviera',
    galleryImages: [
      {
        src: '/cenexpo-spaces/coliseo-gran-riviera-interior-01.webp',
        alt: 'Vista frontal del Coliseo Gran Riviera con graderías y montaje de sillas',
        caption: 'Vista frontal del coliseo con montaje para evento',
      },
      {
        src: '/cenexpo-spaces/coliseo-gran-riviera-interior-02.webp',
        alt: 'Vista lateral del Coliseo Gran Riviera con graderías, escenario y zona central',
        caption: 'Vista lateral del montaje y graderías',
      },
    ],
  },
  {
    title: 'Pabellón San Carlos',
    capacity: '5,000+',
    area: '20,000 m²',
    type: 'Pabellón',
    description: 'Pabellón techado de gran formato ideal para ferias comerciales, exposiciones industriales y showrooms. Puertas de acceso amplias para maquinaria y stands.',
    features: ['Puertas de 6m de alto', 'Conexiones eléctricas', 'Wifi industrial', 'Bodega de carga'],
    porHora: '$2.800.000',
    minHoras: '4',
    porDia: '$14.000.000',
    mapImage: '/cenexpo-map-segments/pabellon-san-carlos.webp',
    mapAlt: 'Segmento del plano de aforos para Pabellón San Carlos',
  },
  {
    title: 'Salones Gótica',
    capacity: '800',
    area: '1,200 m² c/u',
    type: 'Salón (x2)',
    description: 'Dos salones modulables que pueden unificarse para mayor capacidad. Perfectos para conferencias, graduaciones, lanzamientos y eventos corporativos.',
    features: ['Divisibles en 2 secciones', 'Climatización', 'Tarima incluida', 'Equipo audiovisual'],
    porHora: '$650.000',
    minHoras: '3',
    porDia: '$3.200.000',
    mapImage: '/cenexpo-map-segments/salones-gotica.webp',
    mapAlt: 'Segmento del plano de aforos para Salones Gótica',
  },
  {
    title: 'Salón Santa Marta',
    capacity: '800',
    area: '800 m²',
    type: 'Salón',
    description: 'Este espacio hace parte del Mall Santa Marta. Se hace referencia a los espacios fuera de los locales. La plazoleta de comidas es de tipo outdoor.',
    features: ['Decoración personalizable', 'Cocina equipada', 'Iluminación ambiental', 'Acceso VIP'],
    porHora: '$720.000',
    minHoras: '4',
    porDia: "$5'760.000",
    mapImage: '/cenexpo-map-segments/salon-santa-marta.webp',
    mapAlt: 'Segmento del plano de aforos para Salón Santa Marta',
  },
  {
    title: 'Fonda Milagros',
    capacity: '300',
    area: '600 m²',
    type: 'Fonda',
    description: 'Espacio con ambientación típica colombiana, ideal para eventos culturales, celebraciones tradicionales, fiestas temáticas y activaciones de marca.',
    features: ['Ambientación típica', 'Barra de bebidas', 'Pista de baile', 'Zona de fogón'],
    porHora: '$380.000',
    minHoras: '3',
    porDia: '$1.800.000',
    mapImage: '/cenexpo-map-segments/fonda-milagros.webp',
    mapAlt: 'Segmento del plano de aforos para Fonda Milagros',
  },
  {
    title: 'Plazoleta de Banderas',
    capacity: '3,000',
    area: '5,000 m² (3 áreas)',
    type: 'Plazoleta exterior',
    description: 'Tres plazoletas al aire libre conectadas entre sí. Perfectas para eventos outdoor, food trucks, conciertos abiertos, inauguraciones y actividades recreativas.',
    features: ['Área 1, 2 y 3 separables', 'Zona verde', 'Puntos de luz exterior', 'Carpa instalable'],
    porHora: '$280.000',
    minHoras: '3',
    porDia: '$1.200.000',
    mapImage: '/cenexpo-map-segments/plazoleta-banderas.webp',
    mapAlt: 'Segmento del plano de aforos para Plazoleta de Banderas',
  },
];

function SpaceModal({ space, onClose }: { space: Space; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors text-sm font-bold"
          >
            ✕
          </button>

          {/* Título */}
          <div className="bg-white dark:bg-neutral-900 px-8 pt-8 pb-4 text-center border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-2 block">{space.type}</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white uppercase tracking-wide">
              {space.title}
            </h2>
          </div>

          {/* Descripción */}
          <div className="px-8 py-5 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
            <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed uppercase font-medium">
              {space.description}
            </p>
          </div>

          {/* Contenido en dos columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-700">

            {/* Columna izquierda — Tabla aforo/renta */}
            <div className="p-8">
              <h3 className="font-heading text-xl font-bold text-center text-neutral-900 dark:text-white uppercase tracking-wide mb-6">
                Aforo de Personas
              </h3>
              <table className="w-full border-collapse overflow-hidden rounded-xl border border-blue-700">
                <tbody>
                  <tr className="border-b border-blue-600">
                    <td className="bg-blue-700 text-white font-bold text-xs uppercase tracking-wide px-4 py-3 w-1/2 text-center">
                      Nombre
                    </td>
                    <td className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-3 text-center font-semibold text-sm">
                      {space.title}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-600">
                    <td className="bg-blue-700 text-white font-bold text-xs uppercase tracking-wide px-4 py-3 text-center">
                      Total Aforo
                    </td>
                    <td className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-3 text-center font-bold text-lg">
                      {space.capacity}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-600">
                    <td className="bg-blue-700 text-white font-bold text-xs uppercase tracking-wide px-4 py-3 text-center leading-snug">
                      Renta por Hora<br />
                      <span className="font-normal text-blue-200">({space.minHoras} horas mínimo)</span>
                    </td>
                    <td className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-3 text-center font-bold">
                      {space.porHora} <span className="text-xs font-normal text-neutral-500">+ IVA</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-blue-700 text-white font-bold text-xs uppercase tracking-wide px-4 py-3 text-center">
                      Renta por Día
                    </td>
                    <td className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-3 text-center font-bold">
                      {space.porDia} <span className="text-xs font-normal text-neutral-500">+ IVA</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Columna derecha — Ubicación */}
            <div className="p-8">
              <h3 className="font-heading text-xl font-bold text-center text-neutral-900 dark:text-white uppercase tracking-wide mb-6">
                Ubicación
              </h3>
              <div className="relative w-full aspect-[4/3] bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <Image
                  src={space.mapImage}
                  alt={space.mapAlt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-contain"
                  loading="lazy"
                />
              </div>
              <p className="mt-3 text-xs text-center text-neutral-500 dark:text-neutral-400">
                Segmento del plano de aforos · {space.area}
              </p>
              {/* Features */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                {space.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {space.galleryImages && space.galleryImages.length > 0 && (
            <div className="px-8 py-7 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
              <h3 className="font-heading text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-wide mb-5">
                Imágenes del espacio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {space.galleryImages.map((image) => (
                  <figure key={image.src} className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950">
                    <div className="relative aspect-video">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                    <figcaption className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {image.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="px-8 py-5 bg-blue-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/80 text-sm">¿Listo para reservar este espacio?</p>
            <a
              href="#contacto"
              onClick={onClose}
              className="bg-white text-blue-700 font-bold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm whitespace-nowrap"
            >
              Solicitar cotización →
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function Spaces() {
  const [selected, setSelected] = useState<Space | null>(null);

  return (
    <section id="espacios" className="py-20 px-4 md:px-6 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 text-neutral-900 dark:text-white">
            Nuestros Espacios
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mb-2">
            6 escenarios únicos para todo tipo de evento. Haz clic en cualquier espacio para ver costos y detalles.
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Toca una tarjeta para ver tarifas y metraje
          </span>
        </motion.div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 mb-24">
          {spaces.map((space, idx) => (
            <motion.button
              key={idx}
              onClick={() => setSelected(space)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(29,78,216,0.15)' }}
              whileTap={{ scale: 0.98 }}
              className="text-left bg-white dark:bg-neutral-800 rounded-xl p-7 border border-neutral-100 dark:border-neutral-700 flex flex-col cursor-pointer group transition-colors hover:border-blue-300 dark:hover:border-blue-700"
            >
              <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-lg border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-950">
                <Image
                  src={space.mapImage}
                  alt={space.mapAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                  {space.type}
                </span>
                <span className="text-xs text-neutral-400 group-hover:text-blue-600 transition-colors font-medium">
                  Ver detalles →
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold mb-3 text-neutral-900 dark:text-white">
                {space.title}
              </h3>
              <div className="flex gap-4 mb-4">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="block font-semibold text-neutral-800 dark:text-neutral-200">{space.capacity} pers.</span>
                  Aforo
                </div>
                <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="block font-semibold text-neutral-800 dark:text-neutral-200">{space.area}</span>
                  Área
                </div>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-5 flex-1 line-clamp-2">
                {space.description}
              </p>
              <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                <div>
                  <span className="text-xs text-neutral-400">Desde</span>
                  <div className="font-heading text-lg font-bold text-blue-700">{space.porHora}<span className="text-xs font-normal text-neutral-400">/hr</span></div>
                </div>
                <div className="bg-blue-700 group-hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  Ver más
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Tabla resumen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          id="tarifas"
        >
          <div className="mb-8">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3 text-neutral-900 dark:text-white">
              Tabla de Tarifas
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Precios en COP · IVA no incluido · Haz clic en una fila para ver el detalle completo.
            </p>
          </div>

          {/* Mobile: card list */}
          <div className="sm:hidden flex flex-col gap-3">
            {spaces.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelected(s)}
                className="w-full text-left bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 active:bg-blue-50 dark:active:bg-blue-950/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">{s.title}</span>
                  <span className="text-xs text-neutral-400 ml-2 flex-shrink-0">{s.area}</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400">Aforo </span>
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">{s.capacity}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Hora </span>
                    <span className="text-blue-700 dark:text-blue-400 font-semibold">{s.porHora}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Día </span>
                    <span className="text-neutral-900 dark:text-white font-bold">{s.porDia}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop: full table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="text-left px-6 py-4 font-semibold">Espacio</th>
                  <th className="text-left px-6 py-4 font-semibold">Área</th>
                  <th className="text-right px-6 py-4 font-semibold">Aforo</th>
                  <th className="text-right px-6 py-4 font-semibold">Por hora</th>
                  <th className="text-right px-6 py-4 font-semibold">Por día</th>
                </tr>
              </thead>
              <tbody>
                {spaces.map((s, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelected(s)}
                    className={`border-t border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors ${
                      idx % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50 dark:bg-neutral-850'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{s.title}</td>
                    <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{s.area}</td>
                    <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">{s.capacity}</td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-700 dark:text-blue-400">{s.porHora}</td>
                    <td className="px-6 py-4 text-right font-bold text-neutral-900 dark:text-white">{s.porDia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <a
              href="#contacto"
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Solicitar cotización
            </a>
          </div>
        </motion.div>
      </div>

      {selected && <SpaceModal space={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
