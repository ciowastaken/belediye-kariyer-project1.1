(() => {
  const THEME_ID = 'basiskele-modern-theme';
  const themeHref = 'css/basiskele-theme.css';

  function ensureTheme() {
    if (document.getElementById(THEME_ID) || document.querySelector(`link[href="${themeHref}"]`)) return;
    const link = document.createElement('link');
    link.id = THEME_ID;
    link.rel = 'stylesheet';
    link.href = themeHref;
    document.head.appendChild(link);
  }

  function enhanceForms() {
    document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, select')
      .forEach((field) => {
        field.classList.add(field.tagName === 'SELECT' ? 'form-select' : 'form-control');
      });
  }

  function enhanceTables() {
    document.querySelectorAll('table').forEach((table) => {
      table.classList.add('bk-table');
      const parent = table.parentElement;
      if (parent && parent.classList.contains('table-responsive')) parent.classList.add('bk-table-wrap');
    });
  }

  function markCurrentLinks() {
    const file = window.location.pathname.split('/').pop() || 'anasayfa.html';
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#')) return;
      const target = href.split('#')[0].split('/').pop();
      if (target === file || (file === '' && target === 'anasayfa.html')) link.classList.add('active');
    });
  }

  function setupToasts() {
    if (window.BasiskeleUI?.toast) return;

    const container = document.createElement('div');
    container.className = 'bk-toast-stack';
    container.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:100000;display:grid;gap:10px;max-width:min(360px,calc(100vw - 36px));';
    document.body.appendChild(container);

    window.BasiskeleUI = {
      toast(message, type = 'info') {
        const item = document.createElement('div');
        const color = type === 'danger' ? '#d83a4b' : type === 'success' ? '#14985f' : type === 'warning' ? '#d98b16' : '#006b9f';
        item.textContent = message;
        item.style.cssText = `padding:12px 14px;border-radius:8px;background:#fff;border-left:4px solid ${color};box-shadow:0 16px 36px rgba(15,43,71,.16);font-weight:700;color:#102235;`;
        container.appendChild(item);
        setTimeout(() => item.remove(), 4200);
      }
    };
  }

  function fixExternalTargets() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      if (!link.rel) link.rel = 'noopener noreferrer';
    });
  }

  function init() {
    document.documentElement.classList.add('bk-modern-root');
    document.body.classList.add('bk-modern');
    ensureTheme();
    enhanceForms();
    enhanceTables();
    markCurrentLinks();
    setupToasts();
    fixExternalTargets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
