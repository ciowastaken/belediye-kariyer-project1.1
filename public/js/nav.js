(() => {
  const STYLE_ID = 'basiskele-shared-navbar-style';
  const FA_ID = 'basiskele-fontawesome';
  const LOGO_URL = 'https://www.upload.ee/image/19288734/logo_07042021153953.png';

  const navItems = [
    { href: 'anasayfa.html', label: 'Anasayfa', icon: 'fas fa-home', files: ['', 'index.html', 'anasayfa.html'] },
    { href: 'ilanlar.html', label: 'İlanlar', icon: 'fas fa-briefcase', files: ['ilanlar.html'] },
    { href: 'mesajlar.html', label: 'Mesajlar', icon: 'fas fa-comments', files: ['mesajlar.html'] },
    { href: 'iletisim.html', label: 'İletişim', icon: 'fas fa-map-marker-alt', files: ['iletisim.html'] },
  ];

  function currentFile() {
    return window.location.pathname.split('/').pop() || 'anasayfa.html';
  }

  function isActive(item) {
    return item.files.includes(currentFile());
  }

  function getUserName() {
    try {
      const firebaseUser = window.firebase?.auth?.().currentUser;
      if (firebaseUser?.displayName) return firebaseUser.displayName;
      if (firebaseUser?.email) return firebaseUser.email.split('@')[0];

      const keys = ['userName', 'username', 'displayName', 'currentUserName', 'name'];
      for (const key of keys) {
        const value = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (value) return value;
      }
    } catch (error) {
      console.warn('Navbar kullanıcı adı okunamadı:', error);
    }

    return 'Hasan Yalçın';
  }

  function ensureFontAwesome() {
    if (document.getElementById(FA_ID) || document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"]')) return;

    const link = document.createElement('link');
    link.id = FA_ID;
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --bk-primary: #005792;
        --bk-primary-dark: #003d66;
        --bk-text: #0b3557;
        --bk-muted: #5f6f89;
        --bk-border: rgba(0, 87, 146, .12);
        --bk-shadow: 0 22px 55px rgba(7, 37, 62, .12);
      }

      html { scroll-padding-top: 150px; }

      body {
        padding-top: 150px !important;
      }

      .bk-navbar {
        position: fixed !important;
        top: 28px !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 99999 !important;
        display: block !important;
        width: 100% !important;
        pointer-events: none;
      }

      .bk-navbar__shell {
        width: min(1480px, calc(100% - 64px));
        min-height: 112px;
        margin: 0 auto;
        padding: 18px 30px 18px 34px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 28px;
        border: 1px solid rgba(255, 255, 255, .72);
        border-radius: 30px;
        background: rgba(255, 255, 255, .9);
        box-shadow: var(--bk-shadow);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        pointer-events: auto;
      }

      .bk-brand {
        min-width: 330px;
        display: inline-flex;
        align-items: center;
        gap: 16px;
        color: var(--bk-text) !important;
        text-decoration: none !important;
      }

      .bk-brand__logo {
        width: 70px;
        height: 70px;
        display: grid;
        place-items: center;
        border-radius: 20px;
        background: #fff;
        box-shadow: inset 0 0 0 1px rgba(0, 87, 146, .08), 0 12px 28px rgba(0, 87, 146, .08);
        overflow: hidden;
      }

      .bk-brand__logo img {
        width: 54px;
        height: 54px;
        object-fit: contain;
        display: block;
      }

      .bk-brand__text {
        display: flex;
        flex-direction: column;
        line-height: 1.18;
      }

      .bk-brand__text strong {
        font-size: 19px;
        font-weight: 800;
        letter-spacing: .1px;
      }

      .bk-brand__text span {
        margin-top: 3px;
        color: var(--bk-muted);
        font-size: 15px;
        font-weight: 500;
      }

      .bk-links {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 22px;
      }

      .bk-link {
        min-height: 54px;
        padding: 0 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border-radius: 999px;
        color: var(--bk-primary) !important;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: .1px;
        text-decoration: none !important;
        transition: transform .22s ease, background .22s ease, color .22s ease, box-shadow .22s ease;
      }

      .bk-link i {
        font-size: 17px;
      }

      .bk-link:hover {
        color: var(--bk-primary-dark) !important;
        background: rgba(0, 87, 146, .08);
        transform: translateY(-2px);
      }

      .bk-link.is-active,
      .bk-link.active {
        color: #fff !important;
        background: var(--bk-primary) !important;
        box-shadow: 0 14px 28px rgba(0, 87, 146, .22);
      }

      .bk-actions {
        min-width: 330px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 14px;
      }

      .bk-profile {
        position: relative;
      }

      .bk-profile__button,
      .bk-notification,
      .bk-menu-toggle {
        border: 0;
        color: var(--bk-primary);
        background: transparent;
        font: inherit;
        cursor: pointer;
      }

      .bk-profile__button {
        min-height: 54px;
        padding: 0 16px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border-radius: 999px;
        color: var(--bk-primary);
        font-size: 18px;
        font-weight: 800;
        transition: background .22s ease, transform .22s ease;
      }

      .bk-profile__button:hover,
      .bk-profile.is-open .bk-profile__button {
        background: rgba(0, 87, 146, .08);
        transform: translateY(-2px);
      }

      .bk-profile__menu {
        position: absolute;
        top: calc(100% + 14px);
        right: 0;
        min-width: 230px;
        padding: 10px;
        border: 1px solid var(--bk-border);
        border-radius: 20px;
        background: rgba(255, 255, 255, .96);
        box-shadow: 0 22px 45px rgba(7, 37, 62, .16);
        opacity: 0;
        visibility: hidden;
        transform: translateY(8px);
        transition: .2s ease;
      }

      .bk-profile.is-open .bk-profile__menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .bk-profile__menu a,
      .bk-profile__menu button {
        width: 100%;
        padding: 12px 13px;
        display: flex;
        align-items: center;
        gap: 10px;
        border: 0;
        border-radius: 14px;
        background: transparent;
        color: var(--bk-text);
        font-size: 15px;
        font-weight: 700;
        text-decoration: none;
        text-align: left;
        cursor: pointer;
      }

      .bk-profile__menu a:hover,
      .bk-profile__menu button:hover {
        background: rgba(0, 87, 146, .08);
        color: var(--bk-primary);
      }

      .bk-notification {
        position: relative;
        width: 56px;
        height: 56px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        border: 1px solid rgba(0, 87, 146, .12);
        background: rgba(234, 245, 255, .9);
        font-size: 21px;
        transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
      }

      .bk-notification:hover {
        transform: translateY(-2px);
        background: #fff;
        box-shadow: 0 14px 26px rgba(0, 87, 146, .14);
      }

      .bk-notification__badge {
        position: absolute;
        top: 9px;
        right: 9px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        display: none;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        font-size: 10px;
        font-weight: 800;
      }

      .bk-menu-toggle {
        width: 50px;
        height: 50px;
        display: none;
        place-items: center;
        border-radius: 16px;
        background: rgba(0, 87, 146, .08);
        font-size: 20px;
      }

      @media (max-width: 1180px) {
        body { padding-top: 132px !important; }
        .bk-navbar { top: 18px !important; }
        .bk-navbar__shell { width: min(100% - 32px, 1100px); min-height: 94px; padding: 14px 18px; }
        .bk-brand { min-width: auto; }
        .bk-brand__logo { width: 58px; height: 58px; border-radius: 18px; }
        .bk-brand__logo img { width: 46px; height: 46px; }
        .bk-brand__text strong { font-size: 17px; }
        .bk-brand__text span { font-size: 13px; }
        .bk-links { gap: 8px; }
        .bk-link { min-height: 46px; padding: 0 13px; font-size: 15px; }
        .bk-actions { min-width: auto; }
        .bk-profile__button { font-size: 15px; }
      }

      @media (max-width: 900px) {
        body { padding-top: 118px !important; }
        .bk-navbar__shell { border-radius: 24px; }
        .bk-menu-toggle { display: grid; }
        .bk-links {
          position: absolute;
          top: calc(100% + 12px);
          left: 16px;
          right: 16px;
          padding: 14px;
          display: grid;
          gap: 8px;
          border: 1px solid var(--bk-border);
          border-radius: 22px;
          background: rgba(255, 255, 255, .97);
          box-shadow: 0 22px 45px rgba(7, 37, 62, .16);
          opacity: 0;
          visibility: hidden;
          transform: translateY(8px);
          transition: .2s ease;
        }

        .bk-navbar.is-menu-open .bk-links {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .bk-link { justify-content: center; }
      }

      @media (max-width: 620px) {
        .bk-navbar { top: 12px !important; }
        .bk-navbar__shell { width: calc(100% - 20px); padding: 12px; gap: 8px; }
        .bk-brand__text span { display: none; }
        .bk-brand__text strong { font-size: 15px; }
        .bk-profile__button span { display: none; }
        .bk-profile__button { width: 48px; justify-content: center; padding: 0; }
        .bk-notification { width: 48px; height: 48px; border-radius: 16px; }
      }
    `;

    document.head.appendChild(style);
  }

  function buildNavbar() {
    const links = navItems.map((item) => `
      <a class="bk-link${isActive(item) ? ' is-active active' : ''}" href="${item.href}">
        <i class="${item.icon}" aria-hidden="true"></i>
        <span>${item.label}</span>
      </a>
    `).join('');

    const nav = document.createElement('nav');
    nav.className = 'bk-navbar navbar-custom';
    nav.setAttribute('aria-label', 'Ana navigasyon');
    nav.innerHTML = `
      <div class="bk-navbar__shell">
        <a class="bk-brand" href="anasayfa.html" aria-label="Başiskele Kariyer Platformu">
          <span class="bk-brand__logo"><img src="${LOGO_URL}" alt="Başiskele Belediyesi Logo"></span>
          <span class="bk-brand__text"><strong>Başiskele</strong><span>Kariyer Platformu</span></span>
        </a>

        <div class="bk-links" id="bkNavLinks">${links}</div>

        <div class="bk-actions nav-user-section">
          <div class="bk-profile" id="bkProfileMenu">
            <button class="bk-profile__button" type="button" aria-haspopup="true" aria-expanded="false">
              <i class="fas fa-user-circle" aria-hidden="true"></i><span>${getUserName()}</span>
            </button>
            <div class="bk-profile__menu" role="menu">
              <a href="user_dashboard.html" role="menuitem"><i class="fas fa-columns"></i> Panelim</a>
              <a href="user_dashboard.html#basvurular" role="menuitem"><i class="fas fa-file-alt"></i> Başvurularım</a>
              <a href="settings.html" role="menuitem"><i class="fas fa-cog"></i> Ayarlar</a>
              <button type="button" data-nav-logout role="menuitem"><i class="fas fa-sign-out-alt"></i> Çıkış Yap</button>
            </div>
          </div>

          <button class="bk-notification" type="button" aria-label="Bildirimler">
            <i class="fas fa-bell" aria-hidden="true"></i>
            <span class="bk-notification__badge" id="notificationCountBadge">0</span>
          </button>

          <button class="bk-menu-toggle" type="button" aria-controls="bkNavLinks" aria-expanded="false" aria-label="Menüyü aç/kapat">
            <i class="fas fa-bars" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;

    return nav;
  }

  function replaceExistingNavbar(newNavbar) {
    document.querySelectorAll('.bk-navbar').forEach((element) => element.remove());

    const candidates = Array.from(document.querySelectorAll('nav, header, .navbar, .navbar-custom, .site-header, .main-header'));
    const oldNavbar = candidates.find((element) => {
      const text = (element.textContent || '').toLocaleLowerCase('tr-TR');
      return text.includes('anasayfa') || text.includes('ilanlar') || text.includes('mesajlar') || text.includes('iletişim') || text.includes('profil');
    });

    if (oldNavbar) {
      oldNavbar.replaceWith(newNavbar);
    } else {
      document.body.prepend(newNavbar);
    }
  }

  function wireNavbar(navbar) {
    const toggle = navbar.querySelector('.bk-menu-toggle');
    const profile = navbar.querySelector('.bk-profile');
    const profileButton = navbar.querySelector('.bk-profile__button');
    const logoutButton = navbar.querySelector('[data-nav-logout]');

    toggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = navbar.classList.toggle('is-menu-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    profileButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = profile.classList.toggle('is-open');
      profileButton.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
      if (!navbar.contains(event.target)) {
        navbar.classList.remove('is-menu-open');
        toggle?.setAttribute('aria-expanded', 'false');
        profile?.classList.remove('is-open');
        profileButton?.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        navbar.classList.remove('is-menu-open');
        toggle?.setAttribute('aria-expanded', 'false');
        profile?.classList.remove('is-open');
        profileButton?.setAttribute('aria-expanded', 'false');
      }
    });

    logoutButton?.addEventListener('click', async () => {
      try {
        if (window.firebase?.auth) await window.firebase.auth().signOut();
      } catch (error) {
        console.warn('Çıkış işlemi tamamlanamadı:', error);
      } finally {
        window.location.href = 'index.html';
      }
    });
  }

  function initNavbar() {
    ensureFontAwesome();
    injectStyles();
    const navbar = buildNavbar();
    replaceExistingNavbar(navbar);
    wireNavbar(navbar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
  } else {
    initNavbar();
  }
})();
