# Casos de Uso — E-Commerce Sales Bot

Escenarios de venta, recuperación de carrito e integración con tiendas reales.

---

## Flujos de conversación típicos

### Recomendación de producto

```
Cliente: Busco audífonos buenos pero no muy caros
Bot: Tenemos dos opciones según tu presupuesto:
     - Audífonos Inalámbricos Pro ($289.000) — los más vendidos,
       batería 30h, cancelación de ruido básica
     - Sony WH-1000XM5 ($549.000) — cancelación de ruido premium,
       ideal si trabajas en oficina o viajes seguido
     ¿Para qué los usarías principalmente?

Cliente: Para trabajar desde casa, hay mucho ruido
Bot: Definitivamente los Sony WH-1000XM5. La cancelación de ruido
     activa hace una diferencia enorme trabajando desde casa.
     ¿Los agrego al carrito?
```

### Seguimiento de pedido

```
Cliente: Quiero saber dónde está mi pedido TA-2024-015
Bot: Tu pedido TA-2024-015 (MacBook Air M3) está en camino.
     Fecha estimada de entrega: 3-5 días hábiles.
     ¿Necesitas algo más?
```

### Recuperación de carrito

```
[Usuario agrega Smartwatch al carrito y deja de responder por 5 min]

Bot (proactivo): Hola de nuevo! Veo que tienes el Smartwatch Series X
                 en tu carrito ($599.000). ¿Tienes alguna duda sobre
                 el producto que te impide finalizar la compra?

Cliente: Es que no sé si es compatible con mi iPhone
Bot: Sí, el Smartwatch Series X es compatible con iPhone 8 o superior
     (iOS 14+). Sincroniza notificaciones, llamadas y tiene integración
     con Apple Health. ¿Finalizamos el pedido?
```

### Escalamiento a humano

```
Cliente: Quiero hacer un pedido de 50 unidades para mi empresa
Bot: Para pedidos corporativos de ese volumen manejamos precios
     especiales y condiciones de pago. Voy a conectarte con un
     asesor — ¿me das tu nombre y correo para que te contacten
     en las próximas horas?
```

---

## Conectar con Shopify

Reemplazar el catálogo mock con datos reales de Shopify:

```javascript
import fetch from 'node-fetch';

async function getCatalog() {
  const response = await fetch(
    `https://${process.env.SHOPIFY_STORE}.myshopify.com/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{
          products(first: 50) {
            edges {
              node {
                id
                title
                description
                variants(first: 1) {
                  edges { node { price } }
                }
              }
            }
          }
        }`
      })
    }
  );
  const data = await response.json();
  return data.data.products.edges.map(({ node }) => ({
    id: node.id,
    name: node.title,
    description: node.description,
    price: parseInt(node.variants.edges[0].node.price),
  }));
}
```

---

## Conectar con WooCommerce

```javascript
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const WooCommerce = new WooCommerceRestApi({
  url: process.env.WC_URL,
  consumerKey: process.env.WC_KEY,
  consumerSecret: process.env.WC_SECRET,
  version: 'wc/v3'
});

async function getCatalog() {
  const { data } = await WooCommerce.get('products', { per_page: 100 });
  return data.map(p => ({
    id: `P${p.id}`,
    name: p.name,
    description: p.short_description.replace(/<[^>]+>/g, ''),
    price: parseInt(p.price),
    stock: p.stock_quantity,
  }));
}

async function getOrderStatus(orderId) {
  const { data } = await WooCommerce.get(`orders/${orderId}`);
  return {
    id: `WC-${data.id}`,
    status: data.status,
    total: data.total,
    items: data.line_items.map(i => i.name),
  };
}
```

---

## Automatizar remarketing de carritos abandonados

Usar `GET /api/abandoned` para enviar mensajes de recuperación:

```javascript
import cron from 'node-cron';

// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  const response = await fetch('http://localhost:3003/api/abandoned');
  const carts = await response.json();

  for (const cart of carts) {
    // Enviar WhatsApp, email, o SMS
    await sendRecoveryMessage(cart.sessionId, cart.items);
  }
});

async function sendRecoveryMessage(sessionId, items) {
  const itemNames = items.map(i => i.name).join(', ');
  const total = items.reduce((sum, i) => sum + i.price, 0).toLocaleString('es-CO');

  // Ejemplo: enviar por WhatsApp
  await sendWhatsAppMessage(
    getPhoneForSession(sessionId),
    `Hola! Dejaste ${itemNames} en tu carrito ($${total} COP).
     ¿Necesitas ayuda para finalizar tu compra? Escríbenos.`
  );
}
```

---

## Ajustar umbral de carrito abandonado

Por defecto: 5 minutos de inactividad. Cambiar en `index.js`:

```javascript
// Umbral de abandono (en milisegundos)
const ABANDONMENT_THRESHOLD = 30 * 60 * 1000; // 30 minutos

// Frecuencia de verificación
setInterval(checkAbandonedCarts, 10 * 60 * 1000); // cada 10 min
```

---

## Personalizar el bot para otro tipo de tienda

### Tienda de ropa

```javascript
const systemPrompt = `
Eres asesor de moda de [Nombre Tienda]. Ayuda a los clientes a:
- Encontrar su talla correcta
- Combinar outfits
- Conocer disponibilidad de colores
- Entender política de devoluciones (30 días)

Siempre pregunta la ocasión (casual, trabajo, evento) para recomendar mejor.
`;
```

### Restaurante con pedidos online

```javascript
const systemPrompt = `
Eres el asistente de [Restaurante]. Gestiona pedidos para domicilio:
- Toma el pedido completo (platos, bebidas, postre)
- Confirma dirección de entrega
- Informa tiempo estimado (30-45 min)
- Acepta métodos de pago: efectivo, Nequi, Daviplata

Cuando tengas el pedido completo, emite:
PEDIDO_CONFIRMADO: {"items":[...],"total":X,"direccion":"...","pago":"..."}
`;
```
