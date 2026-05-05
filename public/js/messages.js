// messages.js - Firebase Compat API

const firebaseConfig = {
  apiKey: "AIzaSyALJWbNPziCXnjbgAwbGxpeRafO0O29fy4",
  authDomain: "belediye-kariyer-project.firebaseapp.com",
  projectId: "belediye-kariyer-project",
  storageBucket: "belediye-kariyer-project.firebasestorage.app",
  messagingSenderId: "1018107908919",
  appId: "1:1018107908919:web:b750dff35acbed659d80b2",
  measurementId: "G-NZN8NGWDT7"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db   = firebase.firestore();

const contactsContainer    = document.getElementById('contacts-container');
const messagesBox          = document.getElementById('messages-box');
const chatAvatar           = document.getElementById('chat-avatar');
const chatName             = document.getElementById('chat-name');
const clearChatBtn         = document.getElementById('clear-chat');
const deleteContactBtn     = document.getElementById('delete-contact');
const messageInput         = document.getElementById('message-input');
const sendButton           = document.getElementById('send-button');
const notificationButton   = document.getElementById('notificationButton');
const notificationDropdown = document.getElementById('notificationDropdown');
const notificationList     = document.getElementById('notificationList');
const notificationBadge    = document.getElementById('notificationCountBadge');
const markAllAsReadBtn     = document.getElementById('markAllAsRead');

let currentUser         = null;
let activeContact       = null;
let unsubscribeMessages = null;
let notifUnsub          = null;

auth.onAuthStateChanged(user => {
  if (!user) return window.location.replace('login.html');
  currentUser = user;
  bindNotificationDropdown();
  subscribeNotifications(user.uid);
  const params    = new URLSearchParams(window.location.search);
  const uidParam  = params.get('userId');
  const nameParam = params.get('ownerName');
  loadContacts(uidParam, nameParam ? decodeURIComponent(nameParam) : null);
});

function bindNotificationDropdown() {
  if (!notificationButton) return;
  notificationButton.addEventListener('click', e => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('show');
  });
  document.addEventListener('click', e => {
    if (notificationDropdown && !notificationDropdown.contains(e.target) &&
        !notificationButton.contains(e.target)) {
      notificationDropdown.classList.remove('show');
    }
  });
}

function renderNotifications(items) {
  if (!notificationList) return;
  notificationList.innerHTML = '';
  let unread = 0;
  if (!items.length) {
    notificationList.innerHTML = '<li class="no-notifications">Yeni bildirim yok.</li>';
  } else {
    items.forEach(n => {
      if (!n.read) unread++;
      const li = document.createElement('li');
      li.className = `notification-item${n.read ? '' : ' unread'}`;
      li.dataset.id = n.id;
      li.innerHTML = `
        <div class="icon"><i class="fas ${n.icon || 'fa-bell'}"></i></div>
        <div class="details">
          <div class="title">${n.title || ''}</div>
          <div class="message-text">${n.message || ''}</div>
          <div class="time-ago">${formatTimeAgo(n.timestamp)}</div>
        </div>`;
      li.addEventListener('click', async () => {
        if (!n.read) {
          await db.collection('users').doc(currentUser.uid)
            .collection('notifications').doc(n.id).update({ read: true });
        }
        if (n.type === 'message') {
          window.location.href = `mesajlar.html?userId=${n.senderId}&ownerName=${encodeURIComponent(n.senderName)}`;
        }
      });
      notificationList.append(li);
    });
  }
  if (notificationBadge) {
    notificationBadge.textContent = unread;
    notificationBadge.style.display = unread ? 'flex' : 'none';
  }
}

function subscribeNotifications(uid) {
  if (notifUnsub) notifUnsub();
  notifUnsub = db.collection('users').doc(uid).collection('notifications')
    .orderBy('timestamp', 'desc').limit(50)
    .onSnapshot(snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      renderNotifications(arr);
    });
  if (markAllAsReadBtn) {
    markAllAsReadBtn.addEventListener('click', async () => {
      const batch = db.batch();
      document.querySelectorAll('.notification-item.unread').forEach(el => {
        batch.update(
          db.collection('users').doc(uid).collection('notifications').doc(el.dataset.id),
          { read: true }
        );
      });
      await batch.commit();
    });
  }
}

function loadContacts(pendingUid, pendingName) {
  db.collection('users').onSnapshot(snap => {
    contactsContainer.innerHTML = '';
    const items = [];
    snap.forEach(docSnap => {
      const uid = docSnap.id;
      if (uid === currentUser.uid) return;
      const d    = docSnap.data();
      const name = [d.name, d.surname].filter(Boolean).join(' ') || d.email;

      const item = document.createElement('div');
      item.className   = 'contact-item';
      item.dataset.uid = uid;
      item.innerHTML   = `
        <div class="avatar">${name.charAt(0).toUpperCase()}</div>
        <div class="details">
          <div class="name">${name}</div>
          <div class="preview">Henüz mesaj yok</div>
        </div>`;

      db.collection('messages')
        .where('participants', 'array-contains', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .onSnapshot(s2 => {
          let text = '';
          for (const doc2 of s2.docs) {
            const m = doc2.data();
            if (m.participants.includes(uid)) { text = m.text; break; }
          }
          item.querySelector('.preview').textContent = text || 'Henüz mesaj yok';
        });

      item.addEventListener('click', () => {
        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        selectContact(uid, name);
      });
      contactsContainer.append(item);
      items.push({ item, uid, name });
    });

    if (pendingUid) {
      const found = items.find(i => i.uid === pendingUid);
      if (found) found.item.click();
      else if (items.length) items[0].item.click();
    } else if (items.length) {
      items[0].item.click();
    }
  });
}

function selectContact(uid, name) {
  if (unsubscribeMessages) unsubscribeMessages();
  activeContact         = uid;
  chatName.textContent  = name;
  chatAvatar.textContent= name.charAt(0);
  messagesBox.innerHTML = '';

  const clearKey  = `dm_cleared_${currentUser.uid}_${uid}`;
  const clearedAt = parseInt(localStorage.getItem(clearKey), 10) || 0;

  unsubscribeMessages = db.collection('messages')
    .where('participants', 'array-contains', currentUser.uid)
    .orderBy('timestamp', 'asc')
    .onSnapshot(snap => {
      messagesBox.innerHTML = '';
      snap.forEach(docSnap => {
        const m = docSnap.data();
        if (!m.participants.includes(uid)) return;
        if (!m.timestamp) return;
        const ts = m.timestamp.toMillis();
        if (ts <= clearedAt) return;
        const div = document.createElement('div');
        div.className = 'message ' + (m.sender === currentUser.uid ? 'sent' : 'received');
        div.innerHTML = `
          <div class="text">${escapeHTML(m.text)}</div>
          <div class="time">${new Date(ts).toLocaleTimeString('tr-TR')}</div>`;
        messagesBox.append(div);
      });
      messagesBox.scrollTop = messagesBox.scrollHeight;
    });
}

if (sendButton) sendButton.addEventListener('click', sendMessage);
if (messageInput) messageInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  if (!activeContact) { alert('Önce bir sohbet seçin.'); return; }
  try {
    await db.collection('messages').add({
      sender:       currentUser.uid,
      participants: [currentUser.uid, activeContact],
      text,
      timestamp:    firebase.firestore.FieldValue.serverTimestamp()
    });
    messageInput.value = '';
  } catch (err) {
    console.error('Gönderme hatası:', err);
    alert('Mesaj gönderilemedi: ' + err.message);
  }
}

if (clearChatBtn) clearChatBtn.addEventListener('click', () => {
  if (!activeContact) return;
  if (!confirm('Bu sohbeti temizlemek istediğinize emin misiniz?')) return;
  messagesBox.innerHTML = '';
  localStorage.setItem(`dm_cleared_${currentUser.uid}_${activeContact}`, Date.now().toString());
});

if (deleteContactBtn) deleteContactBtn.addEventListener('click', () => {
  if (!activeContact) return;
  const el = contactsContainer.querySelector(`[data-uid="${activeContact}"]`);
  if (el) el.remove();
  activeContact = null;
  messagesBox.innerHTML = `<div class="no-contact-selected"><p>Soldan bir sohbet seçin.</p></div>`;
});

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
}
function formatTimeAgo(ts) {
  if (!ts) return '';
  const d    = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'});
}