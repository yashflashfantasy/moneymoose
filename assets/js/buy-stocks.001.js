document.querySelector('#marketTableBody').addEventListener('click', async (e) => {
  if (!e.target.matches('button[data-action]')) return;

  const btn    = e.target;
  const action = btn.dataset.action;
  if (btn.disabled) return;

  const row          = btn.closest('tr');
  const symbol       = row.children[1].textContent.trim();
  const lotSize      = row.children[2].textContent.trim();
  const instrumentKey = row.children[3].textContent.trim();
  const currentPrice = row.children[4].textContent.trim().replace(/,/g, '');

  switch (action) {
    case 'buy':
      await handleBuy({ instrumentKey, lotSize, symbol, row, btn, currentPrice });
      break;
    case 'exit':
      await handleExit({ instrumentKey, lotSize, symbol, row, btn, currentPrice });
      break;
    case 'refresh':
      await handleRefresh({ instrumentKey, lotSize, symbol, row });
      break;
    case 'delete':
      await handleDelete({ instrumentKey, lotSize, symbol, row, btn });
      break;
  }
});

async function handleBuy(row) {
  const originalText = row.btn.innerHTML;
  row.btn.disabled = true;
  row.btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Placing...';

  try {
    const result = await buyUpstox(row);
    const allSuccess = result.data?.every(r => r.success);

    result.data?.forEach(r => {
      if (r.success) console.log(`✅ Buy success for ${r.clientName} — orders: ${r.orderIds?.join(', ')}`);
      else           console.error(`❌ Buy failed for ${r.clientName}: ${r.error}`);
    });

    showToast(allSuccess ? 'Buy order placed successfully' : 'Some orders failed — check console', allSuccess ? 'success' : 'error');
  } catch (err) {
    console.error('Buy error:', err);
    showToast('Buy failed: ' + err.message, 'error');
  } finally {
    row.btn.disabled = false;
    row.btn.innerHTML = originalText;
  }
}
