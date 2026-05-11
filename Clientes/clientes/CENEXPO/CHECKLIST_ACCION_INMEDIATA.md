# CHECKLIST DE ACCIÓN INMEDIATA
## Riviera Cenexpo SEO

**Responsable:** [Asignar]  
**Inicio:** Inmediato  
**Fecha límite Fase 1:** 1 semana

---

## 🔴 ROJO - CRÍTICO (Hacer HOY)

### ☐ Tarea 1: Meta Description (5 minutos)

**Descripción:** Agregar meta description a homepage y principales páginas

**Ubicación:** `<head>` de cada página

**Código:** Copiar y pegar exactamente
```html
<!-- HOMEPAGE -->
<meta name="description" content="Riviera Cenexpo: Centro de exposiciones y eventos en [CIUDAD]. Disponemos de coliseos, salones, pabellones y plazoletas para ferias, convenciones y eventos corporativos. Servicios completos: parqueadero y catering.">

<!-- COLISEO GRAN RIVIERA -->
<meta name="description" content="Coliseo Gran Riviera - Espacio para eventos corporativos, ferias y exposiciones. Capacidad variable, servicios incluidos, ubicación estratégica. Contáctanos en Riviera Cenexpo.">

<!-- FONDA MILAGROS -->
<meta name="description" content="Fonda Milagros - Salón moderno para eventos, reuniones y celebraciones. Servicios completos incluidos. Reserva tu espacio en Riviera Cenexpo.">
```

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Fecha:** ___________

---

### ☐ Tarea 2: Corregir H1 Duplicados (10 minutos)

**Descripción:** Cambiar múltiples H1 a H2

**Ubicación:** Homepage y páginas principales

**Instrucciones:**
1. Encontrar todos los `<h1>` en el código
2. Cambiar el secundario de `<h1>` a `<h2>`
3. Mantener solo UN H1 como: "Riviera Cenexpo - Centro de Exposiciones y Eventos"

**Antes:**
```html
<h1>JUNTOS</h1>
<h1>lo hacemos posible</h1>
```

**Después:**
```html
<h1>Riviera Cenexpo - Centro de Exposiciones y Eventos</h1>
<h2>Juntos lo hacemos posible</h2>
```

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Fecha:** ___________

---

### ☐ Tarea 3: Auditar URLs Defectuosas (20 minutos)

**Descripción:** Identificar y marcar URLs con errores para corregir

**URLs con problemas detectadas:**
- [ ] `/plazoleta-de-baderas-1/` (typo: baderas vs banderas)
- [ ] `/plazoleta-deed-2/` (nombre incompleto o errado)

**Acción:** 
1. Verificar nombres correctos de espacios
2. Listar URLs correctas
3. Documentar para redirecciones

**Problemas encontrados:**

| URL Actual | Problema | URL Correcta |
|-----------|----------|------------|
| /plazoleta-de-baderas-1/ | Typo | /plazoleta-de-banderas-1/ |
| /plazoleta-deed-2/ | Incompleto | _____________ |

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Fecha:** ___________

---

## 🟠 NARANJA - ALTO IMPACTO (Esta semana)

### ☐ Tarea 4: Implementar Schema Markup - Organization (1.5 horas)

**Descripción:** Agregar JSON-LD de Organization en el header/footer

**Ubicación:** Antes de `</head>` o antes de `</body>`

**Pasos:**
1. Copiar código Schema Markup - Organization (ver: CODIGOS_IMPLEMENTACION_SEO.md)
2. Reemplazar [campos entre corchetes] con información real:
   - Dirección completa
   - Teléfono (ya conocido: +573234267409)
   - Email (obtener si existe)
   - Logotipo URL
3. Pegar en todas las páginas O en template global (wp_header.php)
4. Validar en: https://validator.schema.org/

**Información necesaria:**
- [ ] Dirección postal completa
- [ ] Teléfono: +573234267409 ✓
- [ ] Email: _______________
- [ ] Logo URL: _______________
- [ ] Horarios de atención: _______________

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Validado en validator.schema.org:** [ ] Sí [ ] No  
**Fecha:** ___________

---

### ☐ Tarea 5: Implementar Schema Markup - EventVenue (2 horas)

**Descripción:** Agregar JSON-LD EventVenue para cada espacio

**Ubicación:** En la página de cada espacio individual

**Espacios a actualizar:**
- [ ] Coliseo Gran Riviera
- [ ] Fonda Milagros
- [ ] Pabellón San Carlos
- [ ] Plazoletas De Banderas (3 áreas)
- [ ] Salones Gótica (2 áreas)
- [ ] Salón Santa Marta
- [ ] Locales de Comidas

**Para cada uno:**
1. Copiar código EventVenue (ver: CODIGOS_IMPLEMENTACION_SEO.md)
2. Rellenar: nombre, descripción, capacidad
3. Validar en https://search.google.com/test/rich-results

**Información a recopilar:**

| Espacio | Capacidad | Descripción |
|---------|-----------|------------|
| Coliseo Gran Riviera | _________ | _________________ |
| Fonda Milagros | _________ | _________________ |
| Pabellón San Carlos | _________ | _________________ |

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Validado en Rich Results Test:** [ ] Sí [ ] No  
**Fecha:** ___________

---

### ☐ Tarea 6: Crear Redirecciones 301 (30 minutos)

**Descripción:** Redirigir URLs defectuosas a URLs correctas

**Método 1 (Apache .htaccess):**
```apache
Redirect 301 /plazoleta-de-baderas-1/ /plazoleta-de-banderas-1/
Redirect 301 /plazoleta-deed-2/ /plazoleta-deep-2/
```

**Método 2 (WordPress plugin "Redirection"):**
1. Instalar plugin "Redirection" desde WordPress.org
2. Dashboard → Tools → Redirection
3. Agregar regla: De → A
4. Marcar como "301 Permanent"

**URLs a redirigir:**
- [ ] /plazoleta-de-baderas-1/ → /plazoleta-de-banderas-1/
- [ ] /plazoleta-deed-2/ → [verificar]

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Método usado:** [ ] .htaccess [ ] Plugin [ ] Otro: _______  
**Fecha:** ___________

---

### ☐ Tarea 7: Expandir Contenido Homepage (2-3 horas)

**Descripción:** Agregar 350-400 palabras de contenido nuevo

**Secciones a agregar:**

**A. Introducción (100 palabras):**
```
Riviera Cenexpo es el principal centro de exposiciones, eventos y 
convenciones de la región. Con [X] años de experiencia, contamos con 
instalaciones de clase mundial diseñadas para albergar desde íntimas 
reuniones de negocios hasta grandes ferias comerciales e exposiciones 
internacionales...
```

**B. Servicios (150 palabras):**
- Alquiler de espacios
- Servicios de catering
- Parqueadero oficial
- Asesoramiento profesional

**C. Ventajas competitivas (100 palabras):**
- Ubicación estratégica
- Instalaciones modernas
- Servicios personalizados
- Experiencia en la industria
- Equipo profesional

**Contenido nuevo redactado:** 
[ ] Completado  
**Inserción en web:** [ ] Completada

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Revisor SEO:** [  ]  
**Fecha:** ___________

---

## 🟡 AMARILLO - IMPORTANTE (Próximas 2 semanas)

### ☐ Tarea 8: Crear Página "Sobre Nosotros" (3-4 horas)

**Descripción:** Nueva página con historia, misión, valores y equipo

**Secciones requeridas:**
- [ ] Título: H1 "Sobre Riviera Cenexpo"
- [ ] Historia de la empresa (200 palabras)
- [ ] Misión, visión y valores (150 palabras)
- [ ] Equipo directivo (texto + fotos)
- [ ] Logros y reconocimientos
- [ ] Certificaciones (si existen)
- [ ] Schema Markup de Organization

**URL recomendada:** `/sobre-nosotros/` o `/acerca-de/`

**Meta Description:**
```html
<meta name="description" content="Conoce la historia de Riviera Cenexpo. 
[X] años de experiencia en exposiciones y eventos. Equipo profesional 
dedicado a tu éxito.">
```

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Fecha publicación:** ___________

---

### ☐ Tarea 9: Primer Artículo de Blog (2-3 horas)

**Descripción:** Publicar artículo SEO sobre palabras clave principales

**Tema recomendado:** "Guía Completa: Cómo Elegir el Espacio Perfecto para tu Evento Corporativo"

**Estructura:**
- H1: Guía Completa...
- Introducción (100 palabras)
- H2: Considera tu número de asistentes
- H2: Define tu presupuesto
- H2: Verifica servicios incluidos
- H2: Ubicación estratégica
- H2: Flexibilidad de espacios
- Conclusión + CTA
- Meta description
- 3-5 internal links

**Largo mínimo:** 1200 palabras

**URL:** `/blog/guia-elegir-espacio-evento/`

**Palabras clave targets:**
- Elegir espacio evento corporativo
- Planificación de eventos

**Meta Description:**
```html
<meta name="description" content="Guía completa para elegir el espacio 
perfecto para tu evento corporativo. 5 pasos esenciales. En Riviera Cenexpo.">
```

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**SEO review:** [ ] Pendiente [ ] Completado  
**Publicado:** [ ] Sí [ ] No  
**Fecha:** ___________

---

### ☐ Tarea 10: Google Search Console (1 hora)

**Descripción:** Verificar y configurar monitoreo de búsqueda

**Pasos:**
1. Ir a https://search.google.com/search-console
2. Agregar propiedad: https://rivieracenexpo.com
3. Verificar propiedad (elegir método: DNS, HTML, Google Analytics, etc.)
4. Enviar sitemap: https://rivieracenexpo.com/wp-sitemap.xml
5. Esperar indexación (1-7 días)
6. Revisar "Cobertura" para errores
7. Marcar las 7 tareas como completadas en GSC

**Checklist:**
- [ ] Propiedad agregada
- [ ] Propiedad verificada
- [ ] Sitemap enviado
- [ ] Esperando datos de rastreo
- [ ] Errores de indexación identificados
- [ ] Email de confirmación recibido

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Propiedad verificada el:** ___________

---

## 🟢 VERDE - SEGUIMIENTO (Próximas 4 semanas)

### ☐ Tarea 11: Google PageSpeed Insights (1 hora)

**Descripción:** Analizar y documentar Core Web Vitals

**Proceso:**
1. Ir a https://pagespeed.web.dev/
2. Ingresar: https://rivieracenexpo.com
3. Copiar resultados:
   - LCP (Largest Contentful Paint)
   - FID/INP (First Input Delay / Interaction to Next Paint)
   - CLS (Cumulative Layout Shift)
   - Score móvil
   - Score desktop
4. Documentar en Google Sheets para seguimiento
5. Identificar 3 recomendaciones principales

**Resultados:**

| Métrica | Valor | Target |
|---------|-------|--------|
| LCP | _______ | < 2.5s |
| FID/INP | _______ | < 100ms/200ms |
| CLS | _______ | < 0.1 |
| Score Móvil | _____/100 | > 80 |
| Score Desktop | _____/100 | > 90 |

**Recomendaciones principales:**
1. _________________________________
2. _________________________________
3. _________________________________

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Fecha:** ___________

---

### ☐ Tarea 12: Open Graph & Twitter Tags (30 minutos)

**Descripción:** Agregar meta tags para redes sociales

**Ubicación:** `<head>`

**Código a agregar:**
```html
<!-- Open Graph -->
<meta property="og:title" content="Riviera Cenexpo - Centro de Exposiciones">
<meta property="og:description" content="Espacios para ferias, convenciones y eventos corporativos">
<meta property="og:url" content="https://rivieracenexpo.com">
<meta property="og:type" content="business.business">
<meta property="og:image" content="[URL de imagen 1200x630]">
<meta property="og:site_name" content="Riviera Cenexpo">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Riviera Cenexpo - Centro de Exposiciones">
<meta name="twitter:description" content="Espacios para eventos corporativos y ferias">
<meta name="twitter:image" content="[URL de imagen]">
```

**Responsable:** [  ]  
**Completado:** [ ] Sí [ ] No  
**Testeado en Facebook:** [ ] Sí [ ] No  
**Testeado en Twitter:** [ ] Sí [ ] No  
**Fecha:** ___________

---

## 📊 ESTADO DE AVANCE

**Semana 1 (Crítico):**

| # | Tarea | Status | Asignado a |
|---|-------|--------|-----------|
| 1 | Meta Description | [ ] [ ] [ ] | [  ] |
| 2 | H1 Duplicados | [ ] [ ] [ ] | [  ] |
| 3 | URLs Defectuosas | [ ] [ ] [ ] | [  ] |

**Semana 1-2 (Alto Impacto):**

| # | Tarea | Status | Asignado a |
|---|-------|--------|-----------|
| 4 | Schema Organization | [ ] [ ] [ ] | [  ] |
| 5 | Schema EventVenue | [ ] [ ] [ ] | [  ] |
| 6 | Redirecciones 301 | [ ] [ ] [ ] | [  ] |
| 7 | Expandir Contenido | [ ] [ ] [ ] | [  ] |

**Semana 2-4 (Importante):**

| # | Tarea | Status | Asignado a |
|---|-------|--------|-----------|
| 8 | Página Sobre Nosotros | [ ] [ ] [ ] | [  ] |
| 9 | Primer Blog Post | [ ] [ ] [ ] | [  ] |
| 10 | Google Search Console | [ ] [ ] [ ] | [  ] |
| 11 | PageSpeed Insights | [ ] [ ] [ ] | [  ] |
| 12 | Open Graph Tags | [ ] [ ] [ ] | [  ] |

**Legend:** [ ] Pendiente [ ] En progreso [ ] Completado

---

## 💾 DOCUMENTACIÓN Y RECURSOS

**Documentos disponibles:**
- [ ] AUDITORIA_SEO_RIVIERACENEXPO.md (Reporte completo)
- [ ] RESUMEN_EJECUTIVO_SEO.md (Para directivos)
- [ ] CODIGOS_IMPLEMENTACION_SEO.md (Códigos listos)
- [ ] ESTRATEGIA_PALABRAS_CLAVE_SEO.md (Plan de contenido)
- [ ] CHECKLIST_ACCION_INMEDIATA.md (Este documento)

**Herramientas recomendadas:**
- Google PageSpeed Insights: https://pagespeed.web.dev/
- Schema Validator: https://validator.schema.org/
- Rich Results Test: https://search.google.com/test/rich-results
- Google Search Console: https://search.google.com/search-console
- Google My Business (opcional): https://business.google.com

---

## 📞 CONTACTO Y ESCALADOS

**¿ Problemas técnicos?**
- Contactar equipo de desarrollo web
- Referencia: documento CODIGOS_IMPLEMENTACION_SEO.md

**¿ Dudas sobre SEO?**
- Revisar sección relevante en AUDITORIA_SEO_RIVIERACENEXPO.md
- Consultar ESTRATEGIA_PALABRAS_CLAVE_SEO.md

**¿ Necesita contenido redactado?**
- Usar templates de ESTRATEGIA_PALABRAS_CLAVE_SEO.md
- Enviar para revisión SEO antes de publicar

---

## ✅ CONFIRMACIÓN FINAL

**He revisado todos los puntos de esta checklist:** [ ] Sí [ ] No

**Responsable de proyecto:** _____________________

**Fecha de inicio:** ___________

**Fecha límite Fase 1 (crítico):** ___________

**Coordinador de seguimiento:** _____________________

---

**Este documento es una guía de acción**
**Versión 1.0 - 3 de abril de 2026**
