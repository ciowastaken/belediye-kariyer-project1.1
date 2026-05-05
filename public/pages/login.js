// login.js

// 1) Firebase konfigürasyonu ve başlatma
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
const db = firebase.firestore();

// Ekran mesajlarını gösterir
function showMessage(message, type = 'info') {
  const el = document.getElementById('generalErrorMessage');
  if (!el) return;

  el.textContent = message;
  el.className = `general-message ${type === 'danger' ? 'danger' : 'success'}`;
  el.style.display = 'block';

  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

function showRegisterMessage(message, type = 'danger') {
  let el = document.getElementById('registerErrorMessage');

  if (!el) {
    el = document.createElement('div');
    el.id = 'registerErrorMessage';
    el.style.cssText = 'padding:12px 14px;border-radius:14px;margin-bottom:14px;font-weight:bold;text-align:center;';

    const form = document.getElementById('registerForm');
    form.parentNode.insertBefore(el, form);
  }

  el.textContent = message;
  el.style.backgroundColor = type === 'danger' ? '#fff1f2' : '#ecfdf3';
  el.style.color = type === 'danger' ? '#9f1239' : '#067647';
  el.style.border = type === 'danger' ? '1px solid #fecdd3' : '1px solid #abefc6';
  el.style.display = 'block';

  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

function setButtonLoading(button, loading, loadingText = 'İşleniyor...') {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${loadingText}`;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
  }
}

// Kullanıcının admin olup olmadığını kontrol eder
async function isAdminUser(user) {
  try {
    const snap = await db.collection('users').doc(user.uid).get();
    return snap.exists && snap.data().isAdmin === true;
  } catch {
    return false;
  }
}

// 2) Oturum durumu değiştiğinde uygun sayfaya yönlendir
auth.onAuthStateChanged(async user => {
  if (!user) return;

  const page = window.location.pathname.split('/').pop();

  if (['', 'index.html', 'login.html'].includes(page)) {
    if (await isAdminUser(user)) {
      window.location = 'admin_panel.html';
    } else {
      window.location = 'anasayfa.html';
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const mainLoginForm = document.getElementById('mainLoginForm');
  const adminLoginFormModal = document.getElementById('adminLoginFormModal');
  const registerForm = document.getElementById('registerForm');
  const showAdminBtn = document.getElementById('showAdminLoginModalBtn');
  const showRegisterBtn = document.getElementById('showRegisterModalBtn');
  const adminModalEl = document.getElementById('adminLoginModal');
  const registerModalEl = document.getElementById('registerModal');
  const registerPhone = document.getElementById('registerPhone');

  // Şifre göster/gizle butonları
  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.textContent = isPassword ? '🙈' : '👁';
    });
  });

  // Telefon alanına sadece rakam yazılsın
  registerPhone?.addEventListener('input', () => {
    registerPhone.value = registerPhone.value.replace(/\D/g, '').slice(0, 10);
  });

  // Modal açma butonları
  showAdminBtn?.addEventListener('click', () => new bootstrap.Modal(adminModalEl).show());
  showRegisterBtn?.addEventListener('click', () => new bootstrap.Modal(registerModalEl).show());

  // 3a) Kullanıcı girişi
  mainLoginForm?.addEventListener('submit', async e => {
    e.preventDefault();

    const button = document.getElementById('mainLoginBtn');
    const email = document.getElementById('userEmail').value.trim();
    const pass = document.getElementById('userPassword').value;

    try {
      setButtonLoading(button, true, 'Giriş yapılıyor...');
      await auth.signInWithEmailAndPassword(email, pass);
    } catch {
      setButtonLoading(button, false);
      showMessage('Giriş başarısız: E-posta veya şifre hatalı.', 'danger');
    }
  });

  // 3b) Admin girişi
  adminLoginFormModal?.addEventListener('submit', async e => {
    e.preventDefault();

    const button = document.getElementById('adminLoginBtn');
    const email = document.getElementById('adminModalEmail').value.trim();
    const pass = document.getElementById('adminModalPassword').value;

    try {
      setButtonLoading(button, true, 'Kontrol ediliyor...');
      await auth.signInWithEmailAndPassword(email, pass);
    } catch {
      setButtonLoading(button, false);
      showMessage('Yetkili girişi başarısız: Bilgileri kontrol edin.', 'danger');
    }
  });

  // 4) Yeni üyelik
  registerForm?.addEventListener('submit', async e => {
    e.preventDefault();

    const button = document.getElementById('registerSubmitBtn');
    const name = document.getElementById('registerName').value.trim();
    const surname = document.getElementById('registerSurname').value.trim();
    const phone = '+90' + document.getElementById('registerPhone').value.trim();
    const address = document.getElementById('registerAddress').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const pass = document.getElementById('registerPassword').value;
    const passConf = document.getElementById('registerPasswordConfirm').value;

    if (pass !== passConf) {
      showRegisterMessage('Şifreler eşleşmiyor!');
      return;
    }

    if (pass.length < 8) {
      showRegisterMessage('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (!/[A-Z]/.test(pass)) {
      showRegisterMessage('Şifre en az bir büyük harf içermelidir.');
      return;
    }

    if (!/[a-z]/.test(pass)) {
      showRegisterMessage('Şifre en az bir küçük harf içermelidir.');
      return;
    }

    if (/[^a-zA-Z0-9]/.test(pass)) {
      showRegisterMessage('Şifre özel karakter içermemelidir.');
      return;
    }

    try {
      setButtonLoading(button, true, 'Üyelik oluşturuluyor...');

      const cred = await auth.createUserWithEmailAndPassword(email, pass);

      await db.collection('users').doc(cred.user.uid).set({
        uid: cred.user.uid,
        email,
        name,
        surname,
        phone,
        address,
        isAdmin: false,
        kayit_tarihi: firebase.firestore.FieldValue.serverTimestamp()
      });

      showRegisterMessage('Üyelik oluşturuldu! Giriş yapabilirsiniz.', 'success');
      bootstrap.Modal.getInstance(registerModalEl)?.hide();
      registerForm.reset();
    } catch (err) {
      const code = err.code || '';

      if (code.includes('email-already-in-use')) {
        showRegisterMessage('Bu e-posta zaten kullanımda.');
      } else if (code.includes('weak-password')) {
        showRegisterMessage('Şifre en az 6 karakter olmalı.');
      } else {
        showRegisterMessage('Kayıt hatası: ' + err.message);
      }
    } finally {
      setButtonLoading(button, false);
    }
  });

  // 5) Şifremi unuttum formunu göster
  document.getElementById('forgot-password-link')?.addEventListener('click', e => {
    e.preventDefault();
    const resetContainer = document.getElementById('reset-password-container');
    resetContainer.style.display = resetContainer.style.display === 'none' ? 'block' : 'none';
  });

  // 6) Şifre sıfırlama e-posta gönder
  document.getElementById('reset-password-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('reset-email').value.trim();
    const out = document.getElementById('reset-message');
    const button = document.getElementById('reset-password-btn');

    out.textContent = '';

    if (!email) {
      out.className = 'text-danger';
      out.textContent = 'Lütfen bir e-posta girin.';
      return;
    }

    try {
      setButtonLoading(button, true, 'Mail gönderiliyor...');
      await auth.sendPasswordResetEmail(email);
      out.className = 'text-success';
      out.textContent = 'Mail gönderildi. Gelen kutunuzu kontrol edin.';
    } catch (err) {
      out.className = 'text-danger';
      out.textContent = 'Hata: ' + err.message;
    } finally {
      setButtonLoading(button, false);
    }
  });
});