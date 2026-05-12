function showToast(message, type = 'success') {
  const existing = document.getElementById('mm-toast');
  if (existing) existing.remove();

  const colors = { success: '#198754', error: '#dc3545', info: '#0dcaf0' };
  const toast = document.createElement('div');
  toast.id = 'mm-toast';
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:${colors[type] || colors.info}; color:#fff;
    padding:12px 20px; border-radius:8px; font-size:14px;
    box-shadow:0 4px 12px rgba(0,0,0,0.2); max-width:320px;
    animation: slideIn 0.2s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
