# 🚀 Through Air Marketing Agency - Sistema Completo

Suite automatizada para gestionar clientes, ejecutar auditorías y generar reportes de marketing con IA.

---

## ⚡ Quick Start

```bash
# Cambiar a directorio
cd "/Users/mike/Experimentos_JuanJo /Experimentos_JuanJo/Through Air/sistema-agencia"

# Ver ayuda
./run.sh

# Crear nuevo cliente
./run.sh nuevo-cliente "Acme Corp"

# Crear nuevo proyecto
./run.sh nuevo-proyecto "Website Redesign" "Acme Corp"

# Ejecutar auditoría
./run.sh auditoria https://acme.com "Acme Corp"

# Ver estado del sistema
./run.sh status
```

---

## 📁 Estructura de Carpetas

```
sistema-agencia/
├── clientes/              # Información de cada cliente
│   ├── Cliente A/
│   ├── Cliente B/
│   └── ...
├── proyectos/             # Proyectos en ejecución
│   ├── Proyecto 1/
│   ├── Proyecto 2/
│   └── ...
├── reportes/              # Reportes generados
│   ├── CLIENT_AUDIT_*.md
│   ├── CLIENT_PROPOSAL_*.md
│   └── ...
├── templates/             # Templates reutilizables
│   ├── CLIENT_ONBOARDING.md
│   ├── PROJECT_TIMELINE.md
│   ├── AUDIT_CHECKLIST.md
│   └── ...
├── archivos-plantilla/    # Assets reutilizables
│   ├── email-sequences/
│   ├── social-calendars/
│   ├── copy-variations/
│   └── ...
├── configuracion/         # Configuración del sistema
├── through-air-cli.py     # CLI principal
├── run.sh                 # Script de ejecución rápida
└── README.md              # Este archivo
```

---

## 🎯 Flujo de Trabajo

### 1️⃣ Nuevo Cliente

```bash
# Crear cliente
./run.sh nuevo-cliente "Mi Cliente"

# El sistema:
# ✅ Crea carpeta en /clientes/Mi Cliente/
# ✅ Crea archivo de perfil de cliente
# ✅ Listo para empezar auditoría
```

### 2️⃣ Auditoría Inicial

```bash
# Ejecutar auditoría de marketing
./run.sh auditoria https://cliente.com "Mi Cliente"

# Luego ejecutar manualmente:
/market audit https://cliente.com

# El reporte se guarda en:
# reportes/Mi_Cliente_AUDIT_2026-04-07_14-30-00.md
```

### 3️⃣ Crear Proyecto

```bash
# Crear nuevo proyecto
./run.sh nuevo-proyecto "Proyecto XYZ" "Mi Cliente"

# El sistema:
# ✅ Crea carpeta en /proyectos/Proyecto XYZ/
# ✅ Crea estructura de proyecto
# ✅ Listo para timeline y entregables
```

### 4️⃣ Generar Entregables

Usa los skills de marketing disponibles:

```bash
# Propuesta de cliente
/market proposal "Mi Cliente"

# Copy optimizado
/market copy https://cliente.com

# Calendario social
/market social "Tema Campaña"

# Análisis competitivo
/market competitors https://cliente.com

# Playbook de lanzamiento
/market launch "Mi Producto"
```

### 5️⃣ Organizar Reportes

Los reportes generados se guardan en `/reportes/` con timestamp:
```
reportes/
├── Mi_Cliente_AUDIT_2026-04-07_10-00-00.md
├── Mi_Cliente_PROPOSAL_2026-04-07_11-00-00.md
├── Mi_Cliente_SOCIAL_CALENDAR_2026-04-07_12-00-00.md
└── ...
```

---

## 🛠️ Skills Disponibles Globalmente

### Auditoría & Análisis
- **`/market audit [url]`** - Auditoría completa (5 subagentes)
- **`/market quick [url]`** - Snapshot rápido (60 segundos)
- **`/market competitors [url]`** - Inteligencia competitiva

### Contenido & Copy
- **`/market copy [url]`** - Copy optimizado
- **`/market emails [tema/url]`** - Secuencias de email
- **`/market social [tema/url]`** - Calendario social (30 días)
- **`/market ads [url]`** - Creativos para campañas

### Análisis Estratégico
- **`/market funnel [url]`** - Análisis de conversión
- **`/market landing [url]`** - CRO de landing pages
- **`/market seo [url]`** - Auditoría SEO completa
- **`/market brand [url]`** - Voz de marca y lineamientos

### Entregables para Clientes
- **`/market launch [producto]`** - Playbook de lanzamiento
- **`/market proposal [cliente]`** - Propuesta formal
- **`/market report [url]`** - Reporte Markdown
- **`/market report-pdf [url]`** - Reporte PDF

---

## 📋 Templates Disponibles

En `/templates/`:

- **CLIENT_ONBOARDING.md** - Flujo de onboarding 3 semanas
- **AUDIT_CHECKLIST.md** - Checklist auditoría completa
- **PROJECT_TIMELINE.md** - Timeline de proyecto (12 semanas)
- **EJEMPLO_CLIENTE.md** - Template de cliente (copia y personaliza)

---

## 💼 Comandos CLI

### Gestión de Clientes
```bash
./run.sh nuevo-cliente <nombre>        # Crear cliente
./run.sh listar-clientes               # Listar todos
```

### Gestión de Proyectos
```bash
./run.sh nuevo-proyecto <nombre> <cliente>   # Crear proyecto
./run.sh listar-proyectos                    # Listar todos
```

### Auditorías
```bash
./run.sh auditoria <url> <cliente>     # Ejecutar auditoría
```

### Sistema
```bash
./run.sh status                        # Ver dashboard
./run.sh help                          # Ver ayuda
```

---

## 🔄 Workflow Recomendado

### Semana 1: Descubrimiento
```bash
# 1. Crear cliente
./run.sh nuevo-cliente "Nuevo Cliente"

# 2. Auditoría completa
/market audit https://cliente.com

# 3. Análisis competitivo
/market competitors https://cliente.com

# 4. Review con cliente
# → Identificar top 3 oportunidades
```

### Semana 2-3: Estrategia
```bash
# 1. Crear proyecto
./run.sh nuevo-proyecto "Estrategia 90D" "Nuevo Cliente"

# 2. Análisis específicos
/market seo https://cliente.com
/market funnel https://cliente.com
/market landing https://cliente.com

# 3. Propuesta
/market proposal "Nuevo Cliente"

# 4. Presentar
```

### Semana 4+: Ejecución
```bash
# 1. Contenido
/market copy https://cliente.com
/market emails "Campaña A"
/market social "Tema Campaña"

# 2. Advertising
/market ads https://cliente.com

# 3. Lanzamientos
/market launch "Producto Nuevo"

# 4. Reportes mensuales
/market report https://cliente.com
```

---

## 📊 Ejemplo: Flujo Completo

```bash
# DÍA 1: Onboarding
./run.sh nuevo-cliente "TechStartup"
./run.sh nuevo-proyecto "Marketing Q2" "TechStartup"

# DÍA 2: Auditoría
/market audit https://techstartup.com

# DÍA 3: Análisis Profundo
/market seo https://techstartup.com
/market competitors https://techstartup.com
/market funnel https://techstartup.com

# DÍA 4: Propuesta
/market proposal "TechStartup"

# DÍA 5-15: Ejecución
/market copy https://techstartup.com
/market emails "Launch Campaign"
/market social "Product Launch"
/market ads https://techstartup.com

# SEMANA 4: Reportes
/market report https://techstartup.com
/market report-pdf https://techstartup.com
```

---

## 🎓 Mejores Prácticas

1. **Usa timestamps en reportes** - Facilita el versionado
2. **Organiza por cliente** - Mantén carpetas limpias
3. **Reutiliza templates** - Acelera onboarding
4. **Documenta decisiones** - Agrega notas en proyectos
5. **Review semanal** - Mantén status actualizado
6. **Reportes mensuales** - Comunica progreso

---

## 📈 Métricas Clave

El sistema te permite rastrear:

- **Por Cliente:** Proyectos activos, reportes generados
- **Por Proyecto:** Timeline, deliverables, status
- **Por Tipo:** Auditorías, propuestas, reportes

Ver status en cualquier momento:
```bash
./run.sh status
```

---

## 🚀 Próximos Pasos

1. ✅ **Skills instalados** - 16 skills de marketing disponibles
2. ✅ **Estructura creada** - Carpetas y templates listos
3. ✅ **CLI implementado** - Dashboard para gestión
4. ⏳ **Templates de procesos** - Formatos estandarizados
5. ⏳ **Implementación completa** - Integración total

---

## 📞 Soporte

- Ver ayuda: `./run.sh help`
- Ver status: `./run.sh status`
- Acceder documentación: `./run.sh`

---

**Creado:** 2026-04-07  
**Sistema:** Through Air Marketing Agency  
**Versión:** 1.0
