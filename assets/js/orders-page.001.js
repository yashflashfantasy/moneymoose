const clientSelect = document.getElementById('clientOptions');
const ordersTbody  = document.getElementById('orders-tbody');

function parseSymbol(sym) {
  if (!sym) return { underlying: '—', strike: '—', optionType: '—' };
  const u = sym.toUpperCase();

  // Spaced BSE format: "SENSEX 74000 PE 14 MAY 26"
  const spaced = u.match(/^([A-Z0-9]+)\s+(\d+)\s+(CE|PE)\b/);
  if (spaced) return { underlying: spaced[1], strike: Number(spaced[2]).toLocaleString('en-IN'), optionType: spaced[3] };

  // NSE with month name: "NIFTY25MAY25000CE", "BANKNIFTY25MAY50000PE"
  const nseMonth = u.match(/^([A-Z]+)\d{2}[A-Z]{3}(\d+)(CE|PE)$/);
  if (nseMonth) return { underlying: nseMonth[1], strike: Number(nseMonth[2]).toLocaleString('en-IN'), optionType: nseMonth[3] };

  // BSE/NSE compact: "SENSEX2651474000PE" — format is UNDERLYING + YYMDD or YYMMDD + STRIKE + CE/PE
  // Date is 5 digits (month 1–9) or 6 digits (month 10–12); detect by range-checking the strike
  const compact = u.match(/^([A-Z]+)(\d+)(CE|PE)$/);
  if (compact) {
    const digits = compact[2];
    for (const skip of [5, 6]) {
      if (digits.length > skip) {
        const candidate = Number(digits.slice(skip));
        if (candidate >= 1000 && candidate <= 300000) {
          return { underlying: compact[1], strike: candidate.toLocaleString('en-IN'), optionType: compact[3] };
        }
      }
    }
    return { underlying: compact[1], strike: '—', optionType: compact[3] };
  }

  return { underlying: sym, strike: '—', optionType: '—' };
}

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
    ordersTbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">Please select a client to view orders</td></tr>`;
    return;
  }

  ordersTbody.innerHTML = `<tr><td colspan="9" class="text-center py-3"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>`;

  try {
    const res    = await getClientOrders(clientId);
    const orders = res?.data || [];

    if (orders.length === 0) {
      ordersTbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">No orders found for today</td></tr>`;
      return;
    }

    ordersTbody.innerHTML = orders.map((o, i) => {
      const { underlying, strike, optionType } = parseSymbol(o.trading_symbol);
      const statusClass = o.status === 'complete'  ? 'bg-success' :
                          o.status === 'rejected'  ? 'bg-danger'  :
                          o.status === 'cancelled' ? 'bg-secondary' : 'bg-warning text-dark';
      const isBuyRow  = o.transaction_type === 'BUY';
      const txStyle   = isBuyRow ? 'color:#27ae60' : 'color:#e67e22';
      const txLabel   = isBuyRow ? 'BUY' : 'EXIT';
      const cpColor   = optionType === 'CE' ? '#27ae60' : '#e67e22';
      const cpLabel   = optionType === 'CE' ? 'CALL' : optionType === 'PE' ? 'PUT' : optionType;

      return `
        <tr>
          <td>${i + 1}</td>
          <td class="fw-semibold">${underlying}</td>
          <td class="fw-semibold">₹${strike}</td>
          <td><span class="badge" style="background:${cpColor}">${cpLabel}</span></td>
          <td><span class="fw-bold" style="${txStyle}">${txLabel}</span></td>
          <td>${o.quantity || 0} @ ₹${Number(o.average_price || o.price || 0).toFixed(2)}</td>
          <td class="text-muted small">${o.order_timestamp ? new Date(o.order_timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
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
    ordersTbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Failed to load orders: ${err.message}</td></tr>`;
  }
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.view-details');
  if (!btn) return;
  const o = JSON.parse(btn.dataset.order);

  const { underlying, strike, optionType } = parseSymbol(o.trading_symbol);
  const cpLabel2    = optionType === 'CE' ? 'CALL' : optionType === 'PE' ? 'PUT' : optionType;
  const cpHex       = optionType === 'CE' ? '#27ae60' : '#e67e22';
  const isBuy       = o.transaction_type === 'BUY';
  const txLabel     = isBuy ? 'BUY' : 'EXIT';
  const txHex       = isBuy ? '#27ae60' : '#e67e22';
  const txIcon      = isBuy ? 'fa-arrow-trend-up' : 'fa-right-from-bracket';
  const statusColor = o.status === 'complete'  ? 'success' :
                      o.status === 'rejected'  ? 'danger'  :
                      o.status === 'cancelled' ? 'secondary' : 'warning';
  const timestamp   = o.order_timestamp
    ? new Date(o.order_timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : '—';
  const avgPrice  = Number(o.average_price || 0).toFixed(2);
  const limitPrice = Number(o.price || 0).toFixed(2);

  document.getElementById('orderDetailContent').innerHTML = `
    <div class="modal-header border-0 pb-0">
      <div>
        <h5 class="modal-title fw-bold mb-1">
          ${underlying}
          <span class="fs-6 fw-normal text-muted">₹${strike}</span>
          <span class="badge ms-1" style="background:${cpHex};font-size:0.7rem">${cpLabel2}</span>
        </h5>
        <span class="badge bg-${statusColor} text-uppercase">${o.status || '—'}</span>
      </div>
      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body pt-2">

      <div class="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style="background:${txHex}18">
        <i class="fa-solid ${txIcon} fa-2x" style="color:${txHex}"></i>
        <div>
          <div class="fw-bold fs-5" style="color:${txHex}">${txLabel}</div>
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
            <div class="fw-bold" style="color:${txHex}">₹${avgPrice}</div>
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
