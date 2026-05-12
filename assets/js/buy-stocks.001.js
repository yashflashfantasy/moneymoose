// Returns a Promise<boolean> — resolves true only if user clicks the confirm button.
// data-bs-keyboard=false and data-bs-backdrop=static mean only the buttons dismiss it.
function showConfirm(html) {
  return new Promise((resolve) => {
    document.getElementById('confirmOrderBody').innerHTML = html;
    const modalEl = document.getElementById('confirmOrderModal');
    const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);

    function onOk()     { cleanup(); modal.hide(); resolve(true);  }
    function onCancel() { cleanup(); modal.hide(); resolve(false); }
    function cleanup()  {
      document.getElementById('confirmOrderOk').removeEventListener('click', onOk);
      document.getElementById('confirmOrderCancel').removeEventListener('click', onCancel);
      modalEl.removeEventListener('hidden.bs.modal', onCancel);
    }

    document.getElementById('confirmOrderOk').addEventListener('click', onOk);
    document.getElementById('confirmOrderCancel').addEventListener('click', onCancel);
    // Also resolve false if modal is closed any other way
    modalEl.addEventListener('hidden.bs.modal', onCancel, { once: true });

    modal.show();
    // Move focus to Cancel so keyboard Enter doesn't accidentally confirm
    modalEl.addEventListener('shown.bs.modal', () => {
      document.getElementById('confirmOrderCancel').focus();
    }, { once: true });
  });
}

document.querySelector('#marketTableBody').addEventListener('click', async (e) => {
  if (!e.target.matches('button[data-action]')) return;

  const btn    = e.target;
  const action = btn.dataset.action;
  if (btn.disabled) return;

  const row           = btn.closest('tr');
  const symbol        = row.children[1].textContent.trim();
  const lotSize       = row.children[2].textContent.trim();
  const instrumentKey = row.children[3].textContent.trim();
  const rawPrice      = row.children[4].textContent.trim().replace(/,/g, '');

  switch (action) {
    case 'buy':
      await handleBuy({ instrumentKey, lotSize, symbol, row, btn, currentPrice: rawPrice });
      break;
    case 'exit':
      await handleExit({ instrumentKey, symbol, btn });
      break;
    case 'delete':
      await handleDelete({ instrumentKey, lotSize, symbol, row, btn });
      break;
  }
});

async function handleBuy({ instrumentKey, lotSize, symbol, row, btn, currentPrice }) {
  // Guard: price must be a valid number
  const price = Number(currentPrice);
  if (!price || isNaN(price) || price <= 0) {
    showToast('Cannot buy — live price not available yet. Wait for SSE feed to populate.', 'error');
    return;
  }

  const confirmed = await showConfirm(`
    <table class="table table-sm mb-0">
      <tr><td class="text-muted">Action</td>  <td class="fw-bold text-success">BUY</td></tr>
      <tr><td class="text-muted">Symbol</td>  <td class="fw-bold">${symbol}</td></tr>
      <tr><td class="text-muted">LTP</td>     <td class="fw-bold">₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
      <tr><td class="text-muted">Lot size</td><td>${lotSize}</td></tr>
      <tr><td class="text-muted">Clients</td> <td>ALL active clients</td></tr>
    </table>
    <div class="alert alert-warning mt-3 mb-0 py-2 small">
      <i class="fa-solid fa-triangle-exclamation me-1"></i>
      This will place a <strong>real market order</strong> using live funds.
    </div>
  `);
  if (!confirmed) return;

  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Placing...';

  try {
    const result     = await buyUpstox({ instrumentKey, lotSize, currentPrice: price });
    const allSuccess = result.data?.every(r => r.success);

    result.data?.forEach(r => {
      if (r.success) console.log(`Buy success — ${r.clientName}: orders ${r.orderIds?.join(', ')}`);
      else           console.error(`Buy failed  — ${r.clientName}: ${r.error}`);
    });

    showToast(
      allSuccess ? `Buy placed for ${symbol}` : 'Some orders failed — check console',
      allSuccess ? 'success' : 'error'
    );

    if (allSuccess) {
      // 10-second cooldown after a successful buy to prevent accidental repeat
      btn.innerHTML = '<i class="bi bi-check-circle"></i> Done (10s)';
      let secs = 10;
      const timer = setInterval(() => {
        secs--;
        if (secs <= 0) { clearInterval(timer); btn.disabled = false; btn.innerHTML = originalText; }
        else btn.innerHTML = `<i class="bi bi-check-circle"></i> Done (${secs}s)`;
      }, 1000);
      return; // skip the finally re-enable
    }
  } catch (err) {
    console.error('Buy error:', err);
    showToast('Buy failed: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = originalText;
}
