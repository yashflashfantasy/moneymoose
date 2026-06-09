const BASE = window.API_BASE || 'https://wormless-interseptal-melodee.ngrok-free.dev';

async function atFetch(path, opts = {}) {
  const res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  return res.json();
}

function fmt(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function levelClass(level) {
  return { success: 'text-success', danger: 'text-danger', warn: 'text-warning', info: 'text-muted' }[level] || 'text-muted';
}

function levelIcon(level) {
  return { success: '●', danger: '●', warn: '◐', info: '○' }[level] || '○';
}

async function loadStatus() {
  try {
    const { data } = await atFetch('/auto-trader/status');
    renderStatus(data);
  } catch (e) {
    document.getElementById('at-log').innerHTML = `<div class="text-danger p-3">Cannot reach backend: ${e.message}</div>`;
  }
}

function renderStatus(data) {
  const toggleBtn   = document.getElementById('at-toggle');
  const statusBadge = document.getElementById('at-status-badge');
  const targetInput = document.getElementById('at-target');
  const slInput     = document.getElementById('at-sl');
  const logEl       = document.getElementById('at-log');

  if (data.enabled) {
    toggleBtn.textContent   = 'Stop Auto-Trader';
    toggleBtn.className     = 'btn btn-danger';
    statusBadge.textContent = 'RUNNING';
    statusBadge.className   = 'badge bg-success ms-2 fs-6';
  } else {
    toggleBtn.textContent   = 'Start Auto-Trader';
    toggleBtn.className     = 'btn btn-success';
    statusBadge.textContent = 'STOPPED';
    statusBadge.className   = 'badge bg-secondary ms-2 fs-6';
  }

  if (!data.enabled) {
    targetInput.value = data.targetPct;
    slInput.value     = data.stopLossPct;
  }

  logEl.innerHTML = data.logs.length
    ? data.logs.map(l => `
      <div class="at-log-row d-flex gap-2 align-items-start py-1 border-bottom">
        <span class="text-muted" style="font-size:11px;min-width:70px;flex-shrink:0">${fmt(l.ts)}</span>
        <span class="${levelClass(l.level)}" style="min-width:10px">${levelIcon(l.level)}</span>
        <span style="font-size:12px;word-break:break-all" class="${levelClass(l.level)}">${l.message}</span>
      </div>`).join('')
    : '<div class="text-muted p-3 text-center" style="font-size:13px">No activity yet. Start the auto-trader to begin.</div>';
}

async function toggleTrader() {
  const btn = document.getElementById('at-toggle');
  btn.disabled = true;
  try {
    const isRunning = btn.textContent.trim().startsWith('Stop');
    if (isRunning) {
      const { data } = await atFetch('/auto-trader/stop', { method: 'POST' });
      renderStatus(data);
    } else {
      const targetPct   = parseFloat(document.getElementById('at-target').value) || 5;
      const stopLossPct = parseFloat(document.getElementById('at-sl').value)     || 3;
      const { data }    = await atFetch('/auto-trader/start', {
        method: 'POST',
        body: JSON.stringify({ targetPct, stopLossPct }),
      });
      renderStatus(data);
    }
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

function isMarketHours() {
  const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return day !== 0 && day !== 6 && mins >= 560 && mins < 910;
}

document.getElementById('at-toggle').addEventListener('click', toggleTrader);

loadStatus();
