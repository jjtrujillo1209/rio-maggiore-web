# E-Commerce Sales Bot

Bot de ventas con catálogo interactivo, seguimiento de pedidos y recuperación automática de carritos abandonados.

Funciona como vendedor virtual 24/7: recomienda productos, aclara dudas, rastrea pedidos y detecta cuando un cliente está a punto de irse sin comprar.

---

## Requisitos

- Node.js 18+
- API Key de Anthropic

---

## Instalación

```bash
cd ecommerce-sales-bot
cp .env.example .env
# Agregar ANTHROPIC_API_KEY en .env
npm install
npm start
```

Abrir `http://localhost:3003` para ver la tienda demo.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `PORT` | Puerto del servidor (default: 3003) |

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Tienda demo con chat integrado |
| `POST` | `/api/chat` | Enviar mensaje al bot |
| `GET` | `/api/products` | Catálogo de productos |
| `GET` | `/api/order/:id` | Estado de un pedido |
| `GET` | `/api/abandoned` | Carritos abandonados para remarketing |
| `GET` | `/api/health` | Estado del servidor |

### POST /api/chat

**Request:**
```json
{
  "sessionId": "uuid-sesion",
  "message": "¿Tienen audífonos bluetooth?",
  "cartItems": [
    { "id": "P001", "name": "Audífonos Pro", "price": 289000 }
  ]
}
```

**Response:**
```json
{
  "response": "Sí! Los Audífonos Pro son nuestra opción más popular...",
  "action": null
}
```

Cuando se detecta recuperación de carrito o necesidad de escalar:

```json
{
  "response": "Veo que tienes el smartwatch en tu carrito...",
  "action": {
    "type": "CARRITO_RECUPERADO",
    "data": { "sessionId": "...", "items": [...] }
  }
}
```

---

## Pedidos de prueba incluidos

| ID | Estado |
|---|---|
| `TA-2024-001` | Entregado — Samsung Galaxy S24 |
| `TA-2024-015` | En camino — MacBook Air M3 |
| `TA-2024-032` | Procesando — Sony WH-1000XM5 |

---

## Detección de carritos abandonados

El bot monitorea la actividad cada 5 minutos. Si un usuario tiene items en el carrito y no ha interactuado en más de 5 minutos, el carrito se registra como abandonado en `abandoned.json`.

```bash
# Ver carritos abandonados
curl http://localhost:3003/api/abandoned
```

Usar esta data para campañas de remarketing o para que Juan José haga seguimiento manual.

---

## Catálogo demo incluido

| ID | Producto | Precio |
|---|---|---|
| P001 | Audífonos Inalámbricos Pro | $289.000 |
| P002 | Smartwatch Series X | $599.000 |
| P003 | Cámara 4K Ultra | $1.299.000 |
| P004 | Laptop UltraSlim | $2.499.000 |
| P005 | Tablet Pro 11" | $899.000 |

---

## Reemplazar con catálogo real

Editar el array `catalog` en `index.js`:

```javascript
const catalog = [
  { id: 'SKU001', name: 'Tu Producto 1', price: 150000, description: 'Descripción', category: 'Categoría', stock: 50 },
  { id: 'SKU002', name: 'Tu Producto 2', price: 250000, description: 'Descripción', category: 'Categoría', stock: 30 },
  // ...
];
```

O conectar con tu base de datos real en la función `getAIResponse`.

---

## Deploy en producción

```bash
# Railway
railway up

# Variables a configurar:
# ANTHROPIC_API_KEY=sk-ant-...
# PORT=3003
```
