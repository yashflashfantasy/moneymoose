(function () {
  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const hasToken = !!localStorage.getItem('mm_token');

  if (!loggedIn || !hasToken) {
    // Clear stale state so the login page starts clean
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('mm_token');
    window.location.replace('login.html');
  }
})();
