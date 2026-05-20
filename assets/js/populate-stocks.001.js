function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value)) || value === '—') return '—';
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatAdded(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function buildRow(stock) {
  const detailsKey = Object.keys(stock.details || {})[0];
  const lastPrice  = detailsKey ? stock.details[detailsKey]?.last_price : null;

  const tr = document.createElement('tr');
  tr.dataset.key = stock.instrument_key;
  tr.innerHTML = `
    <td><input type="checkbox"></td>
    <td>${stock.trading_symbol}</td>
    <td>${stock.lot_size}</td>
    <td>${stock.instrument_key}</td>
    <td class="latest-price fw-semibold">${formatPrice(lastPrice)}</td>
    <td class="text-muted small">${formatAdded(stock.timestamp)}</td>
    <td class="actions">
      <button class="btn btn-sm btn-success"  data-action="buy">Buy</button>
      <button class="btn btn-sm btn-warning"  data-action="exit">Exit</button>
      <button class="btn btn-sm btn-danger"   data-action="delete">Delete</button>
    </td>
  `;
  return tr;
}

async function populateTable() {
  const res         = await getWatchlist();
  // Sort newest first
  const instruments = (res?.data || []).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const callTbody = document.getElementById('callTableBody');
  const putTbody  = document.getElementById('putTableBody');

  const calls = instruments.filter(s => /\bCE\b/i.test(s.trading_symbol || ''));
  const puts  = instruments.filter(s => /\bPE\b/i.test(s.trading_symbol || ''));

  const emptyRow = (type) => `
    <tr>
      <td colspan="7" style="padding:56px 20px;text-align:center;background:linear-gradient(160deg,#f9fafb,#f1f5f1);border-top:1px dashed #e2e8f0;">
        <div style="font-size:44px;line-height:1;margin-bottom:14px">${type === 'CE' ? '📈' : '📉'}</div>
        <div style="font-size:14px;font-weight:700;color:#475569;margin-bottom:6px">No ${type} options in watchlist</div>
        <div style="font-size:12px;color:#94a3b8;max-width:280px;margin:0 auto;line-height:1.6">Use the search bar above to find and add your first ${type} option</div>
      </td>
    </tr>`;

  callTbody.innerHTML = calls.length ? '' : emptyRow('CE');
  calls.forEach(s => callTbody.appendChild(buildRow(s)));

  putTbody.innerHTML = puts.length ? '' : emptyRow('PE');
  puts.forEach(s => putTbody.appendChild(buildRow(s)));
}

populateTable();
