# Lead Qualifier Bot

Widget de chat que califica prospectos automáticamente y guarda los datos estructurados para seguimiento.

Se embebe en cualquier sitio web como un iframe y entrega leads listos para contactar — con nombre, empresa, servicio de interés, presupuesto y objetivo.

---

## Requisitos

- Node.js 18+
- API Key de Anthropic

---

## Instalación

```bash
cd lead-qualifier-bot
cp .env.example .env
# Agregar ANTHROPIC_API_KEY en .env
npm install
npm start
```

Abrir `http://localhost:3002` para ver el widget en acción.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `PORT` | Puerto del servidor (default: 3002) |

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Widget de chat (HTML completo) |
| `POST` | `/api/chat` | Enviar mensaje y recibir respuesta |
| `GET` | `/api/leads` | Ver todos los leads calificados |
| `GET` | `/api/health` | Estado del servidor |

### POST /api/chat

**Request:**
```json
{
  "sessionId": "uuid-de-la-sesion",
  "message": "Hola, me interesa sus servicios"
}
```

**Response:**
```json
{
  "response": "Bienvenido! ¿Me puedes decir tu nombre?",
  "qualified": false
}
```

Cuando el lead queda calificado, `qualified` es `true` y los datos se guardan en `leads.json`.

---

## Embeber en tu sitio web

### Iframe simple

```html
<iframe
  src="https://tudominio.com:3002"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);"
></iframe>
```

### Widget flotante (esquina inferior derecha)

```html
<style>
  #chat-widget {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 380px;
    height: 580px;
    border: none;
    border-radius: 16px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.3);
    z-index: 9999;
  }
</style>
<iframe id="chat-widget" src="https://tudominio.com:3002"></iframe>
```

---

## Datos que captura

Cuando Claude considera que tiene suficiente información, emite un marcador interno y el servidor guarda automáticamente:

```json
{
  "nombre": "María García",
  "empresa": "Restaurante El Fogón",
  "servicio": "Pautas Digitales",
  "presupuesto": "$2.000.000",
  "objetivo": "Aumentar reservas en un 30%",
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

Los leads se acumulan en `leads.json` en la raíz del bot.

---

## Ver leads capturados

```bash
# Via API
curl http://localhost:3002/api/leads

# Directo al archivo
cat leads.json
```

---

## Deploy en producción

```bash
# Railway
railway up

# O Render — conectar repo y configurar:
# Build Command: npm install
# Start Command: npm start
# Variables: ANTHROPIC_API_KEY=sk-ant-...
```
