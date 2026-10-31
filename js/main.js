/* Kebab Empire — açılış */
(function () {
  function start() {
    KE.UI.boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
