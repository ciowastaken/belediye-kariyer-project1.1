(() => {
  const auth = window.auth;
  const db = window.db;

  const refs = {
    formMessage: document.getElementById('formMessage'),
    toggleFormButton: document.getElementById('toggle-form-button'),
    cancelFormButton: document.getElementById('cancel-listing-form'),
    form: document.getElementById('new-listing-form'),
    container: document.getElementById('job-listings-container'),
    filterType: document.getElementById('filter-type'),
    filterWorkType: document.getElementById('filter-work-type'),
    filterLocation: document.getElementById('filter-location'),
    searchInput: document.getElementById('search-input'),
    resetFilters: document.getElementById('reset-filters'),
    totalCount: document.getElementById('jobs-total-count'),
    employerCount: document.getElementById('jobs-employer-count'),
    seekerCount: document.getElementById('jobs-seeker-count'),
    detailModal: document.getElementById('jobDetailModal'),
    detailTitle: document.getElementById('jobDetailModalTitle'),
    detailBody: document.getElementById('jobDetailModalBody'),
    submitText: document.getElementById('new-listing-submit-text')
  };

  const fields = {
    id: document.getElementById('new-listing-id'),
    type: document.getElementById('new-listing-type'),
    category: document.getElementById('new-listing-category'),
    title: document.getElementById('new-listing-title'),
    description: document.getElementById('new-listing-description'),
    location: document.getElementById('new-listing-location'),
    workType: document.getElementById('new-listing-work-type'),
    posterName: document.getElementById('new-listing-poster-name'),
    phone: document.getElementById('new-listing-phone'),
    salary: document.getElementById('new-listing-salary'),
    experience: document.getElementById('new-listing-experience'),
    deadline: document.getElementById('new-listing-deadline'),
    benefits: document.getElementById('new-listing-benefits')
  };

  const state = {
    user: null,
    listings: [],
    users: new Map()
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
    if (!value) return 'Belirtilmedi';
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Belirtilmedi';
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatWorkType(value) {
    const labels = {
      'tam-zamanli': 'Tam zamanlı',
      'yari-zamanli': 'Yarı zamanlı',
      uzaktan: 'Uzaktan',
      staj: 'Staj',
      donemsel: 'Dönemsel',
      yevmiyeli: 'Yevmiyeli'
    };
    return labels[value] || value || '';
  }

  function showMessage(message, type = 'info') {
    if (window.BasiskeleUI?.toast) window.BasiskeleUI.toast(message, type);
    if (!refs.formMessage) return;
    refs.formMessage.textContent = message;
    refs.formMessage.className = `alert alert-${type === 'danger' ? 'danger' : type}`;
    refs.formMessage.classList.remove('d-none');
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => refs.formMessage.classList.add('d-none'), 5000);
  }

  function getValue(field) {
    return (field?.value || '').trim();
  }

  function setSubmitText(text, icon = 'fa-save') {
    if (refs.submitText) refs.submitText.innerHTML = `<i class="fas ${icon} me-2"></i>${text}`;
  }

  function setFormVisible(visible) {
    if (!refs.form) return;
    refs.form.style.display = visible ? 'block' : 'none';
    refs.toggleFormButton.innerHTML = visible
      ? '<i class="fas fa-minus-circle me-2"></i>İlan Formunu Kapat'
      : '<i class="fas fa-plus-circle me-2"></i>Yeni İlan Ekle';
  }

  function resetForm() {
    refs.form?.reset();
    if (fields.id) fields.id.value = '';
    setSubmitText('İlanı Kaydet');
    setFormVisible(false);
  }

  function fillForm(listing) {
    fields.id.value = listing.id || '';
    fields.type.value = listing.ilan_tipi || '';
    fields.category.value = listing.kategori || listing.category || '';
    fields.title.value = listing.baslik || '';
    fields.description.value = listing.aciklama || '';
    fields.location.value = listing.konum || '';
    fields.workType.value = listing.calisma_sekli || '';
    fields.posterName.value = listing.poster_name || '';
    fields.phone.value = listing.iletisim_telefon || listing.contact_phone || '';
    fields.salary.value = listing.maas || listing.salary || '';
    fields.experience.value = listing.deneyim || listing.experience || '';
    fields.deadline.value = listing.son_basvuru || listing.deadline || '';
    fields.benefits.value = listing.yan_haklar || listing.benefits || '';
    setSubmitText('İlanı Güncelle', 'fa-pen-to-square');
    setFormVisible(true);
    refs.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function listingPayload() {
    return {
      ilan_tipi: getValue(fields.type),
      kategori: getValue(fields.category),
      baslik: getValue(fields.title),
      aciklama: getValue(fields.description),
      konum: getValue(fields.location),
      calisma_sekli: getValue(fields.workType),
      poster_name: getValue(fields.posterName),
      iletisim_telefon: getValue(fields.phone),
      maas: getValue(fields.salary),
      deneyim: getValue(fields.experience),
      son_basvuru: getValue(fields.deadline),
      yan_haklar: getValue(fields.benefits)
    };
  }

  function validatePayload(payload) {
    const required = ['ilan_tipi', 'baslik', 'aciklama', 'konum', 'calisma_sekli', 'poster_name'];
    return required.every((key) => payload[key]);
  }

  async function loadUserMap() {
    try {
      const snap = await db.collection('users').get();
      state.users = new Map();
      snap.forEach((doc) => state.users.set(doc.id, doc.data()));
    } catch (error) {
      console.warn('Kullanıcı haritası yüklenemedi:', error);
    }
  }

  async function fetchListings() {
    refs.container.innerHTML = '<div class="col-12 text-center text-muted py-5"><div class="spinner-border text-primary"></div><p class="mt-2">İlanlar yükleniyor...</p></div>';

    try {
      const snapshot = await db.collection('ilanlar').where('durum', '==', 'aktif').get();
      state.listings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      state.listings.sort((a, b) => {
        const da = a.eklenme_tarihi?.toMillis ? a.eklenme_tarihi.toMillis() : 0;
        const dbb = b.eklenme_tarihi?.toMillis ? b.eklenme_tarihi.toMillis() : 0;
        return dbb - da;
      });

      renderListings();
    } catch (error) {
      console.error('İlanlar yüklenirken hata:', error);
      refs.container.innerHTML = '<div class="col-12 text-center text-danger py-5">İlanlar yüklenirken hata oluştu. Filtreleri azaltıp tekrar deneyin.</div>';
    }
  }

  function filteredListings() {
    const term = normalize(refs.searchInput.value);
    const type = refs.filterType.value;
    const workType = refs.filterWorkType.value;
    const location = refs.filterLocation.value;

    return state.listings.filter((listing) => {
      if (type && listing.ilan_tipi !== type) return false;
      if (workType && listing.calisma_sekli !== workType) return false;
      if (location && listing.konum !== location) return false;
      if (!term) return true;

      const haystack = normalize([
        listing.baslik,
        listing.aciklama,
        listing.poster_name,
        listing.kategori,
        listing.konum,
        listing.calisma_sekli,
        listing.maas,
        listing.deneyim,
        listing.yan_haklar
      ].join(' '));
      return haystack.includes(term);
    });
  }

  function updateStats(rows) {
    const all = state.listings;
    refs.totalCount.textContent = all.length;
    refs.employerCount.textContent = all.filter((item) => item.ilan_tipi === 'employer').length;
    refs.seekerCount.textContent = all.filter((item) => item.ilan_tipi !== 'employer').length;
    document.title = rows.length ? `İlanlar (${rows.length}) - Başiskele Kariyer` : 'İlanlar - Başiskele Kariyer';
  }

  function renderListings() {
    const rows = filteredListings();
    updateStats(rows);

    if (!rows.length) {
      refs.container.innerHTML = `
        <div class="col-12">
          <div class="bk-empty-state">
            <i class="fas fa-search"></i>
            <p>Aradığın kritere uygun aktif ilan bulunamadı.</p>
          </div>
        </div>
      `;
      return;
    }

    refs.container.innerHTML = rows.map((listing) => {
      const isOwner = state.user && state.user.uid === listing.ilan_sahibi_id;
      const ownerName = listing.poster_name || getOwnerName(listing.ilan_sahibi_id);
      const typeLabel = listing.ilan_tipi === 'employer' ? 'İşveren' : 'İş Arayan';
      const typeClass = listing.ilan_tipi === 'employer' ? 'success' : '';
      const workTypeLabel = formatWorkType(listing.calisma_sekli);

      return `
        <div class="col-md-6 col-xl-4">
          <article class="job-card">
            <div class="card-header d-flex align-items-center justify-content-between gap-2">
              <span class="bk-chip ${typeClass}">${escapeHTML(typeLabel)}</span>
              <small class="text-muted">${formatDate(listing.eklenme_tarihi)}</small>
            </div>
            <div class="card-body">
              <h2 class="h5 job-title">${escapeHTML(listing.baslik || 'İsimsiz ilan')}</h2>
              <p class="job-description">${escapeHTML(listing.aciklama || 'Açıklama yok')}</p>
              <div class="job-meta-list">
                <span><i class="fas fa-building"></i>${escapeHTML(ownerName || 'İlan sahibi')}</span>
                <span><i class="fas fa-map-marker-alt"></i>${escapeHTML(listing.konum || 'Konum belirtilmedi')}</span>
                <span><i class="fas fa-briefcase"></i>${escapeHTML(workTypeLabel || 'Çalışma şekli belirtilmedi')}</span>
                ${listing.kategori ? `<span><i class="fas fa-layer-group"></i>${escapeHTML(listing.kategori)}</span>` : ''}
                ${listing.maas ? `<span><i class="fas fa-wallet"></i>${escapeHTML(listing.maas)}</span>` : ''}
                ${listing.deneyim ? `<span><i class="fas fa-award"></i>${escapeHTML(listing.deneyim)}</span>` : ''}
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-sm btn-primary view-details-btn" data-id="${listing.id}">
                <i class="fas fa-eye me-1"></i>Detay
              </button>
              ${state.user && !isOwner && listing.ilan_sahibi_id ? `
                <button class="btn btn-sm btn-outline-primary message-btn" data-owner-id="${escapeHTML(listing.ilan_sahibi_id)}" data-owner-name="${encodeURIComponent(ownerName || 'İlan Sahibi')}">
                  <i class="fas fa-paper-plane me-1"></i>Mesaj
                </button>
              ` : ''}
              ${isOwner ? `
                <button class="btn btn-sm btn-warning edit-listing-btn" data-id="${listing.id}">
                  <i class="fas fa-edit me-1"></i>Düzenle
                </button>
                <button class="btn btn-sm btn-outline-danger delete-listing-btn" data-id="${listing.id}">
                  <i class="fas fa-trash-alt me-1"></i>Sil
                </button>
              ` : ''}
            </div>
          </article>
        </div>
      `;
    }).join('');
  }

  function getOwnerName(uid) {
    const data = state.users.get(uid);
    if (!data) return '';
    return [data.name, data.surname].filter(Boolean).join(' ') || data.email || '';
  }

  function showDetails(id) {
    const listing = state.listings.find((item) => item.id === id);
    if (!listing) return showMessage('İlan bulunamadı.', 'danger');

    refs.detailTitle.textContent = listing.baslik || 'İlan detayı';
    refs.detailBody.innerHTML = `
      <div class="d-flex flex-wrap gap-2 mb-3">
        <span class="bk-chip ${listing.ilan_tipi === 'employer' ? 'success' : ''}">${listing.ilan_tipi === 'employer' ? 'İşveren' : 'İş Arayan'}</span>
        <span class="bk-chip">${escapeHTML(listing.konum || 'Konum yok')}</span>
        <span class="bk-chip">${escapeHTML(listing.calisma_sekli || 'Çalışma şekli yok')}</span>
      </div>
      <p>${escapeHTML(listing.aciklama || 'Açıklama yok.')}</p>
      <div class="row g-3">
        <div class="col-md-6"><strong>Sektör:</strong> ${escapeHTML(listing.kategori || '-')}</div>
        <div class="col-md-6"><strong>İlan sahibi:</strong> ${escapeHTML(listing.poster_name || getOwnerName(listing.ilan_sahibi_id) || '-')}</div>
        <div class="col-md-6"><strong>Telefon:</strong> ${escapeHTML(listing.iletisim_telefon || '-')}</div>
        <div class="col-md-6"><strong>Maaş:</strong> ${escapeHTML(listing.maas || '-')}</div>
        <div class="col-md-6"><strong>Deneyim:</strong> ${escapeHTML(listing.deneyim || '-')}</div>
        <div class="col-md-6"><strong>Son başvuru:</strong> ${escapeHTML(listing.son_basvuru || '-')}</div>
        <div class="col-12"><strong>Ek bilgiler:</strong> ${escapeHTML(listing.yan_haklar || '-')}</div>
      </div>
    `;
    new bootstrap.Modal(refs.detailModal).show();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!state.user) return showMessage('İlan oluşturmak için giriş yapmalısın.', 'warning');

    const payload = listingPayload();
    if (!validatePayload(payload)) return showMessage('Lütfen zorunlu alanları doldur.', 'warning');

    const editingId = getValue(fields.id);
    const now = firebase.firestore.FieldValue.serverTimestamp();

    try {
      if (editingId) {
        const existing = state.listings.find((item) => item.id === editingId);
        if (!existing || existing.ilan_sahibi_id !== state.user.uid) {
          return showMessage('Bu ilanı düzenleme yetkin yok.', 'danger');
        }
        await db.collection('ilanlar').doc(editingId).update({
          ...payload,
          updated_at: now
        });
        showMessage('İlan güncellendi.', 'success');
      } else {
        await db.collection('ilanlar').add({
          ...payload,
          ilan_sahibi_id: state.user.uid,
          olusturan_email: state.user.email,
          durum: 'aktif',
          eklenme_tarihi: now
        });
        showMessage('İlan yayınlandı.', 'success');
      }
      resetForm();
      await fetchListings();
    } catch (error) {
      console.error('İlan kaydetme hatası:', error);
      showMessage('İşlem tamamlanamadı: ' + (error.message || 'Bilinmeyen hata'), 'danger');
    }
  }

  async function deleteListing(id) {
    const listing = state.listings.find((item) => item.id === id);
    if (!listing || listing.ilan_sahibi_id !== state.user?.uid) return showMessage('Bu ilanı silme yetkin yok.', 'danger');
    await db.collection('ilanlar').doc(id).delete();
    showMessage('İlan silindi.', 'success');
    await fetchListings();
  }

  function bindEvents() {
    refs.toggleFormButton?.addEventListener('click', () => {
      if (!state.user) return showMessage('İlan oluşturmak için giriş yapmalısın.', 'warning');
      setFormVisible(refs.form.style.display !== 'block');
    });

    refs.cancelFormButton?.addEventListener('click', resetForm);
    refs.form?.addEventListener('submit', handleSubmit);

    [refs.filterType, refs.filterWorkType, refs.filterLocation].forEach((field) => {
      field?.addEventListener('change', renderListings);
    });

    refs.searchInput?.addEventListener('input', () => {
      clearTimeout(bindEvents.searchTimer);
      bindEvents.searchTimer = setTimeout(renderListings, 180);
    });

    refs.resetFilters?.addEventListener('click', () => {
      refs.filterType.value = '';
      refs.filterWorkType.value = '';
      refs.filterLocation.value = '';
      refs.searchInput.value = '';
      renderListings();
    });

    refs.container?.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      if (button.classList.contains('view-details-btn')) showDetails(button.dataset.id);

      if (button.classList.contains('message-btn')) {
        const ownerId = button.dataset.ownerId;
        const ownerName = button.dataset.ownerName || '';
        window.location.href = `mesajlar.html?userId=${encodeURIComponent(ownerId)}&ownerName=${ownerName}`;
      }

      if (button.classList.contains('edit-listing-btn')) {
        const listing = state.listings.find((item) => item.id === button.dataset.id);
        if (listing) fillForm(listing);
      }

      if (button.classList.contains('delete-listing-btn')) {
        if (confirm('Bu ilan silinsin mi?')) {
          try {
            await deleteListing(button.dataset.id);
          } catch (error) {
            console.error(error);
            showMessage('İlan silinemedi: ' + (error.message || 'Bilinmeyen hata'), 'danger');
          }
        }
      }
    });
  }

  if (!auth || !db) {
    refs.container.innerHTML = '<div class="col-12 text-center text-danger py-5">Firebase bağlantısı kurulamadı.</div>';
    return;
  }

  bindEvents();
  loadUserMap().then(() => fetchListings());

  auth.onAuthStateChanged((user) => {
    state.user = user;
    if (refs.toggleFormButton) {
      refs.toggleFormButton.disabled = !user;
      refs.toggleFormButton.innerHTML = user
        ? '<i class="fas fa-plus-circle me-2"></i>Yeni İlan Ekle'
        : '<i class="fas fa-lock me-2"></i>İlan için giriş yap';
    }
    renderListings();
  });
})();
