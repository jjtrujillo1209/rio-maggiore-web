#!/usr/bin/env node
/**
 * Deriv Bot Simulator - Ejecuta trades simulados de demo
 */

// Simulated trades data
const tradeTemplates = [
  { market: 'R_50', side: 'BUY', stake: 25, result: 'WIN', pnl: 22.50 },
  { market: 'R_50', side: 'SELL', stake: 30, result: 'WIN', pnl: 27.00 },
  { market: 'R_50', side: 'BUY', stake: 20, result: 'LOSE', pnl: -20.00 },
  { market: 'R_50', side: 'SELL', stake: 35, result: 'WIN', pnl: 31.50 },
  { market: 'R_50', side: 'BUY', stake: 25, result: 'WIN', pnl: 22.50 },
  { market: 'R_50', side: 'SELL', stake: 40, result: 'WIN', pnl: 36.00 },
  { market: 'R_50', side: 'BUY', stake: 30, result: 'WIN', pnl: 27.00 },
  { market: 'R_50', side: 'SELL', stake: 25, result: 'LOSE', pnl: -25.00 },
];

let stats = {
  trades: 0,
  wins: 0,
  losses: 0,
  totalPnl: 0.0,
};

function formatTime() {
  const now = new Date();
  return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
}

function logTrade(trade) {
  const isWin = trade.result === 'WIN';
  const pnlStr = `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`;
  const resultColor = isWin ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';

  console.log(
    `${formatTime()} [TRADE] ${trade.market} | ${trade.side} $${trade.stake} | ` +
    `${resultColor}${trade.result}${resetColor} | P&L: ${pnlStr}`
  );

  stats.trades++;
  if (isWin) stats.wins++;
  else stats.losses++;
  stats.totalPnl += trade.pnl;
}

function logStatus() {
  const winRate = stats.trades > 0 ? ((stats.wins / stats.trades) * 100).toFixed(1) : 0;
  console.log(
    `\n${formatTime()} [STATUS] Trades: ${stats.trades} | Win: ${stats.wins} | Loss: ${stats.losses} | ` +
    `Win Rate: ${winRate}% | Total P&L: $${stats.totalPnl.toFixed(2)}\n`
  );
}

async function startSimulator() {
  console.log('\n╭─────────────────────────────────────────────────────╮');
  console.log('│  🤖 Deriv Bot Simulator — DEMO MODE EJECUTANDO       │');
  console.log('╰─────────────────────────────────────────────────────╯\n');

  console.log('Mode: PAPER TRADING (simulación)');
  console.log('Market: R_50 (Crash/Boom)');
  console.log('Generando trades demo cada 8-15 segundos...\n');

  let tradeIndex = 0;

  while (true) {
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 7000 + 8000)
    );

    const trade = {
      ...tradeTemplates[tradeIndex % tradeTemplates.length],
      stake: Math.floor(Math.random() * 40) + 15,
    };

    trade.pnl = trade.result === 'WIN'
      ? trade.stake * 0.9
      : -trade.stake;

    logTrade(trade);

    if (stats.trades % 5 === 0) {
      logStatus();
    }

    tradeIndex++;
  }
}

startSimulator().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n╭─────────────────────────────────────────────────────╮');
  console.log('│  ✅ Deriv Bot Simulator detenido                     │');
  console.log('╰─────────────────────────────────────────────────────╯\n');

  const winRate = stats.trades > 0 ? ((stats.wins / stats.trades) * 100).toFixed(1) : 0;
  console.log(`Final Stats:`);
  console.log(`  Trades: ${stats.trades}`);
  console.log(`  Wins: ${stats.wins} | Losses: ${stats.losses}`);
  console.log(`  Win Rate: ${winRate}%`);
  console.log(`  Total P&L: $${stats.totalPnl.toFixed(2)}\n`);

  process.exit(0);
});
