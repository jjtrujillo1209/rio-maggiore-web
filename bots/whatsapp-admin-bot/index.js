import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const app = express();
app.use(express.json());

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const CONFIG_FILE = './config.json';

const DEFAULT_CONFIG = {
  // Credenciales
  anthropicApiKey: '',
  whatsappToken: '',
  whatsappPhoneId: '',
  verifyToken: '',
  // Identidad del cliente
  clientName: 'Through Air',
  tagline: 'Conectando tu negocio con el mundo',
  ownerName: 'Juan José',
  // Servicios
  services: [
    { name: 'Pautas Digitales (Google/Meta Ads)', price: '$2.000.000 COP/mes' },
    { name: 'Redes Sociales', price: '$3.500.000 COP/mes' },
    { name: 'Página Web', price: '$3.500.000 COP (único)' },
    { name: 'E-Commerce', price: '$5.900.000 COP (único)' },
  ],
  // Comportamiento
  tone: 'profesional y cercano',
  maxSentences: 3,
  escalatePhrase: 'voy a consultarlo con ${ownerName} y te respondo pronto',
};

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(data) {
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

let config = loadConfig();

// ─── SYSTEM PROMPT DINÁMICO ──────────────────────────────────────────────────

function buildSystemPrompt(cfg) {
  const servicesText = cfg.services
    .map(s => `- ${s.name}: ${s.price}`)
    .join('\n');
  const escalate = cfg.escalatePhrase.replace('${ownerName}', cfg.ownerName);
  return `Eres el asistente virtual de ${cfg.clientName}${cfg.tagline ? `, "${cfg.tagline}"` : ''}.
Tu misión es atender clientes y prospectos de forma ${cfg.tone} — disponible 24/7.

SERVICIOS Y PRECIOS:
${servicesText}

REGLAS:
1. Responde siempre en español, tono ${cfg.tone}
2. Mensajes cortos (máximo ${cfg.maxSentences} oraciones en WhatsApp)
3. Si alguien quiere una propuesta, pide: nombre, empresa, servicio de interés
4. Para agendar reunión, ofrece una llamada de 15 minutos con ${cfg.ownerName}
5. Nunca inventes precios ni servicios fuera de la lista
6. Si no sabes algo, di "${escalate}"
7. Cierra siempre con una pregunta o llamada a la acción`;
}

// ─── BOT LOGIC ───────────────────────────────────────────────────────────────

const conversations = new Map();

async function getAIResponse(from, userMessage) {
  const cfg = loadConfig();
  const apiKey = cfg.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  const client = new Anthropic({ apiKey });

  if (!conversations.has(from)) conversations.set(from, []);
  const history = conversations.get(from);
  history.push({ role: 'user', content: userMessage });
  if (history.length > 20) history.splice(0, history.length - 20);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: buildSystemPrompt(cfg),
    messages: history,
  });

  const reply = response.content[0].text;
  history.push({ role: 'assistant', content: reply });
  return reply;
}

async function sendWhatsAppMessage(to, message) {
  const cfg = loadConfig();
  await axios.post(
    `https://graph.facebook.com/v19.0/${cfg.whatsappPhoneId}/messages`,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } },
    {
      headers: {
        Authorization: `Bearer ${cfg.whatsappToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

app.get('/admin', (req, res) => {
  const cfg = loadConfig();
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>WhatsApp Admin Bot — Panel de Configuración</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#07070b;color:#e2e2f0;min-height:100vh;display:flex}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0f0f1a}::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:3px}
/* Sidebar */
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
/* Main */
.main{margin-left:240px;flex:1;padding:2rem;max-width:900px}
.page-header{margin-bottom:2rem}
.page-header h1{font-size:1.6rem;font-weight:700;color:#fff;margin-bottom:.3rem}
.page-header p{color:#666;font-size:.875rem}
/* Cards */
.card{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:16px;padding:1.8rem;margin-bottom:1.5rem}
.card-header{display:flex;align-items:center;gap:.8rem;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #1e1e3a}
.card-header .icon{width:36px;height:36px;background:linear-gradient(135deg,#F26522,#C8317A);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem}
.card-header h2{font-size:1rem;font-weight:600;color:#fff}
.card-header p{font-size:.78rem;color:#666;margin-top:.1rem}
/* Form */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.form-grid.single{grid-template-columns:1fr}
.field{display:flex;flex-direction:column;gap:.4rem}
.field label{font-size:.78rem;color:#888;font-weight:500;letter-spacing:.3px;text-transform:uppercase}
.field input,.field select,.field textarea{background:#1a1a2e;border:1.5px solid #2a2a4a;border-radius:10px;padding:.7rem 1rem;color:#e2e2f0;font-size:.875rem;outline:none;transition:border-color .2s;width:100%}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#F26522;box-shadow:0 0 0 3px rgba(242,101,34,.1)}
.field textarea{resize:vertical;min-height:80px}
.field .input-wrap{position:relative;display:flex;align-items:center}
.field .input-wrap input{padding-right:2.5rem}
.field .eye-btn{position:absolute;right:.7rem;background:none;border:none;color:#555;cursor:pointer;font-size:.95rem;padding:.2rem}
.field .hint{font-size:.72rem;color:#555;margin-top:.2rem}
/* Services list */
.services-list{display:flex;flex-direction:column;gap:.7rem}
.service-row{display:grid;grid-template-columns:1fr 1fr auto;gap:.7rem;align-items:center}
.service-row input{background:#1a1a2e;border:1.5px solid #2a2a4a;border-radius:8px;padding:.6rem .9rem;color:#e2e2f0;font-size:.85rem;outline:none;transition:border-color .2s}
.service-row input:focus{border-color:#F26522}
.remove-btn{width:32px;height:32px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#ef4444;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.remove-btn:hover{background:rgba(239,68,68,.2)}
.add-btn{display:flex;align-items:center;gap:.5rem;padding:.6rem 1rem;background:rgba(242,101,34,.1);border:1.5px dashed rgba(242,101,34,.4);border-radius:10px;color:#F26522;cursor:pointer;font-size:.85rem;font-weight:500;transition:all .2s;width:100%;justify-content:center;margin-top:.5rem}
.add-btn:hover{background:rgba(242,101,34,.15);border-color:#F26522}
/* Preview */
.preview-box{background:#0a0a12;border:1px solid #1e1e3a;border-radius:10px;padding:1rem;font-family:'Courier New',monospace;font-size:.75rem;color:#7878aa;white-space:pre-wrap;line-height:1.6;max-height:280px;overflow-y:auto}
/* Save bar */
.save-bar{position:fixed;bottom:2rem;right:2rem;display:flex;gap:.8rem;align-items:center;z-index:20}
.save-btn{padding:.8rem 2rem;background:linear-gradient(135deg,#F26522,#C8317A);border:none;border-radius:12px;color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 20px rgba(242,101,34,.4)}
.save-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(242,101,34,.5)}
.save-btn:active{transform:translateY(0)}
.toast{padding:.7rem 1.2rem;background:#1a2e1a;border:1px solid #22c55e;border-radius:10px;color:#22c55e;font-size:.85rem;font-weight:600;opacity:0;transition:opacity .3s}
.toast.show{opacity:1}
.toast.error{background:#2e1a1a;border-color:#ef4444;color:#ef4444}
/* Webhook helper */
.webhook-url{background:#1a1a2e;border:1.5px solid #2a2a4a;border-radius:10px;padding:.7rem 1rem;color:#F26522;font-size:.8rem;font-family:monospace;display:flex;align-items:center;justify-content:space-between;gap:.5rem}
.copy-btn{background:rgba(242,101,34,.15);border:1px solid rgba(242,101,34,.3);border-radius:6px;color:#F26522;cursor:pointer;font-size:.75rem;padding:.3rem .7rem;white-space:nowrap;transition:all .2s}
.copy-btn:hover{background:rgba(242,101,34,.25)}
.section-divider{height:1px;background:#1e1e3a;margin:1rem 0}
</style>
</head>
<body>
<aside class="sidebar">
  <div class="sidebar-logo">
    <div><span class="through">through</span> <span class="air">air</span></div>
    <div class="badge">WhatsApp Admin Bot</div>
  </div>
  <nav>
    <a href="#creds" class="active"><span class="icon">🔑</span> Credenciales</a>
    <a href="#identity"><span class="icon">🏢</span> Identidad</a>
    <a href="#services"><span class="icon">💼</span> Servicios</a>
    <a href="#behavior"><span class="icon">🤖</span> Comportamiento</a>
    <a href="#webhook"><span class="icon">🔗</span> Webhook</a>
    <a href="#preview"><span class="icon">👁</span> Vista previa</a>
  </nav>
  <div class="sidebar-footer">
    <span class="status-dot"></span>
    <span class="status-text">Bot activo · Puerto ${process.env.PORT || 3001}</span>
  </div>
</aside>

<main class="main">
  <div class="page-header">
    <h1>Configuración del Bot</h1>
    <p>Personaliza el asistente de WhatsApp para tu cliente. Los cambios aplican al instante.</p>
  </div>

  <!-- Credenciales -->
  <div class="card" id="creds">
    <div class="card-header">
      <div class="icon">🔑</div>
      <div><h2>Credenciales</h2><p>API Keys y tokens de acceso</p></div>
    </div>
    <div class="form-grid single">
      <div class="field">
        <label>Anthropic API Key</label>
        <div class="input-wrap">
          <input type="password" id="anthropicApiKey" value="${cfg.anthropicApiKey}" placeholder="sk-ant-..."/>
          <button class="eye-btn" onclick="togglePass('anthropicApiKey')">👁</button>
        </div>
        <span class="hint">Tu API key de Anthropic. Conseguirla en console.anthropic.com</span>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>WhatsApp Token</label>
          <div class="input-wrap">
            <input type="password" id="whatsappToken" value="${cfg.whatsappToken}" placeholder="EAAB..."/>
            <button class="eye-btn" onclick="togglePass('whatsappToken')">👁</button>
          </div>
          <span class="hint">Token de acceso de tu app Meta</span>
        </div>
        <div class="field">
          <label>WhatsApp Phone ID</label>
          <input type="text" id="whatsappPhoneId" value="${cfg.whatsappPhoneId}" placeholder="1234567890"/>
          <span class="hint">ID del número de WhatsApp Business</span>
        </div>
      </div>
      <div class="field">
        <label>Verify Token</label>
        <input type="text" id="verifyToken" value="${cfg.verifyToken}" placeholder="mi_token_secreto"/>
        <span class="hint">Token secreto que usas al configurar el webhook en Meta</span>
      </div>
    </div>
  </div>

  <!-- Identidad -->
  <div class="card" id="identity">
    <div class="card-header">
      <div class="icon">🏢</div>
      <div><h2>Identidad del cliente</h2><p>Nombre, tagline y datos del negocio</p></div>
    </div>
    <div class="form-grid">
      <div class="field">
        <label>Nombre del negocio</label>
        <input type="text" id="clientName" value="${cfg.clientName}" placeholder="Through Air"/>
      </div>
      <div class="field">
        <label>Nombre del propietario</label>
        <input type="text" id="ownerName" value="${cfg.ownerName}" placeholder="Juan José"/>
        <span class="hint">Se usa cuando el bot necesita escalar</span>
      </div>
      <div class="field" style="grid-column:1/-1">
        <label>Tagline / Descripción corta</label>
        <input type="text" id="tagline" value="${cfg.tagline}" placeholder="Conectando tu negocio con el mundo"/>
      </div>
    </div>
  </div>

  <!-- Servicios -->
  <div class="card" id="services">
    <div class="card-header">
      <div class="icon">💼</div>
      <div><h2>Servicios y precios</h2><p>El bot solo cotizará lo que agregues aquí</p></div>
    </div>
    <div class="services-list" id="servicesList"></div>
    <button class="add-btn" onclick="addService()">+ Agregar servicio</button>
  </div>

  <!-- Comportamiento -->
  <div class="card" id="behavior">
    <div class="card-header">
      <div class="icon">🤖</div>
      <div><h2>Comportamiento del bot</h2><p>Tono, límites y reglas de respuesta</p></div>
    </div>
    <div class="form-grid">
      <div class="field">
        <label>Tono de comunicación</label>
        <select id="tone">
          <option value="profesional y cercano" ${cfg.tone === 'profesional y cercano' ? 'selected' : ''}>Profesional y cercano</option>
          <option value="muy formal, usando usted" ${cfg.tone === 'muy formal, usando usted' ? 'selected' : ''}>Muy formal</option>
          <option value="casual y amigable" ${cfg.tone === 'casual y amigable' ? 'selected' : ''}>Casual y amigable</option>
          <option value="energético y entusiasta" ${cfg.tone === 'energético y entusiasta' ? 'selected' : ''}>Energético</option>
        </select>
      </div>
      <div class="field">
        <label>Máximo de oraciones por respuesta</label>
        <input type="number" id="maxSentences" value="${cfg.maxSentences}" min="1" max="10"/>
        <span class="hint">Recomendado: 2-3 para WhatsApp</span>
      </div>
      <div class="field" style="grid-column:1/-1">
        <label>Frase de escalamiento</label>
        <input type="text" id="escalatePhrase" value="${cfg.escalatePhrase}" placeholder="voy a consultarlo con \${ownerName} y te respondo pronto"/>
        <span class="hint">Usa \${ownerName} para insertar el nombre del propietario automáticamente</span>
      </div>
    </div>
  </div>

  <!-- Webhook -->
  <div class="card" id="webhook">
    <div class="card-header">
      <div class="icon">🔗</div>
      <div><h2>Configuración del Webhook</h2><p>Instrucciones para conectar con Meta</p></div>
    </div>
    <div class="field">
      <label>URL del webhook</label>
      <div class="webhook-url">
        <span id="webhookUrl">https://tudominio.com/webhook</span>
        <button class="copy-btn" onclick="copyWebhook()">Copiar</button>
      </div>
      <span class="hint">Reemplaza "tudominio.com" con tu URL real (Railway, Render, o ngrok para pruebas)</span>
    </div>
    <div class="section-divider"></div>
    <div style="font-size:.82rem;color:#666;line-height:1.8">
      <strong style="color:#aaa">Pasos en Meta Developers:</strong><br/>
      1. Ir a developers.facebook.com → Tu app → WhatsApp → Configuración<br/>
      2. En "Webhook", hacer clic en <em>Editar</em><br/>
      3. Pegar la URL del webhook y el Verify Token de arriba<br/>
      4. Suscribirse a: <code style="color:#F26522;background:#1a1a2e;padding:.1rem .4rem;border-radius:4px">messages</code><br/>
      5. Guardar y verificar — Meta hará un GET al webhook para confirmar
    </div>
  </div>

  <!-- Preview -->
  <div class="card" id="preview">
    <div class="card-header">
      <div class="icon">👁</div>
      <div><h2>Vista previa del system prompt</h2><p>Exactamente lo que Claude recibe como instrucciones</p></div>
    </div>
    <div class="preview-box" id="promptPreview">Cargando...</div>
  </div>

  <div style="height:5rem"></div>
</main>

<div class="save-bar">
  <div class="toast" id="toast">¡Configuración guardada!</div>
  <button class="save-btn" onclick="saveConfig()">Guardar cambios</button>
</div>

<script>
const initialServices = ${JSON.stringify(cfg.services)};

function renderServices(list) {
  const el = document.getElementById('servicesList');
  el.innerHTML = '';
  list.forEach((s, i) => {
    el.innerHTML += \`<div class="service-row" id="sr\${i}">
      <input type="text" value="\${s.name}" placeholder="Nombre del servicio" oninput="updatePreview()"/>
      <input type="text" value="\${s.price}" placeholder="Precio (ej: $2.000.000 COP/mes)" oninput="updatePreview()"/>
      <button class="remove-btn" onclick="removeService(\${i})">×</button>
    </div>\`;
  });
}

function addService() {
  const rows = document.querySelectorAll('.service-row');
  const list = getServices();
  list.push({ name: '', price: '' });
  renderServices(list);
  updatePreview();
}

function removeService(i) {
  const list = getServices();
  list.splice(i, 1);
  renderServices(list);
  updatePreview();
}

function getServices() {
  return Array.from(document.querySelectorAll('.service-row')).map(row => {
    const inputs = row.querySelectorAll('input');
    return { name: inputs[0].value, price: inputs[1].value };
  });
}

function getConfig() {
  return {
    anthropicApiKey: document.getElementById('anthropicApiKey').value,
    whatsappToken: document.getElementById('whatsappToken').value,
    whatsappPhoneId: document.getElementById('whatsappPhoneId').value,
    verifyToken: document.getElementById('verifyToken').value,
    clientName: document.getElementById('clientName').value,
    ownerName: document.getElementById('ownerName').value,
    tagline: document.getElementById('tagline').value,
    services: getServices(),
    tone: document.getElementById('tone').value,
    maxSentences: parseInt(document.getElementById('maxSentences').value),
    escalatePhrase: document.getElementById('escalatePhrase').value,
  };
}

function updatePreview() {
  const cfg = getConfig();
  const servicesText = cfg.services.filter(s => s.name).map(s => \`- \${s.name}: \${s.price}\`).join('\\n');
  const escalate = cfg.escalatePhrase.replace('\${ownerName}', cfg.ownerName);
  const prompt = \`Eres el asistente virtual de \${cfg.clientName}\${cfg.tagline ? ', "' + cfg.tagline + '"' : ''}.
Tu misión es atender clientes y prospectos de forma \${cfg.tone} — disponible 24/7.

SERVICIOS Y PRECIOS:
\${servicesText || '(agrega servicios arriba)'}

REGLAS:
1. Responde siempre en español, tono \${cfg.tone}
2. Mensajes cortos (máximo \${cfg.maxSentences} oraciones en WhatsApp)
3. Si alguien quiere una propuesta, pide: nombre, empresa, servicio de interés
4. Para agendar reunión, ofrece una llamada de 15 minutos con \${cfg.ownerName}
5. Nunca inventes precios ni servicios fuera de la lista
6. Si no sabes algo, di "\${escalate}"
7. Cierra siempre con una pregunta o llamada a la acción\`;
  document.getElementById('promptPreview').textContent = prompt;
}

async function saveConfig() {
  const cfg = getConfig();
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    if (res.ok) {
      showToast('¡Configuración guardada!', false);
    } else {
      showToast('Error al guardar', true);
    }
  } catch (e) {
    showToast('Error de conexión', true);
  }
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

function copyWebhook() {
  navigator.clipboard.writeText(document.getElementById('webhookUrl').textContent);
  showToast('URL copiada al portapapeles', false);
}

// Nav active state
document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelectorAll('nav a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});

// Scroll spy for nav
const sections = ['creds','identity','services','behavior','webhook','preview'];
const navLinks = ['[href="#creds"]','[href="#identity"]','[href="#services"]','[href="#behavior"]','[href="#webhook"]','[href="#preview"]'];
window.addEventListener('scroll', () => {
  let current = sections[0];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 100) current = id;
  });
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  const active = document.querySelector('nav a[href="#' + current + '"]');
  if (active) active.classList.add('active');
}, { passive: true });

// Live preview on any input change
document.addEventListener('input', updatePreview);
document.addEventListener('change', updatePreview);

// Init
renderServices(initialServices);
updatePreview();
</script>
</body>
</html>`);
});

app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  // Mask secrets in response
  res.json({ ...cfg, anthropicApiKey: cfg.anthropicApiKey ? '***' : '', whatsappToken: cfg.whatsappToken ? '***' : '' });
});

app.post('/api/config', (req, res) => {
  const newConfig = { ...loadConfig(), ...req.body };
  saveConfig(newConfig);
  config = newConfig;
  console.log('[ADMIN] Configuración actualizada para:', newConfig.clientName);
  res.json({ ok: true });
});

// ─── WEBHOOK META ────────────────────────────────────────────────────────────

app.get('/webhook', (req, res) => {
  const cfg = loadConfig();
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = cfg.verifyToken || process.env.VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];
    if (!message || message.type !== 'text') return;

    const from = message.from;
    const text = message.text.body;
    console.log(`[${new Date().toISOString()}] Mensaje de ${from}: ${text}`);

    const reply = await getAIResponse(from, text);
    await sendWhatsAppMessage(from, reply);
    console.log(`[${new Date().toISOString()}] Respuesta a ${from}: ${reply}`);
  } catch (error) {
    console.error('Error procesando mensaje:', error.message);
  }
});

app.get('/health', (req, res) => {
  const cfg = loadConfig();
  res.json({
    status: 'ok',
    bot: `WhatsApp Admin Bot — ${cfg.clientName}`,
    uptime: process.uptime(),
    conversations: conversations.size,
    configured: !!(cfg.anthropicApiKey || process.env.ANTHROPIC_API_KEY),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`WhatsApp Admin Bot corriendo en puerto ${PORT}`);
  console.log(`Panel de admin: http://localhost:${PORT}/admin`);
});
