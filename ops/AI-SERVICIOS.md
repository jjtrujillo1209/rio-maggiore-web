# Through Air × AI — Servicios de Inteligencia Artificial para Clientes

> Propuesta interna de Juan José Trujillo
> Fecha: Marzo 2026

---

## Por qué ofrecer servicios de AI ahora

- Los clientes ya preguntan por "IA" — prefieren que les expliques tú antes que la competencia
- Reduce costos de producción 60-80% (más margen para Through Air)
- Diferenciador real vs agencias tradicionales
- Puedes escalar sin contratar más personas

---

## Portafolio de servicios AI para ofrecer

### 🥇 TIER 1 — Servicios de alta demanda (empezar aquí)

---

#### 1. Generación de contenido AI-asistido

**Qué es:** Producción masiva de contenido de redes sociales, blogs y ads usando Claude + herramientas de imagen.

**Qué incluye:**
- 30 posts mensuales (2x vs el plan actual de 15) al mismo precio
- Artículos SEO de 2,000+ palabras cada semana
- Variaciones de copy para A/B testing en ads
- Guiones para Reels y TikTok

**Cómo lo haces:**
- Claude Code + seomachine para texto
- Gemini (nano-banana-2) para imágenes
- El diseñador solo ajusta y da toque humano

**Precio sugerido:** +$150/mes sobre el plan de redes sociales → **$530/mes total**
**Margen:** ~85% (solo gastos API ~$20-30/mes)

---

#### 2. Chatbot de ventas para clientes

**Qué es:** Un asistente en el sitio web o WhatsApp que responde preguntas, califica leads y agenda citas.

**Qué incluye:**
- Chatbot entrenado con info del negocio
- Integración web (widget) o WhatsApp Business API
- Dashboard de conversaciones
- Mínimo 3 flujos: Info → Calificación → Agenda

**Cómo lo haces:**
- Claude API + Anthropic SDK (skill claude-api)
- WhatsApp Business API o Tidio/Intercom como interfaz
- El backend es simple: Node.js o Python

**Precio sugerido:** $800-1,200 USD implementación + $150/mes mantenimiento
**Tiempo estimado:** 2-3 semanas de desarrollo

---

#### 3. Reportes automáticos inteligentes

**Qué es:** El cliente recibe cada mes un reporte generado automáticamente con análisis real de sus KPIs y recomendaciones de AI.

**Qué incluye:**
- Conexión a Google Analytics 4 y Meta Ads API
- Reporte PDF generado automáticamente con Claude
- Análisis de tendencias y recomendaciones
- Entrega el día 1 de cada mes sin trabajo manual

**Cómo lo haces:**
- Python scripts + Google Analytics API (ya está en seomachine)
- Claude genera el análisis y redacción
- PDF con skill `/market report-pdf`

**Precio sugerido:** +$100/mes por cliente (add-on al plan mensual)
**Escalabilidad:** 10 clientes = $1,000/mes adicional casi automático

---

### 🥈 TIER 2 — Servicios de mayor valor (3-6 meses)

---

#### 4. Automatización de atención al cliente (CRM + AI)

**Qué es:** Sistema que clasifica, responde y escala mensajes de clientes en redes sociales automáticamente.

**Qué incluye:**
- Monitoreo de mensajes en Instagram DM y Facebook Messenger
- Respuestas automáticas para preguntas frecuentes (>80% de mensajes)
- Escalado inteligente al humano para casos complejos
- Dashboard de conversaciones y métricas

**Precio sugerido:** $1,500 implementación + $200/mes
**Impacto para cliente:** Reduce tiempo de respuesta de horas a segundos

---

#### 5. Generador de propuestas AI

**Qué es:** Sistema interno de Through Air (o vendido como herramienta) que genera propuestas personalizadas en minutos.

**Cómo funciona:**
- Ingresas nombre, industria, objetivo del cliente
- AI genera propuesta completa personalizada
- Usa `/market proposal` de tu sistema actual

**Valor para Through Air:** Cerrar propuestas en 1 hora vs 1 día
**Valor para clientes:** Pueden licenciar la herramienta para su equipo de ventas — $300-500/mes

---

#### 6. SEO automatizado con seomachine

**Qué es:** Usar la infraestructura de seomachine para producir y publicar contenido SEO de forma semi-automática.

**Qué incluye:**
- 4 artículos SEO/mes por cliente
- Investigación de keywords con DataForSEO
- Publicación directa a WordPress
- Reporte de posicionamiento mensual

**Precio sugerido:** $400/mes por cliente
**Costo real:** ~2-3 horas de supervisión + API costs (~$30)
**Margen:** ~90%

---

### 🥉 TIER 3 — Innovación (6-12 meses)

---

#### 7. Agente AI de marketing autónomo

**Qué es:** Un agente Claude que gestiona toda la estrategia digital del cliente: planea, ejecuta, mide y optimiza sin intervención manual.

**Capacidades:**
- Planea el calendario de contenido del mes
- Genera copy, imágenes y variaciones
- Revisa métricas y ajusta estrategia
- Genera reportes y recomendaciones

**Cómo construirlo:** Claude Agent SDK + herramientas MCP
**Precio sugerido:** $1,500-2,500/mes (premium)
**Timeline:** 3-4 meses de desarrollo

---

#### 8. AI para e-commerce: personalización y ventas

**Qué es:** Motor de recomendaciones y comunicación personalizada para tiendas online de clientes.

**Qué incluye:**
- Emails personalizados por comportamiento del usuario
- Recomendaciones de productos con AI
- Recuperación de carritos abandonados inteligente
- Optimización de fichas de producto con AI

**Precio sugerido:** $600/mes (requiere e-commerce activo)

---

## Cómo venderlo

### Conversación de venta

> "¿Qué pasaría si pudieras publicar el doble de contenido, responder el 80% de mensajes sin levantar el teléfono, y recibir tu reporte el primer día del mes sin pedirlo? Eso es lo que hacemos ahora con AI."

### Objeciones comunes

| Objeción | Respuesta |
|----------|-----------|
| "¿No va a reemplazar el toque humano?" | "La AI hace el 80% del volumen, el diseñador hace el 20% que necesita ojo humano. Resultado: más cantidad con la misma calidad." |
| "¿Es seguro compartir info de mi empresa?" | "Todo corre en tu infraestructura o en APIs privadas. Nada se comparte públicamente." |
| "¿Cuánto tiempo tarda en dar resultados?" | "El chatbot y el contenido en semana 1. El SEO en 90 días." |

---

## Roadmap de implementación para Through Air

### Mes 1 — Ya tienes esto
- [x] Claude Code operativo
- [x] seomachine configurado
- [x] Skills de marketing activos
- [x] `/market proposal`, `/market report-pdf`

### Mes 2 — Construir
- [ ] Chatbot básico con Claude API para 1 cliente piloto
- [ ] Conectar GA4 de clientes al sistema de reportes
- [ ] Configurar seomachine con contexto de cada cliente

### Mes 3 — Vender
- [ ] Lanzar "Plan AI" como add-on de $150/mes
- [ ] Demostrar chatbot a 3 prospectos
- [ ] Cerrar primer contrato de SEO automatizado

### Mes 6 — Escalar
- [ ] 5+ clientes en plan AI
- [ ] Ingresos AI: +$1,500/mes
- [ ] Propuesta de Agente AI autónomo en desarrollo

---

## Herramientas que ya tienes disponibles

| Herramienta | Uso | Costo |
|-------------|-----|-------|
| Claude API | Chatbots, generación de contenido, análisis | ~$0.003/1K tokens |
| Gemini Image API | Generación de imágenes | ~$0.01/imagen |
| seomachine | SEO, blogs, keywords | Gratis (open source) |
| Google Analytics API | Métricas web clientes | Gratis |
| Meta Ads API | Métricas de campañas | Gratis |

---

## Próximos pasos

1. **Esta semana:** Configurar seomachine con contexto de Through Air
2. **Este mes:** Construir chatbot piloto para Zepia (si cierra)
3. **Próximo mes:** Lanzar add-on AI a todos los clientes activos

---

_Documento interno Through Air — Juan José Trujillo_
_Actualizado: Marzo 2026_
