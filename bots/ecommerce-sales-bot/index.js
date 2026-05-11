import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const app = express();
app.use(express.json());

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const CONFIG_FILE = './config.json';
const ABANDONED_FILE = './abandoned.json';

const DEFAULT_CONFIG = {
  anthropicApiKey: '',
  // Identidad de la tienda
  storeName: 'Mi Tienda',
  botName: 'Aire',
  storeDescription: 'tienda online',
  returnPolicy: '30 días para devoluciones',
  shippingInfo: '2-5 días hábiles',
  // Catálogo de productos
  products: [
    { id: 'P001', name: 'Producto 1', price: 89000, stock: 15, category: 'General', emoji: '📦' },
    { id: 'P002', name: 'Producto 2', price: 145000, stock: 8, category: 'General', emoji: '📦' },
    { id: 'P003', name: 'Producto 3', price: 220000, stock: 5, category: 'General', emoji: '📦' },
  ],
  // Órdenes de prueba
  sampleOrders: [
    { id: 'ORD-001', status: 'Entregado', product: 'Producto 1', date: '2024-12-01', total: 89000 },
    { id: 'ORD-002', status: 'En camino', product: 'Producto 2', date: '2025-01-10', total: 145000, tracking: 'En camino, llega mañana' },
  ],
  // Comportamiento
  abandonmentMinutes: 5,
  recoveryDiscount: '5%',
  tone: 'amigable y entusiasta',
  maxSentences: 3,
  primaryColor: '#F26522',
  secondaryColor: '#C8317A',
  navColor: '#1B1B6E',
};

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) }; }
  catch { return { ...DEFAULT_CONFIG }; }
}

function saveConfig(data) { writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2)); }

function loadAbandoned() {
  if (!existsSync(ABANDONED_FILE)) return [];
  try { return JSON.parse(readFileSync(ABANDONED_FILE, 'utf8')); } catch { return []; }
}

function saveAbandoned(cart) {
  const list = loadAbandoned();
  const idx = list.findIndex(c => c.sessionId === cart.sessionId);
  if (idx >= 0) list[idx] = { ...cart, updatedAt: new Date().toISOString() };
  else list.push({ ...cart, createdAt: new Date().toISOString() });
  writeFileSync(ABANDONED_FILE, JSON.stringify(list, null, 2));
}

// ─── SYSTEM PROMPT DINÁMICO ──────────────────────────────────────────────────

function buildSystemPrompt(cfg, extraContext = '') {
  const catalog = cfg.products
    .map(p => `- [${p.id}] ${p.name}: $${p.price.toLocaleString('es-CO')} COP (${p.stock} disponibles)`)
    .join('\n');
  return `Eres ${cfg.botName}, asistente de ventas de ${cfg.storeName} (${cfg.storeDescription}).

CATÁLOGO:
${catalog}

POLÍTICAS:
- Devoluciones: ${cfg.returnPolicy}
- Envíos: ${cfg.shippingInfo}

COMPORTAMIENTO:
- Sé ${cfg.tone}, máximo ${cfg.maxSentences} oraciones por respuesta
- Si el cliente da un número de orden, busca en el sistema y responde con el estado
- Si el cliente tiene carrito activo y no ha comprado, ofrece un ${cfg.recoveryDiscount} de descuento
- Para recuperar carrito: CARRITO_RECUPERADO: {"sessionId":"...","descuento":"${cfg.recoveryDiscount}"}
- Para escalar: ESCALAR_HUMANO: {"motivo":"..."}
- Siempre cierra con una pregunta o CTA${extraContext}`;
}

// ─── BOT LOGIC ───────────────────────────────────────────────────────────────

const sessions = new Map();

async function chat(sessionId, userMessage, cartItems = []) {
  const cfg = loadConfig();
  const apiKey = cfg.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  const client = new Anthropic({ apiKey });

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { history: [], cart: cartItems, lastActivity: Date.now() });
  }
  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  if (cartItems.length > 0) session.cart = cartItems;

  // Detectar número de orden
  const orderPrefix = cfg.sampleOrders?.[0]?.id?.replace(/-\d+$/, '-') || 'ORD-';
  const orderMatch = userMessage.match(new RegExp(orderPrefix.replace('-', '[-_]?') + '\\d+', 'i'));
  let extra = '';
  if (orderMatch) {
    const order = cfg.sampleOrders?.find(o => o.id.toUpperCase() === orderMatch[0].toUpperCase());
    if (order) {
      extra = `\nINFO PEDIDO ${order.id}: Estado: ${order.status} | Producto: ${order.product} | Fecha: ${order.date}${order.tracking ? ' | ' + order.tracking : ''}`;
    } else {
      extra = `\nEl pedido ${orderMatch[0]} no fue encontrado.`;
    }
  }

  const cartContext = session.cart.length > 0
    ? `\n\nCARRITO ACTUAL: ${session.cart.map(i => `${i.name} x${i.qty || 1}`).join(', ')}`
    : '';

  session.history.push({ role: 'user', content: userMessage });
  if (session.history.length > 20) session.history.splice(0, session.history.length - 20);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: buildSystemPrompt(cfg, extra + cartContext),
    messages: session.history,
  });

  const reply = response.content[0].text;
  session.history.push({ role: 'assistant', content: reply });

  let action = null;
  const cartRecovery = reply.match(/CARRITO_RECUPERADO:\s*(\{.*?\})/s);
  if (cartRecovery) {
    try { action = { type: 'cart_recovery', data: JSON.parse(cartRecovery[1]) }; saveAbandoned({ sessionId, cart: session.cart, recovered: true }); } catch {}
  }
  const escalate = reply.match(/ESCALAR_HUMANO:\s*(\{.*?\})/s);
  if (escalate) {
    try { action = { type: 'escalate', data: JSON.parse(escalate[1]) }; } catch {}
  }

  const cleanReply = reply.replace(/CARRITO_RECUPERADO:\s*\{.*?\}/s, '').replace(/ESCALAR_HUMANO:\s*\{.*?\}/s, '').trim();
  return { reply: cleanReply, action };
}

// Abandono automático
setInterval(() => {
  const cfg = loadConfig();
  const threshold = (cfg.abandonmentMinutes || 5) * 60 * 1000;
  for (const [sid, session] of sessions.entries()) {
    if (Date.now() - session.lastActivity > threshold && session.cart.length > 0 && !session.recoveryAttempted) {
      session.recoveryAttempted = true;
      saveAbandoned({ sessionId: sid, cart: session.cart, recovered: false });
      console.log(`[CARRITO ABANDONADO] Sesión ${sid}`);
    }
  }
}, 60 * 1000);

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

app.get('/admin', (req, res) => {
  const cfg = loadConfig();
  const abandoned = loadAbandoned();
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>E-Commerce Sales Bot — Panel de Configuración</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#07070b;color:#e2e2f0;min-height:100vh;display:flex}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0f0f1a}::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:3px}
.sidebar{width:240px;min-height:100vh;background:#0d0d1a;border-right:1px solid #1e1e3a;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:10}
.sidebar-logo{padding:1.5rem;border-bottom:1px solid #1e1e3a}
.sidebar-logo .through{font-weight:900;font-size:1.1rem;color:#fff;letter-spacing:-0.5px}
.sidebar-logo .air{font-weight:300;font-size:1.4rem;color:#F26522}
.sidebar-logo .badge{font-size:.65rem;background:linear-gradient(135deg,#F26522,#C8317A);color:#fff;padding:.2rem .6rem;border-radius:50px;margin-top:.4rem;display:inline-block}
nav{padding:1rem 0;flex:1}
nav a{display:flex;align-items:center;gap:.7rem;padding:.65rem 1.2rem;color:#8888aa;text-decoration:none;font-size:.85rem;transition:all .2s;cursor:pointer;border-left:2px solid transparent}
nav a:hover,nav a.active{color:#fff;background:rgba(242,101,34,.08);border-left-color:#F26522}
nav a .icon{font-size:1rem;width:20px;text-align:center}
.sidebar-footer{padding:1rem 1.2rem;border-top:1px solid #1e1e3a}
.status-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;margin-right:.5rem;box-shadow:0 0 6px #22c55e}
.status-text{font-size:.75rem;color:#888}
.main{margin-left:240px;flex:1;padding:2rem;max-width:1020px}
.page-header{margin-bottom:2rem}
.page-header h1{font-size:1.6rem;font-weight:700;color:#fff;margin-bottom:.3rem}
.page-header p{color:#666;font-size:.875rem}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
.stat{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:12px;padding:1.2rem;text-align:center}
.stat .num{font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,#F26522,#C8317A);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat .lbl{font-size:.72rem;color:#666;margin-top:.2rem}
.card{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:16px;padding:1.8rem;margin-bottom:1.5rem}
.card-header{display:flex;align-items:center;gap:.8rem;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #1e1e3a}
.card-header .icon{width:36px;height:36px;background:linear-gradient(135deg,#F26522,#C8317A);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem}
.card-header h2{font-size:1rem;font-weight:600;color:#fff}
.card-header p{font-size:.78rem;color:#666;margin-top:.1rem}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.form-grid.single{grid-template-columns:1fr}
.form-grid.three{grid-template-columns:1fr 1fr 1fr}
.field{display:flex;flex-direction:column;gap:.4rem}
.field label{font-size:.78rem;color:#888;font-weight:500;letter-spacing:.3px;text-transform:uppercase}
.field input,.field select,.field textarea{background:#1a1a2e;border:1.5px solid #2a2a4a;border-radius:10px;padding:.7rem 1rem;color:#e2e2f0;font-size:.875rem;outline:none;transition:border-color .2s;width:100%}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#F26522;box-shadow:0 0 0 3px rgba(242,101,34,.1)}
.field .input-wrap{position:relative;display:flex;align-items:center}
.field .input-wrap input{padding-right:2.5rem}
.field .eye-btn{position:absolute;right:.7rem;background:none;border:none;color:#555;cursor:pointer;font-size:.95rem}
.field .hint{font-size:.72rem;color:#555;margin-top:.2rem}
/* Products table */
.products-table{width:100%;border-collapse:collapse}
.products-table th{padding:.6rem .8rem;text-align:left;font-size:.72rem;color:#666;text-transform:uppercase;border-bottom:1px solid #1e1e3a}
.products-table td{padding:.5rem .8rem;border-bottom:1px solid #0d0d1a}
.products-table td input{background:#1a1a2e;border:1px solid #2a2a4a;border-radius:6px;padding:.4rem .7rem;color:#e2e2f0;font-size:.82rem;outline:none;width:100%}
.products-table td input:focus{border-color:#F26522}
.products-table td input.price-input{width:120px}
.products-table td input.stock-input{width:70px}
.products-table td input.emoji-input{width:60px;text-align:center}
.remove-btn{width:28px;height:28px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:6px;color:#ef4444;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:all .2s}
.remove-btn:hover{background:rgba(239,68,68,.2)}
.add-btn{display:flex;align-items:center;gap:.5rem;padding:.6rem 1rem;background:rgba(242,101,34,.1);border:1.5px dashed rgba(242,101,34,.4);border-radius:10px;color:#F26522;cursor:pointer;font-size:.85rem;font-weight:500;transition:all .2s;width:100%;justify-content:center;margin-top:.8rem}
.add-btn:hover{background:rgba(242,101,34,.15);border-color:#F26522}
/* Orders table */
.orders-table{width:100%;border-collapse:collapse}
.orders-table th{padding:.6rem .8rem;text-align:left;font-size:.72rem;color:#666;text-transform:uppercase;border-bottom:1px solid #1e1e3a}
.orders-table td{padding:.5rem .8rem;font-size:.82rem;color:#ccc;border-bottom:1px solid #0d0d1a}
.orders-table td input{background:#1a1a2e;border:1px solid #2a2a4a;border-radius:6px;padding:.4rem .7rem;color:#e2e2f0;font-size:.8rem;outline:none;width:100%}
.orders-table td input:focus{border-color:#F26522}
.status-badge{padding:.2rem .6rem;border-radius:50px;font-size:.72rem;font-weight:600}
.status-badge.delivered{background:rgba(34,197,94,.15);color:#22c55e}
.status-badge.shipping{background:rgba(59,130,246,.15);color:#60a5fa}
.status-badge.processing{background:rgba(234,179,8,.15);color:#eab308}
/* Abandoned table */
.abandoned-table{width:100%;border-collapse:collapse}
.abandoned-table th{padding:.6rem 1rem;text-align:left;font-size:.72rem;color:#666;text-transform:uppercase;border-bottom:1px solid #1e1e3a}
.abandoned-table td{padding:.6rem 1rem;font-size:.82rem;color:#ccc;border-bottom:1px solid #111}
/* Colors */
.colors-row{display:flex;gap:1rem}
.color-field{flex:1}
.color-field label{font-size:.78rem;color:#888;font-weight:500;text-transform:uppercase;display:block;margin-bottom:.4rem}
.color-field input[type=color]{width:100%;height:40px;border:1.5px solid #2a2a4a;border-radius:10px;background:#1a1a2e;cursor:pointer;padding:.2rem}
/* Store preview */
.store-preview{background:#f0f2f5;border-radius:16px;overflow:hidden;border:1px solid #eee}
.store-nav-preview{padding:.8rem 1.5rem;color:#fff;font-weight:700;font-size:.9rem}
.store-products-preview{padding:1rem;display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem}
.product-card-preview{background:#fff;border-radius:10px;padding:.7rem;text-align:center}
.product-card-preview .emoji{font-size:1.5rem}
.product-card-preview h4{font-size:.72rem;color:#1a1a2e;margin:.3rem 0 .2rem}
.product-card-preview .price{font-size:.78rem;font-weight:700}
/* Save */
.save-bar{position:fixed;bottom:2rem;right:2rem;display:flex;gap:.8rem;align-items:center;z-index:20}
.save-btn{padding:.8rem 2rem;background:linear-gradient(135deg,#F26522,#C8317A);border:none;border-radius:12px;color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 20px rgba(242,101,34,.4)}
.save-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(242,101,34,.5)}
.toast{padding:.7rem 1.2rem;background:#1a2e1a;border:1px solid #22c55e;border-radius:10px;color:#22c55e;font-size:.85rem;font-weight:600;opacity:0;transition:opacity .3s}
.toast.show{opacity:1}
.toast.error{background:#2e1a1a;border-color:#ef4444;color:#ef4444}
</style>
</head>
<body>
<aside class="sidebar">
  <div class="sidebar-logo">
    <div><span class="through">through</span> <span class="air">air</span></div>
    <div class="badge">E-Commerce Sales Bot</div>
  </div>
  <nav>
    <a href="#creds" class="active"><span class="icon">🔑</span> Credenciales</a>
    <a href="#identity"><span class="icon">🏪</span> Tienda</a>
    <a href="#products"><span class="icon">📦</span> Productos</a>
    <a href="#orders"><span class="icon">📋</span> Órdenes de prueba</a>
    <a href="#behavior"><span class="icon">🤖</span> Comportamiento</a>
    <a href="#appearance"><span class="icon">🎨</span> Apariencia</a>
    <a href="#abandoned"><span class="icon">🛒</span> Carritos (${abandoned.filter(c => !c.recovered).length})</a>
  </nav>
  <div class="sidebar-footer">
    <span class="status-dot"></span>
    <span class="status-text">Bot activo · Puerto ${process.env.PORT || 3003}</span>
  </div>
</aside>

<main class="main">
  <div class="page-header">
    <h1>Configuración del Bot</h1>
    <p>Personaliza el bot de ventas para tu cliente. Los cambios aplican al instante.</p>
  </div>

  <div class="stats">
    <div class="stat"><div class="num">${cfg.products.length}</div><div class="lbl">Productos</div></div>
    <div class="stat"><div class="num">${sessions.size}</div><div class="lbl">Sesiones activas</div></div>
    <div class="stat"><div class="num">${abandoned.filter(c => !c.recovered).length}</div><div class="lbl">Carritos abandonados</div></div>
    <div class="stat"><div class="num">${abandoned.filter(c => c.recovered).length}</div><div class="lbl">Carritos recuperados</div></div>
  </div>

  <!-- Credenciales -->
  <div class="card" id="creds">
    <div class="card-header">
      <div class="icon">🔑</div>
      <div><h2>Credenciales</h2><p>API Key de Anthropic</p></div>
    </div>
    <div class="field">
      <label>Anthropic API Key</label>
      <div class="input-wrap">
        <input type="password" id="anthropicApiKey" value="${cfg.anthropicApiKey}" placeholder="sk-ant-..."/>
        <button class="eye-btn" onclick="togglePass('anthropicApiKey')">👁</button>
      </div>
      <span class="hint">Conseguirla en console.anthropic.com</span>
    </div>
  </div>

  <!-- Tienda -->
  <div class="card" id="identity">
    <div class="card-header">
      <div class="icon">🏪</div>
      <div><h2>Identidad de la tienda</h2><p>Nombre, descripción y políticas</p></div>
    </div>
    <div class="form-grid">
      <div class="field">
        <label>Nombre de la tienda</label>
        <input type="text" id="storeName" value="${cfg.storeName}" placeholder="Mi Tienda"/>
      </div>
      <div class="field">
        <label>Nombre del bot</label>
        <input type="text" id="botName" value="${cfg.botName}" placeholder="Aire"/>
        <span class="hint">Cómo se presenta el asistente</span>
      </div>
      <div class="field" style="grid-column:1/-1">
        <label>Descripción de la tienda</label>
        <input type="text" id="storeDescription" value="${cfg.storeDescription}" placeholder="tienda de ropa en Medellín"/>
      </div>
      <div class="field">
        <label>Política de devoluciones</label>
        <input type="text" id="returnPolicy" value="${cfg.returnPolicy}" placeholder="30 días para devoluciones"/>
      </div>
      <div class="field">
        <label>Información de envíos</label>
        <input type="text" id="shippingInfo" value="${cfg.shippingInfo}" placeholder="2-5 días hábiles"/>
      </div>
    </div>
  </div>

  <!-- Productos -->
  <div class="card" id="products">
    <div class="card-header">
      <div class="icon">📦</div>
      <div><h2>Catálogo de productos</h2><p>El bot solo venderá lo que está aquí</p></div>
    </div>
    <div style="overflow-x:auto">
      <table class="products-table">
        <thead>
          <tr>
            <th>Emoji</th>
            <th>ID</th>
            <th style="min-width:180px">Nombre del producto</th>
            <th>Precio (COP)</th>
            <th>Stock</th>
            <th>Categoría</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="productTableBody"></tbody>
      </table>
    </div>
    <button class="add-btn" onclick="addProduct()">+ Agregar producto</button>
  </div>

  <!-- Órdenes de prueba -->
  <div class="card" id="orders">
    <div class="card-header">
      <div class="icon">📋</div>
      <div><h2>Órdenes de prueba</h2><p>El bot puede responder consultas sobre estos pedidos</p></div>
    </div>
    <div style="overflow-x:auto">
      <table class="orders-table">
        <thead>
          <tr><th>ID del pedido</th><th>Estado</th><th>Producto</th><th>Fecha</th><th>Total</th><th></th></tr>
        </thead>
        <tbody id="ordersTableBody"></tbody>
      </table>
    </div>
    <button class="add-btn" onclick="addOrder()">+ Agregar pedido</button>
  </div>

  <!-- Comportamiento -->
  <div class="card" id="behavior">
    <div class="card-header">
      <div class="icon">🤖</div>
      <div><h2>Comportamiento del bot</h2><p>Tono, carritos abandonados y recuperación</p></div>
    </div>
    <div class="form-grid three">
      <div class="field">
        <label>Tono del bot</label>
        <select id="tone">
          <option value="amigable y entusiasta" ${cfg.tone === 'amigable y entusiasta' ? 'selected' : ''}>Amigable y entusiasta</option>
          <option value="profesional y conciso" ${cfg.tone === 'profesional y conciso' ? 'selected' : ''}>Profesional y conciso</option>
          <option value="casual y divertido" ${cfg.tone === 'casual y divertido' ? 'selected' : ''}>Casual y divertido</option>
          <option value="experto y consultivo" ${cfg.tone === 'experto y consultivo' ? 'selected' : ''}>Experto y consultivo</option>
        </select>
      </div>
      <div class="field">
        <label>Minutos para carrito abandonado</label>
        <input type="number" id="abandonmentMinutes" value="${cfg.abandonmentMinutes}" min="1" max="60"/>
        <span class="hint">Tiempo de inactividad antes de marcar como abandonado</span>
      </div>
      <div class="field">
        <label>Descuento de recuperación</label>
        <input type="text" id="recoveryDiscount" value="${cfg.recoveryDiscount}" placeholder="5%"/>
        <span class="hint">Se ofrece al intentar recuperar el carrito</span>
      </div>
    </div>
  </div>

  <!-- Apariencia -->
  <div class="card" id="appearance">
    <div class="card-header">
      <div class="icon">🎨</div>
      <div><h2>Apariencia de la tienda</h2><p>Colores del header y del chat</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start">
      <div>
        <div class="colors-row">
          <div class="color-field">
            <label>Color primario</label>
            <input type="color" id="primaryColor" value="${cfg.primaryColor}"/>
          </div>
          <div class="color-field">
            <label>Color secundario</label>
            <input type="color" id="secondaryColor" value="${cfg.secondaryColor}"/>
          </div>
          <div class="color-field">
            <label>Color del nav</label>
            <input type="color" id="navColor" value="${cfg.navColor}"/>
          </div>
        </div>
      </div>
      <div>
        <div style="font-size:.75rem;color:#555;margin-bottom:.5rem">Vista previa</div>
        <div class="store-preview">
          <div class="store-nav-preview" id="storeNavPreview" style="background:${cfg.navColor}">${cfg.storeName}</div>
          <div class="store-products-preview" id="storeProductsPreview"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Carritos abandonados -->
  <div class="card" id="abandoned">
    <div class="card-header">
      <div class="icon">🛒</div>
      <div><h2>Carritos abandonados</h2><p>${abandoned.length} registros totales</p></div>
    </div>
    ${abandoned.length === 0
      ? '<div style="text-align:center;color:#444;padding:2rem;font-size:.875rem">No hay carritos abandonados aún. Aparecerán aquí automáticamente.</div>'
      : `<div style="overflow-x:auto"><table class="abandoned-table">
        <thead><tr><th>Sesión</th><th>Productos</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
        <tbody>
        ${abandoned.slice(-10).reverse().map(c => {
          const total = (c.cart || []).reduce((s, i) => s + (i.price || i.precio || 0) * (i.qty || 1), 0);
          const items = (c.cart || []).map(i => i.name || i.nombre).join(', ') || '—';
          return `<tr>
            <td style="font-family:monospace;font-size:.75rem">${c.sessionId?.slice(-8) || '—'}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${items}</td>
            <td>$${total.toLocaleString('es-CO')}</td>
            <td><span class="status-badge ${c.recovered ? 'delivered' : 'shipping'}">${c.recovered ? 'Recuperado' : 'Abandonado'}</span></td>
            <td>${new Date(c.createdAt || c.updatedAt).toLocaleDateString('es-CO')}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table></div>`}
  </div>

  <div style="height:5rem"></div>
</main>

<div class="save-bar">
  <div class="toast" id="toast">¡Configuración guardada!</div>
  <button class="save-btn" onclick="saveConfig()">Guardar cambios</button>
</div>

<script>
const initProducts = ${JSON.stringify(cfg.products)};
const initOrders = ${JSON.stringify(cfg.sampleOrders || [])};

function renderProducts(list) {
  const tb = document.getElementById('productTableBody');
  tb.innerHTML = list.map((p, i) => \`<tr id="pr\${i}">
    <td><input class="emoji-input" type="text" value="\${p.emoji||'📦'}" placeholder="📦"/></td>
    <td><input type="text" value="\${p.id}" placeholder="P00\${i+1}" style="width:80px"/></td>
    <td><input type="text" value="\${p.name}" placeholder="Nombre del producto" oninput="updatePreview()"/></td>
    <td><input class="price-input" type="number" value="\${p.price}" placeholder="89000" oninput="updatePreview()"/></td>
    <td><input class="stock-input" type="number" value="\${p.stock}" placeholder="10"/></td>
    <td><input type="text" value="\${p.category||''}" placeholder="General" style="width:100px"/></td>
    <td><button class="remove-btn" onclick="removeProduct(\${i})">×</button></td>
  </tr>\`).join('');
}

function addProduct() {
  const list = getProducts();
  list.push({ id: 'P' + String(list.length + 1).padStart(3,'0'), name: '', price: 0, stock: 10, category: 'General', emoji: '📦' });
  renderProducts(list);
  updatePreview();
}

function removeProduct(i) { const l = getProducts(); l.splice(i,1); renderProducts(l); updatePreview(); }

function getProducts() {
  return Array.from(document.querySelectorAll('#productTableBody tr')).map(row => {
    const inputs = row.querySelectorAll('input');
    return { emoji: inputs[0].value, id: inputs[1].value, name: inputs[2].value, price: parseInt(inputs[3].value)||0, stock: parseInt(inputs[4].value)||0, category: inputs[5].value };
  });
}

function renderOrders(list) {
  const tb = document.getElementById('ordersTableBody');
  tb.innerHTML = list.map((o, i) => \`<tr>
    <td><input type="text" value="\${o.id}" placeholder="ORD-001" style="width:110px"/></td>
    <td><input type="text" value="\${o.status}" placeholder="Entregado / En camino / Procesando" /></td>
    <td><input type="text" value="\${o.product}" placeholder="Nombre del producto"/></td>
    <td><input type="text" value="\${o.date}" placeholder="2024-01-15" style="width:110px"/></td>
    <td><input type="number" value="\${o.total}" placeholder="89000" style="width:100px"/></td>
    <td><button class="remove-btn" onclick="removeOrder(\${i})">×</button></td>
  </tr>\`).join('');
}

function addOrder() { const l = getOrders(); l.push({ id: 'ORD-' + String(l.length+1).padStart(3,'0'), status: 'Procesando', product: '', date: new Date().toISOString().slice(0,10), total: 0 }); renderOrders(l); }
function removeOrder(i) { const l = getOrders(); l.splice(i,1); renderOrders(l); }

function getOrders() {
  return Array.from(document.querySelectorAll('#ordersTableBody tr')).map(row => {
    const inputs = row.querySelectorAll('input');
    return { id: inputs[0].value, status: inputs[1].value, product: inputs[2].value, date: inputs[3].value, total: parseInt(inputs[4].value)||0 };
  });
}

function updatePreview() {
  const navColor = document.getElementById('navColor').value;
  const p1 = document.getElementById('primaryColor').value;
  const storeName = document.getElementById('storeName').value;
  document.getElementById('storeNavPreview').style.background = navColor;
  document.getElementById('storeNavPreview').textContent = storeName;
  const products = getProducts().slice(0, 3);
  document.getElementById('storeProductsPreview').innerHTML = products.map(p => \`
    <div class="product-card-preview">
      <div class="emoji">\${p.emoji || '📦'}</div>
      <h4>\${p.name || 'Producto'}</h4>
      <div class="price" style="color:\${p1}">$\${(p.price||0).toLocaleString('es-CO')}</div>
    </div>\`).join('');
}

function getConfig() {
  return {
    anthropicApiKey: document.getElementById('anthropicApiKey').value,
    storeName: document.getElementById('storeName').value,
    botName: document.getElementById('botName').value,
    storeDescription: document.getElementById('storeDescription').value,
    returnPolicy: document.getElementById('returnPolicy').value,
    shippingInfo: document.getElementById('shippingInfo').value,
    products: getProducts().filter(p => p.name.trim()),
    sampleOrders: getOrders().filter(o => o.id.trim()),
    tone: document.getElementById('tone').value,
    abandonmentMinutes: parseInt(document.getElementById('abandonmentMinutes').value)||5,
    recoveryDiscount: document.getElementById('recoveryDiscount').value,
    primaryColor: document.getElementById('primaryColor').value,
    secondaryColor: document.getElementById('secondaryColor').value,
    navColor: document.getElementById('navColor').value,
  };
}

async function saveConfig() {
  try {
    const res = await fetch('/api/config', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(getConfig())
    });
    showToast(res.ok ? '¡Configuración guardada!' : 'Error al guardar', !res.ok);
  } catch { showToast('Error de conexión', true); }
}

function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '') + ' show';
  setTimeout(() => t.className = 'toast' + (isError ? ' error' : ''), 2500);
}

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelectorAll('nav a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});

document.addEventListener('input', updatePreview);
document.addEventListener('change', updatePreview);

renderProducts(initProducts);
renderOrders(initOrders);
updatePreview();
</script>
</body>
</html>`);
});

app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  res.json({ ...cfg, anthropicApiKey: cfg.anthropicApiKey ? '***' : '' });
});

app.post('/api/config', (req, res) => {
  const newConfig = { ...loadConfig(), ...req.body };
  saveConfig(newConfig);
  console.log('[ADMIN] Configuración actualizada para:', newConfig.storeName);
  res.json({ ok: true });
});

// ─── API ─────────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { sessionId, message, cart } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'sessionId y message son requeridos' });
  try {
    const result = await chat(sessionId, message, cart || []);
    res.json(result);
  } catch (error) {
    console.error('Error en chat:', error.message);
    res.status(500).json({ error: 'Error procesando mensaje' });
  }
});

app.get('/api/products', (req, res) => {
  const cfg = loadConfig();
  const catalog = {};
  cfg.products.forEach(p => { catalog[p.id] = p; });
  res.json(catalog);
});

app.get('/api/order/:id', (req, res) => {
  const cfg = loadConfig();
  const order = cfg.sampleOrders?.find(o => o.id.toUpperCase() === req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(order);
});

app.get('/api/abandoned', (req, res) => res.json(loadAbandoned()));

app.get('/api/health', (req, res) => {
  const cfg = loadConfig();
  res.json({
    status: 'ok',
    bot: `E-Commerce Sales Bot — ${cfg.storeName}`,
    sessions: sessions.size,
    products: cfg.products.length,
    abandoned: loadAbandoned().filter(c => !c.recovered).length,
  });
});

// ─── STOREFRONT ──────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  const cfg = loadConfig();
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${cfg.storeName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2f5}
.header{background:${cfg.navColor};color:#fff;padding:1rem 2rem;display:flex;align-items:center;gap:1rem}
.header span{font-weight:900;font-size:1.3rem}
.store{max-width:1100px;margin:2rem auto;padding:0 1rem;display:grid;grid-template-columns:1fr 340px;gap:2rem}
.products h2{font-size:1.3rem;color:#1B1B6E;margin-bottom:1rem}
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem}
.product-card{background:#fff;border-radius:12px;padding:1rem;box-shadow:0 2px 8px rgba(0,0,0,.08);cursor:pointer;transition:transform .2s;text-align:center}
.product-card:hover{transform:translateY(-3px)}
.product-card .emoji{font-size:2rem}
.product-card h4{font-size:.9rem;color:#1a1a2e;margin:.5rem 0 .3rem}
.product-card .price{font-weight:700;color:${cfg.primaryColor};font-size:.95rem}
.product-card button{margin-top:.7rem;width:100%;padding:.5rem;background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:600}
.chat-widget{position:sticky;top:1rem;height:calc(100vh - 4rem);display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);overflow:hidden}
.chat-header{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});padding:1rem;color:#fff}
.chat-header h3{font-weight:700;font-size:.95rem}
.chat-header p{font-size:.75rem;opacity:.85}
.chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.7rem}
.msg{max-width:85%;padding:.6rem .9rem;border-radius:14px;font-size:.825rem;line-height:1.5}
.msg.bot{background:#f0f2f5;color:#1a1a2e;align-self:flex-start;border-bottom-left-radius:3px}
.msg.user{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;align-self:flex-end;border-bottom-right-radius:3px}
.chat-input{display:flex;gap:.5rem;padding:.8rem;border-top:1px solid #eee}
.chat-input input{flex:1;padding:.6rem .9rem;border:1.5px solid #eee;border-radius:50px;font-size:.85rem;outline:none}
.chat-input input:focus{border-color:${cfg.primaryColor}}
.chat-input button{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;border:none;border-radius:50px;padding:.6rem 1rem;cursor:pointer;font-weight:700;font-size:.8rem}
.cart-badge{background:${cfg.navColor};color:#fff;padding:.3rem .8rem;border-radius:50px;font-size:.75rem;font-weight:700;margin-top:.3rem;display:inline-block}
</style>
</head>
<body>
<div class="header"><span>${cfg.storeName}</span><span style="opacity:.7;font-size:.85rem">— Tu tienda online</span></div>
<div class="store">
  <div class="products">
    <h2>Nuestros productos</h2>
    <div class="product-grid" id="productGrid"></div>
  </div>
  <div class="chat-widget">
    <div class="chat-header">
      <h3>${cfg.botName} — Asistente de ventas</h3>
      <p>Pregúntame sobre productos, pedidos o envíos</p>
    </div>
    <div class="chat-messages" id="messages"></div>
    <div id="cartInfo" style="padding:.5rem 1rem;display:none">
      <div class="cart-badge" id="cartBadge"></div>
    </div>
    <div class="chat-input">
      <input type="text" id="input" placeholder="¿Qué buscas hoy?"/>
      <button onclick="sendMessage()">→</button>
    </div>
  </div>
</div>
<script>
const sessionId = 'shop_' + Math.random().toString(36).slice(2);
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
let cart = [];

function addMessage(text, type) {
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addToCart(product) {
  const ex = cart.find(i => i.id === product.id);
  if (ex) ex.qty++; else cart.push({...product, qty: 1});
  updateCartBadge();
  sendMessage('Quiero agregar al carrito: ' + product.name);
}

function updateCartBadge() {
  const ci = document.getElementById('cartInfo');
  const cb = document.getElementById('cartBadge');
  if (cart.length > 0) {
    ci.style.display = 'block';
    cb.textContent = cart.length + ' producto(s) — $' + cart.reduce((s,i) => s+i.price*i.qty,0).toLocaleString('es-CO') + ' COP';
  }
}

async function sendMessage(auto) {
  const text = auto || inputEl.value.trim();
  if (!text) return;
  if (!auto) inputEl.value = '';
  if (!auto) addMessage(text, 'user');
  try {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId, message: text, cart })
    });
    const data = await res.json();
    addMessage(data.reply, 'bot');
    if (data.action?.type === 'cart_recovery') addMessage('¡Descuento aplicado! ' + (data.action.data.descuento||'5%') + ' en tu compra.', 'bot');
  } catch { addMessage('Hubo un error. Intenta de nuevo.', 'bot'); }
}

inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

fetch('/api/products').then(r => r.json()).then(products => {
  const grid = document.getElementById('productGrid');
  Object.entries(products).forEach(([id, p]) => {
    grid.innerHTML += '<div class="product-card">' +
      '<div class="emoji">' + (p.emoji||'📦') + '</div>' +
      '<h4>' + p.name + '</h4>' +
      '<div class="price">$' + p.price.toLocaleString('es-CO') + '</div>' +
      '<button onclick=\\'addToCart(' + JSON.stringify({id, name: p.name, price: p.price}) + ')\\'>Agregar al carrito</button>' +
      '</div>';
  });
});

window.onload = () => addMessage('¡Hola! Soy ${cfg.botName}, tu asistente de ventas. ¿En qué te puedo ayudar? Pregúntame sobre productos o consulta tu pedido con el número de orden.', 'bot');
</script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`E-Commerce Sales Bot corriendo en: http://localhost:${PORT}`);
  console.log(`Panel de admin: http://localhost:${PORT}/admin`);
});
