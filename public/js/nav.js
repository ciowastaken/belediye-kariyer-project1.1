(() => {
  const STYLE_ID = 'basiskele-shared-navbar-style';
  const FA_ID = 'basiskele-fontawesome';
  const LOGO_URL = 'assets/brand/basiskele-belediyesi-logo.svg';

  const navItems = [
    { href: 'anasayfa.html', label: 'Anasayfa', icon: 'fas fa-home', files: ['', 'index.html', 'anasayfa.html'] },
    { href: 'ilanlar.html', label: 'İlanlar', icon: 'fas fa-briefcase', files: ['ilanlar.html'] },
    { href: 'mesajlar.html', label: 'Mesajlar', icon: 'fas fa-comments', files: ['mesajlar.html'] },
    { href: 'iletisim.html', label: 'İletişim', icon: 'fas fa-map-marker-alt', files: ['iletisim.html'] },
  ];

  const protectedFiles = ['anasayfa.html', 'ilanlar.html', 'mesajlar.html', 'iletisim.html', 'user_dashboard.html', 'settings.html', 'admin_panel.html'];

  function currentFile() {
    const file = (window.location.pathname.split('/').pop() || 'anasayfa').toLowerCase();
    return file.includes('.') ? file : `${file}.html`;
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

    return 'Profilim';
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
        --bk-primary: #009fbd;
        --bk-primary-dark: #005f7c;
        --bk-primary-light: #e6fbff;
        --bk-accent: #18d7ff;
        --bk-text: #073052;
        --bk-muted: #52657d;
        --bk-border: rgba(0, 159, 189, .18);
        --bk-shadow: 0 24px 60px rgba(0, 71, 85, .16);
      }

      html { scroll-padding-top: 24px; }

      body {
        padding-top: 0 !important;
      }

      @keyframes bkNavEnter {
        from {
          opacity: 0;
          transform: translateY(-14px) scale(.985);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes bkLinkPop {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes bkBellPulse {
        0%, 100% {
          box-shadow: 0 12px 26px rgba(0, 159, 189, .14);
        }

        50% {
          box-shadow: 0 14px 34px rgba(0, 159, 189, .27);
        }
      }

      .bk-navbar {
        position: relative !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        z-index: 99999 !important;
        display: block !important;
        width: 100% !important;
        padding: 18px 0 16px !important;
        pointer-events: none;
      }

      .bk-navbar__shell {
        position: relative;
        width: min(1480px, calc(100% - 64px));
        min-height: 98px;
        margin: 0 auto;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        border: 1px solid rgba(0, 159, 189, .18);
        border-radius: 8px;
        background:
          linear-gradient(120deg, rgba(255, 255, 255, .98), rgba(238, 251, 255, .94)),
          rgba(255, 255, 255, .94);
        box-shadow: var(--bk-shadow), inset 0 1px 0 rgba(255, 255, 255, .88);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        pointer-events: auto;
        animation: bkNavEnter .52s cubic-bezier(.2, .8, .2, 1) both;
        transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease;
      }

      .bk-navbar__shell::before {
        content: "";
        position: absolute;
        inset: 0 18px auto;
        height: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, var(--bk-accent), var(--bk-primary), transparent);
        opacity: .72;
      }

      .bk-navbar__shell:hover {
        border-color: rgba(0, 159, 189, .28);
        box-shadow: 0 30px 70px rgba(0, 71, 85, .2), inset 0 1px 0 rgba(255, 255, 255, .9);
        transform: translateY(-1px);
      }

      .bk-brand {
        min-width: 270px;
        display: inline-flex;
        align-items: center;
        gap: 14px;
        color: var(--bk-text) !important;
        text-decoration: none !important;
        transition: transform .22s ease;
      }

      .bk-brand:hover {
        transform: translateY(-2px);
      }

      .bk-brand__logo {
        width: 62px;
        height: 62px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: #fff;
        box-shadow: inset 0 0 0 1px rgba(0, 165, 194, .1), 0 12px 28px rgba(0, 165, 194, .1);
        overflow: hidden;
        transition: transform .24s ease, box-shadow .24s ease;
      }

      .bk-brand:hover .bk-brand__logo {
        transform: rotate(-2deg) scale(1.04);
        box-shadow: inset 0 0 0 1px rgba(0, 159, 189, .18), 0 16px 34px rgba(0, 159, 189, .18);
      }

      .bk-brand__logo img {
        width: 50px;
        height: 50px;
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
        font-weight: 900;
        letter-spacing: .1px;
      }

      .bk-brand__text span {
        margin-top: 3px;
        color: #35516c;
        font-size: 15px;
        font-weight: 650;
      }

      .bk-links {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .bk-link {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        min-height: 48px;
        padding: 0 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border-radius: 8px;
        color: var(--bk-primary-dark) !important;
        font-size: 15px;
        font-weight: 900;
        letter-spacing: .1px;
        text-decoration: none !important;
        animation: bkLinkPop .38s ease both;
        transition: transform .22s ease, background .22s ease, color .22s ease, box-shadow .22s ease;
      }

      .bk-link:nth-child(1) { animation-delay: .05s; }
      .bk-link:nth-child(2) { animation-delay: .1s; }
      .bk-link:nth-child(3) { animation-delay: .15s; }
      .bk-link:nth-child(4) { animation-delay: .2s; }

      .bk-link::before {
        content: "";
        position: absolute;
        inset: 6px;
        z-index: 0;
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(0, 159, 189, .12), rgba(24, 215, 255, .2));
        opacity: 0;
        transform: scale(.9);
        transition: opacity .22s ease, transform .22s ease;
      }

      .bk-link i {
        position: relative;
        z-index: 1;
        font-size: 17px;
        color: #008baa;
        transition: transform .22s ease, color .22s ease;
      }

      .bk-link span {
        position: relative;
        z-index: 1;
      }

      .bk-link:hover {
        color: #03415c !important;
        background: rgba(255, 255, 255, .68);
        box-shadow: 0 14px 30px rgba(0, 107, 128, .14);
        transform: translateY(-3px);
      }

      .bk-link:hover::before {
        opacity: 1;
        transform: scale(1);
      }

      .bk-link:hover i {
        color: var(--bk-primary-dark);
        transform: rotate(-8deg) scale(1.12);
      }

      .bk-link.is-active,
      .bk-link.active {
        color: #fff !important;
        background: linear-gradient(135deg, var(--bk-primary), var(--bk-primary-dark)) !important;
        box-shadow: 0 14px 28px rgba(0, 121, 145, .26);
      }

      .bk-link.is-active i,
      .bk-link.active i {
        color: #fff;
      }

      .bk-actions {
        min-width: 300px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
      }

      .bk-profile {
        position: relative;
      }

      .bk-notification-wrap {
        position: relative;
      }

      .bk-profile__button,
      .bk-notification,
      .bk-back-button,
      .bk-menu-toggle {
        border: 0;
        color: var(--bk-primary);
        background: transparent;
        font: inherit;
        cursor: pointer;
      }

      .bk-profile__button,
      .bk-back-button {
        position: relative;
        overflow: hidden;
        min-height: 48px;
        padding: 0 14px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border-radius: 8px;
        color: var(--bk-primary-dark);
        font-size: 15px;
        font-weight: 900;
        transition: background .22s ease, transform .22s ease, box-shadow .22s ease, color .22s ease;
      }

      .bk-profile__button:hover,
      .bk-back-button:hover,
      .bk-profile.is-open .bk-profile__button {
        color: #03415c;
        background: rgba(0, 159, 189, .1);
        box-shadow: 0 12px 26px rgba(0, 107, 128, .13);
        transform: translateY(-3px);
      }

      .bk-profile__button i,
      .bk-back-button i {
        color: #008baa;
        transition: transform .22s ease, color .22s ease;
      }

      .bk-profile__button:hover i,
      .bk-back-button:hover i,
      .bk-profile.is-open .bk-profile__button i {
        color: var(--bk-primary-dark);
        transform: scale(1.12);
      }

      .bk-profile__menu {
        position: absolute;
        top: calc(100% + 14px);
        right: 0;
        min-width: 230px;
        padding: 10px;
        border: 1px solid var(--bk-border);
        border-radius: 8px;
        background: rgba(255, 255, 255, .97);
        box-shadow: 0 24px 54px rgba(7, 37, 62, .18);
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
        border-radius: 8px;
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
        background: linear-gradient(135deg, rgba(0, 159, 189, .1), rgba(24, 215, 255, .14));
        color: var(--bk-primary-dark);
      }

      .bk-notification {
        position: relative;
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        border: 1px solid rgba(0, 159, 189, .18);
        background: linear-gradient(135deg, rgba(232, 251, 255, .96), rgba(255, 255, 255, .92));
        font-size: 18px;
        transition: transform .22s ease, box-shadow .22s ease, background .22s ease, color .22s ease;
        animation: bkBellPulse 3.2s ease-in-out infinite;
      }

      .bk-notification:hover {
        color: var(--bk-primary-dark);
        transform: translateY(-3px) rotate(-2deg);
        background: #fff;
        box-shadow: 0 16px 34px rgba(0, 159, 189, .2);
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

      .bk-notification-content {
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        width: min(360px, calc(100vw - 28px));
        max-height: 420px;
        overflow: hidden;
        border: 1px solid var(--bk-border);
        border-radius: 8px;
        background: rgba(255, 255, 255, .98);
        box-shadow: 0 24px 54px rgba(7, 37, 62, .18);
        opacity: 0;
        visibility: hidden;
        transform: translateY(8px);
        transition: .2s ease;
      }

      .bk-notification-content.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .bk-notification-header,
      .bk-notification-footer {
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: #f7fbff;
        color: var(--bk-text);
        font-weight: 900;
      }

      .bk-notification-header button,
      .bk-notification-footer a {
        border: 0;
        background: transparent;
        color: var(--bk-primary);
        font-weight: 800;
        text-decoration: none;
      }

      .bk-notification-list {
        max-height: 290px;
        margin: 0;
        padding: 8px;
        overflow: auto;
        list-style: none;
      }

      .bk-notification-list li {
        padding: 10px;
        border-radius: 8px;
        color: var(--bk-text);
        font-weight: 700;
      }

      .bk-notification-list li + li {
        margin-top: 4px;
      }

      .bk-notification-list li:hover {
        background: var(--bk-primary-light);
      }

      .bk-notification-list .no-notifications {
        color: var(--bk-muted);
        text-align: center;
      }

      .bk-menu-toggle {
        width: 48px;
        height: 48px;
        display: none;
        place-items: center;
        border-radius: 8px;
        background: rgba(0, 159, 189, .1);
        font-size: 20px;
        color: var(--bk-primary-dark);
        transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
      }

      .bk-menu-toggle:hover {
        background: rgba(0, 159, 189, .16);
        box-shadow: 0 12px 26px rgba(0, 107, 128, .13);
        transform: translateY(-2px);
      }

      .bk-actions.is-guest .bk-profile,
      .bk-actions.is-guest .bk-notification-wrap {
        display: none !important;
      }

      @media (max-width: 1180px) {
        body { padding-top: 0 !important; }
        .bk-navbar { padding: 14px 0 14px !important; }
        .bk-navbar__shell { width: min(100% - 32px, 1100px); min-height: 88px; padding: 14px 16px; }
        .bk-brand { min-width: auto; }
        .bk-brand__logo { width: 56px; height: 56px; border-radius: 8px; }
        .bk-brand__logo img { width: 46px; height: 46px; }
        .bk-brand__text strong { font-size: 17px; }
        .bk-brand__text span { font-size: 13px; }
        .bk-links { gap: 8px; }
        .bk-link { min-height: 46px; padding: 0 13px; font-size: 15px; }
        .bk-actions { min-width: auto; }
        .bk-profile__button { font-size: 15px; }
      }

      @media (max-width: 900px) {
        body { padding-top: 0 !important; }
        .bk-navbar__shell { border-radius: 8px; }
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
          border-radius: 8px;
          background: rgba(255, 255, 255, .98);
          box-shadow: 0 24px 54px rgba(7, 37, 62, .18);
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

      @media (prefers-reduced-motion: reduce) {
        .bk-navbar__shell,
        .bk-link,
        .bk-notification {
          animation: none !important;
        }

        .bk-navbar__shell,
        .bk-brand,
        .bk-link,
        .bk-profile__button,
        .bk-back-button,
        .bk-notification,
        .bk-menu-toggle {
          transition: none !important;
        }

        .bk-navbar__shell:hover,
        .bk-brand:hover,
        .bk-link:hover,
        .bk-profile__button:hover,
        .bk-back-button:hover,
        .bk-notification:hover,
        .bk-menu-toggle:hover {
          transform: none !important;
        }
      }

      @media (max-width: 620px) {
        .bk-navbar { padding: 10px 0 12px !important; }
        .bk-navbar__shell { width: calc(100% - 20px); padding: 12px; gap: 8px; }
        .bk-brand__text span { display: none; }
        .bk-brand__text strong { font-size: 15px; }
        .bk-back-button span,
        .bk-profile__button span { display: none; }
        .bk-back-button,
        .bk-profile__button { width: 44px; justify-content: center; padding: 0; }
        .bk-notification { width: 44px; height: 44px; border-radius: 8px; }
        .bk-menu-toggle { width: 44px; height: 44px; }
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
    nav.className = 'bk-navbar';
    nav.setAttribute('aria-label', 'Ana navigasyon');
    nav.innerHTML = `
      <div class="bk-navbar__shell">
        <a class="bk-brand" href="anasayfa.html" aria-label="Başiskele Kariyer Platformu">
          <span class="bk-brand__logo"><img src="${LOGO_URL}" alt="Başiskele Belediyesi Logo"></span>
          <span class="bk-brand__text"><strong>Başiskele</strong><span>Kariyer Platformu</span></span>
        </a>

        <div class="bk-links" id="bkNavLinks">${links}</div>

        <div class="bk-actions nav-user-section is-guest">
          <button class="bk-back-button" type="button" data-nav-back aria-label="Geri dön">
            <i class="fas fa-arrow-left" aria-hidden="true"></i><span>Geri</span>
          </button>

          <div class="bk-profile" id="bkProfileMenu">
            <button class="bk-profile__button" type="button" aria-haspopup="true" aria-expanded="false">
              <i class="fas fa-user-circle" aria-hidden="true"></i><span data-nav-profile-name id="nav-profile-name">${getUserName()}</span>
            </button>
            <div class="bk-profile__menu" role="menu">
              <a href="user_dashboard.html" role="menuitem"><i class="fas fa-columns"></i> Panelim</a>
              <a href="user_dashboard.html#basvurular" role="menuitem"><i class="fas fa-file-alt"></i> Başvurularım</a>
              <a href="settings.html" role="menuitem"><i class="fas fa-cog"></i> Ayarlar</a>
              <button type="button" data-nav-logout id="nav-logout-btn" role="menuitem"><i class="fas fa-sign-out-alt"></i> Çıkış Yap</button>
            </div>
          </div>

          <div class="bk-notification-wrap">
            <button class="bk-notification" id="notificationButton" type="button" aria-label="Bildirimler" aria-expanded="false" aria-haspopup="true">
              <i class="fas fa-bell" aria-hidden="true"></i>
              <span class="bk-notification__badge badge" id="notificationCountBadge">0</span>
            </button>
            <div class="bk-notification-content notification-content" id="notificationDropdown">
              <div class="bk-notification-header notification-header">
                <span>Bildirimler</span>
                <button id="markAllAsRead" type="button">Tümünü Oku</button>
              </div>
              <ul class="bk-notification-list notification-list" id="notificationList">
                <li class="no-notifications">Yeni bildiriminiz yok.</li>
              </ul>
              <div class="bk-notification-footer notification-footer">
                <a href="mesajlar.html">Mesajlara Git</a>
              </div>
            </div>
          </div>

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
      if (element.classList.contains('bk-admin-nav') || element.closest('.bk-admin-shell')) return false;
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
    const backButton = navbar.querySelector('[data-nav-back]');
    const profileName = navbar.querySelector('[data-nav-profile-name]');
    const actions = navbar.querySelector('.bk-actions');
    const notificationButton = navbar.querySelector('#notificationButton');
    const notificationDropdown = navbar.querySelector('#notificationDropdown');

    function setGuestState(isGuest) {
      actions?.classList.toggle('is-guest', isGuest);
      actions?.classList.toggle('is-user', !isGuest);
    }

    function setProfileName(name) {
      if (!profileName) return;
      const cleanName = (name || 'Profilim').trim() || 'Profilim';
      profileName.textContent = cleanName.length > 18 ? `${cleanName.slice(0, 18)}...` : cleanName;
    }

    async function resolveFirestoreName(user) {
      const fallback = user?.displayName || user?.email || 'Profilim';
      try {
        const db = window.firebase?.firestore?.();
        if (!db || !user?.uid) return fallback;
        const snap = await db.collection('users').doc(user.uid).get();
        if (!snap.exists) return fallback;
        const data = snap.data() || {};
        return [data.name, data.surname].filter(Boolean).join(' ') || data.email || fallback;
      } catch (error) {
        return fallback;
      }
    }

    function syncAuthState() {
      try {
        const auth = window.firebase?.auth?.();
        if (!auth?.onAuthStateChanged) {
          setGuestState(!protectedFiles.includes(currentFile()));
          return;
        }

        auth.onAuthStateChanged(async (user) => {
          setGuestState(!user);
          if (user) setProfileName(await resolveFirestoreName(user));
        });
      } catch (error) {
        console.warn('Navbar oturum durumu okunamadı:', error);
        setGuestState(false);
      }
    }

    toggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = navbar.classList.toggle('is-menu-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    backButton?.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'anasayfa.html';
      }
    });

    profileButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = profile.classList.toggle('is-open');
      profileButton.setAttribute('aria-expanded', String(isOpen));
    });

    notificationButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const isOpen = notificationDropdown?.classList.toggle('show');
      notificationButton.setAttribute('aria-expanded', String(Boolean(isOpen)));
    });

    document.addEventListener('click', (event) => {
      if (!navbar.contains(event.target)) {
        navbar.classList.remove('is-menu-open');
        toggle?.setAttribute('aria-expanded', 'false');
        profile?.classList.remove('is-open');
        profileButton?.setAttribute('aria-expanded', 'false');
        notificationDropdown?.classList.remove('show');
        notificationButton?.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        navbar.classList.remove('is-menu-open');
        toggle?.setAttribute('aria-expanded', 'false');
        profile?.classList.remove('is-open');
        profileButton?.setAttribute('aria-expanded', 'false');
        notificationDropdown?.classList.remove('show');
        notificationButton?.setAttribute('aria-expanded', 'false');
      }
    });

    logoutButton?.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      try {
        if (typeof window.BasiskeleAuthSignOut === 'function') {
          await window.BasiskeleAuthSignOut();
        } else if (window.firebase?.auth) {
          await window.firebase.auth().signOut();
        }
      } catch (error) {
        console.warn('Çıkış işlemi tamamlanamadı:', error);
      } finally {
        window.location.href = 'login.html';
      }
    });

    syncAuthState();
  }

  function initNavbar() {
    ensureFontAwesome();
    injectStyles();
    const navbar = buildNavbar();
    replaceExistingNavbar(navbar);
    wireNavbar(navbar);
  }

  if (document.body) {
    initNavbar();
  } else {
    document.addEventListener('DOMContentLoaded', initNavbar);
  }
})();
