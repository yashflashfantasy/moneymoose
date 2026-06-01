(function () {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.replace('login.html');
  }
})();
