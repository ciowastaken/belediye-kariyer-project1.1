// ilanlar_app.js — Firebase compat (v8) ile uyumlu
// HTML tarafında firebase-compat scriptleri yüklü ve window.auth / window.db atanmış olmalı.

const auth = window.auth;
const db   = window.db;

/* -------------------- Yardımcılar -------------------- */
function showMessage(message, type = 'info', targetElementId = 'formMessage') {
  const el = document.getElementById(targetElementId);
  if (el) {
    el.textContent = message;
    el.className = `mt-3 text-center alert alert-${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }
}

function ensureHiddenIdField() {
  const form = document.getElementById('new-listing-form');
  if (form) {
    ensureHiddenIdField();
    form.addEventListener('submit', handleAddOrUpdate);
  }

  const toggleBtn = document.getElementById('toggle-form-button');
  if (toggleBtn && form) {
    toggleBtn.addEventListener('click', () => {
      if (!auth.currentUser) {
        showMessage('İlan oluşturmak için giriş yapmalısınız.', 'warning');
        return;
      }
      const isVisible = form.style.display === 'block';
      form.style.display = isVisible ? 'none' : 'block';
      toggleBtn.innerHTML = isVisible
        ? '<i class="fas fa-plus-circle me-2"></i>Yeni İlan Ekle'
        : '<i class="fas fa-minus-circle me-2"></i>İlan Ekleme Formunu Kapat';
      if (isVisible) {
        form.reset();
        document.getElementById('new-listing-id').value = '';
        setSubmitBtnText('İlanı Kaydet');
      }
    });
  }
};
function formatTimeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)    return 'az önce';
  if (diff < 3600)  return `${Math.floor(diff/60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff/3600)} sa önce`;
  return date.toLocaleDateString('tr-TR') + ' ' +
         date.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
}

function renderNotifications(items) {
  const listEl  = document.getElementById('notificationList');
  const badgeEl = document.getElementById('notificationCountBadge');
  if (!listEl || !badgeEl) return;

  listEl.innerHTML = '';
  if (!items || items.length === 0) {
    listEl.innerHTML = '<li class="no-notifications">Henüz yeni bildiriminiz yok.</li>';
    badgeEl.style.display = 'none';
    return;
  }

  let unread = 0;
  items.forEach(n => { if (!n.read) unread++; });

  items.forEach(n => {
    const li = document.createElement('li');
    li.className = `notification-item ${n.read ? '' : 'unread'}`;
    li.innerHTML = `
      <i class="fas ${n.icon || 'fa-bell'} icon"></i>
      <div class="details">
        <div class="title">${n.title || 'Bildirim'}</div>
        <div class="message-text">${n.message || ''}</div>
        <div class="time-ago">${formatTimeAgo(n.timestamp)}</div>
      </div>`;
    li.addEventListener('click', async () => {
      if (!n.read) {
        try {
          await db.collection('users').doc(n.uid)
            .collection('notifications').doc(n.id).update({ read: true });
        } catch (e) {
          console.warn('Bildirim okundu güncellenemedi:', e);
        }
      }
      document.getElementById('notificationDropdown')?.classList.remove('show');
    });
    listEl.appendChild(li);
  });

  if (unread > 0) {
    badgeEl.textContent = String(unread);
    badgeEl.style.display = 'block';
  } else {
    badgeEl.style.display = 'none';
  }
}

/* -------------------- Kullanıcıya Özel Bildirimler -------------------- */
let notifUnsub = null;
let lastNotifDocs = [];

function subscribeNotifications(uid) {
  if (notifUnsub) { try { notifUnsub(); } catch(_){} notifUnsub = null; }

  const markAllBtn = document.getElementById('markAllAsRead');
  if (markAllBtn) {
    markAllBtn.onclick = async () => {
      const unread = lastNotifDocs.filter(d => !d.read);
      if (unread.length === 0) return;
      try {
        const batch = db.batch();
        unread.forEach(n => {
          const ref = db.collection('users').doc(uid)
                        .collection('notifications').doc(n.id);
          batch.update(ref, { read: true });
        });
        await batch.commit();
        showMessage('Tüm bildirimler okundu olarak işaretlendi.', 'info');
      } catch (e) {
        console.error('Tümünü oku hatası:', e);
        showMessage('Bildirimler işaretlenirken hata oluştu.', 'danger');
      }
    };
  }

  notifUnsub = db.collection('users').doc(uid)
    .collection('notifications')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .onSnapshot((qs) => {
      const items = [];
      qs.forEach(doc => {
        const d = doc.data() || {};
        items.push({
          id: doc.id,
          uid,
          title: d.title || '',
          message: d.message || '',
          icon: d.icon || 'fa-bell',
          read: !!d.read,
          timestamp: d.timestamp || null,
          related_listing_id: d.related_listing_id || null,
          type: d.type || null,
        });
      });
      lastNotifDocs = items;
      renderNotifications(items);
    }, (err) => {
      console.error('Bildirim dinleme hatası:', err);
      renderNotifications([]);
    });
}

/* -------------------- Oturum Durumu -------------------- */
auth.onAuthStateChanged(function(user) {
  const toggleFormButton = document.getElementById('toggle-form-button');
  const newListingForm   = document.getElementById('new-listing-form');

  if (user) {
    if (toggleFormButton) {
      toggleFormButton.textContent = 'Yeni İlan Ekle';
      toggleFormButton.classList.remove('btn-secondary');
      toggleFormButton.classList.add('btn-primary');
      toggleFormButton.disabled = false;
    }
    subscribeNotifications(user.uid);
  } else {
    if (toggleFormButton) {
      toggleFormButton.textContent = 'İlan Oluşturmak İçin Giriş Yapın';
      toggleFormButton.classList.remove('btn-primary');
      toggleFormButton.classList.add('btn-secondary');
      toggleFormButton.disabled = true;
    }
    if (newListingForm) newListingForm.style.display = 'none';
    if (notifUnsub) { try { notifUnsub(); } catch(_){} notifUnsub = null; }
    renderNotifications([]);
  }

  fetchListings(); // her durumda listeyi çek
});

/* -------------------- İlanları Çek ve Listele -------------------- */
async function fetchListings() {

  const listingsContainer = document.getElementById('job-listings-container');
  if (listingsContainer) {
    listingsContainer.addEventListener('click', e => {
      const btn = e.target.closest('.message-btn');
      if (!btn) return;
      const ownerId   = btn.getAttribute('data-owner-id');
      const ownerName = btn.getAttribute('data-owner-name');
      // URL parametrelerini encode ederek mesajlar sayfasına yönlendir
      window.location.href = `mesajlar.html?userId=${ownerId}&ownerName=${ownerName}`;
    });
  }

  try {
    // 2) Filtre ve arama değerlerini al
    const filterType     = document.getElementById('filter-type')?.value || '';
    const filterWorkType = document.getElementById('filter-work-type')?.value || '';
    const filterLocation = document.getElementById('filter-location')?.value || '';
    const searchTerm     = (document.getElementById('search-input')?.value || '').toLowerCase();

    // 3) Firestore sorgusunu oluştur
    let q = db.collection('ilanlar').where('durum', '==', 'aktif');
    if (filterType)     q = q.where('ilan_tipi', '==', filterType);
    if (filterWorkType) q = q.where('calisma_sekli', '==', filterWorkType);
    if (filterLocation) q = q.where('konum', '==', filterLocation);

    // 4) Sorguyu tarihe göre sırala ve çek
    const snapshot = await q.orderBy('eklenme_tarihi', 'desc').get();

    // 5) Container’ı temizle, döngüye başla
    listingsContainer.innerHTML = '';
    let hasResults = false;

    snapshot.forEach(docSnap => {
      const listing = docSnap.data();
      const id      = docSnap.id;

      // 6) Arama terimine göre istemci-tarafı filtre
      const matchesSearch =
        !searchTerm ||
        (listing.baslik && listing.baslik.toLowerCase().includes(searchTerm)) ||
        (listing.aciklama && listing.aciklama.toLowerCase().includes(searchTerm)) ||
        (listing.poster_name && listing.poster_name.toLowerCase().includes(searchTerm));

      if (!matchesSearch) return;
      hasResults = true;

      // 7) Kartı oluştur
      const date = listing.eklenme_tarihi
        ? new Date(listing.eklenme_tarihi.toDate()).toLocaleDateString('tr-TR')
        : 'Belirtilmemiş';

      const cardCol = document.createElement('div');
      cardCol.className = 'col-md-6 col-lg-4 mb-4 animate__animated animate__fadeIn';
      cardCol.innerHTML = `
        <div class="job-card">
          <div class="card-header">
            <span class="job-type ${listing.ilan_tipi || 'job-seeker'}">
              ${listing.ilan_tipi === 'employer' ? 'İşveren' : 'İş Arayan'}
            </span>
            <span class="poster-name">
              <i class="fas fa-user"></i> ${listing.poster_name || 'Anonim'}
            </span>
          </div>
          <div class="card-body">
            <h5 class="job-title">${listing.baslik || 'İsimsiz İlan'}</h5>
            <p class="job-description">${listing.aciklama || 'Açıklama yok'}</p>
            <p class="job-location">
              <i class="fas fa-map-marker-alt"></i> ${listing.konum || 'Konum belirtilmemiş'}
            </p>
            <p class="job-work-type">
              <i class="fas fa-briefcase"></i> Çalışma Şekli: ${listing.calisma_sekli || 'Belirtilmemiş'}
            </p>
          </div>
          <div class="card-footer d-flex align-items-center">
            <span class="job-date me-auto">Tarih: ${date}</span>

            <button class="btn btn-sm btn-primary view-details-btn"
                    data-id="${id}">
              Detayları Gör
            </button>

            <button class="btn btn-sm btn-outline-secondary message-btn ms-2"
                    data-owner-id="${listing.ilan_sahibi_id}"
                    data-owner-name="${encodeURIComponent(listing.poster_name||'')}">
              <i class="fas fa-envelope"></i> Mesaj Gönder
            </button>

            ${
              auth.currentUser && auth.currentUser.uid === listing.ilan_sahibi_id
                ? `<button class="btn btn-sm btn-warning ms-2 edit-listing-btn" data-id="${id}">
                     <i class="fas fa-edit"></i> Düzenle
                   </button>
                   <button class="btn btn-sm btn-danger ms-2 delete-listing-btn" data-id="${id}">
                     <i class="fas fa-trash-alt"></i> Sil
                   </button>`
                : ''
            }
          </div>
        </div>
      `;
      listingsContainer.appendChild(cardCol);
    });

    // 8) Sonuç yoksa kullanıcıya mesaj göster
    if (!hasResults) {
      listingsContainer.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          Aradığınız kriterlere uygun aktif ilan bulunmamaktadır.
        </div>`;
    }

  } catch (error) {
    console.error("İlanlar yüklenirken hata:", error);
    listingsContainer.innerHTML = `
      <div class="col-12 text-center text-danger py-5">
        İlanlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
      </div>`;
  }
}


/* -------------------- Detay Modalı -------------------- */
async function showListingDetails(listingId) {
  const modalElement = document.getElementById('jobDetailModal');
  if (!modalElement) return;

  const modal      = new bootstrap.Modal(modalElement);
  const modalBody  = document.getElementById('jobDetailModalBody');
  const modalTitle = document.getElementById('jobDetailModalTitle');

  modalBody.innerHTML = '<div class="text-center text-muted py-3">Detaylar yükleniyor...</div>';
  modalTitle.textContent = 'İlan Detayları';
  modal.show();

  try {
    const docSnap = await db.collection("ilanlar").doc(listingId).get();
    if (docSnap.exists) {
      const d = docSnap.data();
      const eklenmeTarihi = d.eklenme_tarihi
        ? new Date(d.eklenme_tarihi.toDate()).toLocaleDateString('tr-TR')
        : 'N/A';

      modalTitle.textContent = d.baslik || 'İlan Detayları';
      modalBody.innerHTML = `
        <p><strong>İlan Tipi:</strong>
          <span class="badge ${d.ilan_tipi === 'employer' ? 'bg-success' : 'bg-primary'}">
            ${d.ilan_tipi === 'employer' ? 'İşveren' : 'İş Arayan'}
          </span>
        </p>
        <p><strong>İlan Sahibi:</strong> ${d.poster_name || 'Bilinmiyor'}</p>
        <p><strong>Konum:</strong> ${d.konum || 'Belirtilmemiş'}</p>
        <p><strong>Çalışma Şekli:</strong> ${d.calisma_sekli || 'Belirtilmemiş'}</p>
        <p><strong>Yayın Tarihi:</strong> ${eklenmeTarihi}</p>
        <hr>
        <p><strong>Açıklama:</strong></p>
        <p>${d.aciklama || 'Açıklama mevcut değil.'}</p>`;
    } else {
      modalBody.innerHTML = '<p class="text-danger text-center py-3">İlan detayı bulunamadı.</p>';
      modalTitle.textContent = 'Hata';
    }
  } catch (error) {
    console.error("İlan detayı getirilirken hata:", error);
    modalBody.innerHTML = '<p class="text-danger text-center py-3">Detaylar yüklenirken bir hata oluştu.</p>';
    modalTitle.textContent = 'Hata';
  }
}

/* -------------------- Düzenleme Formu -------------------- */
async function openEditForm(listingId) {
  try {
    const snap = await db.collection('ilanlar').doc(listingId).get();
    if (!snap.exists) { showMessage('İlan bulunamadı.', 'danger'); return; }

    const data = snap.data();
    if (!auth.currentUser || auth.currentUser.uid !== data.ilan_sahibi_id) {
      showMessage('Bu ilanı düzenleme yetkiniz yok.', 'danger');
      return;
    }

    const hidden = ensureHiddenIdField();
    if (hidden) hidden.value = listingId;

    document.getElementById('new-listing-type').value        = data.ilan_tipi || '';
    document.getElementById('new-listing-title').value       = data.baslik || '';
    document.getElementById('new-listing-description').value = data.aciklama || '';
    document.getElementById('new-listing-location').value    = data.konum || '';
    document.getElementById('new-listing-work-type').value   = data.calisma_sekli || '';
    document.getElementById('new-listing-poster-name').value = data.poster_name || '';

    setSubmitBtnText('Güncelle');

    const form = document.getElementById('new-listing-form');
    if (form) form.style.display = 'block';

    const toggleBtn = document.getElementById('toggle-form-button');
    if (toggleBtn) {
      toggleBtn.innerHTML = '<i class="fas fa-minus-circle me-2"></i>İlan Ekleme Formunu Kapat';
    }
  } catch (err) {
    console.error('Düzenleme formu açılırken hata:', err);
    showMessage('Form yüklenirken bir hata oluştu.', 'danger');
  }
}

/* -------------------- Ekle / Güncelle -------------------- */
async function handleAddOrUpdate(e) {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) { showMessage('İlan eklemek/düzenlemek için giriş yapmalısınız.', 'warning'); return; }

  const hidden = ensureHiddenIdField();
  const id = hidden ? hidden.value : '';

  const ilan_tipi     = document.getElementById('new-listing-type').value;
  const baslik        = document.getElementById('new-listing-title').value;
  const aciklama      = document.getElementById('new-listing-description').value;
  const konum         = document.getElementById('new-listing-location').value;
  const calisma_sekli = document.getElementById('new-listing-work-type').value;
  const poster_name   = document.getElementById('new-listing-poster-name').value;

  if (!ilan_tipi || !baslik || !aciklama || !konum || !calisma_sekli || !poster_name) {
    showMessage('Lütfen tüm alanları doldurun.', 'warning'); return;
  }

  try {
    if (id) {
      const snap = await db.collection('ilanlar').doc(id).get();
      if (!snap.exists) { showMessage('İlan bulunamadı.', 'danger'); return; }
      if (snap.data().ilan_sahibi_id !== user.uid) { showMessage('Bu ilanı düzenleme yetkiniz yok.', 'danger'); return; }

      const payload = {
        ilan_tipi, baslik, aciklama, konum, calisma_sekli, poster_name,
        ilan_sahibi_id: user.uid,
        olusturan_email: user.email,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('ilanlar').doc(id).update(payload);
      showMessage('İlan başarıyla güncellendi.', 'success');
    } else {
      const payload = {
        ilan_tipi, baslik, aciklama, konum, calisma_sekli, poster_name,
        ilan_sahibi_id: user.uid,
        olusturan_email: user.email,
        eklenme_tarihi: firebase.firestore.FieldValue.serverTimestamp(),
        durum: 'aktif'
      };
      await db.collection('ilanlar').add(payload);
      showMessage('İlan başarıyla eklendi.', 'success');
    }

    e.target.reset();
    if (hidden) hidden.value = '';
    setSubmitBtnText('İlanı Kaydet');

    const form = document.getElementById('new-listing-form');
    if (form) form.style.display = 'none';
    const toggleBtn = document.getElementById('toggle-form-button');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Yeni İlan Ekle';

    fetchListings();
  } catch (error) {
    console.error("Kaydet/Güncelle sırasında hata:", error);
    showMessage('İşlem sırasında bir hata oluştu: ' + (error.message || ''), 'danger');
  }
}

/* -------------------- Silme -------------------- */
async function deleteListing(listingId) {
  const user = auth.currentUser;
  if (!user) { showMessage('İlan silmek için giriş yapmalısınız.', 'warning'); return; }

  try {
    const snap = await db.collection('ilanlar').doc(listingId).get();
    if (snap.exists && snap.data().ilan_sahibi_id === user.uid) {
      await db.collection("ilanlar").doc(listingId).delete();
      showMessage('İlan başarıyla silindi!', 'success');
      fetchListings();
    } else {
      showMessage('Bu ilanı silme yetkiniz yok.', 'danger');
    }
  } catch (error) {
    console.error("İlan silinirken hata:", error);
    showMessage('İlan silinirken bir hata oluştu: ' + (error.message || ''), 'danger');
  }
}

/* -------------------- DOM Ready -------------------- */
document.addEventListener('DOMContentLoaded', () => { bindNotificationDropdown();
  /**
 * Bildirim listesini DOM’a render eder.
 */
  function renderNotifications(items) {
    const listEl  = document.getElementById('notificationList');
    const badgeEl = document.getElementById('notificationCountBadge');
    if (!listEl || !badgeEl) return;
    listEl.innerHTML = '';
  
    if (!items.length) {
      listEl.innerHTML = '<li class="no-notifications">Henüz yeni bildiriminiz yok.</li>';
      badgeEl.style.display = 'none';
      return;
    }

    let unread = 0;
    items.forEach(n => {
      if (!n.read) unread++;
      const li = document.createElement('li');
      li.className = `notification-item ${n.read ? '' : 'unread'}`;
      li.innerHTML = `
        <div class="icon"><i class="fas ${n.icon}"></i></div>
        <div class="details">
          <div class="title">${n.title}</div>
          <div class="message-text">${n.message}</div>
          <div class="time-ago">${formatTimeAgo(n.timestamp)}</div>
        </div>
      `;
      li.addEventListener('click', async () => {
        if (!n.read) {
          await db
            .collection('users').doc(currentUser.uid)
            .collection('notifications').doc(n.id)
            .update({ read: true });
        }
      
        if (n.type === 'message') {
          window.location.href =
            `mesajlar.html?userId=${n.senderId}` +
            `&ownerName=${encodeURIComponent(n.senderName)}`;
        }
      });
      listEl.appendChild(li);
    });
  
    badgeEl.textContent = unread;
    badgeEl.style.display = unread ? 'block' : 'none';
  }
  
  let notifUnsub = null;
  /**
   * Geçerli kullanıcı için bildirimleri dinler.
   */
  function subscribeNotifications(uid) {
    if (notifUnsub) notifUnsub();
  
    notifUnsub = db
      .collection('users').doc(uid)
      .collection('notifications')
      .orderBy('timestamp', 'desc')
      .onSnapshot(qs => {
        const items = [];
        qs.forEach(doc => {
          const d = doc.data();
          items.push({
            id:         doc.id,
            senderId:   d.senderId,
            senderName: d.senderName,
            title:      d.title,
            message:    d.message,
            icon:       d.icon,
            type:       d.type,
            read:       d.read,
            timestamp:  d.timestamp
          });
        });
        renderNotifications(items);
      }, err => {
        console.error('Bildirim dinleme hatası:', err);
        renderNotifications([]);
      });
  }
  bindNotificationDropdown();

  const form = document.getElementById('new-listing-form');
  if (form) {
    ensureHiddenIdField();
    form.addEventListener('submit', handleAddOrUpdate);
  }

  const toggleFormButton = document.getElementById('toggle-form-button');
  if (toggleFormButton && form) {
    toggleFormButton.addEventListener('click', () => {
      if (auth.currentUser === null) {
        showMessage('İlan oluşturmak için giriş yapmalısınız.', 'warning');
        return;
      }
      const isVisible = form.style.display === 'block';
      form.style.display = isVisible ? 'none' : 'block';
      if (isVisible) {
        toggleFormButton.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Yeni İlan Ekle';
        form.reset();
        const hidden = document.getElementById('new-listing-id');
        if (hidden) hidden.value = '';
        setSubmitBtnText('İlanı Kaydet');
      } else {
        toggleFormButton.innerHTML = '<i class="fas fa-minus-circle me-2"></i>İlan Ekleme Formunu Kapat';
      }
    });
  }

  // Navbar scroll efekti (HTML'de navbar varsa)
  const navbar = document.querySelector('.navbar-custom');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    });
  }

  // Filtre/Arama
  const filterType      = document.getElementById('filter-type');
  const filterWorkType  = document.getElementById('filter-work-type');
  const filterLocation  = document.getElementById('filter-location');
  const searchInput     = document.getElementById('search-input');
  const resetFiltersBtn = document.getElementById('reset-filters');

  if (filterType)     filterType.addEventListener('change', fetchListings);
  if (filterWorkType) filterWorkType.addEventListener('change', fetchListings);
  if (filterLocation) filterLocation.addEventListener('change', fetchListings);

  if (searchInput) {
    let t;
    searchInput.addEventListener('keyup', () => {
      clearTimeout(t);
      t = setTimeout(fetchListings, 500);
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (filterType)     filterType.value = '';
      if (filterWorkType) filterWorkType.value = '';
      if (filterLocation) filterLocation.value = '';
      if (searchInput)    searchInput.value = '';
      fetchListings();
    });
  }
});


// 1) Başvuruları çek
async function fetchApplications() {
  const snap = await db.collection('applications')
                       .orderBy('appliedAt', 'desc')
                       .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 2) Tabloya render et
async function renderApplications() {
  const apps = await fetchApplications();
  const tbody = document.getElementById('applications-body');
  tbody.innerHTML = apps.map(a => `
    <tr>
      <td>${a.ilanTitle}</td>
      <td>${a.userName}</td>
      <td>${a.userEmail}</td>
      <td>${new Date(a.appliedAt.toDate()).toLocaleDateString()}</td>
      <td>
        <select class="form-select status-select" data-id="${a.id}">
          ${['beklemede','onaylandı','reddedildi'].map(s=>`
            <option value="${s}" ${s===a.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-info view-cv" data-cv="${a.cvUrl}">
          CV Gör
        </button>
      </td>
    </tr>
  `).join('');
}

// 3) Durum güncelleme
document.getElementById('applications-body')
  .addEventListener('change', async e => {
    if (!e.target.matches('.status-select')) return;
    const id = e.target.dataset.id, newStatus = e.target.value;
    await db.collection('applications').doc(id).update({ status: newStatus });
    // opsiyonel: showMessage('Güncellendi','success')
  });

// 4) CV modal
document.getElementById('applications-body')
  .addEventListener('click', e => {
    if (!e.target.closest('.view-cv')) return;
    const url = e.target.closest('.view-cv').dataset.cv;
    document.getElementById('cv-iframe').src = url;
    new bootstrap.Modal(document.getElementById('cv-modal')).show();
  });

