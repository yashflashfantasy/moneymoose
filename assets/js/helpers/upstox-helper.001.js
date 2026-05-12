const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://wormless-interseptal-melodee.ngrok-free.dev';

// Single fetch wrapper — every API call in the app goes through here.
// Automatically adds the ngrok bypass header so CORS never breaks on production.
async function api(path, options = {}) {
  options.headers = { 'ngrok-skip-browser-warning': 'true', ...options.headers };
  const res = await fetch(`${BACKEND_URL}${path}`, options);
  return res.json();
}

// ── Market ────────────────────────────────────────────────────────────────────
async function fetchLatestPrice(instrumentKey) {
  return api(`/market/quote?instrument_key=${encodeURIComponent(instrumentKey)}`);
}
async function fetchOptionContracts(instrumentKey) {
  return api(`/market/option-contracts?instrument_key=${encodeURIComponent(instrumentKey)}`);
}

// ── Clients ───────────────────────────────────────────────────────────────────
async function loadClients() {
  return api('/clients');
}
async function getFundsAndMargin(clientId) {
  return api(`/clients/${clientId}/funds`);
}
async function getClientPnl(clientId) {
  return api(`/clients/${clientId}/pnl`);
}
async function refreshAllClients() {
  return api('/clients/refresh-all', { method: 'POST' });
}
async function refreshClient(clientId) {
  return api(`/clients/${clientId}/refresh`, { method: 'POST' });
}
async function getClientOrders(clientId) {
  return api(`/clients/${clientId}/orders`);
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function placeBuyOrder(instrumentKey, lotSize, currentPrice) {
  return api('/orders/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instrumentKey, lotSize, currentPrice }),
  });
}
async function placeExitOrder(instrumentKey) {
  return api('/orders/exit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instrumentKey }),
  });
}
async function fetchOrderDetails(orderId, clientId) {
  return api(`/orders/details?order_id=${orderId}&client_id=${clientId}`);
}

// ── Trading limit ─────────────────────────────────────────────────────────────
async function updateTradingLimit(clientId, pct) {
  return api(`/clients/${clientId}/trading-limit`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trading_limit_pct: pct }),
  });
}

// ── Real-time price feed (SSE via fetch — EventSource can't send custom headers) ──
function startPriceFeed(onPrice) {
  async function connect() {
    try {
      const res = await fetch(`${BACKEND_URL}/market/stream`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok || !res.body) throw new Error(`SSE ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep partial last line
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try { onPrice(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (err) {
      console.warn('[SSE] disconnected, reconnecting in 4s:', err.message);
    }
    setTimeout(connect, 4_000);
  }
  connect();
}

// ── Watchlist (replaces IndexedDB) ────────────────────────────────────────────
async function getWatchlist() {
  return api('/watchlist');
}
async function saveToWatchlist(item) {
  return api('/watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
}
async function deleteFromWatchlist(instrumentKey) {
  return api(`/watchlist/${encodeURIComponent(instrumentKey)}`, { method: 'DELETE' });
}
