async function handleExit({ instrumentKey, symbol, btn }) {
  const confirmed = await showConfirm(`
    <table class="table table-sm mb-0">
      <tr><td class="text-muted">Action</td> <td class="fw-bold text-danger">EXIT</td></tr>
      <tr><td class="text-muted">Symbol</td> <td class="fw-bold">${symbol}</td></tr>
      <tr><td class="text-muted">Clients</td><td>ALL active clients</td></tr>
    </table>
    <div class="alert alert-danger mt-3 mb-0 py-2 small">
      <i class="fa-solid fa-triangle-exclamation me-1"></i>
      This will <strong>exit all open positions</strong> for this instrument across every client.
    </div>
  `);
  if (!confirmed) return;

  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Exiting...';

  try {
    const result     = await placeExitOrder(instrumentKey);
    const allSuccess = result.data?.every(r => r.success);

    result.data?.forEach(r => {
      if (r.success) console.log(`Exit success — ${r.clientName}`);
      else           console.error(`Exit failed  — ${r.clientName}: ${r.error}`);
    });

    showToast(
      allSuccess ? `Exit placed for ${symbol}` : 'Some exits failed — check console',
      allSuccess ? 'success' : 'error'
    );

    if (allSuccess) {
      // 10-second cooldown after a successful exit
      btn.innerHTML = '<i class="bi bi-check-circle"></i> Done (10s)';
      let secs = 10;
      const timer = setInterval(() => {
        secs--;
        if (secs <= 0) { clearInterval(timer); btn.disabled = false; btn.innerHTML = originalText; }
        else btn.innerHTML = `<i class="bi bi-check-circle"></i> Done (${secs}s)`;
      }, 1000);
      return;
    }
  } catch (err) {
    console.error('Exit error:', err);
    showToast('Exit failed: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = originalText;
}
