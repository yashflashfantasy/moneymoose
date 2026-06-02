(function startLivePnL() {
  const card    = document.getElementById('live-pnl-card');
  const tbody   = document.getElementById('live-pnl-body');
  const updated = document.getElementById('live-pnl-updated');

  if (!card) return;

  function isMarketHours() {
    const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day  = ist.getDay();
    const mins = ist.getHours() * 60 + ist.getMinutes();
    return day !== 0 && day !== 6 && mins >= 560 && mins < 910;
  }

  async function fetchPositions() {
    if (!isMarketHours()) return [];
    const clients = (globalThis.linked_clients || []).filter(c => c.active);
    const all = [];
    await Promise.all(clients.map(async c => {
      try {
        const res = await api(`/clients/${c.id}/positions`);
        (res.data || []).forEach(p => all.push({ ...p, clientName: c.client_name }));
      } catch {}
    }));
    return all;
  }

  function fmt(n) {
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function render() {
    const positions = await fetchPositions();
    if (!positions.length) { card.style.display = 'none'; return; }
    card.style.display = '';
    tbody.innerHTML = positions.map(p => {
      const pnl    = p.pnl;
      const pnlPct = p.avg_price ? ((p.ltp - p.avg_price) / p.avg_price * 100) : null;
      const sign   = pnl >= 0 ? '+' : '';
      const pnlCls = pnl == null ? '' : pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
      return `<tr>
        <td class="fw-semibold">${p.trading_symbol}</td>
        <td>${p.qty}</td>
        <td>₹${fmt(p.avg_price)}</td>
        <td class="fw-bold">${p.ltp != null ? '₹' + fmt(p.ltp) : '<span class="text-muted">—</span>'}</td>
        <td class="${pnlCls}">${pnl != null ? sign + '₹' + fmt(Math.abs(pnl)) : '—'}</td>
        <td class="${pnlCls}">${pnlPct != null ? sign + pnlPct.toFixed(2) + '%' : '—'}</td>
      </tr>`;
    }).join('');
    updated.textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
  }

  document.addEventListener('clients-loaded', () => render());
})();
