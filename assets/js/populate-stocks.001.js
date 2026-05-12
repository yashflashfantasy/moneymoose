function formatPrice(value) {
  if (value == null || isNaN(value)) return '—';
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(ltp, cp) {
  if (!ltp || !cp || cp === 0) return '';
  const pct   = ((ltp - cp) / cp) * 100;
  const sign  = pct >= 0 ? '+' : '';
  const color = pct >= 0 ? 'text-success' : 'text-danger';
  return `<small class="${color}">${sign}${pct.toFixed(2)}%</small>`;
}

async function populateTable() {
  const res         = await getWatchlist();
  const instruments = res?.data || [];
  const tbody       = document.getElementById('marketTableBody');
  tbody.innerHTML   = '';

  instruments.forEach((stock) => {
    const row = document.createElement('tr');
    row.dataset.key = stock.instrument_key;
    row.innerHTML = `
      <td><input type="checkbox"></td>
      <td>${stock.trading_symbol}</td>
      <td>${stock.lot_size}</td>
      <td>${stock.instrument_key}</td>
      <td class="latest-price fw-semibold">—</td>
      <td class="price-change">—</td>
      <td class="actions">
        <button class="btn btn-sm btn-success"  data-action="buy">Buy</button>
        <button class="btn btn-sm btn-warning"  data-action="exit">Exit</button>
        <button class="btn btn-sm btn-danger"   data-action="delete">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('select-all').addEventListener('change', function () {
    document.querySelectorAll('#marketTableBody input[type="checkbox"]')
      .forEach(cb => { cb.checked = this.checked; });
  });

  startPriceFeed(({ key, ltp, cp }) => {
    const row = document.querySelector(`#marketTableBody tr[data-key="${CSS.escape(key)}"]`);
    if (!row) return;
    row.querySelector('.latest-price').textContent = formatPrice(ltp);
    row.querySelector('.price-change').innerHTML   = formatChange(ltp, cp);
  });
}

populateTable();
