const clientSelect = document.getElementById('clientOptions');
const ordersTbody  = document.getElementById('orders-tbody');

async function initOrdersPage() {
  const res     = await loadClients();
  const clients = res.data || [];

  const urlParams      = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('client_id');

  clientSelect.innerHTML = '<option value="">Select Client</option>';
  clients.forEach((client, i) => {
    const opt    = document.createElement('option');
    opt.value    = client.id;
    opt.textContent = client.client_name;
    if ((clientIdFromUrl && String(client.id) === clientIdFromUrl) || (!clientIdFromUrl && i === 0)) {
      opt.selected = true;
    }
    clientSelect.appendChild(opt);
  });

  clientSelect.addEventListener('change', loadOrders);
  loadOrders();
}

async function loadOrders() {
  const clientId = clientSelect.value;
  if (!clientId) {
    ordersTbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Please select a client to view orders</td></tr>`;
    return;
  }

  ordersTbody.innerHTML = `<tr><td colspan="7" class="text-center py-3"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>`;

  try {
    const res    = await getClientOrders(clientId);
    const orders = res?.data || [];

    if (orders.length === 0) {
      ordersTbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No orders found for today</td></tr>`;
      return;
    }

    ordersTbody.innerHTML = orders.map((o, i) => {
      const statusClass = o.status === 'complete'  ? 'bg-success' :
                          o.status === 'rejected'  ? 'bg-danger'  :
                          o.status === 'cancelled' ? 'bg-secondary' : 'bg-warning text-dark';
      const txClass = o.transaction_type === 'BUY' ? 'text-success fw-bold' : 'text-danger fw-bold';

      return `
        <tr>
          <td>${i + 1}</td>
          <td>${o.trading_symbol || '—'}</td>
          <td><span class="${txClass}">${o.transaction_type || '—'}</span></td>
          <td>${o.quantity || 0} @ ₹${Number(o.average_price || o.price || 0).toFixed(2)}</td>
          <td>${o.order_timestamp ? new Date(o.order_timestamp).toLocaleTimeString('en-IN') : '—'}</td>
          <td><span class="badge ${statusClass}">${(o.status || '—').toUpperCase()}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-secondary view-details"
              data-order='${JSON.stringify(o).replace(/'/g, "&apos;")}'>
              <i class="bi bi-eye"></i> View
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    ordersTbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load orders: ${err.message}</td></tr>`;
  }
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.view-details');
  if (!btn) return;
  const o = JSON.parse(btn.dataset.order);
  alert(`Order Details
═══════════════════════
Order ID:     ${o.order_id || 'N/A'}
Symbol:       ${o.trading_symbol || 'N/A'}
Type:         ${o.transaction_type || 'N/A'} — ${o.order_type || 'N/A'}
Qty:          ${o.quantity} (filled: ${o.filled_quantity})
Price:        ₹${o.price || 0} (avg: ₹${o.average_price || 0})
Product:      ${o.product || 'N/A'}
Status:       ${o.status || 'N/A'}
Message:      ${o.status_message || '—'}
Exchange:     ${o.exchange || 'N/A'}
Time:         ${o.order_timestamp || 'N/A'}`);
});

initOrdersPage();
