const clientSelect    = document.getElementById('clientOptions');
const ordersTbody     = document.getElementById('orders-tbody');
const platformBadgeEl = document.getElementById('platform-badge-orders');
const dateInput       = document.getElementById('orders-date');
const clientPlatforms = {};

// Default to today
dateInput.value = new Date().toLocaleDateString('sv'); // 'sv' gives YYYY-MM-DD

function parseSymbol(sym) {
  if (!sym) return { underlying: '—', strike: '—', optionType: '—' };
  const u = sym.toUpperCase();

  // Dhan dash format: "SENSEX-May2026-74500-PE", "NIFTY-May2026-23350-CE"
  const dhanDash = u.match(/^([A-Z0-9]+)-[A-Z]+\d{4}-(\d+)-(CE|PE)$/);
  if (dhanDash) return { underlying: dhanDash[1], strike: Number(dhanDash[2]).toLocaleString('en-IN'), optionType: dhanDash[3] };

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
    clientPlatforms[client.id] = client.platform;
    const opt       = document.createElement('option');
    opt.value       = client.id;
    opt.textContent = client.client_name;
    if ((clientIdFromUrl && String(client.id) === clientIdFromUrl) || (!clientIdFromUrl && i === 0)) {
      opt.selected = true;
    }
    clientSelect.appendChild(opt);
  });

  function updatePlatformBadge() {
    platformBadgeEl.innerHTML = clientSelect.value
      ? platformBadge(clientPlatforms[clientSelect.value])
      : '';
  }

  clientSelect.addEventListener('change', () => { updatePlatformBadge(); loadOrders(); });
  dateInput.addEventListener('change', loadOrders);
  updatePlatformBadge();
  loadOrders();
}

const summaryEl    = document.getElementById('orders-summary');
const PAGE_SIZE    = 10;
let rawOrders      = []; // full list from API
let allOrders      = []; // after date filter
let currentPage    = 1;

function applyDateFilter() {
  const d = dateInput.value; // YYYY-MM-DD
  allOrders = d
    ? rawOrders.filter(o => o.order_timestamp && new Date(o.order_timestamp).toLocaleDateString('sv') === d)
    : rawOrders;

  if (allOrders.length === 0) {
    const label = d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'this period';
    ordersTbody.innerHTML = `<tr><td colspan="11" class="text-center py-4 text-muted">No orders found for ${label}</td></tr>`;
    document.getElementById('orders-pagination').innerHTML = '';
    summaryEl.innerHTML = '';
    return;
  }
  renderPage(1);
  renderSummary(allOrders);
}

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderSummary(orders) {
  let buyTotal = 0, sellTotal = 0;
  for (const o of orders) {
    if (o.status !== 'complete') continue;
    const val = (o.quantity || 0) * (o.average_price || o.price || 0);
    if (o.transaction_type === 'BUY') buyTotal += val;
    else sellTotal += val;
  }
  const pnl     = sellTotal - buyTotal;
  const pnlCol  = pnl >= 0 ? '#27ae60' : '#e74c3c';
  const pnlSign = pnl >= 0 ? '+' : '';

  summaryEl.innerHTML = `
    <div class="d-flex gap-3 mt-3 flex-wrap">
      <div class="border rounded-3 px-4 py-3 flex-fill text-center" style="min-width:140px">
        <div class="text-muted small mb-1">Total Bought</div>
        <div class="fw-bold fs-5" style="color:#27ae60">₹${fmt(buyTotal)}</div>
      </div>
      <div class="border rounded-3 px-4 py-3 flex-fill text-center" style="min-width:140px">
        <div class="text-muted small mb-1">Total Sold</div>
        <div class="fw-bold fs-5" style="color:#e67e22">₹${fmt(sellTotal)}</div>
      </div>
      <div class="border rounded-3 px-4 py-3 flex-fill text-center" style="min-width:140px">
        <div class="text-muted small mb-1">Day's P&amp;L</div>
        <div class="fw-bold fs-5" style="color:${pnlCol}">${pnlSign}₹${fmt(Math.abs(pnl))}</div>
      </div>
    </div>
  `;
}

function renderPage(page) {
  const total      = allOrders.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  currentPage      = Math.max(1, Math.min(page, totalPages));

  const start  = (currentPage - 1) * PAGE_SIZE;
  const slice  = allOrders.slice(start, start + PAGE_SIZE);

  ordersTbody.innerHTML = slice.map((o, i) => {
    const { underlying, strike, optionType } = parseSymbol(o.trading_symbol);
    const statusClass = o.status === 'complete'  ? 'bg-success' :
                        o.status === 'rejected'  ? 'bg-danger'  :
                        o.status === 'cancelled' ? 'bg-secondary' : 'bg-warning text-dark';
    const isBuyRow    = o.transaction_type === 'BUY';
    const txClass     = isBuyRow ? 'tx-buy' : 'tx-exit';
    const txLabel     = isBuyRow ? 'BUY' : 'EXIT';
    const cpClass     = optionType === 'CE' ? 'badge-call' : optionType === 'PE' ? 'badge-put' : 'badge-unknown';
    const cpLabel     = optionType === 'CE' ? 'CALL' : optionType === 'PE' ? 'PUT' : optionType;
    const rowTotal    = (o.quantity || 0) * (o.average_price || o.price || 0);
    const strikeDisplay = strike === '—' ? '—' : `₹${strike}`;
    const sourceBadge = o.tag === 'moneymoose'
      ? `<span class="badge-api">API</span>`
      : `<span class="badge-manual">Manual</span>`;

    return `
      <tr>
        <td>${start + i + 1}</td>
        <td class="fw-semibold">${underlying}</td>
        <td class="fw-semibold">${strikeDisplay}</td>
        <td><span class="${cpClass}">${cpLabel}</span></td>
        <td><span class="${txClass}">${txLabel}</span></td>
        <td>${o.quantity || 0} @ ₹${Number(o.average_price || o.price || 0).toFixed(2)}</td>
        <td class="${txClass}">₹${fmt(rowTotal)}</td>
        <td>${sourceBadge}</td>
        <td class="text-muted small">${o.order_timestamp ? new Date(o.order_timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
        <td><span class="badge ${statusClass}">${(o.status || '—').toUpperCase()}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-secondary view-details"
            aria-label="View order details"
            data-order='${JSON.stringify(o).replace(/'/g, "&apos;")}'>
            <i class="bi bi-eye" aria-hidden="true"></i> View
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Count label
  const end       = Math.min(start + PAGE_SIZE, total);
  const countHtml = `<div class="text-muted small mt-2">Showing ${start + 1}–${end} of ${total} order${total !== 1 ? 's' : ''}</div>`;

  // Pagination controls
  let pages = '';
  for (let p = 1; p <= totalPages; p++) {
    pages += `<li class="page-item ${p === currentPage ? 'active' : ''}">
      <button class="page-link" data-page="${p}">${p}</button>
    </li>`;
  }
  const paginationHtml = totalPages > 1 ? `
    <nav class="mt-2">
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <button class="page-link" data-page="${currentPage - 1}">‹</button>
        </li>
        ${pages}
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <button class="page-link" data-page="${currentPage + 1}">›</button>
        </li>
      </ul>
    </nav>` : '';

  document.getElementById('orders-pagination').innerHTML = countHtml + paginationHtml;
}

async function loadOrders() {
  const clientId = clientSelect.value;
  if (!clientId) {
    ordersTbody.innerHTML = `<tr><td colspan="11" class="text-center py-4">Please select a client to view orders</td></tr>`;
    document.getElementById('orders-pagination').innerHTML = '';
    summaryEl.innerHTML = '';
    return;
  }

  ordersTbody.innerHTML = `<tr><td colspan="11" class="text-center py-3"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>`;
  document.getElementById('orders-pagination').innerHTML = '';
  summaryEl.innerHTML = '';

  try {
    const today   = new Date().toLocaleDateString('sv');
    const selDate = dateInput.value;
    const isToday = !selDate || selDate === today;

    const res = isToday
      ? await getClientOrders(clientId)
      : await getClientOrderHistory(clientId, selDate);

    rawOrders = (res?.data || []).slice().sort((a, b) => {
      const ta = a.order_timestamp ? new Date(a.order_timestamp).getTime() : 0;
      const tb = b.order_timestamp ? new Date(b.order_timestamp).getTime() : 0;
      return tb - ta;
    });

    applyDateFilter();

  } catch (err) {
    ordersTbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger py-4">Failed to load orders: ${err.message}</td></tr>`;
  }
}

document.addEventListener('click', (e) => {
  const pageBtn = e.target.closest('.page-link');
  if (pageBtn && !pageBtn.closest('.disabled')) {
    renderPage(Number(pageBtn.dataset.page));
    return;
  }

  const btn = e.target.closest('.view-details');
  if (!btn) return;
  const o = JSON.parse(btn.dataset.order);

  const { underlying, strike, optionType } = parseSymbol(o.trading_symbol);
  const strikeDisplay2 = strike === '—' ? '' : ` <span class="fs-6 fw-normal text-muted">₹${strike}</span>`;
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
          ${underlying}${strikeDisplay2}
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
