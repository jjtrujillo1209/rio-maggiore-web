'use client';

import { motion } from 'framer-motion';

const services = [
  {
    title: 'Espacios Versátiles',
    description: 'Coliseos, salones modulables y pabellones configurables según tus necesidades específicas.',
    items: ['Coliseos 10,000+ personas', 'Salones multiuso dividibles', 'Pabellones técnicamente equipados'],
  },
  {
    title: 'Servicios Técnicos',
    description: 'Equipamiento de clase mundial para todas tus necesidades audiovisuales y tecnológicas.',
    items: ['Sistemas de sonido profesional', 'Proyecciones 4K y mapping 3D', 'Telecomunicaciones integradas'],
  },
  {
    title: 'Servicios de Catering',
    description: 'Opciones gastronómicas variadas con chefs especializados en eventos corporativos.',
    items: ['Menús personalizados', 'Servicio de bebidas premium', 'Montajes temáticos'],
  },
  {
    title: 'Coordinación Integral',
    description: 'Equipo de profesionales que gestiona cada detalle de tu evento.',
    items: ['Planificación y coordinación', 'Seguridad y logística', 'Asesoramiento personalizado'],
  },
  {
    title: 'Estacionamiento y Transporte',
    description: 'Facilidades de acceso y movilidad para tus asistentes.',
    items: ['Estacionamiento cubierto', 'Servicios de shuttle', 'Zonas VIP exclusivas'],
  },
  {
    title: 'Marketing y Promoción',
    description: 'Apoyo en la difusión y promoción de tu evento.',
    items: ['Estrategias digitales', 'Publicidad local y regional', 'Social media management'],
  },
];

export function Services() {
  return (
    <section id="servicios" className="py-20 px-4 md:px-6 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900 dark:text-white">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400">
            Ofrecemos una gama completa de servicios diseñados para hacer de tu evento una experiencia memorable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-neutral-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-white">
                {service.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                    <span className="text-blue-700 font-bold mt-1">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
