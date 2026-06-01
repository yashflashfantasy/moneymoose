// Shared instrument search widget — used across all admin pages.
// When a result is clicked (or Enter pressed), fires 'instrument-selected'
// so each page can handle the selection differently.

(function () {
  const BACKEND_URL = (globalThis.window !== undefined && globalThis.location.hostname !== 'localhost' && globalThis.location.hostname !== '127.0.0.1')
    ? 'https://wormless-interseptal-melodee.ngrok-free.dev'
    : 'http://localhost:3000';

  function highlightText(text, query) {
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    return text.replace(new RegExp(`(${safe})`, 'gi'), '<span class="search-match">$1</span>');
  }

  function formatExpiry(item) {
    if (!item.expiry) return '';
    const d         = new Date(item.expiry);
    const isExpired = item.expiry < Date.now();
    const dateStr   = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `<span class="result-expiry${isExpired ? ' expired' : ''}">${dateStr}${isExpired ? ' · Expired' : ''}</span>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input            = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    if (!input || !resultsContainer) return;

    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', 'Search instruments — press / to focus');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-haspopup', 'listbox');
    resultsContainer.setAttribute('role', 'listbox');
    let debounceTimer;
    let activeIndex = -1;

    function getItems() {
      return resultsContainer.querySelectorAll('.result-item');
    }

    function setActive(index) {
      const items = getItems();
      items.forEach(el => el.classList.remove('active'));
      activeIndex = Math.max(-1, Math.min(index, items.length - 1));
      if (activeIndex >= 0) {
        items[activeIndex].classList.add('active');
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }

    function closeResults() {
      resultsContainer.innerHTML = '';
      activeIndex = -1;
    }

    function selectItem(item) {
      input.value = item.dataset.name;
      document.dispatchEvent(new CustomEvent('instrument-selected', {
        detail: {
          instrumentKey: item.dataset.instrumentKey,
          tradingSymbol: item.dataset.tradingSymbol,
          lotSize:       item.dataset.lotSize,
          name:          item.dataset.name,
        }
      }));
      closeResults();
    }

    // Press / anywhere on the page to focus search
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input &&
          !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      const query = this.value.trim();
      activeIndex = -1;
      resultsContainer.innerHTML = '';

      if (query.length === 0) return;

      if (query.length < 2) {
        resultsContainer.innerHTML = '<div class="no-results">Type at least 2 characters…</div>';
        return;
      }

      resultsContainer.innerHTML = '<div class="loader"><span class="loader-dot"></span>Searching…</div>';
      debounceTimer = setTimeout(() => search(query), 300);
    });

    input.addEventListener('keydown', function (e) {
      const items = getItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(activeIndex - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && items[activeIndex]) selectItem(items[activeIndex]);
      } else if (e.key === 'Escape') {
        closeResults();
        input.blur();
      }
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
        closeResults();
      }
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
          const badge  = [item.exchange, item.instrument_type].filter(Boolean).join(' · ');
          resultsContainer.insertAdjacentHTML('beforeend', `
            <div class="result-item"
              data-instrument-key="${item.instrument_key}"
              data-trading-symbol="${item.trading_symbol}"
              data-lot-size="${item.lot_size}"
              data-name="${item.name || item.trading_symbol}">
              <div class="result-main">
                <span class="result-name">${nameHL}</span>
                ${item.trading_symbol ? `<span class="result-symbol">${item.trading_symbol}</span>` : ''}
              </div>
              <div class="result-meta">
                ${badge               ? `<span class="result-badge">${badge}</span>`    : ''}
                ${formatExpiry(item)}
              </div>
            </div>
          `);
        });
        activeIndex = -1;
      } catch (err) {
        console.error('Instrument search failed:', err);
        resultsContainer.innerHTML = '<div class="no-results error">Search failed — is the backend running?</div>';
      }
    }

    resultsContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.result-item');
      if (!item) return;
      selectItem(item);
    });
  });
})();
