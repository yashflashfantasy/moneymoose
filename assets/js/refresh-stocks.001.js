function getOrCreateRefreshTs(btn) {
  const existing = btn.parentElement.querySelector('.refresh-ts');
  if (existing) return existing;
  const s = document.createElement('span');
  s.className = 'refresh-ts';
  btn.after(s);
  return s;
}

async function refreshAllInTable(tbodyId, btn) {
  const rows = document.querySelectorAll(`#${tbodyId} tr[data-key]`);
  if (!rows.length) return;

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Refreshing...';

  await Promise.all([...rows].map(async (row) => {
    const instrumentKey = row.dataset.key;
    try {
      const res       = await fetchLatestPrice(instrumentKey);
      const detailKey = Object.keys(res?.data || {})[0];
      const ltp       = detailKey ? res.data[detailKey]?.last_price : null;
      if (ltp !== null && ltp !== undefined) {
        row.querySelector('.latest-price').textContent =
          Number(ltp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        await saveToWatchlist({ instrument_key: instrumentKey, details: res.data, timestamp: Date.now() });
      }
    } catch (err) {
      console.error(`Refresh failed for ${instrumentKey}:`, err.message);
    }
  }));

  btn.disabled = false;
  btn.innerHTML = originalHtml;

  const tsEl = getOrCreateRefreshTs(btn);
  const now  = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  tsEl.textContent = `Updated ${now}`;

  showToast('Prices refreshed', 'success');
}

document.getElementById('refresh-all-ce')?.addEventListener('click', function () {
  refreshAllInTable('callTableBody', this);
});

document.getElementById('refresh-all-pe')?.addEventListener('click', function () {
  refreshAllInTable('putTableBody', this);
});
