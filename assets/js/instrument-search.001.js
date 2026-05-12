// Shared instrument search widget — used across all admin pages.
// When a result is clicked, fires a custom 'instrument-selected' event
// so each page can handle the selection differently.

(function () {
  const BACKEND_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? 'https://wormless-interseptal-melodee.ngrok-free.dev'
    : 'http://localhost:3000';

  function highlightText(text, query) {
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${safe})`, 'gi'), '<span class="highlight">$1</span>');
  }

  function formatExpiry(item) {
    if (!item.expiry) return '';
    const d         = new Date(item.expiry);
    const isExpired = item.expiry < Date.now();
    const dateStr   = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `<div><small><b>Expiry:</b> ${dateStr}${isExpired ? ' <span style="color:#e74c3c">(Expired)</span>' : ''}</small></div>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input            = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    if (!input || !resultsContainer) return;

    resultsContainer.innerHTML = '<div class="no-results">Start typing to search...</div>';
    let debounceTimer;

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      const query = this.value.trim();
      resultsContainer.innerHTML = '';

      if (query.length < 2) {
        resultsContainer.innerHTML = '<div class="no-results">Type at least 2 letters...</div>';
        return;
      }

      resultsContainer.innerHTML = '<div class="loader">Searching...</div>';
      debounceTimer = setTimeout(() => search(query), 300);
    });

    async function search(query) {
      try {
        const params = new URLSearchParams({ query, records: 30, page_number: 1 });
        const res    = await fetch(`${BACKEND_URL}/market/search?${params}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const json   = await res.json();
        const items  = json.data || [];

        resultsContainer.innerHTML = '';
        if (items.length === 0) {
          resultsContainer.innerHTML = '<div class="no-results">No matches found</div>';
          return;
        }

        items.forEach(item => {
          const nameHL = highlightText(item.name || item.trading_symbol || 'Unknown', query);
          resultsContainer.insertAdjacentHTML('beforeend', `
            <div class="result-item"
              data-instrument-key="${item.instrument_key}"
              data-trading-symbol="${item.trading_symbol}"
              data-lot-size="${item.lot_size}"
              data-name="${item.name || item.trading_symbol}">
              <strong>${nameHL}</strong>
              <em>${item.segment || ''} • ${item.exchange || ''} • ${item.instrument_type || ''}</em>
              ${item.trading_symbol ? `<div><small><b>Symbol:</b> ${item.trading_symbol}</small></div>` : ''}
              ${item.isin           ? `<div><small><b>ISIN:</b> ${item.isin}</small></div>`             : ''}
              ${formatExpiry(item)}
            </div>
          `);
        });
      } catch (err) {
        resultsContainer.innerHTML = '<div class="no-results text-danger">Search failed — is the backend running?</div>';
      }
    }

    resultsContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.result-item');
      if (!item) return;
      document.dispatchEvent(new CustomEvent('instrument-selected', {
        detail: {
          instrumentKey:  item.dataset.instrumentKey,
          tradingSymbol:  item.dataset.tradingSymbol,
          lotSize:        item.dataset.lotSize,
          name:           item.dataset.name,
        }
      }));
      resultsContainer.innerHTML = '';
      input.value = '';
    });
  });
})();
