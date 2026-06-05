const BACKEND_URL = globalThis.location.hostname === 'localhost' || globalThis.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://moneymoose-backend.onrender.com';

// Patch window.fetch once so EVERY request to the backend automatically carries
// the session token. Also redirects to login if the server returns 401.
(function patchFetch() {
  const _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    init = init ? { ...init } : {};
    const url = typeof input === 'string' ? input : (input?.url ?? '');
    const isBackend = url.startsWith(BACKEND_URL) || (url.startsWith('/') && !url.startsWith('//'));
    if (isBackend) {
      const token = localStorage.getItem('mm_token');
      init.headers = {
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(init.headers || {}),
      };
    }
    return _fetch(input, init).then(function (res) {
      if (res.status === 401 && isBackend) {
        localStorage.removeItem('mm_token');
        localStorage.removeItem('isLoggedIn');
        window.location.replace('login.html');
      }
      return res;
    });
  };
})();

// Single fetch wrapper — every API call in the app goes through here.
// patchFetch above already injects the Bearer token and handles 401 redirects.
async function api(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, options);
  if (res.status === 401) throw new Error('Unauthorized');
  return res.json();
}

// ── Platform badge ────────────────────────────────────────────────────────────
function platformBadge(platform) {
  const p = (platform || '').toLowerCase();
  if (p === 'paper') {
    return `<span style="display:inline-flex;align-items:center;gap:4px;background:#6c757d;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:.4px;white-space:nowrap">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2h6v6H2z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 5h2M5 4v2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>
      TEST</span>`;
  }
  if (p === 'dhan') {
    return `<span style="display:inline-flex;align-items:center;gap:4px;background:#16a34a;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:.4px;white-space:nowrap">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#fff" stroke-width="1.4"/><path d="M3 5h4M5 3v4" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>
      DHAN</span>`;
  }
  if (p === 'kite') {
    return `<span style="display:inline-flex;align-items:center;gap:4px;background:#387ed1;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:.4px;white-space:nowrap">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8 L5 2 L8 8" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><line x1="3.2" y1="6" x2="6.8" y2="6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>
      KITE</span>`;
  }
  return `<span style="display:inline-flex;align-items:center;gap:4px;background:#6741d9;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:.4px;white-space:nowrap">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1,7 3.5,4 5.5,6 9,2" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    UPSTOX</span>`;
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
async function refreshClientToken(clientId) {
  return api(`/clients/${clientId}/token-refresh`, { method: 'POST' });
}
async function getClientOrders(clientId) {
  return api(`/clients/${clientId}/orders`);
}
async function getClientOrderHistory(clientId, date) {
  return api(`/clients/${clientId}/orders/history?date=${date}`);
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function placeBuyOrder(instrumentKey, lotSize, currentPrice) {
  return api('/orders/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instrumentKey, lotSize, currentPrice }),
  });
}

async function placeBuyOrderStream(instrumentKey, lotSize, currentPrice, onEvent) {
  const response = await fetch(`${BACKEND_URL}/orders/buy-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    body: JSON.stringify({ instrumentKey, lotSize, currentPrice }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line));
    }
  }
}
async function placeExitOrder(instrumentKey) {
  return api('/orders/exit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instrumentKey }),
  });
}

async function placeExitOrderStream(instrumentKey, kiteKey, onEvent, currentPrice) {
  const response = await fetch(`${BACKEND_URL}/orders/exit-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    body: JSON.stringify({ instrumentKey, kiteKey, currentPrice }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line));
    }
  }
}

function getMarketStatus() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  if (day === 0 || day === 6) return { open: false, label: 'Weekend' };
  if (mins < 555)             return { open: false, label: 'Pre-market' };
  if (mins >= 930)            return { open: false, label: 'Market Closed' };
  return { open: true, label: 'Market Open', minutesLeft: 930 - mins };
}

async function getTodayBoughtInstruments() {
  return api('/orders/today-instruments');
}
async function fetchOrderDetails(orderId, clientId) {
  return api(`/orders/details?order_id=${orderId}&client_id=${clientId}`);
}

// ── Active toggle ─────────────────────────────────────────────────────────────
async function setClientActive(clientId, active) {
  return api(`/clients/${clientId}/active`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
}

// ── Trading limit ─────────────────────────────────────────────────────────────
async function updateTradingLimit(clientId, pct) {
  return api(`/clients/${clientId}/trading-limit`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trading_limit_pct: pct }),
  });
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
