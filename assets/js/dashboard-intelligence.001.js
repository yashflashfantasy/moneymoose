// ── IST / market helpers ───────────────────────────────────────────
function getMarketMode() {
  const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  if (day === 0 || day === 6)   return 'weekend';
  if (mins < 560)               return 'premarket';   // < 9:20 AM
  if (mins < 910)               return 'open';        // 9:20 – 15:10
  return 'postmarket';
}

function minsUntil(targetMins) {
  const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const now  = ist.getHours() * 60 + ist.getMinutes();
  const diff = Math.max(0, targetMins - now);
  const h = Math.floor(diff / 60), m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Client Health Score ────────────────────────────────────────────
function calcCHS(c) {
  let s = 0;
  if (c.token_valid) s += 40;
  if (c.active)      s += 30;
  if ((c.paper_margin ?? c.last_margin ?? 0) > 0) s += 20;
  if (c.has_token)   s += 10;
  return Math.min(100, s);
}

function chsColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  return '#dc2626';
}

function pfBadge(platform) {
  const map = { upstox: ['#5c67f2','UP'], dhan: ['#ff6b35','DH'], paper: ['#64748b','PA'] };
  const [bg, lbl] = map[platform] || ['#94a3b8','??'];
  return `<span style="background:${bg};color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px;letter-spacing:.04em;vertical-align:middle">${lbl}</span>`;
}

function fmtM(c) {
  const m = c.paper_margin ?? c.last_margin;
  if (m == null) return '—';
  if (m >= 100000) return '₹' + (m / 100000).toFixed(1) + 'L';
  return '₹' + Number(m).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// ── 1. ADAPTIVE CANVAS ─────────────────────────────────────────────
function renderAdaptiveCanvas(clients) {
  const el = document.getElementById('adaptive-canvas');
  if (!el) return;
  const mode = getMarketMode();

  if (mode === 'premarket') {
    const activeCount = clients.filter(c => c.active).length;
    const tokenOk     = clients.filter(c => c.token_valid).length;
    const totalMargin = clients.reduce((s, c) => s + (c.paper_margin ?? c.last_margin ?? 0), 0);
    const allTokensOk = tokenOk === clients.length;
    el.innerHTML = `
      <div class="ac-card ac-premarket">
        <div class="ac-card-inner">
          <div class="ac-left">
            <div class="ac-label">MORNING BRIEF</div>
            <div class="ac-title">Market opens in <span class="ac-hl">${minsUntil(560)}</span></div>
            <div class="ac-sub">Review your checklist before the session starts</div>
          </div>
          <div class="ac-stats">
            <div class="ac-stat ${allTokensOk ? 'ac-ok' : 'ac-warn'}">
              <div class="ac-stat-icon">${allTokensOk ? '✓' : '⚠'}</div>
              <div class="ac-stat-val">${tokenOk}/${clients.length}</div>
              <div class="ac-stat-lbl">Tokens valid</div>
            </div>
            <div class="ac-stat ${activeCount > 0 ? 'ac-ok' : 'ac-warn'}">
              <div class="ac-stat-icon">${activeCount > 0 ? '●' : '!'}</div>
              <div class="ac-stat-val">${activeCount}</div>
              <div class="ac-stat-lbl">Active clients</div>
            </div>
            <div class="ac-stat ac-info">
              <div class="ac-stat-icon">₹</div>
              <div class="ac-stat-val">${Number(totalMargin >= 100000 ? (totalMargin/100000).toFixed(1)+'L' : totalMargin.toLocaleString('en-IN'))}</div>
              <div class="ac-stat-lbl">Total margin</div>
            </div>
          </div>
        </div>
      </div>`;

  } else if (mode === 'open') {
    const activeCount = clients.filter(c => c.active).length;
    el.innerHTML = `
      <div class="ac-card ac-open">
        <div class="ac-card-inner">
          <div class="ac-left">
            <div class="ac-label">MARKET OPEN</div>
            <div class="ac-title">Live options watchlist</div>
            <div class="ac-sub"><span class="ac-hl-green">● LIVE</span>&nbsp; Closes in ${minsUntil(910)} &nbsp;·&nbsp; ${activeCount} active client${activeCount !== 1 ? 's' : ''}</div>
          </div>
          <div class="ac-stats">
            <div class="ac-stat ac-ok">
              <div class="ac-stat-icon">●</div>
              <div class="ac-stat-val">${activeCount}</div>
              <div class="ac-stat-lbl">Trading now</div>
            </div>
          </div>
        </div>
      </div>`;

  } else {
    const label = mode === 'postmarket' ? 'MARKET CLOSED' : 'WEEKEND';
    el.innerHTML = `
      <div class="ac-card ac-closed">
        <div class="ac-card-inner">
          <div class="ac-left">
            <div class="ac-label">${label}</div>
            <div class="ac-title">Trading session ended</div>
            <div class="ac-sub">Next session at 9:20 AM IST &nbsp;·&nbsp; <a href="report.html" class="ac-link">View today's report →</a></div>
          </div>
        </div>
      </div>`;
  }
}

// ── 2. CLIENT HEALTH STRIP ─────────────────────────────────────────
function renderClientHealthStrip(clients) {
  const el = document.getElementById('client-health-strip');
  if (!el || !clients.length) return;

  el.innerHTML = `
    <div class="chs-strip">
      ${clients.map(c => {
        const score = calcCHS(c);
        const col   = chsColor(score);
        return `
          <div class="chs-card ${c.active ? '' : 'chs-dim'}">
            <div class="chs-top">
              <span class="chs-name" title="${c.client_name}">${c.client_name.split(' ')[0]}</span>
              ${pfBadge(c.platform)}
              <span class="chs-dot" style="background:${c.token_valid ? '#16a34a' : '#ef4444'}" title="${c.token_valid ? 'Token valid' : 'Token expired'}"></span>
            </div>
            <div class="chs-score-line">
              <span class="chs-score-num" style="color:${col}">${score}</span>
              <div class="chs-bar-wrap"><div class="chs-bar-fill" style="width:${score}%;background:${col}"></div></div>
            </div>
            <div class="chs-margin-val">${fmtM(c)}</div>
            <div>${c.active
              ? '<span class="chs-badge-active">ACTIVE</span>'
              : '<span class="chs-badge-idle">INACTIVE</span>'}</div>
          </div>`;
      }).join('')}
    </div>`;
}

// ── 3. OPERATIONAL HEALTH FOOTER ───────────────────────────────────
let _lastSyncMs = Date.now();

function updateOpsFooter(clients) {
  const el = document.getElementById('ops-footer');
  if (!el) return;

  const live    = clients.filter(c => c.platform !== 'paper');
  const tokOk   = live.filter(c => c.token_valid).length;
  const active  = clients.filter(c => c.active).length;
  const secsAgo = Math.round((Date.now() - _lastSyncMs) / 1000);
  const sync    = secsAgo < 60 ? `${secsAgo}s ago` : `${Math.floor(secsAgo / 60)}m ago`;
  const tokAll  = tokOk === live.length;

  el.innerHTML = `
    <div class="ops-bar">
      <div class="ops-left">
        <span class="ops-item ops-ok"><span class="ops-dot ops-dot-green"></span>Server OK</span>
        <span class="ops-sep">·</span>
        <span class="ops-item ${tokAll ? 'ops-ok' : 'ops-warn'}">
          <span class="ops-dot ${tokAll ? 'ops-dot-green' : 'ops-dot-amber'}"></span>
          Tokens ${tokOk}/${live.length}
        </span>
        <span class="ops-sep">·</span>
        <span class="ops-item ops-neutral"><i class="bi bi-people-fill me-1"></i>${active} active</span>
        <span class="ops-sep">·</span>
        <span class="ops-item ops-neutral"><i class="bi bi-arrow-repeat me-1"></i>Synced ${sync}</span>
      </div>
      <div class="ops-right-cluster">
        <a href="auto-trader.html" class="ops-link"><i class="fa-solid fa-robot me-1"></i>Auto Trader</a>
        <span class="ops-sep">·</span>
        <span class="ops-version">MoneyMoose v1.0</span>
      </div>
    </div>`;
}

// ── 4. SKELETON teardown — populateTable already replaces tbody ─────
//    Just ensure initial skeletons disappear gracefully (no extra work needed;
//    populateTable() sets innerHTML on the tbodies which clears skeletons).

// ── Bootstrap ─────────────────────────────────────────────────────
const _waitIntel = setInterval(() => {
  const clients = globalThis.linked_clients;
  if (!Array.isArray(clients)) return;
  clearInterval(_waitIntel);

  _lastSyncMs = Date.now();

  renderAdaptiveCanvas(clients);
  renderClientHealthStrip(clients);
  updateOpsFooter(clients);

  // Canvas re-renders every minute (market mode changes)
  setInterval(() => renderAdaptiveCanvas(clients), 60_000);
  // Footer sync counter ticks every 5s
  setInterval(() => updateOpsFooter(clients), 5_000);
}, 300);
