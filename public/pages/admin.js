document.addEventListener('DOMContentLoaded', () => {
  const firebaseConfig = {
    apiKey: "AIzaSyALJWbNPziCXnjbgAwbGxpeRafO0O29fy4",
    authDomain: "belediye-kariyer-project.firebaseapp.com",
    projectId: "belediye-kariyer-project",
    storageBucket: "belediye-kariyer-project.firebasestorage.app",
    messagingSenderId: "1018107908919",
    appId: "1:1018107908919:web:b750dff35acbed659d80b2",
    measurementId: "G-NZN8NGWDT7"
  };

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();
  const cloudFunctions = firebase.functions ? firebase.functions() : null;

  const refs = {
    loading: document.getElementById('loading-indicator'),
    content: document.getElementById('admin-content'),
    alert: document.getElementById('admin-alert'),
    currentUser: document.getElementById('admin-current-user'),
    totalListings: document.getElementById('total-listings-count'),
    activeListings: document.getElementById('active-listings-count'),
    totalUsers: document.getElementById('total-users-count'),
    totalMessages: document.getElementById('total-messages-count'),
    listingTable: document.getElementById('ilanlar-tablosu'),
    usersTable: document.getElementById('users-table-body'),
    listingSearch: document.getElementById('ilan-search'),
    listingStatus: document.getElementById('ilan-status-filter'),
    userSearch: document.getElementById('user-search'),
    chatUsersList: document.getElementById('chat-users-list'),
    chatUserSearch: document.getElementById('chat-user-search'),
    chatWindow: document.getElementById('chat-window'),
    chatPartnerName: document.getElementById('chat-partner-name'),
    chatPartnerMeta: document.getElementById('chat-partner-meta'),
    chatPartnerAvatar: document.getElementById('chat-partner-avatar'),
    messageInput: document.getElementById('message-input'),
    sendMessageBtn: document.getElementById('send-message-btn'),
    clearChatBtn: document.getElementById('clear-chat'),
    clearAllMessagesBtn: document.getElementById('clear-all-messages'),
    toggleChatUsersBtn: document.getElementById('toggleChatUsersBtn'),
    refreshBtn: document.getElementById('adminRefreshBtn'),
    detailModal: document.getElementById('ilan-detail-modal'),
    detailBody: document.getElementById('ilan-detail-body'),
    detailTitle: document.getElementById('ilanDetailLabel')
  };

  const state = {
    listings: [],
    users: [],
    messages: [],
    adminUser: null,
    adminData: null,
    currentChatPartner: null,
    chatUnsubscribe: null,
    booted: false
  };

  const roleLabels = {
    user: 'Kullanıcı',
    yetkili: 'Yetkili',
    admin: 'Admin'
  };

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>"']/g, (s) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[s]));
  }

  function normalize(value = '') {
    return String(value).toLocaleLowerCase('tr-TR').trim();
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatTime(value) {
    if (!value) return '';
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function showAlert(message, type = 'info') {
    if (window.BasiskeleUI?.toast) window.BasiskeleUI.toast(message, type);
    if (!refs.alert) return;
    refs.alert.className = `alert alert-${type === 'danger' ? 'danger' : type} mb-3`;
    refs.alert.textContent = message;
    refs.alert.classList.remove('d-none');
    clearTimeout(showAlert.timer);
    showAlert.timer = setTimeout(() => refs.alert.classList.add('d-none'), 5200);
  }

  function isAdminLike(data = {}) {
    const role = typeof data.role === 'string' ? data.role.trim().toLowerCase() : '';
    if (role) return role === 'admin' || role === 'yetkili';
    return data.isAdmin === true;
  }

  function getRole(data = {}) {
    if (typeof data.role === 'string' && data.role.trim()) return data.role.trim().toLowerCase();
    return data.isAdmin ? 'admin' : 'user';
  }

  function getName(data = {}) {
    return [data.name, data.surname].filter(Boolean).join(' ') || data.displayName || data.email || 'İsimsiz kullanıcı';
  }

  function setLoading(loading) {
    refs.loading?.classList.toggle('d-none', !loading);
    refs.content?.classList.toggle('d-none', loading);
  }

  function getListingOwnerName(listing) {
    const user = state.users.find((item) => item.id === listing.ilan_sahibi_id);
    return user ? getName(user) : (listing.poster_name || listing.olusturan_email || '-');
  }

  async function loadDashboardData() {
    refs.listingTable.innerHTML = '<tr><td colspan="6" class="text-center py-4">İlanlar yükleniyor...</td></tr>';
    refs.usersTable.innerHTML = '<tr><td colspan="5" class="text-center py-4">Kullanıcılar yükleniyor...</td></tr>';

    const [listingSnap, userSnap, messageSnap] = await Promise.all([
      db.collection('ilanlar').get(),
      db.collection('users').get(),
      db.collection('messages').limit(1000).get().catch(() => ({ docs: [], size: 0 }))
    ]);

    state.listings = listingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    state.users = userSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    state.messages = messageSnap.docs ? messageSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) : [];

    state.listings.sort((a, b) => {
      const da = a.eklenme_tarihi?.toMillis ? a.eklenme_tarihi.toMillis() : 0;
      const dbb = b.eklenme_tarihi?.toMillis ? b.eklenme_tarihi.toMillis() : 0;
      return dbb - da;
    });
    state.users.sort((a, b) => getName(a).localeCompare(getName(b), 'tr'));

    refs.totalListings.textContent = state.listings.length;
    refs.activeListings.textContent = state.listings.filter((item) => (item.durum || 'aktif') === 'aktif').length;
    refs.totalUsers.textContent = state.users.length;
    refs.totalMessages.textContent = state.messages.length;

    renderListings();
    renderUsers();
    renderChatUsers();
  }

  function renderListings() {
    const term = normalize(refs.listingSearch?.value);
    const status = refs.listingStatus?.value || '';
    const rows = state.listings.filter((listing) => {
      const ownerName = getListingOwnerName(listing);
      const haystack = normalize(`${listing.baslik || ''} ${listing.aciklama || ''} ${listing.konum || ''} ${ownerName}`);
      const listingStatus = listing.durum || 'aktif';
      return (!term || haystack.includes(term)) && (!status || listingStatus === status);
    });

    if (!rows.length) {
      refs.listingTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Filtreye uygun ilan bulunamadı.</td></tr>';
      return;
    }

    refs.listingTable.innerHTML = rows.map((listing) => {
      const ownerName = getListingOwnerName(listing);
      const durum = listing.durum || 'aktif';
      const isActive = durum === 'aktif';
      return `
        <tr>
          <td>
            <div class="bk-row-title">
              <strong>${escapeHTML(listing.baslik || 'İsimsiz ilan')}</strong>
              <small>${escapeHTML(listing.ilan_tipi === 'employer' ? 'İşveren ilanı' : 'İş arayan ilanı')} · ${formatDate(listing.eklenme_tarihi)}</small>
            </div>
          </td>
          <td>${escapeHTML(ownerName)}</td>
          <td>${escapeHTML(listing.konum || '-')}</td>
          <td>${escapeHTML(listing.calisma_sekli || '-')}</td>
          <td><span class="bk-chip ${isActive ? 'success' : 'warning'}">${escapeHTML(isActive ? 'Aktif' : 'Pasif')}</span></td>
          <td>
            <div class="bk-action-group">
              <button class="btn btn-light btn-sm view-detail-btn" data-id="${listing.id}" title="Detay">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="btn btn-outline-primary btn-sm dm-btn" data-owner-id="${escapeHTML(listing.ilan_sahibi_id || '')}" data-owner-name="${escapeHTML(ownerName)}" title="Mesaj">
                <i class="fa-solid fa-comments"></i>
              </button>
              <button class="btn btn-outline-secondary btn-sm toggle-listing-status-btn" data-id="${listing.id}" data-status="${isActive ? 'pasif' : 'aktif'}">
                ${isActive ? 'Pasifleştir' : 'Aktifleştir'}
              </button>
              <button class="btn btn-outline-danger btn-sm delete-listing-btn" data-id="${listing.id}" title="Sil">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderUsers() {
    const term = normalize(refs.userSearch?.value);
    const rows = state.users.filter((user) => normalize(`${getName(user)} ${user.email || ''} ${user.phone || ''}`).includes(term));

    if (!rows.length) {
      refs.usersTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Kullanıcı bulunamadı.</td></tr>';
      return;
    }

    refs.usersTable.innerHTML = rows.map((user) => {
      const role = getRole(user);
      const self = state.adminUser?.uid === user.id;
      return `
        <tr>
          <td>
            <div class="bk-row-title">
              <strong>${escapeHTML(getName(user))}</strong>
              <small>${escapeHTML(user.id)}</small>
            </div>
          </td>
          <td>
            <div class="bk-row-title">
              <span>${escapeHTML(user.email || '-')}</span>
              <small>${escapeHTML(user.phone || user.address || '')}</small>
            </div>
          </td>
          <td>
            <select class="form-select form-select-sm bk-role-select role-select" data-id="${user.id}" ${self ? 'data-self="true"' : ''}>
              ${Object.entries(roleLabels).map(([value, label]) => `<option value="${value}" ${role === value ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
          </td>
          <td>${formatDate(user.createdAt || user.kayit_tarihi)}</td>
          <td>
            <div class="bk-action-group">
              <button class="btn btn-outline-primary btn-sm open-user-chat-btn" data-id="${user.id}" data-name="${escapeHTML(getName(user))}">
                <i class="fa-solid fa-message"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm delete-user-btn" data-id="${user.id}" ${self ? 'disabled title="Kendi hesabınızı buradan silemezsiniz."' : ''}>
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderChatUsers() {
    const term = normalize(refs.chatUserSearch?.value);
    const rows = state.users.filter((user) => {
      if (user.id === state.adminUser?.uid) return false;
      return normalize(`${getName(user)} ${user.email || ''}`).includes(term);
    });

    if (!rows.length) {
      refs.chatUsersList.innerHTML = '<li class="list-group-item text-center text-muted py-4">Kişi bulunamadı.</li>';
      return;
    }

    refs.chatUsersList.innerHTML = rows.map((user) => `
      <li class="list-group-item list-group-item-action ${state.currentChatPartner === user.id ? 'active' : ''}" data-uid="${user.id}" data-name="${escapeHTML(getName(user))}">
        <div class="bk-row-title">
          <strong>${escapeHTML(getName(user))}</strong>
          <small>${escapeHTML(user.email || '')}</small>
        </div>
      </li>
    `).join('');
  }

  function renderListingDetail(listingId) {
    const listing = state.listings.find((item) => item.id === listingId);
    if (!listing) return showAlert('İlan bulunamadı.', 'danger');

    refs.detailTitle.textContent = listing.baslik || 'İlan Detayı';
    refs.detailBody.innerHTML = `
      <div class="bk-row-title mb-3">
        <strong>${escapeHTML(listing.baslik || 'İsimsiz ilan')}</strong>
        <small>${escapeHTML(getListingOwnerName(listing))} · ${formatDate(listing.eklenme_tarihi)}</small>
      </div>
      <div class="row g-3 mb-3">
        <div class="col-md-4"><span class="bk-chip">${escapeHTML(listing.ilan_tipi === 'employer' ? 'İşveren' : 'İş Arayan')}</span></div>
        <div class="col-md-4"><strong>Konum:</strong> ${escapeHTML(listing.konum || '-')}</div>
        <div class="col-md-4"><strong>Çalışma:</strong> ${escapeHTML(listing.calisma_sekli || '-')}</div>
        <div class="col-md-4"><strong>Maaş:</strong> ${escapeHTML(listing.maas || listing.salary || '-')}</div>
        <div class="col-md-4"><strong>Deneyim:</strong> ${escapeHTML(listing.deneyim || listing.experience || '-')}</div>
        <div class="col-md-4"><strong>Telefon:</strong> ${escapeHTML(listing.iletisim_telefon || listing.contact_phone || '-')}</div>
      </div>
      <p class="mb-0">${escapeHTML(listing.aciklama || 'Açıklama yok.')}</p>
    `;

    new bootstrap.Modal(refs.detailModal).show();
  }

  async function updateListingStatus(id, nextStatus) {
    await db.collection('ilanlar').doc(id).update({
      durum: nextStatus,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    const listing = state.listings.find((item) => item.id === id);
    if (listing) listing.durum = nextStatus;
    renderListings();
    refs.activeListings.textContent = state.listings.filter((item) => (item.durum || 'aktif') === 'aktif').length;
    showAlert(`İlan ${nextStatus === 'aktif' ? 'aktif edildi' : 'pasife alındı'}.`, 'success');
  }

  async function deleteListing(id) {
    await db.collection('ilanlar').doc(id).delete();
    state.listings = state.listings.filter((item) => item.id !== id);
    refs.totalListings.textContent = state.listings.length;
    refs.activeListings.textContent = state.listings.filter((item) => (item.durum || 'aktif') === 'aktif').length;
    renderListings();
    showAlert('İlan silindi.', 'success');
  }

  async function updateUserRole(uid, role) {
    const isAdminRole = role === 'admin';
    await db.collection('users').doc(uid).set({
      role,
      isAdmin: isAdminRole,
      roleUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      roleUpdatedBy: state.adminUser.uid
    }, { merge: true });

    if (cloudFunctions) {
      try {
        await cloudFunctions.httpsCallable('setUserRole')({ uid, role });
      } catch (error) {
        console.warn('Custom claim rol güncellemesi atlandı:', error);
      }
    }

    const user = state.users.find((item) => item.id === uid);
    if (user) {
      user.role = role;
      user.isAdmin = isAdminRole;
    }
    showAlert(`${getName(user)} için rol ${roleLabels[role]} yapıldı.`, 'success');
  }

  async function deleteUser(uid) {
    if (cloudFunctions) {
      try {
        await cloudFunctions.httpsCallable('deleteUserAccount')({ uid });
      } catch (error) {
        console.warn('Auth hesabı silinemedi, Firestore kaydı silinecek:', error);
      }
    }

    await db.collection('users').doc(uid).delete();
    state.users = state.users.filter((item) => item.id !== uid);
    refs.totalUsers.textContent = state.users.length;
    renderUsers();
    renderChatUsers();
    showAlert('Kullanıcı kaydı silindi.', 'success');
  }

  function selectChatPartner(uid, name) {
    state.currentChatPartner = uid;
    refs.chatPartnerName.textContent = name || 'Kullanıcı';
    refs.chatPartnerMeta.textContent = 'Admin destek sohbeti';
    refs.chatPartnerAvatar.textContent = (name || '?').charAt(0).toLocaleUpperCase('tr-TR');
    renderChatUsers();
    startChatListener();
  }

  function startChatListener() {
    if (state.chatUnsubscribe) state.chatUnsubscribe();
    if (!state.currentChatPartner || !state.adminUser) return;

    refs.chatWindow.innerHTML = '<div class="bk-empty-state"><div class="spinner-border text-primary"></div><p>Mesajlar yükleniyor...</p></div>';

    state.chatUnsubscribe = db.collection('messages')
      .where('participants', 'array-contains', state.adminUser.uid)
      .onSnapshot((snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if ((data.participants || []).includes(state.currentChatPartner)) messages.push({ id: doc.id, ...data });
        });
        messages.sort((a, b) => {
          const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return ta - tb;
        });
        renderChatMessages(messages);
      }, (error) => {
        console.error('Mesaj dinleme hatası:', error);
        refs.chatWindow.innerHTML = '<div class="bk-empty-state text-danger"><p>Mesajlar yüklenemedi.</p></div>';
      });
  }

  function renderChatMessages(messages) {
    if (!messages.length) {
      refs.chatWindow.innerHTML = '<div class="bk-empty-state"><i class="fa-regular fa-comments"></i><p>Bu kullanıcıyla henüz mesaj yok.</p></div>';
      return;
    }

    refs.chatWindow.innerHTML = messages.map((message) => {
      const mine = message.sender === state.adminUser.uid;
      return `
        <div class="msg ${mine ? 'from-me' : 'from-them'}">
          <span>${escapeHTML(message.text || '')}</span>
          <button class="delete-message-btn" data-id="${message.id}" title="Mesajı sil">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <div class="bk-message-meta">${formatTime(message.timestamp)}</div>
        </div>
      `;
    }).join('');
    refs.chatWindow.scrollTop = refs.chatWindow.scrollHeight;
  }

  async function sendMessage() {
    const text = refs.messageInput.value.trim();
    if (!text) return;
    if (!state.currentChatPartner) return showAlert('Önce bir kullanıcı seç.', 'warning');

    await db.collection('messages').add({
      sender: state.adminUser.uid,
      participants: [state.adminUser.uid, state.currentChatPartner],
      recipients: [state.currentChatPartner],
      text,
      type: 'support',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    refs.messageInput.value = '';
  }

  async function deleteMessagesByFilter(filterFn) {
    const snap = await db.collection('messages').get();
    let batch = db.batch();
    let count = 0;
    let pending = 0;

    for (const doc of snap.docs) {
      if (!filterFn(doc.data())) continue;
      batch.delete(doc.ref);
      count += 1;
      pending += 1;
      if (pending === 450) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }

    if (pending > 0) await batch.commit();
    return count;
  }

  function bindEvents() {
    refs.refreshBtn?.addEventListener('click', async () => {
      try {
        await loadDashboardData();
        showAlert('Veriler yenilendi.', 'success');
      } catch (error) {
        console.error(error);
        showAlert('Veriler yenilenirken hata oluştu.', 'danger');
      }
    });

    refs.listingSearch?.addEventListener('input', renderListings);
    refs.listingStatus?.addEventListener('change', renderListings);
    refs.userSearch?.addEventListener('input', renderUsers);
    refs.chatUserSearch?.addEventListener('input', renderChatUsers);

    refs.toggleChatUsersBtn?.addEventListener('click', () => {
      refs.chatUsersList.classList.toggle('d-none');
    });

    refs.listingTable?.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      try {
        if (button.classList.contains('view-detail-btn')) renderListingDetail(button.dataset.id);

        if (button.classList.contains('toggle-listing-status-btn')) {
          await updateListingStatus(button.dataset.id, button.dataset.status);
        }

        if (button.classList.contains('delete-listing-btn')) {
          if (confirm('Bu ilan kalıcı olarak silinsin mi?')) await deleteListing(button.dataset.id);
        }

        if (button.classList.contains('dm-btn')) {
          if (!button.dataset.ownerId) return showAlert('Bu ilana bağlı kullanıcı bulunamadı.', 'warning');
          selectChatPartner(button.dataset.ownerId, button.dataset.ownerName);
          document.getElementById('mesajlasma-yonetimi')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (error) {
        console.error(error);
        showAlert('İşlem tamamlanamadı: ' + (error.message || 'Bilinmeyen hata'), 'danger');
      }
    });

    refs.usersTable?.addEventListener('change', async (event) => {
      const select = event.target.closest('.role-select');
      if (!select) return;

      const oldUser = state.users.find((item) => item.id === select.dataset.id);
      const oldRole = getRole(oldUser);

      if (select.dataset.self === 'true' && select.value !== 'admin') {
        select.value = oldRole;
        return showAlert('Kendi admin yetkini panelden düşürmene izin vermedim.', 'warning');
      }

      try {
        await updateUserRole(select.dataset.id, select.value);
      } catch (error) {
        select.value = oldRole;
        console.error(error);
        showAlert('Rol güncellenemedi: ' + (error.message || 'Bilinmeyen hata'), 'danger');
      }
    });

    refs.usersTable?.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      try {
        if (button.classList.contains('open-user-chat-btn')) {
          selectChatPartner(button.dataset.id, button.dataset.name);
          document.getElementById('mesajlasma-yonetimi')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (button.classList.contains('delete-user-btn')) {
          if (confirm('Bu kullanıcı kaydı silinsin mi?')) await deleteUser(button.dataset.id);
        }
      } catch (error) {
        console.error(error);
        showAlert('Kullanıcı işlemi tamamlanamadı: ' + (error.message || 'Bilinmeyen hata'), 'danger');
      }
    });

    refs.chatUsersList?.addEventListener('click', (event) => {
      const item = event.target.closest('[data-uid]');
      if (item) selectChatPartner(item.dataset.uid, item.dataset.name);
    });

    refs.chatWindow?.addEventListener('click', async (event) => {
      const button = event.target.closest('.delete-message-btn');
      if (!button) return;
      if (!confirm('Bu mesaj silinsin mi?')) return;

      try {
        await db.collection('messages').doc(button.dataset.id).delete();
        showAlert('Mesaj silindi.', 'success');
      } catch (error) {
        console.error(error);
        showAlert('Mesaj silinemedi: ' + (error.message || 'Bilinmeyen hata'), 'danger');
      }
    });

    refs.sendMessageBtn?.addEventListener('click', () => {
      sendMessage().catch((error) => {
        console.error(error);
        showAlert('Mesaj gönderilemedi: ' + (error.message || 'Bilinmeyen hata'), 'danger');
      });
    });

    refs.messageInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        refs.sendMessageBtn.click();
      }
    });

    refs.clearChatBtn?.addEventListener('click', async () => {
      if (!state.currentChatPartner) return showAlert('Önce bir sohbet seç.', 'warning');
      if (!confirm('Seçili sohbetin tüm mesajları kalıcı olarak silinsin mi?')) return;

      try {
        const uid = state.currentChatPartner;
        const count = await deleteMessagesByFilter((message) => {
          const participants = message.participants || [];
          return participants.includes(state.adminUser.uid) && participants.includes(uid);
        });
        showAlert(`${count} mesaj silindi.`, 'success');
      } catch (error) {
        console.error(error);
        showAlert('Sohbet silinemedi: ' + (error.message || 'Bilinmeyen hata'), 'danger');
      }
    });

    refs.clearAllMessagesBtn?.addEventListener('click', async () => {
      const ok = confirm('Platformdaki tüm mesajları kalıcı olarak silmek istediğine emin misin?');
      if (!ok) return;
      const secondOk = confirm('Bu işlem geri alınamaz. Son kez onaylıyor musun?');
      if (!secondOk) return;

      try {
        const count = await deleteMessagesByFilter(() => true);
        refs.totalMessages.textContent = Math.max(0, Number(refs.totalMessages.textContent || 0) - count);
        showAlert(`${count} mesaj kalıcı olarak silindi.`, 'success');
      } catch (error) {
        console.error(error);
        showAlert('Toplu silme tamamlanamadı: ' + (error.message || 'Bilinmeyen hata'), 'danger');
      }
    });

    document.getElementById('adminLogoutBtn')?.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'login.html';
    });
  }

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      if (!isAdminLike(userData)) {
        showAlert('Bu sayfaya erişim yetkin yok.', 'danger');
        await auth.signOut();
        window.location.href = 'login.html';
        return;
      }

      state.adminUser = user;
      state.adminData = userData;
      refs.currentUser.textContent = `${getName(userData)} olarak giriş yaptın.`;
      setLoading(false);

      if (!state.booted) {
        bindEvents();
        state.booted = true;
      }

      await loadDashboardData();
    } catch (error) {
      console.error('Admin panel başlangıç hatası:', error);
      showAlert('Panel yüklenemedi: ' + (error.message || 'Bilinmeyen hata'), 'danger');
      setLoading(false);
    }
  });
});
