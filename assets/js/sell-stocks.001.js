// Inject exit-stream modal once on load
(function injectExitModal() {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'exitStreamModal';
  modal.setAttribute('tabindex', '-1');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered" style="max-width:520px">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header border-0 pb-0">
          <div>
            <h6 class="modal-title fw-bold mb-0" id="exitModalTitle">Exiting Position</h6>
            <small class="text-muted" id="exitModalSubtitle"></small>
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
            <tbody id="exitStreamRows"></tbody>
          </table>
        </div>
        <div class="modal-footer border-0 pt-0 justify-content-between align-items-center">
          <small id="exitStreamSummary" class="text-muted"></small>
          <button type="button" class="btn btn-sm btn-light px-3" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
})();

function spinnerHtmlExit() {
  return `<span class="spinner-border spinner-border-sm text-secondary" style="width:13px;height:13px;border-width:2px"></span>`;
}

function ensureExitRow(clientId, clientName, platform) {
  let tr = document.getElementById(`exit_row_${clientId}`);
  if (tr) return tr;
  tr = document.createElement('tr');
  tr.id = `exit_row_${clientId}`;
  tr.innerHTML = `
    <td class="ps-0 fw-semibold">${clientName}</td>
    <td>${platformBadge(platform)}</td>
    <td id="exit_status_${clientId}">${spinnerHtmlExit()}</td>
    <td id="exit_detail_${clientId}" class="text-muted" style="font-size:12px">—</td>`;
  document.getElementById('exitStreamRows').appendChild(tr);
  return tr;
}

function applyExitResult(event, counters) {
  const statusEl = document.getElementById(`exit_status_${event.clientId}`);
  const detailEl = document.getElementById(`exit_detail_${event.clientId}`);
  if (!statusEl || !detailEl) return;
  if (event.success) {
    counters.closed++;
    const noPos = event.data === 'No open position' || event.data === 'No open positions';
    if (noPos) {
      statusEl.innerHTML = '<span class="status-no-pos">— No position</span>';
      detailEl.textContent = '';
    } else {
      statusEl.innerHTML = '<span class="status-filled">✓ Closed</span>';
      detailEl.textContent = event.orderIds?.length ? `#${event.orderIds[0]}` : '';
    }
  } else {
    counters.failed++;
    statusEl.innerHTML = '<span class="status-failed">✗ Failed</span>';
    detailEl.textContent = event.error || 'Unknown error';
    detailEl.className = 'status-failed';
  }
}

function applyExitDone(counters, summaryEl) {
  const { closed, failed } = counters;
  if (failed === 0) {
    summaryEl.innerHTML = `<span class="status-filled">✓ All ${closed} exit${closed === 1 ? '' : 's'} processed</span>`;
  } else {
    summaryEl.innerHTML = `<span class="status-filled">${closed} closed</span>&nbsp;&nbsp;<span class="status-failed">${failed} failed</span>`;
  }
}

async function handleExit({ instrumentKey, symbol, row, btn }) {
  // Hard block — never place orders outside market hours
  const _ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const _day  = _ist.getDay();
  const _mins = _ist.getHours() * 60 + _ist.getMinutes();
  const _open = _day !== 0 && _day !== 6 && _mins >= 560 && _mins < 910;
  if (!_open) {
    showToast('Market closed — exit blocked outside 9:20 AM – 3:10 PM IST (Mon–Fri)', 'error');
    return;
  }

  const tbody   = document.getElementById('exitStreamRows');
  const title   = document.getElementById('exitModalTitle');
  const subtitle = document.getElementById('exitModalSubtitle');
  const summary = document.getElementById('exitStreamSummary');

  title.textContent    = `Exiting ${symbol}`;
  subtitle.textContent = instrumentKey;
  summary.textContent  = '';
  tbody.innerHTML      = '';

  const activeClients = (globalThis.linked_clients || []).filter(c => c.active);
  if (activeClients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3" style="font-size:12px">No active clients configured</td></tr>';
  } else {
    activeClients.forEach(c => ensureExitRow(c.id, c.client_name, c.platform));
  }

  const bsModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('exitStreamModal'));
  bsModal.show();

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

  const counters = { closed: 0, failed: 0 };

  const currentPrice = parseFloat(row?.querySelector('.latest-price')?.textContent?.replaceAll(',', '')) || 0;

  try {
    await placeExitOrderStream(instrumentKey, undefined, (event) => {
      if (event.type === 'pending') ensureExitRow(event.clientId, event.clientName, event.platform);
      if (event.type === 'result')  applyExitResult(event, counters);
      if (event.type === 'done')    applyExitDone(counters, summary);
    }, currentPrice);

    const { closed, failed } = counters;
    if (failed === 0) {
      row.classList.remove('card-bought');
      btn.innerHTML = 'Exit';
      btn.disabled = false;
      const buyBtn = row.querySelector('button[data-action="buy"]');
      if (buyBtn) { buyBtn.disabled = false; }
      if (typeof boughtToday !== 'undefined') boughtToday.delete(instrumentKey);
      showToast(`Exited ${symbol}`, 'success');
    } else if (closed > 0) {
      btn.disabled = false;
      btn.innerHTML = 'Exit';
      showToast(`${closed} exited, ${failed} failed`, 'info');
    } else {
      btn.disabled = false;
      btn.innerHTML = 'Exit';
      showToast('All exits failed — check modal for details', 'error');
    }
  } catch (err) {
    console.error('Exit stream error:', err);
    btn.disabled = false;
    btn.innerHTML = 'Exit';
    summary.innerHTML = `<span style="color:#dc3545">Error: ${err.message}</span>`;
    showToast('Exit failed: ' + err.message, 'error');
  }
}
