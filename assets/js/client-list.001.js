const tbodyNew = document.querySelector('table tbody');

async function loadClientList() {
  const res = await loadClients();
  renderClients(res.data || []);
}

function renderClients(clients) {
  tbodyNew.innerHTML = clients.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><a href="orders.html?client_id=${c.id}">${c.client_name}</a></td>
      <td>${c.platform}</td>
      <td id="pnl_${c.id}">—</td>
      <td id="margin_${c.id}">—</td>
      <td>
        <span class="badge ${c.active ? 'bg-success' : 'bg-secondary'}">${c.active ? 'Active' : 'Inactive'}</span>
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

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.refresh-client');
  if (!btn) return;
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
});

loadClientList();
