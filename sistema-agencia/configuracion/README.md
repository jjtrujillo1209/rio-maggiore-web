# Configuración de Through Air Marketing Agency

## Estructura de Carpetas

```
sistema-agencia/
├── clientes/                 # Información y perfiles de clientes
│   ├── cliente-1/
│   ├── cliente-2/
│   └── ...
├── proyectos/               # Proyectos activos en ejecución
│   ├── proyecto-1/
│   ├── proyecto-2/
│   └── ...
├── reportes/                # Reportes generados (auditorías, análisis)
│   ├── CLIENTE_AUDIT_2026-04-07.md
│   ├── CLIENTE_PROPOSAL_2026-04-07.md
│   └── ...
├── templates/               # Plantillas de procesos y deliverables
│   ├── CLIENT_ONBOARDING.md
│   ├── PROJECT_TIMELINE.md
│   ├── AUDIT_CHECKLIST.md
│   └── ...
├── archivos-plantilla/      # Templates de contenido reutilizable
│   ├── email-sequences/
│   ├── social-calendars/
│   ├── copy-variations/
│   └── ...
└── configuracion/           # Config y documentación del sistema
    └── README.md            # Este archivo
```

## Flujo de Trabajo

1. **Nuevo Cliente** → Crear carpeta en `/clientes/[nombre-cliente]/`
2. **Nuevo Proyecto** → Crear carpeta en `/proyectos/[nombre-proyecto]/`
3. **Auditoría/Análisis** → Ejecutar skill market-* → Guardar en `/reportes/`
4. **Entregables** → Usar templates en `/templates/` como base
5. **Reutilizar** → Guardar en `/archivos-plantilla/`

## Skills Disponibles Globalmente

- `/market audit [url]` - Auditoría completa
- `/market quick [url]` - Análisis rápido (60s)
- `/market copy [url]` - Copy optimizado
- `/market emails [tema]` - Secuencias de email
- `/market social [tema]` - Calendario social
- `/market ads [url]` - Creativos para ads
- `/market funnel [url]` - Análisis de funnel
- `/market competitors [url]` - Inteligencia competitiva
- `/market landing [url]` - CRO landing page
- `/market seo [url]` - Auditoría SEO
- `/market brand [url]` - Voz de marca
- `/market launch [producto]` - Playbook de lanzamiento
- `/market proposal [cliente]` - Propuesta de cliente
- `/market report [url]` - Reporte Markdown
- `/market report-pdf [url]` - Reporte PDF

## Quick Start

```bash
# Auditar sitio web de cliente
/market audit https://cliente.com

# Generar propuesta para nuevo cliente
/market proposal "Cliente Nuevo"

# Crear calendario social
/market social "Producto A"

# Análisis competitivo
/market competitors https://competidor.com
```
