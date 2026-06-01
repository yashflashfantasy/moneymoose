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

  const card = document.createElement('div');
  card.className      = 'wl-card';
  card.dataset.key    = stock.instrument_key;
  card.dataset.symbol = stock.trading_symbol;
  card.dataset.lot    = stock.lot_size;

  card.innerHTML = `
    <div class="wl-card-cb">
      <input type="checkbox" class="wl-cb">
    </div>
    <div class="wl-card-body">
      <div class="wl-symbol">${stock.trading_symbol}</div>
      <div class="wl-meta-row">
        <span class="wl-key-chip" title="${stock.instrument_key}">${stock.instrument_key}</span>
        <span class="wl-lot-chip">Lot ${stock.lot_size}</span>
      </div>
      <div class="wl-added-ts">Added ${formatAdded(stock.timestamp)}</div>
    </div>
    <div class="wl-price-col">
      <div class="latest-price wl-ltp-val">${formatPrice(lastPrice)}</div>
      <div class="wl-ltp-lbl">LTP</div>
    </div>
    <div class="wl-actions-col">
      <button class="wl-btn-buy" data-action="buy">
        <i class="bi bi-lightning-fill"></i> Buy
      </button>
      <button class="wl-btn-exit" data-action="exit">Exit</button>
      <button class="wl-btn-del"  data-action="delete"><i class="bi bi-trash3"></i></button>
    </div>`;

  return card;
}

function buildEmptyCard(type) {
  const d = document.createElement('div');
  d.className = 'wl-empty';
  d.innerHTML = `
    <div class="wl-empty-icon">${type === 'CE' ? '📈' : '📉'}</div>
    <div class="wl-empty-title">No ${type} options in watchlist</div>
    <div class="wl-empty-hint">Use the search bar above to find and add your first ${type} option</div>`;
  return d;
}

async function populateTable() {
  const callContainer = document.getElementById('callTableBody');
  const putContainer  = document.getElementById('putTableBody');

  let instruments = [];
  try {
    const res = await getWatchlist();
    instruments = (res?.data || []).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (err) {
    console.error('Failed to load watchlist:', err);
  }

  const calls = instruments.filter(s => /\bCE\b/i.test(s.trading_symbol || ''));
  const puts  = instruments.filter(s => /\bPE\b/i.test(s.trading_symbol || ''));

  callContainer.innerHTML = '';
  if (calls.length) calls.forEach(s => callContainer.appendChild(buildRow(s)));
  else callContainer.appendChild(buildEmptyCard('CE'));

  putContainer.innerHTML = '';
  if (puts.length) puts.forEach(s => putContainer.appendChild(buildRow(s)));
  else putContainer.appendChild(buildEmptyCard('PE'));
}

populateTable();
