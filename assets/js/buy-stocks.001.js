// Listen on the whole main-body so both CE and PE tables are covered
document.querySelector('.main-body').addEventListener('click', async (e) => {
  if (!e.target.matches('button[data-action]')) return;

  const btn    = e.target;
  const action = btn.dataset.action;
  if (btn.disabled) return;

  const row           = btn.closest('tr');
  const symbol        = row.children[1].textContent.trim();
  const lotSize       = row.children[2].textContent.trim();
  const instrumentKey = row.children[3].textContent.trim();
  const rawPrice      = row.children[4].textContent.trim().replace(/,/g, '');

  if (action === 'buy')    await handleBuy({ instrumentKey, lotSize, symbol, row, btn, currentPrice: rawPrice });
  if (action === 'exit')   await handleExit({ instrumentKey, symbol, row, btn });
  if (action === 'delete') await handleDelete({ instrumentKey, lotSize, symbol, row, btn });
});

async function handleBuy({ instrumentKey, lotSize, symbol, row, btn, currentPrice }) {
  const price = Number(currentPrice);
  if (!price || isNaN(price) || price <= 0) {
    showToast('Live price not loaded yet — wait a moment and try again', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

  try {
    const result     = await buyUpstox({ instrumentKey, lotSize, currentPrice: price });
    const allSuccess = result.data?.every(r => r.success);

    result.data?.forEach(r => {
      if (r.success) console.log(`Buy OK — ${r.clientName}: ${r.orderIds?.join(', ')}`);
      else           console.error(`Buy FAIL — ${r.clientName}: ${r.error}`);
    });

    if (allSuccess) {
      // Mark row as bought — stays locked until page refresh
      row.classList.add('table-success');
      btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Bought';
      btn.classList.replace('btn-success', 'btn-outline-success');
      showToast(`Bought ${symbol}`, 'success');
    } else {
      btn.disabled = false;
      btn.innerHTML = 'Buy';
      showToast('Some orders failed — check console', 'error');
    }
  } catch (err) {
    console.error('Buy error:', err);
    btn.disabled = false;
    btn.innerHTML = 'Buy';
    showToast('Buy failed: ' + err.message, 'error');
  }
}
