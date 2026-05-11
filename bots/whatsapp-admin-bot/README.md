# WhatsApp Admin Bot

Bot de atención al cliente 24/7 para Through Air vía WhatsApp Business API.

Responde consultas sobre servicios, precios y disponibilidad usando Claude Opus 4.6 — con el tono y conocimiento de un asesor de Through Air.

---

## Requisitos

- Node.js 18+
- Cuenta en Meta Developers con app de WhatsApp Business configurada
- Número de WhatsApp Business activo
- API Key de Anthropic

---

## Instalación

```bash
cd whatsapp-admin-bot
cp .env.example .env
# Editar .env con tus credenciales
npm install
npm start
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `WHATSAPP_TOKEN` | Token de acceso de tu app Meta |
| `WHATSAPP_PHONE_ID` | ID del número de WhatsApp Business |
| `VERIFY_TOKEN` | Token secreto para verificar el webhook (elige cualquier string) |
| `PORT` | Puerto del servidor (default: 3001) |

---

## Configurar webhook en Meta

1. Ir a [developers.facebook.com](https://developers.facebook.com) → Tu app → WhatsApp → Configuración
2. En "Webhook", hacer clic en **Editar**
3. URL del webhook: `https://tudominio.com/webhook`
4. Token de verificación: el valor de tu `VERIFY_TOKEN`
5. Campos a suscribir: `messages`
6. Guardar y verificar

> Para pruebas locales, usar [ngrok](https://ngrok.com): `ngrok http 3001`

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/webhook` | Verificación del webhook (Meta lo llama al configurar) |
| `POST` | `/webhook` | Recibe mensajes entrantes de WhatsApp |
| `GET` | `/health` | Estado del servidor |

---

## Comportamiento del bot

- Responde únicamente mensajes de texto (ignora imágenes, audio, etc.)
- Mantiene historial de conversación por usuario (máx. 20 mensajes)
- Respuestas cortas y directas, optimizadas para WhatsApp
- Conoce los servicios y precios actuales de Through Air
- Ofrece agendar llamada con Juan José para cierre de ventas

### Servicios que conoce

- Pautas Digitales — $2.000.000 COP/mes
- Redes Sociales — $3.500.000 COP/mes
- Pack Mensual (ambos) — $5.500.000 COP/mes
- Página Web — $2.000.000 COP (único)
- E-Commerce — $3.900.000 COP (único)

---

## Deploy en producción

**Railway (recomendado):**
```bash
# Conectar repositorio y configurar variables de entorno en el dashboard
# Railway asigna URL HTTPS automáticamente — usar esa como webhook URL en Meta
```

**Render:**
```bash
# Crear Web Service, conectar repo, agregar env vars
# URL format: https://tu-app.onrender.com/webhook
```

**Importante:** El servidor debe estar en HTTPS para que Meta acepte el webhook. Railway y Render lo hacen automático.
