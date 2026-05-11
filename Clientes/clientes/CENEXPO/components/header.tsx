'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#sobre-nosotros', label: 'Nosotros' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#espacios', label: 'Espacios' },
  { href: '#tarifas', label: 'Tarifas' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo-casgo.jpeg"
            alt="Grupo CASGO SAS"
            width={48}
            height={48}
            className="rounded-md object-contain bg-white"
          />
          <div className="flex flex-col leading-none gap-0.5">
            <span className="font-heading text-2xl font-bold tracking-widest text-neutral-900 dark:text-white uppercase">CENEXPO</span>
            <span className="font-body text-[10px] text-neutral-400 dark:text-neutral-500 tracking-widest uppercase font-medium">by Grupo CASGO SAS</span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8 items-center">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="font-body text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors tracking-wide">
              {label}
            </a>
          ))}
          <a href="#contacto" className="font-body text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors">
            Contacto
          </a>
        </nav>

        {/* Hamburger button — mobile only */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          <span className={`block w-5 h-0.5 bg-neutral-800 dark:bg-neutral-200 transition-all duration-300 ${open ? 'rotate-45 translate-y-1' : ''}`} />
          <span className={`block w-5 h-0.5 bg-neutral-800 dark:bg-neutral-200 mt-1 transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-neutral-800 dark:bg-neutral-200 mt-1 transition-all duration-300 ${open ? '-rotate-45 -translate-y-2.5' : ''}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md"
          >
            <ul className="flex flex-col px-4 py-3 gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block py-3 px-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:text-blue-700 dark:hover:text-blue-400 border-b border-neutral-100 dark:border-neutral-800 transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li className="pt-3 pb-2">
                <a
                  href="#contacto"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                >
                  Contacto
                </a>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
