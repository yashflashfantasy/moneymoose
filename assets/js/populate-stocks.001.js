function formatPrice(value) {
  if (value == null || isNaN(value)) return '—';
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function populateTable() {
  const res         = await getWatchlist();
  const instruments = res?.data || [];
  const tbody       = document.getElementById('marketTableBody');
  tbody.innerHTML   = '';

  instruments.forEach((stock) => {
    const detailsKey = Object.keys(stock.details || {})[0];
    const lastPrice  = detailsKey ? stock.details[detailsKey]?.last_price : null;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox"></td>
      <td>${stock.trading_symbol}</td>
      <td>${stock.lot_size}</td>
      <td>${stock.instrument_key}</td>
      <td class="latest-price">${formatPrice(lastPrice)}</td>
      <td class="actions">
        <button class="btn btn-sm btn-success"  data-action="buy">Buy</button>
        <button class="btn btn-sm btn-warning"  data-action="exit">Exit</button>
        <button class="btn btn-sm btn-info"     data-action="refresh">Refresh</button>
        <button class="btn btn-sm btn-danger"   data-action="delete">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('select-all').addEventListener('change', function () {
    document.querySelectorAll('#marketTableBody input[type="checkbox"]')
      .forEach(cb => { cb.checked = this.checked; });
  });
}

populateTable();
