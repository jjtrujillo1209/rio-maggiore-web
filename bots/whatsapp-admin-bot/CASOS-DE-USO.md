# Casos de Uso — WhatsApp Admin Bot

Ejemplos reales de conversaciones y guía para personalizar el bot.

---

## Flujos de conversación típicos

### Consulta de precios

```
Cliente: Hola, quiero saber cuánto cuestan sus servicios
Bot: Hola! En Through Air manejamos:
     - Pautas Digitales: $2.000.000/mes
     - Redes Sociales: $3.500.000/mes
     - Pack mensual (los dos): $5.500.000
     ¿Te interesa alguno en particular?

Cliente: ¿Qué incluye Redes Sociales?
Bot: Incluye gestión completa de tus redes: contenido, diseño,
     publicación y reportes mensuales. ¿Qué redes manejas actualmente?
```

### Calificación de lead

```
Cliente: Tenemos una empresa de restaurantes y queremos más clientes
Bot: Perfecto, eso es exactamente lo que hacemos. ¿En qué ciudad están
     y cuántas mesas tienen? Así te digo cuál servicio encaja mejor.

Cliente: Medellín, 40 mesas
Bot: Con 40 mesas en Medellín, Pautas Digitales tiene mucho potencial.
     ¿Te puedo conectar con Juan José para una llamada de 15 min sin costo?
```

### Seguimiento de pedido / soporte

```
Cliente: Necesito hablar con alguien de su equipo
Bot: Claro, ¿sobre qué tema? Si es urgente te conecto con Juan José
     directamente. Si no, me cuentas y lo gestionamos aquí.
```

---

## Personalizar el sistema prompt

El comportamiento del bot se define en el `systemPrompt` dentro de `index.js`.

### Cambiar los servicios

```javascript
const systemPrompt = `...
SERVICIOS Y PRECIOS ACTUALES:
- [Tu servicio 1]: $X.XXX.XXX COP/mes
- [Tu servicio 2]: $X.XXX.XXX COP/mes
...`;
```

### Cambiar el tono

Por defecto el bot usa un tono profesional pero cercano. Para ajustar:

```javascript
// Más formal
"Responde siempre de manera formal, usando 'usted'."

// Más casual
"Responde con un tono muy cercano y usa emojis ocasionalmente."
```

### Agregar preguntas de calificación

```javascript
// Agregar al prompt:
`Cuando un cliente muestre interés, pregunta:
1. ¿En qué ciudad está su negocio?
2. ¿Cuánto tiempo lleva operando?
3. ¿Ha invertido en publicidad digital antes?`
```

### Límite de mensajes por conversación

Por defecto el historial se limita a 20 mensajes. Cambiar en `index.js`:

```javascript
// Línea: if (history.length > 20)
if (history.length > 10) // Conversaciones más cortas, menos tokens
```

---

## Integrar con CRM

Cuando el bot detecta un lead interesado, puedes guardar los datos automáticamente.

### Ejemplo: guardar en Notion

```javascript
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_KEY });

async function saveLead(phone, name, interest) {
  await notion.pages.create({
    parent: { database_id: process.env.NOTION_DB_ID },
    properties: {
      Nombre: { title: [{ text: { content: name } }] },
      Telefono: { rich_text: [{ text: { content: phone } }] },
      Interes: { select: { name: interest } },
    }
  });
}
```

### Ejemplo: notificar a Juan José por WhatsApp

```javascript
// Al detectar palabras clave como "quiero contratar", "cuándo empezamos"
async function notifyOwner(clientPhone, message) {
  await sendWhatsAppMessage(
    process.env.OWNER_PHONE,
    `Lead caliente! ${clientPhone} dijo: "${message}"`
  );
}
```

---

## Horarios de atención

Para responder diferente fuera de horario, agregar al inicio de `getAIResponse`:

```javascript
const hour = new Date().getHours();
const isBusinessHours = hour >= 8 && hour < 18;

const systemPrompt = isBusinessHours
  ? promptNormal
  : `${promptNormal}
     IMPORTANTE: Son las ${hour}:00, fuera de horario de oficina.
     Informa que Juan José lo contactará mañana en horario laboral (8am-6pm).`;
```

---

## Estadísticas de uso

Para ver cuántos mensajes procesa el bot, agregar logging básico:

```javascript
let stats = { messages: 0, users: new Set() };

// Dentro de la ruta POST /webhook:
stats.messages++;
stats.users.add(from);

// Nuevo endpoint:
app.get('/stats', (req, res) => {
  res.json({
    totalMessages: stats.messages,
    uniqueUsers: stats.users.size,
    activeSessions: conversations.size
  });
});
```
