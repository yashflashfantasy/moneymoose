const PULSE_BASE = window.API_BASE || window.BACKEND_URL || (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://moneymoose-backend.onrender.com');

function isMarketHours() {
  const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return day !== 0 && day !== 6 && mins >= 560 && mins < 910;
}

function fmtIdx(n) {
  if (n == null) return '—';
  if (n >= 10000) return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(2);
}

function fmtLtp(n) {
  if (n == null) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function chgClass(v) { return v == null ? 'flat' : v > 0 ? 'up' : v < 0 ? 'dn' : 'flat'; }

function renderIdxTile(elId, label, d) {
  const el = document.getElementById(elId);
  if (!el) return;
  const valEl = el.querySelector('.cmd-idx-val');
  const chgEl = el.querySelector('.cmd-idx-chg');
  if (!d || d.ltp == null) { valEl.textContent = '—'; chgEl.textContent = '—'; chgEl.className = 'cmd-idx-chg flat'; return; }
  valEl.textContent = fmtIdx(d.ltp);
  const cls = chgClass(d.chgPct);
  const arrow = d.chgPct > 0 ? '▲' : d.chgPct < 0 ? '▼' : '';
  const sign  = d.chgPct >= 0 ? '+' : '';
  chgEl.textContent = d.chgPct != null ? `${arrow} ${sign}${d.chgPct.toFixed(2)}%` : '—';
  chgEl.className = `cmd-idx-chg ${cls}`;
}

function renderPulseBar(data) {
  const el = document.getElementById('market-pulse-bar');
  if (!el) return;

  // ── Index cards ──────────────────────────────────────────────
  function idxCard(label, d) {
    if (!d || d.ltp == null) return `
      <div class="mpb-idx">
        <div class="mpb-idx-name">${label}</div>
        <div class="mpb-idx-val">—</div>
        <div class="mpb-idx-chg flat">—</div>
      </div>`;
    const cls   = chgClass(d.chgPct);
    const arrow = d.chgPct > 0 ? '▲' : d.chgPct < 0 ? '▼' : '';
    const sign  = d.chgPct >= 0 ? '+' : '';
    const absChg = d.chg != null ? ` ${d.chg >= 0 ? '+' : ''}${Math.abs(d.chg).toFixed(2)}` : '';
    return `
      <div class="mpb-idx">
        <div class="mpb-idx-name">${label}</div>
        <div class="mpb-idx-val">${fmtIdx(d.ltp)}</div>
        <div class="mpb-idx-chg ${cls}">${arrow}${absChg} <span style="opacity:.75">(${sign}${d.chgPct?.toFixed(2) ?? '—'}%)</span></div>
      </div>`;
  }

  // ── Gainers / Losers rows ────────────────────────────────────
  function stockRows(stocks, dir) {
    if (!stocks || !stocks.length) return '<div class="mpb-empty-note">No data available</div>';
    return stocks.map(s => {
      const cls   = dir === 'g' ? 'up' : 'dn';
      const arrow = dir === 'g' ? '▲' : '▼';
      const sign  = dir === 'g' ? '+' : '';
      return `<div class="mpb-row">
        <span class="mpb-sym">${s.sym}</span>
        <span class="mpb-ltp">${fmtLtp(s.ltp)}</span>
        <span class="mpb-chg ${cls}">${arrow} ${sign}${s.chgPct?.toFixed(2) ?? '—'}%</span>
      </div>`;
    }).join('');
  }

  const ts = data.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' })
    : null;

  el.innerHTML = `
    ${idxCard('SENSEX',   data.sensex)}
    ${idxCard('NIFTY 50', data.nifty)}
    ${idxCard('INDIA VIX', data.vix)}
    <div class="mpb-panel">
      <div class="mpb-panel-hd g">▲ Top Gainers</div>
      ${stockRows(data.gainers, 'g')}
    </div>
    <div class="mpb-panel">
      <div class="mpb-panel-hd l">▼ Top Losers</div>
      ${stockRows(data.losers, 'l')}
    </div>
    ${ts ? `<div class="mpb-footer"><span class="mpb-updated">Last updated ${ts} IST</span></div>` : ''}`;

  el.classList.add('mpb-flash');
  setTimeout(() => el.classList.remove('mpb-flash'), 500);

  // Sync the clock bar index tiles
  renderIdxTile('cmdtile-sensex', 'SENSEX',   data.sensex);
  renderIdxTile('cmdtile-nifty',  'NIFTY 50', data.nifty);
  renderIdxTile('cmdtile-vix',    'INDIA VIX', data.vix);
}

async function loadPulse() {
  try {
    const res  = await fetch(`${PULSE_BASE}/market/pulse`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    const json = await res.json();
    if (json.status === 'success' && json.data) renderPulseBar(json.data);
  } catch (e) {
    console.warn('Market pulse unavailable:', e.message);
  }
}

loadPulse();
