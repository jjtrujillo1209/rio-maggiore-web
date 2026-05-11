# Through Air — Bots de IA

Tres bots listos para producción, construidos con Claude Opus 4.6 + Node.js.

## Requisitos

- Node.js 18+
- Cuenta en Anthropic (API Key)

---

## 1. WhatsApp Admin Bot — Puerto 3001

Atiende clientes en WhatsApp 24/7 con IA.

**Setup:**
```bash
cd whatsapp-admin-bot
cp .env.example .env   # Llenar con tus credenciales
npm install
npm start
```

**Variables requeridas:**
- `ANTHROPIC_API_KEY` — Tu API key de Anthropic
- `WHATSAPP_TOKEN` — Token de la app de Meta
- `WHATSAPP_PHONE_ID` — ID del número de WhatsApp Business
- `VERIFY_TOKEN` — Token secreto para verificar el webhook

**Configurar webhook en Meta:**
1. Ir a developers.facebook.com → Tu app → WhatsApp → Configuración
2. URL del webhook: `https://tudominio.com/webhook`
3. Token: el valor de `VERIFY_TOKEN`
4. Suscribirse a: `messages`

---

## 2. Lead Qualifier Bot — Puerto 3002

Califica prospectos automáticamente con un widget de chat.

**Setup:**
```bash
cd lead-qualifier-bot
cp .env.example .env
npm install
npm start
```

**Uso:**
- Abrir `http://localhost:3002` para ver el widget
- Los leads calificados se guardan en `leads.json`
- API: `GET /api/leads` para ver todos los leads

**Embed en tu sitio web:**
```html
<iframe src="https://tudominio.com:3002" width="400" height="600" frameborder="0"></iframe>
```

---

## 3. E-commerce Sales Bot — Puerto 3003

Bot de ventas con catálogo, seguimiento de pedidos y recuperación de carritos.

**Setup:**
```bash
cd ecommerce-sales-bot
cp .env.example .env
npm install
npm start
```

**Uso:**
- Abrir `http://localhost:3003` para ver la tienda demo
- `GET /api/products` — catálogo
- `GET /api/order/TA-2024-015` — estado de pedido
- `GET /api/abandoned` — carritos abandonados (para remarketing)

**Pedidos de prueba:**
- `TA-2024-001` — Entregado
- `TA-2024-015` — En camino
- `TA-2024-032` — Procesando

---

## Arquitectura

```
Cliente (WhatsApp/Web)
       ↓
  Express server
       ↓
  Claude Opus 4.6  ←── System prompt personalizado
       ↓
  Respuesta + acción detectada (lead calificado, carrito, escalar)
       ↓
  Guardar en JSON / notificar
```

## Producción

Para deploy real usar:
- **Railway** o **Render** (gratuito para empezar)
- **ngrok** para pruebas locales del webhook de WhatsApp
- Variables de entorno en el panel del hosting (nunca en el código)
