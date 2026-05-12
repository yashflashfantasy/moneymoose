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
          <td>${o.order_timestamp ? new Date(o.order_timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
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

  const isBuy       = o.transaction_type === 'BUY';
  const statusColor = o.status === 'complete'  ? 'success' :
                      o.status === 'rejected'  ? 'danger'  :
                      o.status === 'cancelled' ? 'secondary' : 'warning';
  const txColor     = isBuy ? 'success' : 'danger';
  const txIcon      = isBuy ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
  const timestamp   = o.order_timestamp
    ? new Date(o.order_timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : '—';
  const avgPrice    = Number(o.average_price || 0).toFixed(2);
  const limitPrice  = Number(o.price || 0).toFixed(2);

  document.getElementById('orderDetailContent').innerHTML = `
    <div class="modal-header border-0 pb-0">
      <div>
        <h5 class="modal-title fw-bold mb-1">${o.trading_symbol || 'Order Details'}</h5>
        <span class="badge bg-${statusColor} text-uppercase">${o.status || '—'}</span>
      </div>
      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body pt-2">

      <div class="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 bg-${txColor} bg-opacity-10">
        <i class="fa-solid ${txIcon} fa-2x text-${txColor}"></i>
        <div>
          <div class="fw-bold fs-5 text-${txColor}">${o.transaction_type || '—'}</div>
          <div class="text-muted small">${o.order_type || '—'} order</div>
        </div>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-6">
          <div class="border rounded-3 p-3 text-center">
            <div class="text-muted small mb-1">Quantity</div>
            <div class="fw-bold fs-5">${o.quantity || 0}</div>
          </div>
        </div>
        <div class="col-6">
          <div class="border rounded-3 p-3 text-center">
            <div class="text-muted small mb-1">Filled</div>
            <div class="fw-bold fs-5">${o.filled_quantity || 0}</div>
          </div>
        </div>
        <div class="col-6">
          <div class="border rounded-3 p-3 text-center">
            <div class="text-muted small mb-1">Limit Price</div>
            <div class="fw-bold">₹${limitPrice}</div>
          </div>
        </div>
        <div class="col-6">
          <div class="border rounded-3 p-3 text-center">
            <div class="text-muted small mb-1">Avg Price</div>
            <div class="fw-bold text-${txColor}">₹${avgPrice}</div>
          </div>
        </div>
      </div>

      <table class="table table-sm table-borderless mb-0">
        <tr><td class="text-muted" style="width:40%">Exchange</td>   <td class="fw-semibold">${o.exchange || '—'}</td></tr>
        <tr><td class="text-muted">Product</td>    <td class="fw-semibold">${o.product || '—'}</td></tr>
        <tr><td class="text-muted">Validity</td>   <td class="fw-semibold">${o.validity || '—'}</td></tr>
        <tr><td class="text-muted">Order ID</td>   <td class="fw-semibold text-muted small">${o.order_id || '—'}</td></tr>
        <tr><td class="text-muted">Time</td>       <td class="fw-semibold">${timestamp}</td></tr>
        ${o.status_message ? `<tr><td class="text-muted">Message</td><td class="text-danger small">${o.status_message}</td></tr>` : ''}
      </table>
    </div>
    <div class="modal-footer border-0">
      <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    </div>
  `;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('orderDetailModal')).show();
});

initOrdersPage();
