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

function showConfirm(message, { confirmLabel = 'Remove', confirmClass = 'btn-danger' } = {}) {
  return new Promise(resolve => {
    let modal = document.getElementById('mm-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mm-confirm-modal';
      modal.className = 'modal fade';
      modal.setAttribute('tabindex', '-1');
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow">
            <div class="modal-body pt-4 pb-2 px-4 text-center">
              <div class="mb-3" style="font-size:2rem">&#9888;</div>
              <p class="mb-0 fw-semibold" id="mm-confirm-msg" style="font-size:14px;line-height:1.5"></p>
            </div>
            <div class="modal-footer justify-content-center border-0 pb-4 gap-2">
              <button class="btn btn-sm btn-light px-4" id="mm-confirm-cancel">Cancel</button>
              <button class="btn btn-sm px-4" id="mm-confirm-ok"></button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('mm-confirm-msg').textContent = message;
    const okBtn = document.getElementById('mm-confirm-ok');
    okBtn.textContent = confirmLabel;
    okBtn.className = `btn btn-sm px-4 ${confirmClass}`;

    const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();

    function cleanup(result) {
      okBtn.onclick = null;
      document.getElementById('mm-confirm-cancel').onclick = null;
      bsModal.hide();
      resolve(result);
    }

    okBtn.onclick = () => cleanup(true);
    document.getElementById('mm-confirm-cancel').onclick = () => cleanup(false);
    modal.addEventListener('hidden.bs.modal', () => resolve(false), { once: true });
  });
}
