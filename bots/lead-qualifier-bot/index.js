import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const app = express();
app.use(express.json());

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const CONFIG_FILE = './config.json';
const LEADS_FILE = './leads.json';

const DEFAULT_CONFIG = {
  anthropicApiKey: '',
  // Identidad
  companyName: 'Through Air',
  companyDescription: 'agencia de marketing digital colombiana',
  ownerName: 'Juan José',
  ownerContact: '',
  // Servicios a calificar
  services: [
    'Pautas Digitales — $2.000.000 COP/mes',
    'Redes Sociales — $3.500.000 COP/mes',
    'Página Web — $2.000.000 COP (único)',
    'E-Commerce — $3.900.000 COP (único)',
    'Bots de IA — desde $2.000.000 COP',
  ],
  // Preguntas de calificación
  qualifyFields: [
    { key: 'nombre', label: 'Nombre completo del prospecto' },
    { key: 'empresa', label: 'Empresa o negocio' },
    { key: 'servicio', label: 'Servicio de interés' },
    { key: 'presupuesto', label: 'Presupuesto aproximado disponible' },
    { key: 'objetivo', label: 'Objetivo principal' },
  ],
  // UI del widget
  widgetTitle: 'Habla con nosotros',
  widgetSubtitle: 'Responde unas preguntas y te enviamos una propuesta personalizada',
  welcomeMessage: '¡Hola! Soy el asistente de ${companyName}. En 2 minutos sabemos si somos el equipo ideal para tu negocio. ¿Cómo te llamas?',
  closingMessage: '¡Listo! ${ownerName} te contactará muy pronto con tu propuesta personalizada.',
  primaryColor: '#F26522',
  secondaryColor: '#C8317A',
  // Comportamiento
  minBudget: '',
  tone: 'amigable y profesional',
};

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) }; }
  catch { return { ...DEFAULT_CONFIG }; }
}

function saveConfig(data) { writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2)); }

function loadLeads() {
  if (!existsSync(LEADS_FILE)) return [];
  try { return JSON.parse(readFileSync(LEADS_FILE, 'utf8')); } catch { return []; }
}

function saveLead(lead) {
  const leads = loadLeads();
  leads.push({ ...lead, fecha: new Date().toISOString() });
  writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  const cfg = loadConfig();
  console.log(`[LEAD CALIFICADO] ${lead.nombre || '?'} — ${lead.empresa || '?'} — ${lead.servicio || '?'}`);
}

// ─── SYSTEM PROMPT DINÁMICO ──────────────────────────────────────────────────

function buildSystemPrompt(cfg) {
  const servicesText = cfg.services.map(s => `- ${s}`).join('\n');
  const fieldsText = cfg.qualifyFields
    .map((f, i) => `${i + 1}. ${f.label}`)
    .join('\n');
  const jsonKeys = cfg.qualifyFields.map(f => `"${f.key}":"..."`).join(',');
  const minBudgetRule = cfg.minBudget
    ? `- Si el presupuesto del prospecto es menor a ${cfg.minBudget}, sé amable pero explica que actualmente trabajamos con presupuestos desde esa cifra.`
    : '';

  return `Eres el asistente de calificación de leads de ${cfg.companyName}, ${cfg.companyDescription}.
Tu objetivo es calificar prospectos a través de una conversación natural y ${cfg.tone}.

Debes obtener los siguientes datos:
${fieldsText}

SERVICIOS DISPONIBLES:
${servicesText}

INSTRUCCIONES:
- Sé conversacional y ${cfg.tone}, NO uses un formulario rígido
- Haz una pregunta a la vez
- ${minBudgetRule}
- Una vez que tengas TODOS los datos, responde con el JSON al final del mensaje:
  LEAD_CALIFICADO: {${jsonKeys}}
- Máximo 2-3 oraciones por respuesta`;
}

// ─── CHAT LOGIC ──────────────────────────────────────────────────────────────

const sessions = new Map();

async function chat(sessionId, userMessage) {
  const cfg = loadConfig();
  const apiKey = cfg.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  const client = new Anthropic({ apiKey });

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { history: [], qualified: false });
  }
  const session = sessions.get(sessionId);
  session.history.push({ role: 'user', content: userMessage });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: buildSystemPrompt(cfg),
    messages: session.history,
  });

  const reply = response.content[0].text;
  session.history.push({ role: 'assistant', content: reply });

  const leadMatch = reply.match(/LEAD_CALIFICADO:\s*(\{.*?\})/s);
  if (leadMatch && !session.qualified) {
    try {
      const leadData = JSON.parse(leadMatch[1]);
      session.qualified = true;
      saveLead(leadData);
      const cleanReply = reply.replace(/LEAD_CALIFICADO:\s*\{.*?\}/s, '').trim();
      return { reply: cleanReply, qualified: true, lead: leadData };
    } catch (e) {
      console.error('Error parseando lead:', e.message);
    }
  }

  return { reply, qualified: false };
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

app.get('/admin', (req, res) => {
  const cfg = loadConfig();
  const leads = loadLeads();
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Lead Qualifier Bot — Panel de Configuración</title>
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
.main{margin-left:240px;flex:1;padding:2rem;max-width:960px}
.page-header{margin-bottom:2rem}
.page-header h1{font-size:1.6rem;font-weight:700;color:#fff;margin-bottom:.3rem}
.page-header p{color:#666;font-size:.875rem}
/* Stats strip */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
.stat{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:12px;padding:1.2rem;text-align:center}
.stat .num{font-size:2rem;font-weight:800;background:linear-gradient(135deg,#F26522,#C8317A);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat .lbl{font-size:.75rem;color:#666;margin-top:.2rem}
.card{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:16px;padding:1.8rem;margin-bottom:1.5rem}
.card-header{display:flex;align-items:center;gap:.8rem;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #1e1e3a}
.card-header .icon{width:36px;height:36px;background:linear-gradient(135deg,#F26522,#C8317A);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem}
.card-header h2{font-size:1rem;font-weight:600;color:#fff}
.card-header p{font-size:.78rem;color:#666;margin-top:.1rem}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.form-grid.single{grid-template-columns:1fr}
.field{display:flex;flex-direction:column;gap:.4rem}
.field label{font-size:.78rem;color:#888;font-weight:500;letter-spacing:.3px;text-transform:uppercase}
.field input,.field select,.field textarea{background:#1a1a2e;border:1.5px solid #2a2a4a;border-radius:10px;padding:.7rem 1rem;color:#e2e2f0;font-size:.875rem;outline:none;transition:border-color .2s;width:100%}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#F26522;box-shadow:0 0 0 3px rgba(242,101,34,.1)}
.field .input-wrap{position:relative;display:flex;align-items:center}
.field .input-wrap input{padding-right:2.5rem}
.field .eye-btn{position:absolute;right:.7rem;background:none;border:none;color:#555;cursor:pointer;font-size:.95rem}
.field .hint{font-size:.72rem;color:#555;margin-top:.2rem}
.list-row{display:grid;gap:.6rem}
.list-item{display:flex;gap:.6rem;align-items:center}
.list-item input{flex:1;background:#1a1a2e;border:1.5px solid #2a2a4a;border-radius:8px;padding:.6rem .9rem;color:#e2e2f0;font-size:.85rem;outline:none;transition:border-color .2s}
.list-item input:focus{border-color:#F26522}
.list-item .key-input{width:110px;flex:none;font-size:.78rem;color:#F26522}
.remove-btn{width:32px;height:32px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#ef4444;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.remove-btn:hover{background:rgba(239,68,68,.2)}
.add-btn{display:flex;align-items:center;gap:.5rem;padding:.6rem 1rem;background:rgba(242,101,34,.1);border:1.5px dashed rgba(242,101,34,.4);border-radius:10px;color:#F26522;cursor:pointer;font-size:.85rem;font-weight:500;transition:all .2s;width:100%;justify-content:center;margin-top:.5rem}
.add-btn:hover{background:rgba(242,101,34,.15);border-color:#F26522}
/* Widget preview */
.preview-wrap{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start}
.widget-preview{background:#f0f2f5;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.widget-header-preview{padding:1.2rem 1.5rem;color:#fff}
.widget-header-preview h3{font-weight:700;font-size:.95rem}
.widget-header-preview p{font-size:.75rem;opacity:.85;margin-top:.2rem}
.widget-messages{padding:1rem;display:flex;flex-direction:column;gap:.7rem;background:#f0f2f5;min-height:120px}
.preview-msg-bot{background:#fff;color:#1a1a2e;align-self:flex-start;padding:.6rem .9rem;border-radius:12px;border-bottom-left-radius:3px;font-size:.8rem;max-width:85%}
.prompt-box{background:#0a0a12;border:1px solid #1e1e3a;border-radius:10px;padding:1rem;font-family:monospace;font-size:.72rem;color:#7878aa;white-space:pre-wrap;line-height:1.6;max-height:320px;overflow-y:auto}
/* Leads table */
.leads-table{width:100%;border-collapse:collapse}
.leads-table th{padding:.6rem 1rem;text-align:left;font-size:.72rem;color:#666;text-transform:uppercase;border-bottom:1px solid #1e1e3a}
.leads-table td{padding:.7rem 1rem;font-size:.82rem;border-bottom:1px solid #111;color:#ccc}
.leads-table tr:last-child td{border-bottom:none}
.badge-service{background:rgba(242,101,34,.15);color:#F26522;padding:.2rem .6rem;border-radius:50px;font-size:.72rem}
/* Embed code */
.code-box{background:#0a0a12;border:1px solid #1e1e3a;border-radius:10px;padding:1rem;font-family:monospace;font-size:.75rem;color:#F26522;position:relative}
.code-box .copy-overlay{position:absolute;top:.5rem;right:.5rem}
.copy-btn{background:rgba(242,101,34,.15);border:1px solid rgba(242,101,34,.3);border-radius:6px;color:#F26522;cursor:pointer;font-size:.75rem;padding:.3rem .7rem}
.copy-btn:hover{background:rgba(242,101,34,.25)}
/* Colors */
.colors-row{display:flex;gap:1rem}
.color-field{flex:1;display:flex;flex-direction:column;gap:.4rem}
.color-field label{font-size:.78rem;color:#888;font-weight:500;text-transform:uppercase}
.color-field input[type=color]{width:100%;height:40px;border:1.5px solid #2a2a4a;border-radius:10px;background:#1a1a2e;cursor:pointer;padding:.2rem}
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
    <div class="badge">Lead Qualifier Bot</div>
  </div>
  <nav>
    <a href="#creds" class="active"><span class="icon">🔑</span> Credenciales</a>
    <a href="#identity"><span class="icon">🏢</span> Identidad</a>
    <a href="#services"><span class="icon">💼</span> Servicios</a>
    <a href="#questions"><span class="icon">❓</span> Preguntas</a>
    <a href="#widget"><span class="icon">💬</span> Widget</a>
    <a href="#embed"><span class="icon">🔗</span> Código embed</a>
    <a href="#leads"><span class="icon">📋</span> Leads (${leads.length})</a>
  </nav>
  <div class="sidebar-footer">
    <span class="status-dot"></span>
    <span class="status-text">Bot activo · Puerto ${process.env.PORT || 3002}</span>
  </div>
</aside>

<main class="main">
  <div class="page-header">
    <h1>Configuración del Bot</h1>
    <p>Personaliza el calificador de leads para tu cliente. Los cambios aplican al instante.</p>
  </div>

  <div class="stats">
    <div class="stat"><div class="num">${leads.length}</div><div class="lbl">Leads totales</div></div>
    <div class="stat"><div class="num">${leads.filter(l => {const d = new Date(l.fecha); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();}).length}</div><div class="lbl">Este mes</div></div>
    <div class="stat"><div class="num">${sessions.size}</div><div class="lbl">Sesiones activas</div></div>
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

  <!-- Identidad -->
  <div class="card" id="identity">
    <div class="card-header">
      <div class="icon">🏢</div>
      <div><h2>Identidad del cliente</h2><p>Datos del negocio que va a calificar leads</p></div>
    </div>
    <div class="form-grid">
      <div class="field">
        <label>Nombre de la empresa</label>
        <input type="text" id="companyName" value="${cfg.companyName}" placeholder="Through Air"/>
      </div>
      <div class="field">
        <label>Nombre del propietario</label>
        <input type="text" id="ownerName" value="${cfg.ownerName}" placeholder="Juan José"/>
      </div>
      <div class="field" style="grid-column:1/-1">
        <label>Descripción de la empresa</label>
        <input type="text" id="companyDescription" value="${cfg.companyDescription}" placeholder="agencia de marketing digital colombiana"/>
        <span class="hint">Ej: "restaurante de cocina fusión en Bogotá"</span>
      </div>
      <div class="field">
        <label>Presupuesto mínimo aceptado</label>
        <input type="text" id="minBudget" value="${cfg.minBudget}" placeholder="$1.500.000 COP"/>
        <span class="hint">Dejar vacío para no filtrar por presupuesto</span>
      </div>
      <div class="field">
        <label>Tono de conversación</label>
        <select id="tone">
          <option value="amigable y profesional" ${cfg.tone === 'amigable y profesional' ? 'selected' : ''}>Amigable y profesional</option>
          <option value="muy formal" ${cfg.tone === 'muy formal' ? 'selected' : ''}>Muy formal</option>
          <option value="casual y energético" ${cfg.tone === 'casual y energético' ? 'selected' : ''}>Casual y energético</option>
          <option value="empático y consultivo" ${cfg.tone === 'empático y consultivo' ? 'selected' : ''}>Empático y consultivo</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Servicios -->
  <div class="card" id="services">
    <div class="card-header">
      <div class="icon">💼</div>
      <div><h2>Servicios disponibles</h2><p>El bot guiará al prospecto hacia uno de estos</p></div>
    </div>
    <div class="list-row" id="servicesList"></div>
    <button class="add-btn" onclick="addService()">+ Agregar servicio</button>
  </div>

  <!-- Preguntas -->
  <div class="card" id="questions">
    <div class="card-header">
      <div class="icon">❓</div>
      <div><h2>Datos a recolectar</h2><p>Qué información necesitas de cada prospecto</p></div>
    </div>
    <div style="font-size:.78rem;color:#555;margin-bottom:1rem">
      El "campo clave" (en naranja) se usa en el JSON del lead guardado. Usa solo letras y guiones bajos.
    </div>
    <div class="list-row" id="questionsList"></div>
    <button class="add-btn" onclick="addQuestion()">+ Agregar campo</button>
  </div>

  <!-- Widget -->
  <div class="card" id="widget">
    <div class="card-header">
      <div class="icon">💬</div>
      <div><h2>Apariencia del widget</h2><p>Textos y colores del chat embebido</p></div>
    </div>
    <div class="preview-wrap">
      <div>
        <div class="form-grid single">
          <div class="field">
            <label>Título del widget</label>
            <input type="text" id="widgetTitle" value="${cfg.widgetTitle}" placeholder="Habla con nosotros"/>
          </div>
          <div class="field">
            <label>Subtítulo</label>
            <input type="text" id="widgetSubtitle" value="${cfg.widgetSubtitle}"/>
          </div>
          <div class="field">
            <label>Mensaje de bienvenida</label>
            <textarea id="welcomeMessage" rows="2">${cfg.welcomeMessage}</textarea>
            <span class="hint">Usa \${companyName} y \${ownerName} como variables</span>
          </div>
          <div class="field">
            <label>Mensaje de cierre (lead calificado)</label>
            <textarea id="closingMessage" rows="2">${cfg.closingMessage}</textarea>
          </div>
        </div>
        <div class="colors-row" style="margin-top:1rem">
          <div class="color-field">
            <label>Color primario</label>
            <input type="color" id="primaryColor" value="${cfg.primaryColor}"/>
          </div>
          <div class="color-field">
            <label>Color secundario</label>
            <input type="color" id="secondaryColor" value="${cfg.secondaryColor}"/>
          </div>
        </div>
      </div>
      <div>
        <div style="font-size:.75rem;color:#555;margin-bottom:.5rem">Vista previa del widget</div>
        <div class="widget-preview">
          <div class="widget-header-preview" id="widgetHeaderPreview" style="background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor})">
            <h3 id="prevTitle">${cfg.widgetTitle}</h3>
            <p id="prevSubtitle">${cfg.widgetSubtitle}</p>
          </div>
          <div class="widget-messages">
            <div class="preview-msg-bot" id="prevWelcome">${cfg.welcomeMessage.replace('${companyName}', cfg.companyName).replace('${ownerName}', cfg.ownerName)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Embed -->
  <div class="card" id="embed">
    <div class="card-header">
      <div class="icon">🔗</div>
      <div><h2>Código para embeber</h2><p>Pega esto en el HTML de tu cliente</p></div>
    </div>
    <div class="code-box" id="embedCode">
      <div class="copy-overlay"><button class="copy-btn" onclick="copyEmbed()">Copiar</button></div>
      <span id="embedCodeText"></span>
    </div>
    <div style="font-size:.78rem;color:#555;margin-top:.8rem">
      Reemplaza <code style="color:#F26522">tudominio.com</code> con la URL donde está desplegado el bot.
    </div>
  </div>

  <!-- Leads -->
  <div class="card" id="leads">
    <div class="card-header">
      <div class="icon">📋</div>
      <div><h2>Leads calificados</h2><p>Últimos ${Math.min(leads.length, 10)} de ${leads.length}</p></div>
    </div>
    ${leads.length === 0
      ? '<div style="text-align:center;color:#444;padding:2rem;font-size:.875rem">Aún no hay leads. El bot los guardará automáticamente aquí.</div>'
      : `<div style="overflow-x:auto"><table class="leads-table">
        <thead><tr>
          <th>Fecha</th><th>Nombre</th><th>Empresa</th><th>Servicio</th><th>Presupuesto</th>
        </tr></thead>
        <tbody>
        ${leads.slice(-10).reverse().map(l => `<tr>
          <td style="white-space:nowrap">${new Date(l.fecha).toLocaleDateString('es-CO')}</td>
          <td>${l.nombre || '—'}</td>
          <td>${l.empresa || '—'}</td>
          <td><span class="badge-service">${l.servicio || '—'}</span></td>
          <td>${l.presupuesto || '—'}</td>
        </tr>`).join('')}
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
const initServices = ${JSON.stringify(cfg.services)};
const initQuestions = ${JSON.stringify(cfg.qualifyFields)};

function renderServices(list) {
  const el = document.getElementById('servicesList');
  el.innerHTML = list.map((s, i) => \`
    <div class="list-item">
      <input type="text" value="\${s}" placeholder="Nombre del servicio — $precio" oninput="updatePreview()"/>
      <button class="remove-btn" onclick="removeService(\${i})">×</button>
    </div>\`).join('');
}

function addService() { renderServices([...getServices(), '']); }
function removeService(i) { const l = getServices(); l.splice(i,1); renderServices(l); updatePreview(); }
function getServices() { return Array.from(document.querySelectorAll('#servicesList .list-item input')).map(i => i.value); }

function renderQuestions(list) {
  const el = document.getElementById('questionsList');
  el.innerHTML = list.map((q, i) => \`
    <div class="list-item">
      <input type="text" class="key-input" value="\${q.key}" placeholder="campo_clave"/>
      <input type="text" value="\${q.label}" placeholder="Descripción del dato a recolectar" oninput="updatePreview()"/>
      <button class="remove-btn" onclick="removeQuestion(\${i})">×</button>
    </div>\`).join('');
}

function addQuestion() { const l = getQuestions(); l.push({key:'nuevo_campo', label:''}); renderQuestions(l); }
function removeQuestion(i) { const l = getQuestions(); l.splice(i,1); renderQuestions(l); updatePreview(); }
function getQuestions() {
  return Array.from(document.querySelectorAll('#questionsList .list-item')).map(row => {
    const inputs = row.querySelectorAll('input');
    return { key: inputs[0].value, label: inputs[1].value };
  });
}

function updatePreview() {
  const p1 = document.getElementById('primaryColor').value;
  const p2 = document.getElementById('secondaryColor').value;
  document.getElementById('widgetHeaderPreview').style.background = \`linear-gradient(135deg,\${p1},\${p2})\`;
  document.getElementById('prevTitle').textContent = document.getElementById('widgetTitle').value;
  document.getElementById('prevSubtitle').textContent = document.getElementById('widgetSubtitle').value;
  const company = document.getElementById('companyName').value;
  const owner = document.getElementById('ownerName').value;
  document.getElementById('prevWelcome').textContent = document.getElementById('welcomeMessage').value
    .replace('\${companyName}', company).replace('\${ownerName}', owner);
  updateEmbed();
}

function updateEmbed() {
  const code = \`<iframe
  src="https://tudominio.com"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.2)"
></iframe>\`;
  document.getElementById('embedCodeText').textContent = code;
}

function getConfig() {
  return {
    anthropicApiKey: document.getElementById('anthropicApiKey').value,
    companyName: document.getElementById('companyName').value,
    companyDescription: document.getElementById('companyDescription').value,
    ownerName: document.getElementById('ownerName').value,
    minBudget: document.getElementById('minBudget').value,
    tone: document.getElementById('tone').value,
    services: getServices().filter(s => s.trim()),
    qualifyFields: getQuestions().filter(q => q.key && q.label),
    widgetTitle: document.getElementById('widgetTitle').value,
    widgetSubtitle: document.getElementById('widgetSubtitle').value,
    welcomeMessage: document.getElementById('welcomeMessage').value,
    closingMessage: document.getElementById('closingMessage').value,
    primaryColor: document.getElementById('primaryColor').value,
    secondaryColor: document.getElementById('secondaryColor').value,
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

function copyEmbed() {
  navigator.clipboard.writeText(document.getElementById('embedCodeText').textContent);
  showToast('Código copiado al portapapeles', false);
}

document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelectorAll('nav a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});

document.addEventListener('input', updatePreview);
document.addEventListener('change', updatePreview);

renderServices(initServices);
renderQuestions(initQuestions);
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
  console.log('[ADMIN] Configuración actualizada para:', newConfig.companyName);
  res.json({ ok: true });
});

// ─── API ─────────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'sessionId y message son requeridos' });
  try {
    const result = await chat(sessionId, message);
    res.json(result);
  } catch (error) {
    console.error('Error en chat:', error.message);
    res.status(500).json({ error: 'Error procesando mensaje' });
  }
});

app.get('/api/leads', (req, res) => res.json(loadLeads()));

app.get('/api/health', (req, res) => {
  const cfg = loadConfig();
  res.json({ status: 'ok', bot: `Lead Qualifier Bot — ${cfg.companyName}`, sessions: sessions.size, leads: loadLeads().length });
});

// ─── WIDGET ──────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  const cfg = loadConfig();
  const welcome = cfg.welcomeMessage
    .replace('${companyName}', cfg.companyName)
    .replace('${ownerName}', cfg.ownerName);
  const closing = cfg.closingMessage
    .replace('${companyName}', cfg.companyName)
    .replace('${ownerName}', cfg.ownerName);

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${cfg.companyName} — ${cfg.widgetTitle}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh}
.chat-container{width:400px;height:600px;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden}
.chat-header{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});padding:1.2rem 1.5rem;color:#fff}
.chat-header h3{font-weight:700;font-size:1rem}
.chat-header p{font-size:.8rem;opacity:.85;margin-top:.2rem}
.chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.8rem}
.msg{max-width:80%;padding:.7rem 1rem;border-radius:16px;font-size:.875rem;line-height:1.5}
.msg.bot{background:#f0f2f5;color:#1a1a2e;align-self:flex-start;border-bottom-left-radius:4px}
.msg.user{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.msg.typing{opacity:.6}
.chat-input{display:flex;gap:.5rem;padding:1rem;border-top:1px solid #eee}
.chat-input input{flex:1;padding:.7rem 1rem;border:1.5px solid #eee;border-radius:50px;font-size:.9rem;outline:none}
.chat-input input:focus{border-color:${cfg.primaryColor}}
.chat-input button{background:linear-gradient(135deg,${cfg.primaryColor},${cfg.secondaryColor});color:#fff;border:none;border-radius:50px;padding:.7rem 1.2rem;cursor:pointer;font-weight:600;font-size:.85rem}
.qualified-banner{background:#1B1B6E;color:#fff;padding:.8rem 1rem;text-align:center;font-size:.8rem;font-weight:600}
</style>
</head>
<body>
<div class="chat-container">
  <div class="chat-header">
    <h3>${cfg.companyName} — ${cfg.widgetTitle}</h3>
    <p>${cfg.widgetSubtitle}</p>
  </div>
  <div class="chat-messages" id="messages"></div>
  <div class="chat-input">
    <input type="text" id="input" placeholder="Escribe tu mensaje..."/>
    <button onclick="sendMessage()">Enviar</button>
  </div>
</div>
<script>
const sessionId = 'session_' + Math.random().toString(36).slice(2);
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const CLOSING = ${JSON.stringify(closing)};

function addMessage(text, type) {
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';
  addMessage(text, 'user');
  const typing = addMessage('Escribiendo...', 'bot typing');
  try {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId, message: text })
    });
    const data = await res.json();
    typing.remove();
    addMessage(data.reply, 'bot');
    if (data.qualified) {
      const banner = document.createElement('div');
      banner.className = 'qualified-banner';
      banner.textContent = CLOSING;
      document.querySelector('.chat-container').appendChild(banner);
    }
  } catch(e) {
    typing.remove();
    addMessage('Hubo un error. Intenta de nuevo.', 'bot');
  }
}

inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
window.onload = () => addMessage(${JSON.stringify(welcome)}, 'bot');
</script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Lead Qualifier Bot corriendo en: http://localhost:${PORT}`);
  console.log(`Panel de admin: http://localhost:${PORT}/admin`);
});
