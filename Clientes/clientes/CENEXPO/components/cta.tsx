'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-20 px-4 md:px-6 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center text-white"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          ¿Listo para tu Próximo Evento?
        </h2>
        <p className="text-xl md:text-2xl mb-8 opacity-95">
          Contacta nuestro equipo de expertos hoy mismo
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="tel:+573001234567">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 font-bold">
              📞 Llamar Ahora
            </Button>
          </a>
          <a href="mailto:info@cenexpo.com">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold">
              📧 Enviar Email
            </Button>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
