# Cenexpo - Centro de Exposiciones y Eventos

Sitio web moderno optimizado en SEO para Cenexpo, construido con Next.js, React, TypeScript, Tailwind CSS y shadcn/ui.

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Package Manager**: npm

## Características

- ✅ Optimización SEO completa (meta tags, schema markup, og:tags)
- ✅ Componentes reutilizables con shadcn/ui
- ✅ Animaciones fluidas con Framer Motion
- ✅ Diseño responsive (mobile-first)
- ✅ Dark mode listo
- ✅ TypeScript para seguridad de tipos

## Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Ejecutar servidor de desarrollo**:
```bash
npm run dev
```

El sitio estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
cenexpo/
├── app/
│   ├── layout.tsx          # Layout principal con SEO
│   ├── page.tsx            # Página de inicio
│   └── globals.css         # Estilos globales
├── components/
│   ├── ui/
│   │   ├── button.tsx      # Componente Button
│   │   └── background-paths.tsx  # Fondo animado
│   ├── header.tsx          # Navegación
│   ├── hero.tsx            # Sección hero
│   ├── about.tsx           # Sección "Sobre nosotros"
│   ├── services.tsx        # Sección servicios
│   ├── spaces.tsx          # Sección espacios
│   ├── cta.tsx             # Call to action
│   └── footer.tsx          # Footer
├── lib/
│   └── utils.ts            # Utilidades (cn helper)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Secciones Principales

### 1. Hero
Sección de bienvenida con fondo animado y llamada a la acción.

### 2. About
Información sobre Cenexpo con estadísticas clave.

### 3. Services
Descripción de 6 servicios principales con iconos y características.

### 4. Spaces
Información detallada sobre los espacios disponibles.

### 5. CTA
Sección de llamada a la acción con botones de contacto.

## SEO Optimizaciones Implementadas

- Meta description personalizada
- Open Graph tags para redes sociales
- JSON-LD Schema Markup (Organization + EventVenue)
- Canonical URL
- Robots meta tag
- Palabras clave estratégicas
- Estructura H1-H6 correcta
- Imágenes con alt text
- Mobile-friendly responsive

## Compilación

Para compilar para producción:

```bash
npm run build
npm run start
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Personalizaciones

### Cambiar Colores
Edita `tailwind.config.js` para ajustar los colores principales.

### Agregar Nuevas Secciones
1. Crea un nuevo componente en `components/`
2. Importa en `app/page.tsx`
3. Añade el componente a la página

### Actualizar Contenido
Todos los textos están en los componentes. Busca y reemplaza el contenido según sea necesario.

## Notas Importantes

- Las imágenes deben ser reemplazadas en los componentes
- Actualiza los URLs de contacto (teléfono, email, redes sociales)
- Configura Google Analytics en el layout
- Verifica el sitio en Google Search Console

## Próximos Pasos

- [ ] Integrar formulario de contacto con backend
- [ ] Añadir blog/artículos
- [ ] Implementar galerías de eventos
- [ ] Integrar Google Analytics
- [ ] Configurar sitemap.xml dinámico
- [ ] Añadir testimonios de clientes
- [ ] Crear página de términos y privacidad

---

**Fecha de creación**: Abril 2026
**Última actualización**: Abril 3, 2026
