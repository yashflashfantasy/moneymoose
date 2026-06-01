(function startCommandClock() {
  const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function ist() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  }

  function getState(t) {
    const day  = t.getDay();
    const mins = t.getHours() * 60 + t.getMinutes();
    const isWE = day === 0 || day === 6;

    if (isWE) {
      const name = day === 6 ? 'Saturday' : 'Sunday';
      return { mode:'weekend', label: name.toUpperCase(), dotCls:'sdot-closed',
        countdown: 'Next session <strong>Mon 9:20 AM IST</strong>' };
    }
    if (mins < 560) {
      const left = 560 - mins;
      const h = Math.floor(left / 60), m = left % 60;
      return { mode:'premarket', label:'PRE-MARKET', dotCls:'sdot-pre',
        countdown: `Opens in <strong>${h > 0 ? h + 'h ' : ''}${String(m).padStart(2,'0')}m</strong>` };
    }
    if (mins < 910) {
      const left = 910 - mins;
      const h = Math.floor(left / 60), m = left % 60;
      return { mode:'open', label:'MARKET OPEN', dotCls:'sdot-open',
        countdown: `Closes in <strong>${h > 0 ? h + 'h ' : ''}${String(m).padStart(2,'0')}m</strong>` };
    }
    return { mode:'closed', label:'MARKET CLOSED', dotCls:'sdot-closed',
      countdown: 'Next session <strong>9:20 AM IST</strong>' };
  }

  function tick() {
    const t = ist();
    const h = String(t.getHours()).padStart(2,'0');
    const m = String(t.getMinutes()).padStart(2,'0');
    const s = String(t.getSeconds()).padStart(2,'0');

    const digEl = document.getElementById('cmd-digits');
    if (digEl) {
      digEl.textContent = `${h}:${m}:${s}`;
    }

    const dtEl = document.getElementById('cmd-date-str');
    if (dtEl) {
      dtEl.textContent = `${DAYS[t.getDay()]}, ${t.getDate()} ${MONTH[t.getMonth()]} ${t.getFullYear()}`;
    }

    const st = getState(t);

    if (digEl) {
      digEl.className = 'cmd-clock-digits ' + (
        st.mode === 'open'      ? 'state-open'  :
        st.mode === 'premarket' ? 'state-pre'    : 'state-closed'
      );
    }

    const dotEl = document.getElementById('cmd-sdot');
    if (dotEl) dotEl.className = `cmd-sdot ${st.dotCls}`;

    const lblEl = document.getElementById('cmd-slabel');
    if (lblEl) lblEl.textContent = st.label;

    const cdEl = document.getElementById('cmd-countdown');
    if (cdEl) cdEl.innerHTML = st.countdown;

    document.querySelectorAll('.wl-card[data-key]').forEach(card => {
      card.classList.toggle('market-live', st.mode === 'open');
    });
  }

  tick();
  setInterval(tick, 1000);
})();
