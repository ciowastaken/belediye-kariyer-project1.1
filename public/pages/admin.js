document.addEventListener('DOMContentLoaded', () => {
  // --- 1) Firebase başlatma ---
  const firebaseConfig = {
    apiKey: "AIzaSyALJWbNPziCXnjbgAwbGxpeRafO0O29fy4",
    authDomain: "belediye-kariyer-project.firebaseapp.com",
    projectId: "belediye-kariyer-project",
    storageBucket: "belediye-kariyer-project.firebasestorage.app",
    messagingSenderId: "1018107908919",
    appId: "1:1018107908919:web:b750dff35acbed659d80b2",
    measurementId: "G-NZN8NGWDT7"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db   = firebase.firestore();

  // --- 2) UI referansları ---
  const ilanlarTbody      = document.getElementById('ilanlar-tablosu');
  const usersTbody        = document.getElementById('users-table-body');
  const templatesTbody    = document.getElementById('templates-table-body');
  const schedulesTbody    = document.getElementById('schedules-table-body');
  const totalListingsEl   = document.getElementById('total-listings-count');
  const totalUsersEl      = document.getElementById('total-users-count');
  const loadingIndicator  = document.getElementById('loading-indicator');
  const adminContent      = document.getElementById('admin-content');
  const toggleChatUsersBtn = document.getElementById('toggleChatUsersBtn');
  const chatUserSearch     = document.getElementById('chat-user-search');
  const chatUsersList      = document.getElementById('chat-users-list');
  const chatWindow         = document.getElementById('chat-window');
  const messageInput       = document.getElementById('message-input');
  const sendMessageBtn     = document.getElementById('send-message-btn');
  const clearChatBtn       = document.getElementById('clear-chat');

  let currentChatPartner = null;
  let chatUnsubscribe    = null;

  // --- 3) Oturum & admin kontrolü ---
  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = "index.html";
    const snap = await db.collection("users").doc(user.uid).get();
    const role = snap.exists
      ? (snap.data().role || (snap.data().isAdmin ? "admin" : "user"))
      : null;
    if (role !== "admin") {
      alert("Bu sayfaya erişim yetkiniz yok.");
      await auth.signOut();
      return window.location.href = "index.html";
    }
    loadingIndicator.classList.add("d-none");
    adminContent.classList.remove("d-none");

    // Panelin veri ve chat bölümlerini yükle
    loadChatUsersList();
    loadAdminPanelData();
  });

  // --- 4) Ana veri yükleme ---
  async function loadAdminPanelData(){
    const [ listingsSnap, usersSnap ] = await Promise.all([
      db.collection("ilanlar").get(),
      db.collection("users").get()
    ]);
    totalListingsEl.textContent = listingsSnap.size;
    totalUsersEl.textContent    = usersSnap.size;

    await Promise.all([
      fetchAndDisplayJobListings(),
      fetchAndDisplayUsers(),
      fetchAndDisplayTemplates(),
      fetchAndDisplaySchedules()
    ]);
  }

  // --- 5) İlan tablosu (sahip isimleri için user map) ---
  async function fetchAndDisplayJobListings() {
    if (!ilanlarTbody) return;
    ilanlarTbody.innerHTML = '<tr><td colspan="8">Yükleniyor…</td></tr>';

    // Kullanıcı adlarını çek
    const usersSnap = await db.collection('users').get();
    const userMap = {};
    usersSnap.forEach(u => {
      const d = u.data();
      const fullName = [d.name, d.surname].filter(Boolean).join(' ') || d.email;
      userMap[u.id] = fullName;
    });

    const snap = await db.collection('ilanlar')
                         .orderBy('eklenme_tarihi','desc')
                         .get();
    if (snap.empty) {
      ilanlarTbody.innerHTML = '<tr><td colspan="8">Henüz ilan yok.</td></tr>';
      return;
    }

    let rows = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const date = d.eklenme_tarihi
        ? new Date(d.eklenme_tarihi.toDate()).toLocaleDateString("tr-TR")
        : "—";
      const ownerName = userMap[d.ilan_sahibi_id] || '—';

      rows += `
        <tr>
          <td>${d.baslik||"—"}</td>
          <td>${ownerName}</td>
          <td>${d.konum||"—"}</td>
          <td>${date}</td>
          <td><span class="badge bg-${d.durum==="aktif"?"success":"secondary"}">${d.durum||"—"}</span></td>
          <td>
            <button class="btn btn-sm btn-info view-detail-btn" data-id="${docSnap.id}">
              <i class="fas fa-eye"></i>
            </button>
          </td>
          <td>
            <button class="btn btn-sm btn-primary dm-btn"
                    data-owner-id="${d.ilan_sahibi_id}"
                    data-owner-name="${ownerName}">
              <i class="fas fa-comments"></i>
            </button>
          </td>
          <td>
            <button class="btn btn-sm btn-danger delete-listing-btn" data-id="${docSnap.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>`;
    });
    ilanlarTbody.innerHTML = rows;
  }

  // --- 6) Kullanıcı tablosu ---
  async function fetchAndDisplayUsers() {
    if (!usersTbody) return;
    usersTbody.innerHTML = '<tr><td colspan="5">Yükleniyor…</td></tr>';
    const snap = await db.collection('users')
                         .orderBy('createdAt','desc')
                         .get();
    if (snap.empty) {
      usersTbody.innerHTML = '<tr><td colspan="5">Henüz kullanıcı yok.</td></tr>';
      return;
    }

    let rows = "";
    snap.forEach(docSnap => {
      const u = docSnap.data();
      const fullName = [u.name,u.surname].filter(Boolean).join(" ")||u.email;
      const role     = u.role || (u.isAdmin?"admin":"user");
      const date     = u.createdAt
        ? new Date(u.createdAt.toDate()).toLocaleDateString("tr-TR")
        : "—";
      rows += `
        <tr>
          <td>${fullName}</td>
          <td>${u.email||"—"}</td>
          <td><span class="badge bg-${role==="admin"?"primary":"secondary"}">${role}</span></td>
          <td>${date}</td>
          <td>
            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${docSnap.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>`;
    });
    usersTbody.innerHTML = rows;
  }

  // --- 7) Şablon tablosu ---
  async function fetchAndDisplayTemplates() {
    if (!templatesTbody) return;
    templatesTbody.innerHTML = '<tr><td colspan="3">Yükleniyor…</td></tr>';
    const snap = await db.collection('templates')
                         .orderBy('createdAt','desc')
                         .get();
    if (snap.empty) {
      templatesTbody.innerHTML = '<tr><td colspan="3">Henüz şablon yok.</td></tr>';
      return;
    }
    let rows = "";
    snap.forEach(docSnap => {
      const t = docSnap.data();
      rows += `
        <tr>
          <td>${t.name||"—"}</td>
          <td>${t.type||"—"}</td>
          <td>
            <button class="btn btn-sm btn-warning edit-template-btn" data-id="${docSnap.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-template-btn" data-id="${docSnap.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>`;
    });
    templatesTbody.innerHTML = rows;
  }

  // --- 8) Zamanlanmış bildirimler ---
  async function fetchAndDisplaySchedules() {
    if (!schedulesTbody) return;
    schedulesTbody.innerHTML = '<tr><td colspan="6">Yükleniyor…</td></tr>';
    const snap = await db.collection('scheduledNotifications')
                         .orderBy('scheduledAt','desc')
                         .get();
    if (snap.empty) {
      schedulesTbody.innerHTML = '<tr><td colspan="6">Henüz plan yok.</td></tr>';
      return;
    }
    let rows = "";
    for (const docSnap of snap.docs) {
      const s = docSnap.data();
      let tplName = "—";
      if (s.templateId) {
        const tpl = await db.collection('templates').doc(s.templateId).get();
        if (tpl.exists) tplName = tpl.data().name || "—";
      }
      const when   = s.scheduledAt
        ? new Date(s.scheduledAt.toDate()).toLocaleString("tr-TR")
        : "—";
      const repeat = s.repeat ? "Evet" : "Hayır";
      rows += `
        <tr>
          <td>${tplName}</td>
          <td>${s.targetCollection||"—"}</td>
          <td>${when}</td>
          <td>${repeat}</td>
          <td>${s.status||"pending"}</td>
          <td>
            <button class="btn btn-sm btn-danger delete-schedule-btn" data-id="${docSnap.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>`;
    }
    schedulesTbody.innerHTML = rows;
  }

  // --- 9) Delegasyon: tüm butonlar ---
  document.addEventListener("click", async e => {
    // İlan detay
    if (e.target.closest(".view-detail-btn")) {
      const id = e.target.closest(".view-detail-btn").dataset.id;
      const docSnap = await db.collection("ilanlar").doc(id).get();
      if (!docSnap.exists) return alert("İlan bulunamadı!");
      const d = docSnap.data();
      document.getElementById("detail-baslik").innerText    = d.baslik||"–";
      document.getElementById("detail-aciklama").innerText = d.aciklama||"–";
      const ek = d.ekstralar||[];
      document.getElementById("detail-ekstralar").innerHTML =
        ek.length
          ? ek.map(x=>`<li class="list-group-item">${x}</li>`).join("")
          : `<li class="list-group-item">Ekstra yok.</li>`;
      new bootstrap.Modal(document.getElementById("ilan-detail-modal")).show();
      return;
    }

    // İlan sil
    if (e.target.closest(".delete-listing-btn")) {
      if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;
      const id = e.target.closest(".delete-listing-btn").dataset.id;
      await db.collection("ilanlar").doc(id).delete();
      await fetchAndDisplayJobListings();
      return;
    }

    // Kullanıcı sil
    if (e.target.closest(".delete-user-btn")) {
      if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
      const id = e.target.closest(".delete-user-btn").dataset.id;
      await db.collection("users").doc(id).delete();
      await fetchAndDisplayUsers();
      return;
    }

    // Şablon sil
    if (e.target.closest(".delete-template-btn")) {
      if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
      const id = e.target.closest(".delete-template-btn").dataset.id;
      await db.collection("templates").doc(id).delete();
      await fetchAndDisplayTemplates();
      return;
    }

    // Planlı bildirim sil
    if (e.target.closest(".delete-schedule-btn")) {
      if (!confirm("Bu planı silmek istediğinize emin misiniz?")) return;
      const id = e.target.closest(".delete-schedule-btn").dataset.id;
      await db.collection("scheduledNotifications").doc(id).delete();
      await fetchAndDisplaySchedules();
      return;
    }

    // Mesaj silme (admin panel chat)
    if (e.target.closest(".delete-message-btn")) {
      const msgId = e.target.closest(".delete-message-btn").dataset.id;
      if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
      try {
        await db.collection("messages").doc(msgId).delete();
        startChatListener();
      } catch (err) {
        console.error("Mesaj silme hatası:", err);
        alert("Mesaj silinirken hata: " + err.message);
      }
      return;
    }

    // Çıkış
    if (e.target.id === "adminLogoutBtn") {
      if (confirm("Çıkış yapmak istediğinize emin misiniz?")) {
        await auth.signOut();
        window.location.href = "index.html";
      }
    }
  });

  // --- 10) Chat fonksiyonları ---
  async function loadChatUsersList(){
    chatUsersList.innerHTML = '<li class="list-group-item text-center">Yükleniyor…</li>';
    const snap = await db.collection("users").get();
    chatUsersList.innerHTML = "";
    snap.forEach(docSnap => {
      const u = docSnap.data();
      const name = [u.name,u.surname].filter(Boolean).join(" ")||u.email;
      const li = document.createElement("li");
      li.className = "list-group-item list-group-item-action";
      li.textContent = name;
      li.dataset.uid = docSnap.id;
      li.addEventListener("click", () => {
        chatUsersList.querySelectorAll("li").forEach(i=>i.classList.remove("active"));
        li.classList.add("active");
        currentChatPartner = docSnap.id;
        startChatListener();
      });
      chatUsersList.appendChild(li);
    });
  }

  function startChatListener() {
    if (chatUnsubscribe) chatUnsubscribe();
    chatUnsubscribe = db.collection("messages")
      .where("participants", "array-contains", auth.currentUser.uid)
      .orderBy("timestamp", "asc")
      .onSnapshot(snapshot => {
        chatWindow.innerHTML = "";
        snapshot.forEach(docSnap => {
          const m = docSnap.data();
          if (!m.participants.includes(currentChatPartner)) return;
          const div = document.createElement("div");
          div.className = "msg " + (m.sender === auth.currentUser.uid ? "from-me" : "from-them");
          div.innerHTML = `
            <span>${m.text}</span>
            <button class="btn btn-sm btn-outline-danger delete-message-btn" data-id="${docSnap.id}" title="Mesajı Sil">
              <i class="fas fa-trash-alt"></i>
            </button>
          `;
          chatWindow.appendChild(div);
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
      });
  }

  sendMessageBtn.addEventListener("click", async () => {
    const text = messageInput.value.trim();
    if (!text || !currentChatPartner) return;
    try {
      await db.collection("messages").add({
        sender: auth.currentUser.uid,
        participants: [auth.currentUser.uid, currentChatPartner],
        recipients: [currentChatPartner],
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      messageInput.value = "";
    } catch (e) {
      console.error("Mesaj gönderme hatası:", e);
      alert("Mesaj gönderilemedi: " + e.message);
    }
  });

  clearChatBtn.addEventListener("click", async () => {
    if (!currentChatPartner) return;
    if (!confirm("Bu sohbetteki tüm mesajları silmek istediğinize emin misiniz?")) return;
    const me = auth.currentUser.uid;
    const snap = await db.collection("messages")
                         .where("participants", "array-contains", me)
                         .orderBy("timestamp")
                         .get();
    const batch = db.batch();
    snap.docs.forEach(docSnap => {
      const m = docSnap.data();
      if (m.participants.includes(currentChatPartner)) batch.delete(docSnap.ref);
    });
    await batch.commit();
    chatWindow.innerHTML = "";
    currentChatPartner = null;
    chatUsersList.querySelectorAll("li").forEach(li=>li.classList.remove("active"));
  });

  // --- 11) DM butonu delegation ---
  ilanlarTbody.addEventListener('click', e => {
    const btn = e.target.closest('.dm-btn');
    if (!btn) return;
    const ownerId   = btn.dataset.ownerId;
    const ownerName = btn.dataset.ownerName;
    if (!ownerId) return alert('Bu ilana ait kullanıcı yok!');
    if (chatUsersList.style.display === "none") toggleChatUsersBtn.click();
    setTimeout(() => openChatWith(ownerId, ownerName), 200);
  });

  function openChatWith(userId, userName) {
    chatUsersList.style.display = 'none';
    chatUserSearch.style.display = 'none';
    toggleChatUsersBtn.textContent = 'Kişileri Göster';
    currentChatPartner = userId;
    chatWindow.innerHTML = '';
    startChatListener();
  }
});