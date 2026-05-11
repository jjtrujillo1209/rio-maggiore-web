'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export function About() {
  const stats = [
    { number: '500+', label: 'Eventos Anuales' },
    { number: '50,000m²', label: 'Área Total' },
    { number: '15,000+', label: 'Visitantes Promedio' },
    { number: '99%', label: 'Satisfacción Clientes' },
  ];

  return (
    <section id="sobre-nosotros" className="py-20 px-4 md:px-6 bg-white dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-neutral-900 dark:text-white">
            Sobre Cenexpo
          </h2>

          <div className="grid md:grid-cols-2 gap-10 mb-12">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-neutral-900 dark:text-white">
                Infraestructura de Primer Nivel
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                Somos el principal centro de exposiciones y eventos de la región, especializado en ofrecer espacios versátiles y modernos para ferias comerciales, convenciones, conferencias y eventos corporativos de gran escala.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-neutral-900 dark:text-white">
                Nuestra Misión
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                Proporcionar espacios excepcionales que faciliten la conexión de negocios, la innovación y el crecimiento empresarial en Armenia, Quindío, consolidándonos como destino preferido para eventos de envergadura regional e internacional.
              </p>

              <ul className="space-y-3">
                {[
                  'Más de 20 años de experiencia en gestión de eventos',
                  'Certificaciones internacionales de calidad',
                  'Equipo especializado disponible 24/7',
                  'Tecnología de punta en audiovisuales y telecomunicaciones',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-neutral-700 dark:text-neutral-300">
                    <span className="text-blue-700 font-bold mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-100 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30 rounded-xl p-8 flex items-center justify-center min-h-[400px]"
            >
              <div className="text-center">
                <Image
                  src="/logo-casgo.jpeg"
                  alt="CENEXPO by Grupo CASGO SAS"
                  width={192}
                  height={192}
                  className="object-contain mx-auto mb-4 rounded-xl bg-white p-3 shadow-md"
                />
                <p className="text-neutral-600 dark:text-neutral-400 text-lg font-semibold">
                  CENEXPO by Grupo CASGO SAS
                </p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg p-6 text-white text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-sm md:text-base opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
