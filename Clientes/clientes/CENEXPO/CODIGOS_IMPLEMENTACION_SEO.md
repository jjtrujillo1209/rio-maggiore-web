# CÓDIGOS LISTOS PARA IMPLEMENTAR
## Riviera Cenexpo SEO Fixes

---

## 1. META DESCRIPTION

**Ubicación:** Agregar en `<head>` de todas las páginas

### Homepage
```html
<meta name="description" content="Riviera Cenexpo: Centro de exposiciones y eventos en la región. Disponemos de coliseos, salones, pabellones y plazoletas para ferias, convenciones y eventos corporativos. Parqueadero y servicios completos.">
```

### Coliseo Gran Riviera
```html
<meta name="description" content="Coliseo Gran Riviera en Riviera Cenexpo: Espacios amplios para eventos corporativos, ferias y exposiciones. Capacidad variable, servicios de catering y parqueadero.">
```

### Fonda Milagros
```html
<meta name="description" content="Fonda Milagros - Espacio en Riviera Cenexpo para eventos, reuniones y celebraciones. Servicios incluidos, ubicación estratégica, parqueadero disponible.">
```

---

## 2. SCHEMA MARKUP - JSON-LD

### A. Organization Schema (Agregar en homepage y footer)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Riviera Cenexpo",
  "alternateName": "Riviera Centro de Exposiciones",
  "url": "https://rivieracenexpo.com",
  "logo": "https://rivieracenexpo.com/logo.png",
  "description": "Centro de exposiciones y eventos - Espacios para ferias, convenciones y eventos corporativos",
  "telephone": "+573234267409",
  "email": "info@rivieracenexpo.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Ingrese dirección completa]",
    "addressLocality": "[Ciudad]",
    "addressRegion": "[Departamento]",
    "postalCode": "[Código postal]",
    "addressCountry": "CO"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "telephone": "+573234267409",
    "availableLanguage": ["es"]
  },
  "sameAs": [
    "https://www.facebook.com/profile.php?id=61551934317300",
    "https://www.instagram.com/rivieracenexpo/",
    "https://www.youtube.com/@RIVIERACENEXPO"
  ]
}
</script>
```

### B. LocalBusiness Schema (Homepage)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Riviera Cenexpo",
  "image": "https://rivieracenexpo.com/logo.png",
  "description": "Centro de exposiciones y eventos",
  "telephone": "+573234267409",
  "priceRange": "$$",
  "areaServed": {
    "@type": "City",
    "name": "[Ciudad principal]"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Dirección completa]",
    "addressLocality": "[Ciudad]",
    "addressRegion": "[Departamento]",
    "postalCode": "[Código postal]",
    "addressCountry": "CO"
  }
}
</script>
```

### C. EventVenue Schema (Páginas de cada espacio)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EventVenue",
  "name": "Coliseo Gran Riviera",
  "url": "https://rivieracenexpo.com/coliseo-gran-riviera/",
  "telephone": "+573234267409",
  "image": "https://rivieracenexpo.com/images/coliseo-gran-riviera.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Dirección del espacio]",
    "addressLocality": "[Ciudad]",
    "addressRegion": "[Departamento]",
    "postalCode": "[Código postal]",
    "addressCountry": "CO"
  },
  "capacity": "NÚMERO_DE_PERSONAS",
  "description": "Espacio amplio y moderno para eventos, ferias y exposiciones",
  "amenityFeature": [
    {
      "@type": "LocationFeatureSpecification",
      "name": "Parqueadero"
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Servicios de Catering"
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Conexión a Internet"
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Sistema de Climatización"
    }
  ]
}
</script>
```

### D. Service Schema (Para cada servicio/espacio)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "[Nombre del espacio/servicio]",
  "url": "https://rivieracenexpo.com/[ruta]/",
  "image": "https://rivieracenexpo.com/images/[nombre].jpg",
  "description": "[Descripción del servicio]",
  "provider": {
    "@type": "Organization",
    "name": "Riviera Cenexpo",
    "telephone": "+573234267409",
    "url": "https://rivieracenexpo.com"
  },
  "areaServed": {
    "@type": "City",
    "name": "[Ciudad]"
  },
  "availableLanguage": ["es"],
  "offers": {
    "@type": "Offer",
    "description": "[Incluye...]",
    "priceCurrency": "COP",
    "price": "[PRECIO]",
    "eligibleRegion": {
      "@type": "City",
      "name": "[Ciudad]"
    }
  }
}
</script>
```

### E. BreadcrumbList Schema

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://rivieracenexpo.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Espacios",
      "item": "https://rivieracenexpo.com/espacios"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[Nombre del espacio]",
      "item": "https://rivieracenexpo.com/[ruta-espacio]/"
    }
  ]
}
</script>
```

---

## 3. META TAGS ADICIONALES

```html
<!-- Open Graph para redes sociales -->
<meta property="og:title" content="Riviera Cenexpo - Centro de Exposiciones">
<meta property="og:description" content="Espacios para ferias, convenciones y eventos corporativos">
<meta property="og:url" content="https://rivieracenexpo.com">
<meta property="og:type" content="business.business">
<meta property="og:image" content="https://rivieracenexpo.com/og-image.jpg">
<meta property="og:site_name" content="Riviera Cenexpo">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Riviera Cenexpo - Centro de Exposiciones">
<meta name="twitter:description" content="Espacios para ferias, convenciones y eventos corporativos">
<meta name="twitter:image" content="https://rivieracenexpo.com/twitter-image.jpg">

<!-- Viewport Mobile -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Charset -->
<meta charset="UTF-8">

<!-- Language -->
<html lang="es">
```

---

## 4. REDIRECCIONES 301 (Para URLs con errores)

**En archivo .htaccess (Apache) o configuración del servidor:**

```apache
# Redirecciones para URLs con typos
Redirect 301 /plazoleta-de-baderas-1/ /plazoleta-de-banderas-1/
Redirect 301 /plazoleta-deed-2/ /plazoleta-deep-2/

# Si el nombre correcto es diferente, ajustar según corresponda
```

**Si usa WordPress, agregar en wp-config.php o usar plugin "Redirection":**

```php
// En wp-config.php
if ( preg_match( '/plazoleta-de-baderas-1/', $_SERVER['REQUEST_URI'] ) ) {
    wp_redirect( 'https://rivieracenexpo.com/plazoleta-de-banderas-1/', 301 );
    exit;
}
```

---

## 5. ROBOTS.txt MEJORADO

**Ubicación: /robots.txt**

```
# Todas las arañas web
User-agent: *
Crawl-delay: 1
Allow: /
Disallow: /wp-admin/
Disallow: /wp-login.php
Disallow: /wp-includes/
Disallow: /*?
Disallow: /*&
Disallow: /search/
Allow: /wp-admin/admin-ajax.php

# Google
User-agent: Googlebot
Disallow:

# Bing
User-agent: Bingbot
Disallow:

# Sitemap
Sitemap: https://rivieracenexpo.com/wp-sitemap.xml
Sitemap: https://rivieracenexpo.com/sitemap.xml
```

---

## 6. HEADING STRUCTURE (HTML)

**Corregir para cada página:**

```html
<!-- HOMEPAGE -->
<h1>Riviera Cenexpo - Centro de Exposiciones y Eventos</h1>

<h2>Nuestros Espacios</h2>
<h3>Coliseo Gran Riviera</h3>
<h3>Fonda Milagros</h3>

<h2>Servicios</h2>
<h3>Alquiler de Espacios</h3>
<h3>Parqueadero Oficial</h3>
<h3>Catering</h3>

<h2>Por qué elegir Riviera Cenexpo</h2>
<h3>Ubicación Estratégica</h3>
<h3>Servicios Completos</h3>
<h3>Experiencia</h3>

<h2>Eventos Próximos</h2>
<h3>Ferias y Exposiciones</h3>
<h3>Convenciones Corporativas</h3>

<!-- PÁGINA DE ESPACIO INDIVIDUAL -->
<h1>Coliseo Gran Riviera - Centro de Exposiciones</h1>

<h2>Características del Espacio</h2>
<h3>Capacidad</h3>
<h3>Dimensiones</h3>
<h3>Amenidades</h3>

<h2>Servicios Incluidos</h2>
<h3>Parqueadero</h3>
<h3>Catering</h3>

<h2>Galería</h2>
<h2>Precios</h2>
<h2>Reservar Ahora</h2>
```

---

## 7. CANONICAL TAG

**Agregar en `<head>` de todas las páginas:**

```html
<!-- Homepage -->
<link rel="canonical" href="https://rivieracenexpo.com/">

<!-- Página de espacio -->
<link rel="canonical" href="https://rivieracenexpo.com/coliseo-gran-riviera/">

<!-- Post/Artículo del blog -->
<link rel="canonical" href="https://rivieracenexpo.com/blog/titulo-articulo/">
```

---

## 8. ATRIBUTOS DE ENLACES (rel)

**Actualizar enlaces externos:**

```html
<!-- Redes Sociales (external) -->
<a href="https://www.instagram.com/rivieracenexpo/" rel="external noopener noreferrer">Instagram</a>
<a href="https://www.facebook.com/profile.php?id=61551934317300" rel="external noopener noreferrer">Facebook</a>
<a href="https://www.youtube.com/@RIVIERACENEXPO" rel="external noopener noreferrer">YouTube</a>

<!-- Links a WhatsApp y directos (external) -->
<a href="https://api.whatsapp.com/send?phone=573234267409" rel="external noopener noreferrer">Contactar por WhatsApp</a>

<!-- Enlaces internos (sin rel específico necesario) -->
<a href="/coliseo-gran-riviera/">Coliseo Gran Riviera</a>
<a href="/espacios/">Todos los Espacios</a>
```

---

## 9. CONTENT EXPANSION - HOMEPAGE

**Texto a agregar después del valor principal:**

```html
<section class="about-intro">
  <h2>Bienvenido a Riviera Cenexpo</h2>
  
  <p>Riviera Cenexpo es el principal centro de exposiciones, eventos y convenciones de la región. Contamos con instalaciones de clase mundial diseñadas para albergar desde íntimas reuniones de negocios hasta grandes ferias comerciales e exposiciones internacionales.</p>

  <h3>Nuestros Servicios</h3>
  <p>Ofrecemos una completa gama de espacios y servicios para hacer de su evento un éxito memorable:</p>
  <ul>
    <li><strong>Alquiler de Espacios:</strong> Coliseos, salones, pabellones y plazoletas con capacidades que van desde 50 hasta 3,000+ personas</li>
    <li><strong>Servicios de Catering:</strong> Opciones gastronómicas de nivel internacional para sus eventos</li>
    <li><strong>Parqueadero Oficial:</strong> Amplio estacionamiento disponible para visitantes y expositores</li>
    <li><strong>Asesoramiento Profesional:</strong> Equipo experto en planificación y coordinación de eventos</li>
  </ul>

  <h3>¿Por Qué Elegir Riviera Cenexpo?</h3>
  <ul>
    <li>Ubicación estratégica de fácil acceso</li>
    <li>Instalaciones modernas y bien mantenidas</li>
    <li>Servicios personalizados para cada evento</li>
    <li>Experiencia de 15+ años en la industria</li>
    <li>Equipo profesional dedicado al éxito de su evento</li>
  </ul>
</section>
```

---

## 10. VALIDADORES ONLINE

**Para validar implementación:**

1. **Schema Markup Validator**
   - https://schema.org/docs/schema_org_rdfs.html
   - https://validator.schema.org/

2. **Google Rich Results Test**
   - https://search.google.com/test/rich-results

3. **Meta Tags Checker**
   - https://www.seobility.net/en/seocheck/
   - https://www.metatags.io/

4. **Mobile Friendly Test**
   - https://search.google.com/test/mobile-friendly

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

```
Implementación SEO - Riviera Cenexpo

□ Meta Description agregada a todas las páginas
□ H1 corregidos (máximo 1 por página)
□ Organization Schema implementado
□ EventVenue Schema en páginas de espacios
□ Service Schema en servicios
□ BreadcrumbList Schema agregado
□ Open Graph tags agregados
□ Twitter Card agregados
□ URLs con errores corregidas (301 redirects)
□ Robots.txt actualizado
□ Heading structure mejorada
□ Canonical tags agregados
□ Atributos rel en enlaces externos actualizados
□ Contenido homepage expandido (800+ palabras)
□ Google Search Console verificado
□ Validación de schema en Rich Results Test
□ PageSpeed Insights ejecutado
□ Análisis en Google Analytics 4
□ Monitoreo mensual planificado

Validación Final:
□ Todos los schemas válidos
□ Sin errores de crawl en GSC
□ Mobile-friendly confirmado
□ URLs canonicalizadas correctamente
```

---

## 🔧 INSTRUCCIONES POR PLATAFORMA

### WordPress + Elementor

**Opción 1: Manualmente en code snippets**
- Usar plugin "Code Snippets" para agregar JSON-LD
- Editar header.php para meta tags

**Opción 2: Plugin SEO**
- Instalar Yoast SEO o Rank Math
- Configurar meta descriptions automáticas
- Agregar schema markup desde plugins

**Opción 3: Header & Footer Code**
- Dashboard WordPress → Apariencia → Personalizar
- Agregar código en head/footer custom

### HTML Estático

- Editar directamente en archivos .html
- Agregar meta tags en sección `<head>`
- Agregar JSON-LD antes de `</body>`

### Otros CMS

- Consultar documentación específica del CMS
- Buscar "agregar meta tags en [CMS]"
- Usar plugins si están disponibles

---

**Última actualización:** 3 de abril de 2026
**Versión:** 1.0
