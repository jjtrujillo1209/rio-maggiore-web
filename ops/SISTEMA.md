# Through Air — Sistema Operativo desde Terminal

> Through Air es un negocio AI-nativo: usa AI para cumplir sus servicios, no para venderlos.
> Estrategia completa: ver `ESTRATEGIA-AI-NATIVA.md`

## Estructura de directorios

```
ops/
├── clientes/          → Un archivo .md por cliente
├── proyectos/         → Estado de cada proyecto activo
├── propuestas/        → Propuestas enviadas y su estado
├── reportes/          → Reportes mensuales entregados
└── plantillas/        → Templates reutilizables
```

---

## Flujo de trabajo

### 1. Nuevo prospecto entra
```
/market proposal <nombre_cliente>
```
→ Genera propuesta en `propuestas/<cliente>-propuesta.md`
→ Crear ficha en `clientes/<cliente>.md`

### 2. Propuesta aceptada
→ Mover a `proyectos/<cliente>-activo.md`
→ Configurar contexto en seomachine si incluye contenido

### 3. Ejecución mensual
- Pauta digital: revisar campañas, KPIs, ajustes
- Redes: publicar 15 piezas, responder comentarios
- Reporte: generar con `/market report`

### 4. Entrega de reporte
→ Archivar en `reportes/<cliente>/<YYYY-MM>.md`
→ Actualizar estado en ficha de cliente

---

## Comandos clave desde terminal

| Acción | Comando Claude Code |
|--------|-------------------|
| Nueva propuesta | `/market proposal <cliente>` |
| Auditar web cliente | `/market audit <url>` |
| Analizar competencia | `/market competitors <url>` |
| Crear contenido SEO | `/research <tema>` luego `/write <tema>` |
| Reporte mensual | `/market report <url_cliente>` |
| Estrategia redes | `/market social <tema>` |
| Landing page | `/landing-write <servicio>` |
| Copy para ads | `/market ads <url>` |

---

## Métricas a trackear por cliente

### Pautas digitales
- Presupuesto invertido vs gastado
- CPC, CPM, CTR por campaña
- Leads generados
- Costo por lead
- ROAS

### Redes sociales
- Alcance orgánico semanal
- Tasa de engagement (likes+comments/reach)
- Seguidores ganados
- Piezas publicadas vs planeadas

### Web / E-commerce
- Visitas mensuales (GA4)
- Tasa de conversión
- Páginas más visitadas
- Velocidad de carga
