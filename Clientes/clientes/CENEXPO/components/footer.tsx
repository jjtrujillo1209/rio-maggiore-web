'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer id="contacto" className="bg-neutral-900 dark:bg-black text-neutral-300 py-16 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo-casgo.jpeg" alt="Grupo CASGO SAS" width={40} height={40} className="object-contain rounded bg-white p-1" />
              <div className="leading-tight">
                <p className="text-white font-bold text-base">CENEXPO</p>
                <p className="text-neutral-400 text-xs">by Grupo CASGO SAS</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400">
              Centro de exposiciones y eventos de referencia en Armenia, Quindío.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#sobre-nosotros" className="hover:text-blue-400 transition">Sobre Nosotros</a></li>
              <li><a href="#servicios" className="hover:text-blue-400 transition">Servicios</a></li>
              <li><a href="#espacios" className="hover:text-blue-400 transition">Espacios</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li>📞 <a href="tel:+573001234567" className="hover:text-blue-400 transition">+57 300 123 4567</a></li>
              <li>📧 <a href="mailto:info@cenexpo.com" className="hover:text-blue-400 transition">info@cenexpo.com</a></li>
              <li>📍 Armenia, Quindío, Colombia</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Síguenos</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                f
              </a>
              <a href="#" className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                🔗
              </a>
              <a href="#" className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                📷
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500">
            <p>© 2026 CENEXPO — Grupo CASGO SAS. Todos los derechos reservados.</p>
            <div className="mt-4 md:mt-0 space-x-4">
              <a href="#" className="hover:text-neutral-300 transition">Política de Privacidad</a>
              <a href="#" className="hover:text-neutral-300 transition">Términos y Condiciones</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
