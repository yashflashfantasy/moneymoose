// Inject buy-stream modal once on load
(function injectBuyModal() {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'buyStreamModal';
  modal.setAttribute('tabindex', '-1');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered" style="max-width:520px">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header border-0 pb-0">
          <div>
            <h6 class="modal-title fw-bold mb-0" id="buyModalTitle">Placing Orders</h6>
            <small class="text-muted" id="buyModalSubtitle"></small>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body py-2">
          <table class="table table-sm align-middle mb-0" style="font-size:13px">
            <thead style="font-size:11px;color:#888">
              <tr>
                <th class="border-0 ps-0">Client</th>
                <th class="border-0">Platform</th>
                <th class="border-0">Status</th>
                <th class="border-0">Details</th>
              </tr>
            </thead>
            <tbody id="buyStreamRows"></tbody>
          </table>
        </div>
        <div class="modal-footer border-0 pt-0 justify-content-between align-items-center">
          <small id="buyStreamSummary" class="text-muted"></small>
          <button type="button" class="btn btn-sm btn-light px-3" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
})();

// ── Duplicate buy prevention ──────────────────────────────────────────────────
const boughtToday = new Set();

async function markAlreadyBought() {
  try {
    const res = await getTodayBoughtInstruments();
    (res?.data || []).forEach(key => boughtToday.add(key));
    document.querySelectorAll('.wl-card[data-key]').forEach(row => {
      if (!boughtToday.has(row.dataset.key)) return;
      row.classList.add('card-bought');
      const buyBtn = row.querySelector('button[data-action="buy"]');
      if (buyBtn) {
        buyBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Bought';
        buyBtn.disabled = true;
      }
    });
  } catch {}
}

// markAlreadyBought is called directly from populateTable() after render.

// Listen on the whole main-body so both CE and PE tables are covered
document.querySelector('.main-body').addEventListener('click', async (e) => {
  if (!e.target.matches('button[data-action]')) return;

  const btn    = e.target;
  const action = btn.dataset.action;
  if (btn.disabled) return;

  const row           = btn.closest('.wl-card');
  const symbol        = row.dataset.symbol;
  const lotSize       = row.dataset.lot;
  const instrumentKey = row.dataset.key;
  const rawPrice      = row.querySelector('.latest-price')?.textContent.trim().replaceAll(',', '') || '';

  if (action === 'buy')    await handleBuy({ instrumentKey, lotSize, symbol, row, btn, currentPrice: rawPrice });
  if (action === 'exit')   await handleExit({ instrumentKey, symbol, row, btn });
  if (action === 'delete') await handleDelete({ instrumentKey, lotSize, symbol, row, btn });
});

function spinnerHtml() {
  return `<span class="spinner-border spinner-border-sm text-secondary" style="width:13px;height:13px;border-width:2px"></span>`;
}

function ensureBuyRow(clientId, clientName, platform) {
  let tr = document.getElementById(`buy_row_${clientId}`);
  if (tr) return tr;
  tr = document.createElement('tr');
  tr.id = `buy_row_${clientId}`;
  tr.innerHTML = `
    <td class="ps-0 fw-semibold">${clientName}</td>
    <td>${platformBadge(platform)}</td>
    <td id="buy_status_${clientId}">${spinnerHtml()}</td>
    <td id="buy_detail_${clientId}" class="text-muted" style="font-size:12px">—</td>`;
  document.getElementById('buyStreamRows').appendChild(tr);
  return tr;
}

function applyStreamResult(event, counters) {
  const statusEl = document.getElementById(`buy_status_${event.clientId}`);
  const detailEl = document.getElementById(`buy_detail_${event.clientId}`);
  if (statusEl && detailEl) {
    if (event.success) {
      counters.filled++;
      statusEl.innerHTML = '<span class="status-filled">✓ Filled</span>';
      detailEl.textContent = event.orderIds?.length ? `#${event.orderIds[0]}` : '';
    } else {
      counters.failed++;
      statusEl.innerHTML = '<span class="status-failed">✗ Failed</span>';
      detailEl.textContent = event.error || 'Unknown error';
      detailEl.className = 'status-failed';
    }
  }
}

function applyStreamDone(counters, summaryEl) {
  const { filled, failed } = counters;
  if (failed === 0) {
    summaryEl.innerHTML = `<span class="status-filled">✓ All ${filled} order${filled === 1 ? '' : 's'} filled</span>`;
  } else {
    summaryEl.innerHTML = `<span class="status-filled">${filled} filled</span>&nbsp;&nbsp;<span class="status-failed">${failed} failed</span>`;
  }
}

async function handleBuy({ instrumentKey, lotSize, symbol, row, btn, currentPrice }) {
  if (boughtToday.has(instrumentKey)) {
    showToast(`${symbol} already bought today`, 'info');
    return;
  }

  // Hard block — never place orders outside market hours
  const _ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const _day  = _ist.getDay();
  const _mins = _ist.getHours() * 60 + _ist.getMinutes();
  const _open = _day !== 0 && _day !== 6 && _mins >= 560 && _mins < 910;
  if (!_open) {
    showToast('Market closed — trading blocked outside 9:20 AM – 3:10 PM IST (Mon–Fri)', 'error');
    return;
  }

  const price = Number(currentPrice);
  if (!price || Number.isNaN(price) || price <= 0) {
    showToast('Live price not loaded yet — wait a moment and try again', 'error');
    return;
  }

  const tbody   = document.getElementById('buyStreamRows');
  const title   = document.getElementById('buyModalTitle');
  const subtitle = document.getElementById('buyModalSubtitle');
  const summary = document.getElementById('buyStreamSummary');

  title.textContent    = `Buying ${symbol}`;
  subtitle.textContent = `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })} · Lot ${lotSize}`;
  summary.textContent  = '';
  tbody.innerHTML      = '';

  const activeClients = (globalThis.linked_clients || []).filter(c => c.active);
  if (activeClients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3" style="font-size:12px">No active clients configured</td></tr>';
  } else {
    activeClients.forEach(c => ensureBuyRow(c.id, c.client_name, c.platform));
  }

  const bsModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('buyStreamModal'));
  bsModal.show();

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

  const counters = { filled: 0, failed: 0 };

  try {
    await placeBuyOrderStream(instrumentKey, Number(lotSize), price, (event) => {
      if (event.type === 'pending') ensureBuyRow(event.clientId, event.clientName, event.platform);
      if (event.type === 'result')  applyStreamResult(event, counters);
      if (event.type === 'done')    applyStreamDone(counters, summary);
    });

    const { filled, failed } = counters;
    if (filled > 0 && failed === 0) {
      boughtToday.add(instrumentKey);
      row.classList.add('card-bought');
      btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Bought';
      btn.disabled = true;
      showToast(`Bought ${symbol} — ${filled} client${filled === 1 ? '' : 's'}`, 'success');
    } else if (filled > 0) {
      btn.disabled = false;
      btn.innerHTML = 'Buy';
      showToast(`${filled} filled, ${failed} failed`, 'info');
    } else {
      btn.disabled = false;
      btn.innerHTML = 'Buy';
      showToast('All orders failed — check order status', 'error');
    }
  } catch (err) {
    console.error('Buy stream error:', err);
    btn.disabled = false;
    btn.innerHTML = 'Buy';
    summary.innerHTML = `<span style="color:#dc3545">Error: ${err.message}</span>`;
    showToast('Buy failed: ' + err.message, 'error');
  }
}
