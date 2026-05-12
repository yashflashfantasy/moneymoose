async function handleExit({ instrumentKey, symbol, row, btn }) {
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

  try {
    const result     = await placeExitOrder(instrumentKey);
    const allSuccess = result.data?.every(r => r.success);

    result.data?.forEach(r => {
      if (r.success) console.log(`Exit OK — ${r.clientName}`);
      else           console.error(`Exit FAIL — ${r.clientName}: ${r.error}`);
    });

    if (allSuccess) {
      // Mark row as exited — stays locked until page refresh
      row.classList.remove('table-success');
      row.classList.add('table-secondary');
      btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Exited';
      btn.classList.replace('btn-warning', 'btn-outline-secondary');
      // Also lock the buy button so you can't re-buy an exited position
      const buyBtn = row.querySelector('button[data-action="buy"]');
      if (buyBtn) { buyBtn.disabled = true; }
      showToast(`Exited ${symbol}`, 'success');
    } else {
      btn.disabled = false;
      btn.innerHTML = 'Exit';
      showToast('Some exits failed — check console', 'error');
    }
  } catch (err) {
    console.error('Exit error:', err);
    btn.disabled = false;
    btn.innerHTML = 'Exit';
    showToast('Exit failed: ' + err.message, 'error');
  }
}
