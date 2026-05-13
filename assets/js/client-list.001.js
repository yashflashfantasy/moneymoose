const tbodyNew = document.querySelector('table tbody');

async function loadClientList() {
  const res = await loadClients();
  renderClients(res.data || []);
}

function renderClients(clients) {
  tbodyNew.innerHTML = clients.map((c, i) => `
    <tr id="row_${c.id}" class="${c.active ? '' : 'opacity-50'}">
      <td>${i + 1}</td>
      <td><a href="orders.html?client_id=${c.id}">${c.client_name}</a></td>
      <td>${platformBadge(c.platform)}</td>
      <td id="pnl_${c.id}">—</td>
      <td id="margin_${c.id}">${c.last_margin == null ? '—' : `₹${Number(c.last_margin).toLocaleString('en-IN')}`}</td>
      <td>
        <div class="input-group input-group-sm" style="width:110px;">
          <input type="number" class="form-control limit-input" min="1" max="100"
            data-id="${c.id}" value="${c.trading_limit_pct ?? 90}" title="% of margin to use">
          <span class="input-group-text">%</span>
        </div>
      </td>
      <td>
        <button class="btn btn-sm toggle-active ${c.active ? 'btn-success' : 'btn-outline-secondary'}"
          data-id="${c.id}" data-active="${c.active}">
          ${c.active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td>
        <button class="btn btn-sm btn-primary refresh-client" data-id="${c.id}">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </td>
    </tr>
  `).join('');
}

async function refreshAll() {
  showToast('Refreshing all clients...', 'info');
  const res = await refreshAllClients();
  (res.data || []).forEach(c => {
    const el = document.getElementById(`margin_${c.id}`);
    if (el) el.textContent = c.available_margin != null ? `₹${Number(c.available_margin).toLocaleString('en-IN')}` : '—';
  });
  showToast('All clients refreshed', 'success');
}

async function handleToggleActive(btn) {
  const id        = btn.dataset.id;
  const newActive = btn.dataset.active !== 'true';
  btn.disabled = true;
  try {
    await setClientActive(id, newActive);
    btn.dataset.active = String(newActive);
    btn.textContent    = newActive ? 'Active' : 'Inactive';
    btn.className      = `btn btn-sm toggle-active ${newActive ? 'btn-success' : 'btn-outline-secondary'}`;
    const row = document.getElementById(`row_${id}`);
    if (row) row.classList.toggle('opacity-50', !newActive);
    showToast(`Client marked ${newActive ? 'active' : 'inactive'}`, newActive ? 'success' : 'info');
  } catch (err) {
    showToast('Failed to update status: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleRefreshClient(btn) {
  const id = btn.dataset.id;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
  try {
    const [fundsRes, pnlRes] = await Promise.all([
      getFundsAndMargin(id),
      getClientPnl(id),
    ]);
    const margin = fundsRes?.data?.equity?.available_margin ?? 0;
    const pnl    = (pnlRes?.data || []).reduce((sum, t) => sum + ((t.sell_amount || 0) - (t.buy_amount || 0)), 0);
    const marginEl = document.getElementById(`margin_${id}`);
    const pnlEl    = document.getElementById(`pnl_${id}`);
    if (marginEl) marginEl.textContent = `₹${Number(margin).toLocaleString('en-IN')}`;
    if (pnlEl)    pnlEl.textContent    = `₹${pnl.toFixed(2)}`;
    showToast('Client refreshed', 'success');
  } catch (err) {
    showToast('Refresh failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
  }
}

document.addEventListener('click', async (e) => {
  const toggleBtn = e.target.closest('.toggle-active');
  if (toggleBtn) { await handleToggleActive(toggleBtn); return; }

  const refreshBtn = e.target.closest('.refresh-client');
  if (refreshBtn) await handleRefreshClient(refreshBtn);
});

// Save trading limit on blur
document.addEventListener('change', async (e) => {
  const input = e.target.closest('.limit-input');
  if (!input) return;
  const id  = input.dataset.id;
  const pct = Number(input.value);
  if (!pct || pct < 1 || pct > 100) { input.classList.add('is-invalid'); return; }
  input.classList.remove('is-invalid');
  try {
    await updateTradingLimit(id, pct);
    showToast(`Margin limit updated to ${pct}%`, 'success');
  } catch (err) {
    showToast('Failed to save limit: ' + err.message, 'error');
  }
});

loadClientList();
