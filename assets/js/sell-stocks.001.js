async function handleExit(data) {
  data.btn.disabled = true;
  data.btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Exiting...';

  try {
    const result = await placeExitOrder(data.instrumentKey);
    const allSuccess = result.data?.every(r => r.success);

    result.data?.forEach(r => {
      if (r.success) {
        console.log(`✅ Exit success for ${r.clientName}`);
      } else {
        console.error(`❌ Exit failed for ${r.clientName}: ${r.error}`);
      }
    });

    showToast(allSuccess ? 'Exit placed successfully' : 'Some exits failed — check console', allSuccess ? 'success' : 'error');
  } catch (err) {
    console.error('Exit error:', err);
    showToast('Exit failed: ' + err.message, 'error');
  } finally {
    data.btn.disabled = false;
    data.btn.innerHTML = 'Exit';
  }
}
