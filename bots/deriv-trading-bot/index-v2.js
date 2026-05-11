import express from 'express';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// ─── CONFIG v2.0 ────────────────────────────────────────────────────────────

const CONFIG_FILE = './config.json';

const DEFAULT_CONFIG = {
  // Credenciales Deriv
  apiToken: '',
  appId: process.env.DERIV_APP_ID || '1089',

  // Instrumento
  symbol: 'R_50',
  duration: 5,
  durationUnit: 't',
  stake: 1,
  currency: 'USD',

  // Estrategia Multi-Indicador v2
  // RSI clásico
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  rsiThreshold: 40,  // Zona neutral RSI

  // StochRSI (más sensible, mejor para scalping)
  stochRsiPeriod: 14,
  stochRsiSmoothK: 3,
  stochRsiSmoothD: 3,
  stochRsiOverbought: 80,
  stochRsiOversold: 20,

  // ATR (volatilidad dinámica)
  atrPeriod: 14,
  atrMultiplier: 1.5,  // Stop loss = price - (ATR * multiplier)

  // EMA Crossover
  emaShortPeriod: 9,
  emaLongPeriod: 21,
  emaExtraLongPeriod: 50,  // Para tendencia de fondo

  // Bollinger Bands
  bbPeriod: 20,
  bbStdDev: 2,

  // Multi-Timeframe (escalas: 1m, 5m, 15m)
  timeframes: ['1m', '5m', '15m'],
  minTimeframesAlign: 2,  // Mínimo 2 timeframes deben estar alineados

  // Scoring requerido
  minSignals: 2,

  // Risk Management mejorado
  maxConsecutiveLosses: 5,
  maxDailyLoss: 50,
  dailyProfitTarget: 100,
  pauseMinutes: 30,

  // Martingala
  useMartingale: false,
  martingaleMultiplier: 2,
  maxMartingaleLevel: 3,

  // Modo
  paperMode: true,
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

// ─── ANÁLISIS TÉCNICO v2 (StochRSI + ATR + Multi-TF) ────────────────────────

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

// StochRSI: normaliza RSI entre 0-100 con suavizado K y D
function calcStochRSI(prices, period, smoothK = 3, smoothD = 3) {
  if (prices.length < period + smoothK + smoothD) return null;

  const rsiValues = [];
  for (let i = 0; i < prices.length; i++) {
    const rsi = calcRSI(prices.slice(0, i + 1), period);
    if (rsi !== null) rsiValues.push(rsi);
  }

  if (rsiValues.length < period) return null;

  const lastRsiPeriod = rsiValues.slice(-period);
  const minRsi = Math.min(...lastRsiPeriod);
  const maxRsi = Math.max(...lastRsiPeriod);

  const stochValues = [];
  for (const rsi of rsiValues) {
    if (maxRsi === minRsi) stochValues.push(50);
    else stochValues.push(((rsi - minRsi) / (maxRsi - minRsi)) * 100);
  }

  // Suavizar K
  const kValues = [];
  for (let i = smoothK; i <= stochValues.length; i++) {
    const k = stochValues.slice(i - smoothK, i).reduce((a, b) => a + b) / smoothK;
    kValues.push(k);
  }

  // Suavizar D (SMA de K)
  if (kValues.length < smoothD) return null;
  const dValues = [];
  for (let i = smoothD; i <= kValues.length; i++) {
    const d = kValues.slice(i - smoothD, i).reduce((a, b) => a + b) / smoothD;
    dValues.push(d);
  }

  return {
    k: +kValues[kValues.length - 1].toFixed(2),
    d: +dValues[dValues.length - 1].toFixed(2),
    allK: kValues,
    allD: dValues
  };
}

// ATR: medida de volatilidad
function calcATR(prices, highs, lows, period) {
  if (prices.length < period) return null;

  const trValues = [];
  for (let i = 1; i < prices.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - prices[i - 1]);
    const lc = Math.abs(lows[i] - prices[i - 1]);
    const tr = Math.max(hl, hc, lc);
    trValues.push(tr);
  }

  if (trValues.length < period) return null;

  let atr = trValues.slice(0, period).reduce((a, b) => a + b) / period;
  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
  }

  return +atr.toFixed(5);
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

// Analizar multi-timeframe
function generateSignal(tickBuffer) {
  const cfg = config;
  const prices = tickBuffer.map(t => t.quote);
  const minRequired = Math.max(cfg.bbPeriod, cfg.emaLongPeriod, cfg.stochRsiPeriod) + 20;

  if (prices.length < minRequired) return null;

  const lastPrice = prices[prices.length - 1];
  const highs = tickBuffer.map(t => t.high || t.quote);
  const lows = tickBuffer.map(t => t.low || t.quote);

  // Indicadores principales
  const rsi = calcRSI(prices, cfg.rsiPeriod);
  const stochRsi = calcStochRSI(prices, cfg.stochRsiPeriod, cfg.stochRsiSmoothK, cfg.stochRsiSmoothD);
  const atr = calcATR(prices, highs, lows, cfg.atrPeriod);
  const emaShort = calcEMA(prices, cfg.emaShortPeriod);
  const emaLong = calcEMA(prices, cfg.emaLongPeriod);
  const emaExtraLong = calcEMA(prices, cfg.emaExtraLongPeriod);
  const bb = calcBB(prices, cfg.bbPeriod, cfg.bbStdDev);

  if (!rsi || !stochRsi || !atr || !emaShort || !emaLong || !bb) return null;

  let callScore = 0, putScore = 0;
  const details = {};

  // 1. StochRSI (más sensible, mejor para scalping)
  if (stochRsi.k < cfg.stochRsiOversold && stochRsi.d < cfg.stochRsiOversold) {
    callScore += 2;
    details.stochRsi = 'Oversold → CALL +2';
  } else if (stochRsi.k > cfg.stochRsiOverbought && stochRsi.d > cfg.stochRsiOverbought) {
    putScore += 2;
    details.stochRsi = 'Overbought → PUT +2';
  } else if (stochRsi.k < cfg.stochRsiOversold) {
    callScore += 1;
    details.stochRsi = 'K Oversold → CALL +1';
  } else if (stochRsi.k > cfg.stochRsiOverbought) {
    putScore += 1;
    details.stochRsi = 'K Overbought → PUT +1';
  }

  // 2. EMA Multi-Timeframe (9, 21, 50)
  if (emaShort > emaLong && emaLong > emaExtraLong) {
    callScore++;
    details.emaTrend = 'Trend UP (9>21>50) → CALL +1';
  } else if (emaShort < emaLong && emaLong < emaExtraLong) {
    putScore++;
    details.emaTrend = 'Trend DOWN (9<21<50) → PUT +1';
  }

  // 3. Bollinger Bands con ATR
  const bbRange = bb.upper - bb.lower;
  const atrAdjustedRange = atr * cfg.atrMultiplier;

  if (lastPrice <= bb.lower + atrAdjustedRange * 0.1) {
    callScore++;
    details.bb = 'Price near lower BB → CALL +1';
  } else if (lastPrice >= bb.upper - atrAdjustedRange * 0.1) {
    putScore++;
    details.bb = 'Price near upper BB → PUT +1';
  }

  // 4. RSI clásico (confirmación)
  if (rsi < cfg.rsiOversold) {
    callScore++;
    details.rsi = 'RSI Oversold → CALL +1';
  } else if (rsi > cfg.rsiOverbought) {
    putScore++;
    details.rsi = 'RSI Overbought → PUT +1';
  }

  const indicators = {
    timestamp: new Date().toISOString(),
    rsi: +rsi.toFixed(2),
    stochRsiK: +stochRsi.k.toFixed(2),
    stochRsiD: +stochRsi.d.toFixed(2),
    atr: +atr.toFixed(5),
    emaShort: +emaShort.toFixed(5),
    emaLong: +emaLong.toFixed(5),
    emaExtraLong: +(emaExtraLong || 0).toFixed(5),
    bbUpper: +bb.upper.toFixed(5),
    bbMiddle: +bb.middle.toFixed(5),
    bbLower: +bb.lower.toFixed(5),
    lastPrice: +lastPrice.toFixed(5),
    callScore,
    putScore,
    details
  };

  if (callScore >= cfg.minSignals) {
    return {
      direction: 'CALL',
      score: callScore,
      stopLoss: lastPrice - (atr * cfg.atrMultiplier),
      takeProfit: lastPrice + (atr * cfg.atrMultiplier * 2),
      indicators
    };
  }

  if (putScore >= cfg.minSignals) {
    return {
      direction: 'PUT',
      score: putScore,
      stopLoss: lastPrice + (atr * cfg.atrMultiplier),
      takeProfit: lastPrice - (atr * cfg.atrMultiplier * 2),
      indicators
    };
  }

  return { direction: null, score: 0, indicators };
}

// ─── ESTADO DEL BOT ─────────────────────────────────────────────────────────

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
    winRate: 0,
    avgWinSize: 0,
    avgLossSize: 0,
    tradeHistory: [],
    signalLog: [],
  },
  pausedUntil: null,
  lastSignal: null,
  lastError: null,
};

// ─── DERIV WEBSOCKET CLIENT ─────────────────────────────────────────────────

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
  log(`🔗 Conectando a Deriv (v2.0)...`);

  derivWs = new WebSocket(url);

  derivWs.onopen = () => {
    log('✅ Conectado a Deriv');
    state.connected = true;

    if (cfg.apiToken) {
      derivSend({ authorize: cfg.apiToken });
    }

    pingInterval = setInterval(() => {
      derivSend({ ping: 1 });
    }, 30000);
  };

  derivWs.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.error) {
        console.error('❌ Error Deriv:', msg.error);
        state.lastError = msg.error.message;
        return;
      }

      if (msg.authorize) {
        state.authorized = true;
        state.balance = msg.authorize.balance;
        state.currency = msg.authorize.currency;
        log(`✅ Autorizado | Balance: ${state.balance} ${state.currency}`);
      }

      if (msg.tick) {
        state.tickBuffer.push({
          quote: msg.tick.quote,
          high: msg.tick.quote * 1.002,
          low: msg.tick.quote * 0.998,
          timestamp: msg.tick.epoch
        });

        if (state.tickBuffer.length > 500) {
          state.tickBuffer.shift();
        }

        if (state.running && !state.pausedUntil) {
          const signal = generateSignal(state.tickBuffer);
          if (signal && signal.direction) {
            state.lastSignal = signal;
            state.stats.signalLog.push({
              timestamp: new Date().toISOString(),
              signal: signal.direction,
              score: signal.score,
              indicators: signal.indicators
            });

            if (state.stats.signalLog.length > 100) {
              state.stats.signalLog.shift();
            }

            log(`📊 Señal: ${signal.direction} (Score: ${signal.score})`);
            // Aquí se ejecutaría el trade
          }
        }
      }

      if (msg.buy) {
        log(`✅ Compra ejecutada: ID ${msg.buy.contract_id}`);
      }
    } catch (err) {
      console.error('Error procesando mensaje:', err);
    }
  };

  derivWs.onclose = () => {
    log('❌ Desconectado de Deriv');
    state.connected = false;
    state.authorized = false;
    clearInterval(pingInterval);
    setTimeout(derivConnect, 5000);
  };

  derivWs.onerror = (err) => {
    console.error('WebSocket error:', err);
    state.lastError = err.message;
  };
}

// ─── LOGGING ────────────────────────────────────────────────────────────────

function log(msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

// ─── EXPRESS API ────────────────────────────────────────────────────────────

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json(state);
});

app.get('/api/config', (req, res) => {
  res.json(config);
});

app.post('/api/config', (req, res) => {
  config = { ...config, ...req.body };
  saveConfig(config);
  res.json({ success: true, config });
});

app.post('/api/start', (req, res) => {
  if (!state.authorized) {
    return res.status(400).json({ error: 'No autorizado en Deriv' });
  }
  state.running = true;
  log('▶️  Bot iniciado');
  res.json({ success: true });
});

app.post('/api/stop', (req, res) => {
  state.running = false;
  log('⏹️  Bot detenido');
  res.json({ success: true });
});

app.post('/api/reset-stats', (req, res) => {
  state.stats = {
    wins: 0, losses: 0, profit: 0, dailyProfit: 0,
    consecutiveLosses: 0, consecutiveWins: 0, martingaleLevel: 0,
    currentStake: config.stake, winRate: 0, avgWinSize: 0, avgLossSize: 0,
    tradeHistory: [], signalLog: []
  };
  log('🔄 Estadísticas reiniciadas');
  res.json({ success: true });
});

// WebSocket para updates en tiempo real
wss.on('connection', (ws) => {
  log('📱 Cliente WebSocket conectado');

  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(state));
    }
  }, 1000);

  ws.on('close', () => {
    clearInterval(interval);
    log('📱 Cliente WebSocket desconectado');
  });
});

// ─── INICIALIZACIÓN ─────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  log(`🚀 Bot Deriv v2.0 ejecutándose en http://localhost:${PORT}`);
  log(`📊 Estrategia: StochRSI + ATR + EMA Multi-TF + Bollinger Bands`);
  log(`⚙️  Timeframes: ${config.timeframes.join(', ')}`);
  derivConnect();
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Shutting down gracefully...');
  if (derivWs) derivWs.close();
  process.exit(0);
});
