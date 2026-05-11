import express from 'express';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const CONFIG_FILE = './config.json';

const DEFAULT_CONFIG = {
  // Credenciales Deriv
  apiToken: '',
  appId: process.env.DERIV_APP_ID || '1089',

  // Instrumento
  symbol: 'R_50',          // R_10, R_25, R_50, R_75, R_100
  duration: 5,             // duración del contrato
  durationUnit: 't',       // 't'=ticks, 'm'=minutos
  stake: 1,                // monto base por operación (USD)
  currency: 'USD',

  // Parámetros de estrategia
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  emaShortPeriod: 9,
  emaLongPeriod: 21,
  bbPeriod: 20,
  bbStdDev: 2,
  minSignals: 2,           // señales mínimas de 3 para operar (2 = más trades, 3 = más precisión)

  // Gestión de riesgo
  maxConsecutiveLosses: 5,
  maxDailyLoss: 20,        // pérdida máxima diaria en USD
  dailyProfitTarget: 30,   // objetivo de ganancia diaria en USD
  pauseMinutes: 30,        // minutos de pausa tras max pérdidas consecutivas

  // Martingala (opcional)
  useMartingale: false,
  martingaleMultiplier: 2,
  maxMartingaleLevel: 3,

  // Modo operación
  paperMode: true,         // true = simulación sin dinero real
};

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) }; }
  catch { return { ...DEFAULT_CONFIG }; }
}

function saveConfig(data) {
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

let config = loadConfig();

// ─── ANÁLISIS TÉCNICO ────────────────────────────────────────────────────────

function calcRSI(prices, period) {
  if (prices.length < period + 1) return null;
  const data = prices.slice(-(period * 3 + 1));
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = data[i] - data[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calcEMA(prices, period) {
  if (prices.length < period) return null;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  for (let i = period; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
  return ema;
}

function calcBB(prices, period, mult) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b) / period;
  const std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - sma, 2)) / period);
  return { upper: sma + mult * std, middle: sma, lower: sma - mult * std };
}

// Detecta tendencia comparando EMAs de 2 períodos distintos
function calcEMASlope(prices, period) {
  if (prices.length < period + 3) return 0;
  const prev = calcEMA(prices.slice(0, -3), period);
  const curr = calcEMA(prices, period);
  if (!prev || !curr) return 0;
  return curr - prev;
}

function generateSignal(tickBuffer) {
  const cfg = config;
  const prices = tickBuffer.map(t => t.quote);
  const minRequired = Math.max(cfg.bbPeriod, cfg.emaLongPeriod, cfg.rsiPeriod) + 10;
  if (prices.length < minRequired) return null;

  const rsi = calcRSI(prices, cfg.rsiPeriod);
  const emaShort = calcEMA(prices, cfg.emaShortPeriod);
  const emaLong = calcEMA(prices, cfg.emaLongPeriod);
  const bb = calcBB(prices, cfg.bbPeriod, cfg.bbStdDev);
  const emaSlope = calcEMASlope(prices, cfg.emaShortPeriod);

  if (rsi === null || emaShort === null || emaLong === null || bb === null) return null;

  const lastPrice = prices[prices.length - 1];
  let callScore = 0, putScore = 0;

  // 1. RSI
  if (rsi < cfg.rsiOversold) callScore++;
  if (rsi > cfg.rsiOverbought) putScore++;

  // 2. EMA crossover + slope (confirma dirección)
  if (emaShort > emaLong && emaSlope > 0) callScore++;
  if (emaShort < emaLong && emaSlope < 0) putScore++;

  // 3. Posición respecto a Bollinger Bands
  const bbRange = bb.upper - bb.lower;
  if (lastPrice <= bb.lower + bbRange * 0.05) callScore++;
  if (lastPrice >= bb.upper - bbRange * 0.05) putScore++;

  const indicators = {
    rsi: +rsi.toFixed(2),
    emaShort: +emaShort.toFixed(5),
    emaLong: +emaLong.toFixed(5),
    emaSlope: +emaSlope.toFixed(6),
    bbUpper: +bb.upper.toFixed(5),
    bbMiddle: +bb.middle.toFixed(5),
    bbLower: +bb.lower.toFixed(5),
    lastPrice: +lastPrice.toFixed(5),
    callScore,
    putScore,
  };

  if (callScore >= cfg.minSignals) return { direction: 'CALL', score: callScore, indicators };
  if (putScore >= cfg.minSignals) return { direction: 'PUT', score: putScore, indicators };
  return { direction: null, score: 0, indicators };
}

// ─── ESTADO DEL BOT ──────────────────────────────────────────────────────────

let state = {
  running: false,
  connected: false,
  authorized: false,
  tickBuffer: [],
  currentTrade: null,
  balance: 0,
  currency: 'USD',
  stats: {
    wins: 0,
    losses: 0,
    profit: 0,
    dailyProfit: 0,
    consecutiveLosses: 0,
    consecutiveWins: 0,
    martingaleLevel: 0,
    currentStake: DEFAULT_CONFIG.stake,
    tradeHistory: [],
  },
  pausedUntil: null,
  lastSignal: null,
  lastError: null,
};

// ─── DERIV WEBSOCKET CLIENT ──────────────────────────────────────────────────

let derivWs = null;
let pingInterval = null;
let reqId = 1;

function derivSend(payload) {
  if (!derivWs || derivWs.readyState !== WebSocket.OPEN) return null;
  payload.req_id = reqId++;
  derivWs.send(JSON.stringify(payload));
  return payload.req_id;
}

function derivConnect() {
  const cfg = loadConfig();
  if (derivWs) {
    try { derivWs.terminate(); } catch {}
  }

  const url = `wss://ws.derivws.com/websockets/v3?app_id=${cfg.appId}`;
  log(`Conectando a Deriv (App ID: ${cfg.appId})...`);
  derivWs = new WebSocket(url);

  derivWs.on('open', () => {
    state.connected = true;
    clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (derivWs?.readyState === WebSocket.OPEN) derivSend({ ping: 1 });
    }, 25000);

    log('Conectado a Deriv WebSocket');
    broadcast({ type: 'status', data: getStatus() });

    const cfg = loadConfig();
    if (cfg.apiToken) {
      derivSend({ authorize: cfg.apiToken });
    } else if (cfg.paperMode && state.running) {
      // Paper mode sin token: simular directamente
      subscribeToTicks();
    }
  });

  derivWs.on('message', (raw) => {
    try { handleDerivMessage(JSON.parse(raw.toString())); }
    catch (e) { log('Error parseando mensaje: ' + e.message, 'error'); }
  });

  derivWs.on('close', (code) => {
    state.connected = false;
    state.authorized = false;
    clearInterval(pingInterval);
    log(`Desconectado de Deriv (código: ${code})`, 'warn');
    broadcast({ type: 'status', data: getStatus() });
    if (state.running) setTimeout(derivConnect, 5000);
  });

  derivWs.on('error', (err) => {
    state.lastError = err.message;
    log('Error WebSocket: ' + err.message, 'error');
  });
}

function handleDerivMessage(msg) {
  if (msg.error) {
    log(`Error Deriv [${msg.msg_type}]: ${msg.error.message}`, 'error');
    state.lastError = msg.error.message;
    if (msg.msg_type === 'authorize') {
      state.authorized = false;
      state.running = false;
    }
    broadcast({ type: 'error', data: msg.error.message });
    broadcast({ type: 'status', data: getStatus() });
    return;
  }

  switch (msg.msg_type) {
    case 'authorize':
      state.authorized = true;
      state.balance = msg.authorize.balance;
      state.currency = msg.authorize.currency;
      log(`Autorizado: ${msg.authorize.loginid} | Balance: ${state.balance} ${state.currency} | Cuenta: ${msg.authorize.is_virtual ? 'DEMO' : 'REAL'}`);
      broadcast({ type: 'status', data: getStatus() });
      if (state.running) subscribeToTicks();
      break;

    case 'ticks_history':
      if (msg.history?.prices?.length) {
        state.tickBuffer = msg.history.prices.map((p, i) => ({
          quote: parseFloat(p),
          epoch: msg.history.times[i],
        }));
        log(`Historial inicializado: ${state.tickBuffer.length} ticks`);
      }
      break;

    case 'tick':
      handleTick(msg.tick);
      break;

    case 'buy':
      handleBuyResponse(msg);
      break;

    case 'proposal_open_contract':
      if (msg.proposal_open_contract?.is_sold !== undefined) {
        handleContractUpdate(msg.proposal_open_contract);
      }
      break;

    case 'balance':
      state.balance = msg.balance.balance;
      broadcast({ type: 'balance', data: { balance: state.balance, currency: state.currency } });
      break;
  }
}

function subscribeToTicks() {
  const cfg = loadConfig();
  // Cargar historial primero
  derivSend({
    ticks_history: cfg.symbol,
    adjust_start_time: 1,
    count: 300,
    end: 'latest',
    style: 'ticks',
  });
  // Suscribir a ticks en vivo
  derivSend({ ticks: cfg.symbol, subscribe: 1 });
  // Suscribir a balance
  if (state.authorized) derivSend({ balance: 1, subscribe: 1 });
  log(`Suscrito a ${cfg.symbol}`);
}

// ─── LÓGICA DE TICKS Y SEÑALES ───────────────────────────────────────────────

let analyzeCooldown = false;

function handleTick(tick) {
  const td = { quote: parseFloat(tick.quote), epoch: tick.epoch };
  state.tickBuffer.push(td);
  if (state.tickBuffer.length > 600) state.tickBuffer.shift();

  broadcast({ type: 'tick', data: { quote: td.quote, epoch: td.epoch, bufferSize: state.tickBuffer.length } });

  if (!state.running || state.currentTrade || analyzeCooldown) return;

  // Verificar pausa
  if (state.pausedUntil) {
    if (Date.now() < state.pausedUntil) {
      const remaining = Math.ceil((state.pausedUntil - Date.now()) / 60000);
      broadcast({ type: 'paused', data: { remainingMinutes: remaining } });
      return;
    }
    state.pausedUntil = null;
    log('Pausa terminada, reanudando operaciones');
  }

  const cfg = loadConfig();

  // Verificar límites diarios
  if (state.stats.dailyProfit <= -Math.abs(cfg.maxDailyLoss)) {
    log(`Límite de pérdida diaria alcanzado ($${Math.abs(state.stats.dailyProfit).toFixed(2)}). Bot detenido.`, 'warn');
    stopBot();
    return;
  }
  if (state.stats.dailyProfit >= cfg.dailyProfitTarget) {
    log(`Objetivo de ganancia diaria alcanzado ($${state.stats.dailyProfit.toFixed(2)}). Bot detenido.`, 'success');
    stopBot();
    return;
  }

  // Cooldown entre análisis (evitar sobreanalizar)
  analyzeCooldown = true;
  setTimeout(() => { analyzeCooldown = false; }, 800);

  const result = generateSignal(state.tickBuffer);
  if (!result) return;

  state.lastSignal = { ...result, time: Date.now() };
  broadcast({ type: 'signal', data: state.lastSignal });

  if (result.direction) {
    executeTrade(result);
  }
}

// ─── EJECUCIÓN DE TRADES ─────────────────────────────────────────────────────

function executeTrade(signal) {
  const cfg = loadConfig();
  const stake = state.stats.currentStake;

  state.currentTrade = {
    signal,
    startTime: Date.now(),
    stake,
    status: 'placing',
    paper: cfg.paperMode,
  };

  broadcast({ type: 'trade', data: { status: 'placing', direction: signal.direction, stake, paper: cfg.paperMode } });

  if (cfg.paperMode) {
    log(`[PAPER] ${signal.direction} | Stake: $${stake.toFixed(2)} | Score: ${signal.score}/3 | RSI: ${signal.indicators.rsi}`);
    // Simular resultado después de duración
    const delay = cfg.durationUnit === 't' ? cfg.duration * 500 + 1500 : cfg.duration * 60000 + 2000;
    setTimeout(() => simulatePaperResult(signal, stake), delay);
    return;
  }

  // Trade real
  log(`REAL ${signal.direction} | Stake: $${stake.toFixed(2)} | Score: ${signal.score}/3`);
  derivSend({
    buy: '1',
    price: stake,
    parameters: {
      amount: stake,
      basis: 'stake',
      contract_type: signal.direction === 'CALL' ? 'CALL' : 'PUT',
      currency: cfg.currency,
      duration: cfg.duration,
      duration_unit: cfg.durationUnit,
      symbol: cfg.symbol,
    },
  });
}

function simulatePaperResult(signal, stake) {
  // Probabilidad ajustada por score de señal
  const baseWinRate = 0.52;
  const bonusPerExtraSignal = 0.10;
  const winProb = baseWinRate + (signal.score - 2) * bonusPerExtraSignal;
  const won = Math.random() < winProb;
  const profit = won ? +(stake * 0.95).toFixed(2) : -stake;
  processTradeResult(won, stake, profit, true);
}

function handleBuyResponse(msg) {
  if (msg.error) {
    log(`Error al abrir contrato: ${msg.error.message}`, 'error');
    state.currentTrade = null;
    return;
  }
  const contract = msg.buy;
  state.currentTrade = { ...state.currentTrade, contractId: contract.contract_id, buyPrice: contract.buy_price, status: 'open' };
  log(`Contrato abierto: ${contract.contract_id} | Precio: ${contract.buy_price}`);
  broadcast({ type: 'trade', data: { status: 'open', contractId: contract.contract_id, buyPrice: contract.buy_price } });

  derivSend({ proposal_open_contract: 1, contract_id: contract.contract_id, subscribe: 1 });
}

function handleContractUpdate(contract) {
  if (!state.currentTrade || contract.contract_id !== state.currentTrade.contractId) return;
  if (!contract.is_sold) return;

  const won = contract.profit > 0;
  const profit = +contract.profit.toFixed(2);
  const stake = +contract.buy_price.toFixed(2);
  log(`Contrato cerrado: ${won ? 'GANADO' : 'PERDIDO'} | P&L: ${profit >= 0 ? '+' : ''}$${profit}`);
  processTradeResult(won, stake, profit, false);
}

function processTradeResult(won, stake, profit, isPaper) {
  const cfg = loadConfig();
  const s = state.stats;

  if (won) {
    s.wins++;
    s.consecutiveWins++;
    s.consecutiveLosses = 0;
    s.martingaleLevel = 0;
    s.currentStake = cfg.stake;
  } else {
    s.losses++;
    s.consecutiveLosses++;
    s.consecutiveWins = 0;
    if (cfg.useMartingale && s.martingaleLevel < cfg.maxMartingaleLevel) {
      s.martingaleLevel++;
      s.currentStake = +(cfg.stake * Math.pow(cfg.martingaleMultiplier, s.martingaleLevel)).toFixed(2);
      log(`Martingala nivel ${s.martingaleLevel}: próximo stake $${s.currentStake}`);
    }
  }

  s.profit = +(s.profit + profit).toFixed(2);
  s.dailyProfit = +(s.dailyProfit + profit).toFixed(2);

  const trade = {
    time: new Date().toISOString(),
    direction: state.currentTrade?.signal?.direction ?? '?',
    stake: stake.toFixed(2),
    profit: profit.toFixed(2),
    result: won ? 'WIN' : 'LOSS',
    score: state.currentTrade?.signal?.score ?? 0,
    rsi: state.currentTrade?.signal?.indicators?.rsi ?? null,
    paper: isPaper,
  };

  s.tradeHistory.unshift(trade);
  if (s.tradeHistory.length > 100) s.tradeHistory.pop();

  const winRate = s.wins + s.losses > 0 ? ((s.wins / (s.wins + s.losses)) * 100).toFixed(1) : '0.0';
  log(`Win Rate: ${winRate}% | P&L Día: ${s.dailyProfit >= 0 ? '+' : ''}$${s.dailyProfit} | Racha pérd: ${s.consecutiveLosses}`, won ? 'success' : 'warn');

  // Pausar si supera máximo de pérdidas consecutivas
  if (s.consecutiveLosses >= cfg.maxConsecutiveLosses) {
    state.pausedUntil = Date.now() + cfg.pauseMinutes * 60 * 1000;
    s.consecutiveLosses = 0;
    s.martingaleLevel = 0;
    s.currentStake = cfg.stake;
    log(`${cfg.maxConsecutiveLosses} pérdidas consecutivas. Pausando ${cfg.pauseMinutes} minutos.`, 'warn');
  }

  state.currentTrade = null;
  broadcast({ type: 'tradeResult', data: { trade, stats: getSafeStats() } });
}

// ─── CONTROL DEL BOT ─────────────────────────────────────────────────────────

function startBot() {
  const cfg = loadConfig();
  if (!cfg.paperMode && !cfg.apiToken) {
    return { ok: false, error: 'Se requiere API Token para operar en real. Activa el modo Paper para simular.' };
  }

  state.running = true;
  state.stats.currentStake = cfg.stake;
  state.lastError = null;

  log(`Bot iniciado | Modo: ${cfg.paperMode ? 'PAPER (simulación)' : 'REAL'} | ${cfg.symbol} | Stake: $${cfg.stake}`);

  if (!state.connected) {
    derivConnect();
  } else if (state.authorized) {
    subscribeToTicks();
  } else if (cfg.apiToken) {
    derivSend({ authorize: cfg.apiToken });
  } else {
    subscribeToTicks(); // paper sin token
  }

  broadcast({ type: 'status', data: getStatus() });
  return { ok: true };
}

function stopBot() {
  state.running = false;
  state.currentTrade = null;
  log('Bot detenido');
  broadcast({ type: 'status', data: getStatus() });
  return { ok: true };
}

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

const logs = [];

function log(msg, level = 'info') {
  const entry = { time: new Date().toISOString(), msg, level };
  logs.unshift(entry);
  if (logs.length > 300) logs.pop();
  const colors = { info: '\x1b[37m', success: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' };
  console.log(`${colors[level] || ''}[${level.toUpperCase()}]\x1b[0m ${msg}`);
  broadcast({ type: 'log', data: entry });
}

function getStatus() {
  const s = state.stats;
  const total = s.wins + s.losses;
  return {
    running: state.running,
    connected: state.connected,
    authorized: state.authorized,
    balance: state.balance,
    currency: state.currency,
    symbol: config.symbol,
    paperMode: config.paperMode,
    winRate: total > 0 ? ((s.wins / total) * 100).toFixed(1) : '0.0',
    stats: getSafeStats(),
    pausedUntil: state.pausedUntil,
    lastError: state.lastError,
    bufferSize: state.tickBuffer.length,
    inTrade: !!state.currentTrade,
  };
}

function getSafeStats() {
  const s = state.stats;
  const total = s.wins + s.losses;
  return {
    wins: s.wins,
    losses: s.losses,
    total,
    winRate: total > 0 ? ((s.wins / total) * 100).toFixed(1) : '0.0',
    profit: s.profit.toFixed(2),
    dailyProfit: s.dailyProfit.toFixed(2),
    consecutiveLosses: s.consecutiveLosses,
    consecutiveWins: s.consecutiveWins,
    currentStake: s.currentStake,
    martingaleLevel: s.martingaleLevel,
    tradeHistory: s.tradeHistory.slice(0, 30),
  };
}

// ─── BROADCAST A CLIENTES UI ─────────────────────────────────────────────────

const adminClients = new Set();

function broadcast(msg) {
  if (adminClients.size === 0) return;
  const data = JSON.stringify(msg);
  for (const client of adminClients) {
    if (client.readyState === 1) client.send(data);
  }
}

// ─── SERVIDOR HTTP + WS ──────────────────────────────────────────────────────

const app = express();
app.use(express.json());
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  adminClients.add(ws);
  // Enviar estado inicial
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      status: getStatus(),
      config: { ...loadConfig(), apiToken: loadConfig().apiToken ? '***' : '' },
      logs: logs.slice(0, 80),
      recentTicks: state.tickBuffer.slice(-80).map(t => t.quote),
    },
  }));
  ws.on('close', () => adminClients.delete(ws));
  ws.on('error', () => adminClients.delete(ws));
});

app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  res.json({ ...cfg, apiToken: cfg.apiToken ? '***' : '' });
});

app.post('/api/config', (req, res) => {
  const current = loadConfig();
  // No sobreescribir token si viene enmascarado
  const incoming = { ...req.body };
  if (incoming.apiToken === '***') delete incoming.apiToken;
  const newConfig = { ...current, ...incoming };
  saveConfig(newConfig);
  config = newConfig;
  log('Configuración actualizada');
  broadcast({ type: 'status', data: getStatus() });
  res.json({ ok: true });
});

app.post('/api/start', (req, res) => res.json(startBot()));
app.post('/api/stop', (req, res) => res.json(stopBot()));

app.post('/api/reset-stats', (req, res) => {
  state.stats = {
    wins: 0, losses: 0, profit: 0, dailyProfit: 0,
    consecutiveLosses: 0, consecutiveWins: 0,
    martingaleLevel: 0, currentStake: config.stake,
    tradeHistory: [],
  };
  state.pausedUntil = null;
  log('Estadísticas reiniciadas');
  broadcast({ type: 'status', data: getStatus() });
  res.json({ ok: true });
});

app.get('/api/status', (req, res) => res.json(getStatus()));
app.get('/api/logs', (req, res) => res.json(logs.slice(0, 100)));

app.get('/health', (req, res) => res.json({
  status: 'ok', running: state.running, connected: state.connected,
  paperMode: config.paperMode, uptime: process.uptime(),
}));

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Deriv Trading Bot — Panel de Control</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#07070b;color:#e2e2f0;min-height:100vh;display:flex}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0f0f1a}::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:3px}

/* Sidebar */
.sidebar{width:220px;min-height:100vh;background:#0d0d1a;border-right:1px solid #1e1e3a;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:10}
.sb-logo{padding:1.4rem 1.2rem;border-bottom:1px solid #1e1e3a}
.sb-logo .through{font-weight:900;font-size:1rem;color:#fff}
.sb-logo .air{font-weight:300;font-size:1.3rem;color:#F26522}
.sb-logo .badge{font-size:.6rem;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:.2rem .6rem;border-radius:50px;margin-top:.4rem;display:inline-block;letter-spacing:.5px}
nav{padding:.8rem 0;flex:1}
nav a{display:flex;align-items:center;gap:.6rem;padding:.6rem 1.1rem;color:#8888aa;text-decoration:none;font-size:.82rem;transition:all .2s;cursor:pointer;border-left:2px solid transparent}
nav a:hover,nav a.active{color:#fff;background:rgba(242,101,34,.08);border-left-color:#F26522}
.sb-footer{padding:1rem 1.2rem;border-top:1px solid #1e1e3a;font-size:.72rem;color:#555}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:.4rem;vertical-align:middle}
.dot-green{background:#22c55e;box-shadow:0 0 5px #22c55e}
.dot-red{background:#ef4444}
.dot-yellow{background:#f59e0b;box-shadow:0 0 5px #f59e0b}

/* Main */
.main{margin-left:220px;flex:1;padding:1.8rem;max-width:1100px}
.page-header{margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between}
.page-header h1{font-size:1.5rem;font-weight:700;color:#fff}
.page-header p{color:#666;font-size:.82rem;margin-top:.2rem}

/* Control buttons */
.ctrl-btns{display:flex;gap:.6rem}
.btn{padding:.6rem 1.4rem;border:none;border-radius:10px;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s}
.btn-start{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 3px 12px rgba(34,197,94,.35)}
.btn-start:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(34,197,94,.45)}
.btn-stop{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
.btn-stop:hover{transform:translateY(-1px)}
.btn-reset{background:#1a1a2e;border:1px solid #2a2a4a;color:#888;font-size:.78rem}
.btn-reset:hover{color:#e2e2f0;border-color:#444}
.btn-save{background:linear-gradient(135deg,#F26522,#C8317A);color:#fff;padding:.65rem 1.8rem;font-size:.88rem;box-shadow:0 3px 15px rgba(242,101,34,.35)}
.btn-save:hover{transform:translateY(-1px);box-shadow:0 6px 25px rgba(242,101,34,.45)}

/* Status bar */
.status-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
.stat-card{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:14px;padding:1.2rem 1.4rem}
.stat-card .label{font-size:.72rem;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.4rem}
.stat-card .value{font-size:1.6rem;font-weight:700;color:#fff;line-height:1}
.stat-card .sub{font-size:.75rem;color:#555;margin-top:.3rem}
.stat-card.green .value{color:#22c55e}
.stat-card.red .value{color:#ef4444}
.stat-card.orange .value{color:#F26522}

/* Mode badge */
.mode-badge{display:inline-flex;align-items:center;gap:.4rem;padding:.3rem .8rem;border-radius:50px;font-size:.72rem;font-weight:700}
.mode-paper{background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.3)}
.mode-real{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.3)}

/* Chart */
.chart-card{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:14px;padding:1.2rem;margin-bottom:1.2rem}
.chart-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.chart-header h3{font-size:.9rem;font-weight:600;color:#e2e2f0}
.chart-meta{display:flex;gap:1rem;align-items:center;font-size:.75rem;color:#666}
.legend-dot{width:10px;height:3px;border-radius:2px;display:inline-block;margin-right:.3rem}
canvas{width:100%;height:160px;display:block;border-radius:8px}

/* Signal panel */
.signal-panel{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8rem;margin-bottom:1.2rem}
.signal-card{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:12px;padding:1rem;text-align:center}
.signal-card .sig-label{font-size:.7rem;color:#666;text-transform:uppercase;margin-bottom:.5rem}
.signal-card .sig-val{font-size:1.1rem;font-weight:700;color:#e2e2f0}
.sig-call{color:#22c55e!important}
.sig-put{color:#ef4444!important}
.sig-bar{height:4px;border-radius:2px;background:#1e1e3a;margin-top:.5rem;overflow:hidden}
.sig-bar-fill{height:100%;border-radius:2px;transition:width .4s}

/* Card generic */
.card{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:14px;padding:1.4rem;margin-bottom:1.2rem}
.card-hd{display:flex;align-items:center;gap:.7rem;margin-bottom:1.2rem;padding-bottom:.9rem;border-bottom:1px solid #1e1e3a}
.card-hd .ico{width:32px;height:32px;background:linear-gradient(135deg,#F26522,#C8317A);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0}
.card-hd h2{font-size:.9rem;font-weight:600;color:#fff}
.card-hd p{font-size:.74rem;color:#666;margin-top:.1rem}

/* Form */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.9rem}
.form-grid.cols3{grid-template-columns:1fr 1fr 1fr}
.form-grid.single{grid-template-columns:1fr}
.field{display:flex;flex-direction:column;gap:.35rem}
.field label{font-size:.72rem;color:#888;font-weight:500;letter-spacing:.3px;text-transform:uppercase}
.field input,.field select{background:#1a1a2e;border:1.5px solid #2a2a4a;border-radius:9px;padding:.6rem .9rem;color:#e2e2f0;font-size:.85rem;outline:none;transition:border-color .2s;width:100%}
.field input:focus,.field select:focus{border-color:#F26522;box-shadow:0 0 0 3px rgba(242,101,34,.1)}
.field .hint{font-size:.7rem;color:#555}
.field .input-wrap{position:relative;display:flex;align-items:center}
.field .input-wrap input{padding-right:2.4rem}
.field .eye-btn{position:absolute;right:.6rem;background:none;border:none;color:#555;cursor:pointer;font-size:.9rem;padding:.2rem}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:.5rem 0}
.toggle-label{font-size:.82rem;color:#aaa}
.toggle{position:relative;display:inline-block;width:42px;height:22px}
.toggle input{opacity:0;width:0;height:0}
.slider{position:absolute;cursor:pointer;inset:0;background:#2a2a4a;border-radius:22px;transition:.3s}
.slider:before{content:'';position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#888;border-radius:50%;transition:.3s}
input:checked+.slider{background:linear-gradient(135deg,#22c55e,#16a34a)}
input:checked+.slider:before{transform:translateX(20px);background:#fff}

/* Trade history */
.trade-table{width:100%;border-collapse:collapse;font-size:.78rem}
.trade-table th{text-align:left;padding:.5rem .8rem;color:#555;font-weight:500;border-bottom:1px solid #1e1e3a;text-transform:uppercase;font-size:.68rem}
.trade-table td{padding:.55rem .8rem;border-bottom:1px solid #0d0d1a}
.trade-table tr:hover td{background:rgba(255,255,255,.02)}
.pill{display:inline-flex;align-items:center;padding:.15rem .6rem;border-radius:50px;font-size:.7rem;font-weight:700}
.pill-win{background:rgba(34,197,94,.12);color:#22c55e}
.pill-loss{background:rgba(239,68,68,.12);color:#ef4444}
.pill-call{background:rgba(34,197,94,.08);color:#86efac;font-size:.65rem}
.pill-put{background:rgba(239,68,68,.08);color:#fca5a5;font-size:.65rem}
.pill-paper{background:rgba(251,191,36,.08);color:#fde68a;font-size:.65rem}

/* Logs */
.log-box{background:#050508;border:1px solid #1e1e3a;border-radius:10px;padding:.8rem;height:200px;overflow-y:auto;font-family:'Courier New',monospace;font-size:.73rem;line-height:1.7}
.log-info{color:#7878aa}
.log-success{color:#22c55e}
.log-warn{color:#f59e0b}
.log-error{color:#ef4444}

/* Alert banner */
.alert{padding:.8rem 1.2rem;border-radius:10px;font-size:.82rem;margin-bottom:1rem;display:none}
.alert-warn{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.3);color:#fbbf24}
.alert-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);color:#ef4444}
.alert-success{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.3);color:#22c55e}

/* Toast */
.toast{position:fixed;bottom:2rem;right:2rem;padding:.7rem 1.2rem;background:#1a2e1a;border:1px solid #22c55e;border-radius:10px;color:#22c55e;font-size:.82rem;font-weight:600;opacity:0;transition:opacity .3s;z-index:100}
.toast.show{opacity:1}
.toast.error{background:#2e1a1a;border-color:#ef4444;color:#ef4444}

.empty-state{text-align:center;padding:2rem;color:#444;font-size:.82rem}
.spacer{height:3rem}

/* Trade in progress indicator */
.trade-progress{display:none;align-items:center;gap:.6rem;padding:.5rem 1rem;background:rgba(242,101,34,.08);border:1px solid rgba(242,101,34,.3);border-radius:8px;font-size:.78rem;color:#F26522;margin-bottom:1rem}
.trade-progress.show{display:flex}
.pulse{width:8px;height:8px;border-radius:50%;background:#F26522;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
</style>
</head>
<body>
<aside class="sidebar">
  <div class="sb-logo">
    <div><span class="through">through</span> <span class="air">air</span></div>
    <div class="badge">DERIV TRADING BOT</div>
  </div>
  <nav>
    <a href="#dashboard" class="active">📊 Dashboard</a>
    <a href="#signals">📡 Señales</a>
    <a href="#history">📋 Historial</a>
    <a href="#config">⚙️ Configuración</a>
    <a href="#risk">🛡️ Riesgo</a>
    <a href="#logs">🖥️ Logs</a>
  </nav>
  <div class="sb-footer">
    <div id="conn-status"><span class="dot dot-red" id="dot-conn"></span> Desconectado</div>
    <div style="margin-top:.3rem" id="auth-status"></div>
  </div>
</aside>

<main class="main">
  <div class="page-header">
    <div>
      <h1>Trading Bot · <span id="sym-label">R_50</span></h1>
      <p id="mode-label">Cargando...</p>
    </div>
    <div class="ctrl-btns">
      <button class="btn btn-reset" onclick="resetStats()">Reiniciar stats</button>
      <button class="btn btn-stop" id="btn-stop" onclick="stopBot()" style="display:none">⏹ Detener</button>
      <button class="btn btn-start" id="btn-start" onclick="startBot()">▶ Iniciar Bot</button>
    </div>
  </div>

  <div id="alert-box" class="alert"></div>

  <div class="trade-progress" id="trade-progress">
    <span class="pulse"></span>
    <span id="trade-progress-txt">Operación en curso...</span>
  </div>

  <!-- Stats cards -->
  <div class="status-bar" id="dashboard">
    <div class="stat-card">
      <div class="label">Balance</div>
      <div class="value" id="s-balance">—</div>
      <div class="sub" id="s-currency">USD</div>
    </div>
    <div class="stat-card" id="sc-winrate">
      <div class="label">Win Rate</div>
      <div class="value" id="s-winrate">0%</div>
      <div class="sub" id="s-trades">0 trades</div>
    </div>
    <div class="stat-card" id="sc-profit">
      <div class="label">P&L Día</div>
      <div class="value" id="s-profit">$0.00</div>
      <div class="sub" id="s-profit-total">Total: $0.00</div>
    </div>
    <div class="stat-card">
      <div class="label">Racha / Nivel</div>
      <div class="value" id="s-streak">0</div>
      <div class="sub" id="s-martingale">Stake: $1.00</div>
    </div>
  </div>

  <!-- Live Chart -->
  <div class="chart-card">
    <div class="chart-header">
      <h3>Precio en tiempo real</h3>
      <div class="chart-meta">
        <span><span class="legend-dot" style="background:#e2e2f0"></span>Precio</span>
        <span><span class="legend-dot" style="background:#3b82f6"></span>BB Mid</span>
        <span><span class="legend-dot" style="background:#f59e0b"></span>BB Bandas</span>
        <span id="buf-label" style="color:#555">0 ticks</span>
      </div>
    </div>
    <canvas id="chart" height="160"></canvas>
  </div>

  <!-- Señales -->
  <div id="signals">
    <div class="signal-panel">
      <div class="signal-card">
        <div class="sig-label">RSI (14)</div>
        <div class="sig-val" id="ind-rsi">—</div>
        <div class="sig-bar"><div class="sig-bar-fill" id="ind-rsi-bar" style="width:50%;background:#3b82f6"></div></div>
      </div>
      <div class="signal-card">
        <div class="sig-label">EMA Crossover</div>
        <div class="sig-val" id="ind-ema">—</div>
        <div class="sig-bar"><div class="sig-bar-fill" id="ind-ema-bar" style="width:50%;background:#8b5cf6"></div></div>
      </div>
      <div class="signal-card">
        <div class="sig-label">Señal Actual</div>
        <div class="sig-val" id="ind-signal">ESPERA</div>
        <div class="sub" style="font-size:.7rem;color:#555;margin-top:.3rem" id="ind-score">Score: 0/3</div>
      </div>
    </div>
  </div>

  <!-- Trade History -->
  <div class="card" id="history">
    <div class="card-hd">
      <div class="ico">📋</div>
      <div><h2>Historial de operaciones</h2><p>Últimas 30 operaciones</p></div>
    </div>
    <div id="trade-history-wrap">
      <div class="empty-state">Aún no hay operaciones registradas.</div>
    </div>
  </div>

  <!-- Config -->
  <div class="card" id="config">
    <div class="card-hd">
      <div class="ico">⚙️</div>
      <div><h2>Configuración de trading</h2><p>Los cambios aplican al siguiente trade</p></div>
    </div>

    <div class="field" style="margin-bottom:1rem">
      <label>API Token de Deriv</label>
      <div class="input-wrap">
        <input type="password" id="apiToken" placeholder="Obtén tu token en app.deriv.com/account/api-token"/>
        <button class="eye-btn" onclick="togglePass('apiToken')">👁</button>
      </div>
      <span class="hint">Permisos necesarios: Read + Trade. Para demo usa tu cuenta virtual.</span>
    </div>

    <div class="form-grid" style="margin-bottom:1rem">
      <div class="field">
        <label>App ID de Deriv</label>
        <input type="text" id="appId" placeholder="1089"/>
        <span class="hint">Obtén el tuyo en developers.deriv.com (1089 = demo)</span>
      </div>
      <div class="field">
        <label>Símbolo</label>
        <select id="symbol">
          <option value="R_10">Volatility 10 Index</option>
          <option value="R_25">Volatility 25 Index</option>
          <option value="R_50" selected>Volatility 50 Index</option>
          <option value="R_75">Volatility 75 Index</option>
          <option value="R_100">Volatility 100 Index</option>
          <option value="1HZ10V">Volatility 10 (1s)</option>
          <option value="1HZ25V">Volatility 25 (1s)</option>
          <option value="1HZ50V">Volatility 50 (1s)</option>
          <option value="1HZ75V">Volatility 75 (1s)</option>
          <option value="1HZ100V">Volatility 100 (1s)</option>
        </select>
      </div>
    </div>

    <div class="form-grid cols3" style="margin-bottom:1rem">
      <div class="field">
        <label>Stake base (USD)</label>
        <input type="number" id="stake" min="0.35" max="1000" step="0.05"/>
      </div>
      <div class="field">
        <label>Duración</label>
        <input type="number" id="duration" min="1" max="60"/>
      </div>
      <div class="field">
        <label>Unidad</label>
        <select id="durationUnit">
          <option value="t">Ticks</option>
          <option value="m">Minutos</option>
        </select>
      </div>
    </div>

    <div class="toggle-row">
      <div>
        <span class="toggle-label">🧪 Modo Paper (simulación sin dinero real)</span>
        <div style="font-size:.7rem;color:#555;margin-top:.2rem">Recomendado para pruebas iniciales</div>
      </div>
      <label class="toggle"><input type="checkbox" id="paperMode"/><span class="slider"></span></label>
    </div>
  </div>

  <!-- Strategy -->
  <div class="card">
    <div class="card-hd">
      <div class="ico">📡</div>
      <div><h2>Parámetros de estrategia</h2><p>RSI + EMA Crossover + Bollinger Bands</p></div>
    </div>
    <div class="form-grid cols3">
      <div class="field">
        <label>Período RSI</label>
        <input type="number" id="rsiPeriod" min="5" max="30"/>
      </div>
      <div class="field">
        <label>RSI Sobrevendido</label>
        <input type="number" id="rsiOversold" min="10" max="45"/>
      </div>
      <div class="field">
        <label>RSI Sobrecomprado</label>
        <input type="number" id="rsiOverbought" min="55" max="90"/>
      </div>
      <div class="field">
        <label>EMA Corta</label>
        <input type="number" id="emaShortPeriod" min="3" max="20"/>
      </div>
      <div class="field">
        <label>EMA Larga</label>
        <input type="number" id="emaLongPeriod" min="10" max="50"/>
      </div>
      <div class="field">
        <label>Señales mínimas (1-3)</label>
        <select id="minSignals">
          <option value="1">1 — Más trades, menos precisión</option>
          <option value="2" selected>2 — Equilibrado</option>
          <option value="3">3 — Alta precisión, menos trades</option>
        </select>
      </div>
      <div class="field">
        <label>Período BB</label>
        <input type="number" id="bbPeriod" min="10" max="50"/>
      </div>
      <div class="field">
        <label>Desviaciones BB</label>
        <input type="number" id="bbStdDev" min="1" max="3" step="0.1"/>
      </div>
    </div>
  </div>

  <!-- Risk -->
  <div class="card" id="risk">
    <div class="card-hd">
      <div class="ico">🛡️</div>
      <div><h2>Gestión de riesgo</h2><p>Protección de capital y límites automáticos</p></div>
    </div>
    <div class="form-grid">
      <div class="field">
        <label>Máx. pérdidas consecutivas</label>
        <input type="number" id="maxConsecutiveLosses" min="2" max="20"/>
        <span class="hint">Tras alcanzarlo, el bot se pausa automáticamente</span>
      </div>
      <div class="field">
        <label>Pausa (minutos)</label>
        <input type="number" id="pauseMinutes" min="5" max="480"/>
      </div>
      <div class="field">
        <label>Pérdida máxima diaria (USD)</label>
        <input type="number" id="maxDailyLoss" min="1" step="0.5"/>
        <span class="hint">El bot se detiene al alcanzar este límite</span>
      </div>
      <div class="field">
        <label>Objetivo de ganancia diaria (USD)</label>
        <input type="number" id="dailyProfitTarget" min="1" step="0.5"/>
        <span class="hint">El bot se detiene al alcanzar este objetivo</span>
      </div>
    </div>

    <div class="toggle-row" style="margin-top:.5rem">
      <div>
        <span class="toggle-label">📈 Martingala (duplicar stake tras pérdida)</span>
        <div style="font-size:.7rem;color:#555;margin-top:.2rem">Alto riesgo — úsalo con precaución</div>
      </div>
      <label class="toggle"><input type="checkbox" id="useMartingale" onchange="toggleMartingale()"/><span class="slider"></span></label>
    </div>

    <div id="martingale-opts" style="display:none;margin-top:.8rem">
      <div class="form-grid cols3">
        <div class="field">
          <label>Multiplicador</label>
          <input type="number" id="martingaleMultiplier" min="1.5" max="5" step="0.5"/>
        </div>
        <div class="field">
          <label>Niveles máximos</label>
          <input type="number" id="maxMartingaleLevel" min="1" max="6"/>
        </div>
      </div>
    </div>
  </div>

  <!-- Logs -->
  <div class="card" id="logs">
    <div class="card-hd">
      <div class="ico">🖥️</div>
      <div><h2>Logs del sistema</h2><p>Actividad en tiempo real</p></div>
    </div>
    <div class="log-box" id="log-box"></div>
  </div>

  <div style="text-align:right;margin-bottom:1rem">
    <button class="btn btn-save" onclick="saveConfig()">Guardar configuración</button>
  </div>
  <div class="spacer"></div>
</main>

<div class="toast" id="toast"></div>

<script>
// ─── WEBSOCKET CONNECTION ─────────────────────────────────────────────────────
const ws = new WebSocket(\`ws://\${location.host}/ws\`);
const tickHistory = [];
const MAX_CHART_TICKS = 80;
let lastBB = null;
let lastTrades = [];

ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  switch (msg.type) {
    case 'init': onInit(msg.data); break;
    case 'status': onStatus(msg.data); break;
    case 'tick': onTick(msg.data); break;
    case 'signal': onSignal(msg.data); break;
    case 'trade': onTrade(msg.data); break;
    case 'tradeResult': onTradeResult(msg.data); break;
    case 'balance': onBalance(msg.data); break;
    case 'log': appendLog(msg.data); break;
    case 'error': showAlert(msg.data, 'error'); break;
    case 'paused': showAlert(\`Bot pausado. Reanuda en \${msg.data.remainingMinutes} minuto(s).\`, 'warn'); break;
  }
});

ws.addEventListener('open', () => updateConnDot(true));
ws.addEventListener('close', () => { updateConnDot(false); updateAuthStatus(false); });

function onInit(data) {
  updateConnDot(true);
  onStatus(data.status);
  if (data.config) populateForm(data.config);
  if (data.logs) data.logs.forEach(l => appendLog(l, false));
  if (data.recentTicks) {
    data.recentTicks.forEach(q => tickHistory.push(q));
    if (tickHistory.length > MAX_CHART_TICKS) tickHistory.splice(0, tickHistory.length - MAX_CHART_TICKS);
    renderChart();
  }
}

function onStatus(s) {
  document.getElementById('sym-label').textContent = s.symbol || 'R_50';
  const modeBadge = s.paperMode
    ? '<span class="mode-badge mode-paper">🧪 PAPER MODE</span>'
    : '<span class="mode-badge mode-real">⚡ REAL MONEY</span>';
  document.getElementById('mode-label').innerHTML = \`\${modeBadge} · \${s.running ? 'Bot activo' : 'Bot detenido'}\`;

  document.getElementById('btn-start').style.display = s.running ? 'none' : '';
  document.getElementById('btn-stop').style.display = s.running ? '' : 'none';

  if (s.balance !== undefined && s.balance !== 0) {
    document.getElementById('s-balance').textContent = \`\$\${parseFloat(s.balance).toFixed(2)}\`;
  }
  document.getElementById('s-currency').textContent = s.currency || 'USD';
  updateAuthStatus(s.authorized);

  if (s.stats) updateStats(s.stats);
  if (s.lastError) showAlert(s.lastError, 'error');
}

function onBalance(d) {
  document.getElementById('s-balance').textContent = \`\$\${parseFloat(d.balance).toFixed(2)}\`;
}

function onTick(d) {
  tickHistory.push(d.quote);
  if (tickHistory.length > MAX_CHART_TICKS) tickHistory.shift();
  document.getElementById('buf-label').textContent = \`\${d.bufferSize} ticks\`;
  renderChart();
}

function onSignal(d) {
  if (!d.indicators) return;
  const ind = d.indicators;

  // RSI
  const rsi = parseFloat(ind.rsi);
  document.getElementById('ind-rsi').textContent = rsi.toFixed(1);
  const rsiColor = rsi < 30 ? '#22c55e' : rsi > 70 ? '#ef4444' : '#e2e2f0';
  document.getElementById('ind-rsi').style.color = rsiColor;
  document.getElementById('ind-rsi-bar').style.width = rsi + '%';
  document.getElementById('ind-rsi-bar').style.background = rsiColor;

  // EMA
  const diff = ind.emaShort - ind.emaLong;
  const emaEl = document.getElementById('ind-ema');
  emaEl.textContent = diff > 0 ? '↑ ALCISTA' : '↓ BAJISTA';
  emaEl.className = 'sig-val ' + (diff > 0 ? 'sig-call' : 'sig-put');
  const pct = Math.min(100, Math.max(0, 50 + (diff / ind.emaLong) * 5000));
  document.getElementById('ind-ema-bar').style.width = pct + '%';
  document.getElementById('ind-ema-bar').style.background = diff > 0 ? '#22c55e' : '#ef4444';

  // BB for chart
  lastBB = { upper: ind.bbUpper, middle: ind.bbMiddle, lower: ind.bbLower };
  renderChart();

  // Signal
  const sigEl = document.getElementById('ind-signal');
  const scoreEl = document.getElementById('ind-score');
  const dir = d.direction;
  if (dir === 'CALL') { sigEl.textContent = '▲ CALL'; sigEl.className = 'sig-val sig-call'; }
  else if (dir === 'PUT') { sigEl.textContent = '▼ PUT'; sigEl.className = 'sig-val sig-put'; }
  else { sigEl.textContent = 'ESPERA'; sigEl.className = 'sig-val'; }
  scoreEl.textContent = \`Score: \${d.score}/3\`;
}

function onTrade(d) {
  const p = document.getElementById('trade-progress');
  const t = document.getElementById('trade-progress-txt');
  if (d.status === 'placing' || d.status === 'open') {
    p.classList.add('show');
    t.textContent = \`\${d.paper ? '[PAPER] ' : ''}\${d.direction} en curso | Stake: \$\${parseFloat(d.stake).toFixed(2)}\`;
  } else {
    p.classList.remove('show');
  }
}

function onTradeResult(d) {
  document.getElementById('trade-progress').classList.remove('show');
  updateStats(d.stats);
  lastTrades = d.stats.tradeHistory || [];
  renderTradeHistory(lastTrades);

  const t = d.trade;
  const won = t.result === 'WIN';
  showToast(\`\${won ? '✅' : '❌'} \${t.direction} | \${won ? '+' : ''}\$\${t.profit}\`, !won);
}

function updateStats(s) {
  const wr = parseFloat(s.winRate);
  document.getElementById('s-winrate').textContent = wr + '%';
  document.getElementById('s-trades').textContent = \`\${s.total} trades (W:\${s.wins} L:\${s.losses})\`;

  const wrCard = document.getElementById('sc-winrate');
  wrCard.className = 'stat-card ' + (wr >= 60 ? 'green' : wr >= 45 ? '' : 'red');

  const dp = parseFloat(s.dailyProfit);
  const profEl = document.getElementById('s-profit');
  profEl.textContent = \`\${dp >= 0 ? '+' : ''}\$\${Math.abs(dp).toFixed(2)}\`;
  document.getElementById('sc-profit').className = 'stat-card ' + (dp >= 0 ? 'green' : 'red');
  document.getElementById('s-profit-total').textContent = \`Total: \${parseFloat(s.profit) >= 0 ? '+' : ''}\$\${parseFloat(s.profit).toFixed(2)}\`;

  const streak = s.consecutiveLosses > 0 ? \`\${s.consecutiveLosses} perd.\` : \`\${s.consecutiveWins} gan.\`;
  document.getElementById('s-streak').textContent = streak;
  document.getElementById('s-martingale').textContent = \`Stake: \$\${parseFloat(s.currentStake).toFixed(2)}\${s.martingaleLevel > 0 ? ' · M' + s.martingaleLevel : ''}\`;

  if (s.tradeHistory?.length) {
    lastTrades = s.tradeHistory;
    renderTradeHistory(lastTrades);
  }
}

function renderTradeHistory(trades) {
  const wrap = document.getElementById('trade-history-wrap');
  if (!trades || !trades.length) {
    wrap.innerHTML = '<div class="empty-state">Aún no hay operaciones registradas.</div>';
    return;
  }
  wrap.innerHTML = \`<table class="trade-table">
    <thead><tr><th>Hora</th><th>Dir.</th><th>Score</th><th>Stake</th><th>P&L</th><th>Resultado</th></tr></thead>
    <tbody>\${trades.map(t => {
      const time = new Date(t.time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const plColor = parseFloat(t.profit) >= 0 ? '#22c55e' : '#ef4444';
      const plSign = parseFloat(t.profit) >= 0 ? '+' : '';
      return \`<tr>
        <td style="color:#555">\${time}</td>
        <td><span class="pill \${t.direction === 'CALL' ? 'pill-call' : 'pill-put'}">\${t.direction}</span>\${t.paper ? ' <span class="pill pill-paper">PAPER</span>' : ''}</td>
        <td style="color:#888">\${t.score}/3</td>
        <td>\$\${t.stake}</td>
        <td style="color:\${plColor};font-weight:600">\${plSign}\$\${t.profit}</td>
        <td><span class="pill \${t.result === 'WIN' ? 'pill-win' : 'pill-loss'}">\${t.result}</span></td>
      </tr>\`;
    }).join('')}</tbody>
  </table>\`;
}

// ─── CHART ────────────────────────────────────────────────────────────────────
function renderChart() {
  const canvas = document.getElementById('chart');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width - 40;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const padL = 58, padR = 8, padT = 8, padB = 24;
  const pW = w - padL - padR, pH = h - padT - padB;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#07070b';
  ctx.fillRect(0, 0, w, h);

  if (tickHistory.length < 2) return;

  const allPrices = [...tickHistory];
  if (lastBB) allPrices.push(lastBB.upper, lastBB.lower);
  const minP = Math.min(...allPrices) * 0.9995;
  const maxP = Math.max(...allPrices) * 1.0005;
  const range = maxP - minP || 1;

  const xS = (i) => padL + (i / (tickHistory.length - 1)) * pW;
  const yS = (p) => padT + pH - ((p - minP) / range) * pH;

  // Grid
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * pH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    const price = maxP - (i / 4) * range;
    ctx.fillStyle = '#444';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(price.toFixed(3), padL - 4, y + 4);
  }

  // BB bands (filled area)
  if (lastBB && tickHistory.length > 0) {
    ctx.beginPath();
    ctx.moveTo(padL, yS(lastBB.upper));
    ctx.lineTo(w - padR, yS(lastBB.upper));
    ctx.lineTo(w - padR, yS(lastBB.lower));
    ctx.lineTo(padL, yS(lastBB.lower));
    ctx.closePath();
    ctx.fillStyle = 'rgba(59,130,246,0.05)';
    ctx.fill();

    // BB lines
    [['upper', '#f59e0b'], ['middle', '#3b82f6'], ['lower', '#f59e0b']].forEach(([key, color]) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = key === 'middle' ? 1 : 0.8;
      ctx.setLineDash(key === 'middle' ? [4, 3] : []);
      ctx.moveTo(padL, yS(lastBB[key]));
      ctx.lineTo(w - padR, yS(lastBB[key]));
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  // Price line (gradient)
  const grad = ctx.createLinearGradient(padL, 0, w - padR, 0);
  grad.addColorStop(0, 'rgba(226,226,240,0.3)');
  grad.addColorStop(1, '#e2e2f0');

  ctx.beginPath();
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  tickHistory.forEach((q, i) => {
    const x = xS(i), y = yS(q);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Last price dot
  const lx = xS(tickHistory.length - 1), ly = yS(tickHistory[tickHistory.length - 1]);
  ctx.beginPath();
  ctx.arc(lx, ly, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#F26522';
  ctx.fill();

  // Last price label
  ctx.fillStyle = '#F26522';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(tickHistory[tickHistory.length - 1].toFixed(3), lx + 6, ly + 4);
}

// ─── FORM ─────────────────────────────────────────────────────────────────────
function populateForm(cfg) {
  const fields = ['apiToken','appId','symbol','stake','duration','durationUnit',
    'rsiPeriod','rsiOversold','rsiOverbought','emaShortPeriod','emaLongPeriod',
    'minSignals','bbPeriod','bbStdDev','maxConsecutiveLosses','pauseMinutes',
    'maxDailyLoss','dailyProfitTarget','martingaleMultiplier','maxMartingaleLevel'];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && cfg[id] !== undefined) el.value = cfg[id];
  });

  const toggles = ['paperMode', 'useMartingale'];
  toggles.forEach(id => {
    const el = document.getElementById(id);
    if (el && cfg[id] !== undefined) el.checked = !!cfg[id];
  });
  toggleMartingale();
}

function getFormConfig() {
  const nums = ['stake','duration','rsiPeriod','rsiOversold','rsiOverbought',
    'emaShortPeriod','emaLongPeriod','minSignals','bbPeriod','bbStdDev',
    'maxConsecutiveLosses','pauseMinutes','maxDailyLoss','dailyProfitTarget',
    'martingaleMultiplier','maxMartingaleLevel'];
  const strs = ['apiToken','appId','symbol','durationUnit'];
  const bools = ['paperMode','useMartingale'];

  const cfg = {};
  nums.forEach(id => { const v = document.getElementById(id)?.value; if (v !== undefined) cfg[id] = parseFloat(v); });
  strs.forEach(id => { const v = document.getElementById(id)?.value; if (v !== undefined) cfg[id] = v; });
  bools.forEach(id => { const el = document.getElementById(id); if (el) cfg[id] = el.checked; });
  return cfg;
}

async function saveConfig() {
  const cfg = getFormConfig();
  const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
  const data = await res.json();
  if (data.ok) showToast('Configuración guardada', false);
  else showToast('Error al guardar', true);
}

async function startBot() {
  await saveConfig();
  const res = await fetch('/api/start', { method: 'POST' });
  const data = await res.json();
  if (!data.ok) showAlert(data.error || 'Error al iniciar', 'error');
}

async function stopBot() {
  await fetch('/api/stop', { method: 'POST' });
}

async function resetStats() {
  if (!confirm('¿Reiniciar todas las estadísticas?')) return;
  await fetch('/api/reset-stats', { method: 'POST' });
  showToast('Estadísticas reiniciadas', false);
}

function toggleMartingale() {
  const on = document.getElementById('useMartingale')?.checked;
  document.getElementById('martingale-opts').style.display = on ? 'block' : 'none';
}

function togglePass(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
function updateConnDot(connected) {
  const dot = document.getElementById('dot-conn');
  const label = document.getElementById('conn-status');
  if (connected) {
    dot.className = 'dot dot-green';
    label.innerHTML = '<span class="dot dot-green" id="dot-conn"></span> Conectado';
  } else {
    dot.className = 'dot dot-red';
    label.innerHTML = '<span class="dot dot-red" id="dot-conn"></span> Desconectado';
  }
}

function updateAuthStatus(authorized) {
  const el = document.getElementById('auth-status');
  if (el) el.innerHTML = authorized
    ? '<span class="dot dot-green"></span> Autorizado'
    : '<span style="color:#555;font-size:.7rem">Sin autenticar</span>';
}

function appendLog(entry, scroll = true) {
  const box = document.getElementById('log-box');
  const d = document.createElement('div');
  const time = new Date(entry.time).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  d.className = 'log-' + (entry.level || 'info');
  d.textContent = \`[\${time}] \${entry.msg}\`;
  box.appendChild(d);
  if (box.children.length > 150) box.removeChild(box.firstChild);
  if (scroll) box.scrollTop = box.scrollHeight;
}

function showAlert(msg, type = 'warn') {
  const el = document.getElementById('alert-box');
  el.className = 'alert alert-' + type;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 8000);
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '') + ' show';
  setTimeout(() => t.className = 'toast' + (isError ? ' error' : ''), 3000);
}

// Scroll spy
window.addEventListener('scroll', () => {
  const ids = ['dashboard','signals','history','config','risk','logs'];
  let current = ids[0];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}, { passive: true });

document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => {
  document.querySelectorAll('nav a').forEach(x => x.classList.remove('active'));
  a.classList.add('active');
}));

window.addEventListener('resize', renderChart);
</script>
</body>
</html>`);
});

// ─── INIT ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`\x1b[32m[INFO]\x1b[0m Deriv Trading Bot corriendo en puerto ${PORT}`);
  console.log(`\x1b[32m[INFO]\x1b[0m Panel de control: http://localhost:${PORT}`);
  console.log(`\x1b[33m[INFO]\x1b[0m Modo paper activo por defecto — conecta tu API token para operar en real`);
});

// Conectar a Deriv al iniciar (para tener datos de mercado)
derivConnect();
