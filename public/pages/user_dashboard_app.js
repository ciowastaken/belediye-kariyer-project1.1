// Firebase SDK modüllerini CDN URL'lerinden içe aktarın
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, getDoc, updateDoc, setDoc, serverTimestamp, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyALJWbNPziCXnjbgAwbGxpeRafO0O29fy4",
    authDomain: "belediye-kariyer-project.firebaseapp.com",
    projectId: "belediye-kariyer-project",
    storageBucket: "belediye-kariyer-project.firebasestorage.app",
    messagingSenderId: "1018107908919",
    appId: "1:1018107908919:web:b750dff35acbed659d80b2",
    measurementId: "G-KL6SGRPS3D"
};

// Firebase servislerini başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
window.BasiskeleAuthSignOut = () => signOut(auth);

// --- MESAJ GÖSTERME FONKSİYONU ---
function showMessage(message, type = 'info') {
    const messageElement = document.getElementById('userSettingsMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `alert alert-${type}`;
        messageElement.style.display = 'block';
        setTimeout(() => { messageElement.style.display = 'none'; }, 5000);
    }
}

// --- ANA FONKSİYONLAR ---
let currentUserData = null;
let listenersBound = false;
let previewObjectUrl = null;

function setProfilePhotoPreview(photoURL) {
    const preview = document.getElementById('profilePicPreview');
    const frame = document.getElementById('profilePhotoFrame');
    if (!preview) return;

    if (photoURL) {
        preview.src = photoURL;
        frame?.classList.add('has-photo');
    } else {
        preview.removeAttribute('src');
        frame?.classList.remove('has-photo');
    }
}

function setProfilePhotoFileName(text = 'Henüz fotoğraf seçilmedi') {
    const fileNameElement = document.getElementById('profilePicFileName');
    if (fileNameElement) {
        fileNameElement.textContent = text;
    }
}

// Kullanıcı bilgilerini Firestore'dan çekip formu doldurur
async function loadUserProfile(user) {
    const userDocRef = doc(db, 'users', user.uid);
    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            currentUserData = userDoc.data();
            document.getElementById('profileName').value = currentUserData.name || '';
            document.getElementById('profileSurname').value = currentUserData.surname || '';
            document.getElementById('profileEmail').value = user.email; // Auth'dan gelen email daha güvenilir
            document.getElementById('profilePhone').value = currentUserData.phone || '';
            document.getElementById('profileAddress').value = currentUserData.address || '';
            setProfilePhotoPreview(currentUserData.photoURL || '');
            setProfilePhotoFileName(currentUserData.photoURL ? 'Kayıtlı fotoğraf kullanılıyor' : undefined);
        } else {
            // Firestore'da belge yoksa, temel bir belge oluştur
            await setDoc(userDocRef, { email: user.email, kayit_tarihi: serverTimestamp() }, { merge: true });
            document.getElementById('profileEmail').value = user.email;
            setProfilePhotoPreview('');
            setProfilePhotoFileName();
        }
    } catch (error) {
        console.error("Profil yüklenirken hata:", error);
        showMessage('Profil bilgileri yüklenirken bir hata oluştu.', 'danger');
    }
}

// Form gönderildiğinde profil bilgilerini günceller
async function handleProfileUpdate(e) {
    e.preventDefault();
    const user = auth.currentUser;
    const photoFile = document.getElementById('profilePicUpload').files[0];
    let photoURL = currentUserData?.photoURL || '';

    const updateData = {
        name: document.getElementById('profileName').value,
        surname: document.getElementById('profileSurname').value,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value,
        guncelleme_tarihi: serverTimestamp()
    };

    try {
        if (photoFile) {
            showMessage('Profil fotoğrafı yükleniyor...', 'info');
            const photoRef = ref(storage, `profile_pictures/${user.uid}/${photoFile.name}`);
            await uploadBytes(photoRef, photoFile);
            photoURL = await getDownloadURL(photoRef);
            updateData.photoURL = photoURL;
            setProfilePhotoPreview(photoURL);
            setProfilePhotoFileName('Kayıtlı fotoğraf güncellendi');
        }

        await updateDoc(doc(db, 'users', user.uid), updateData);
        showMessage('Profil bilgileri başarıyla güncellendi!', 'success');
        currentUserData = { ...(currentUserData || {}), ...updateData, photoURL };
    } catch (error) {
        console.error("Profil güncellenirken hata:", error);
        showMessage(`Bir hata oluştu: ${error.message}`, 'danger');
    }
}

// Şifre değiştirme
async function handleChangePassword(e) {
    e.preventDefault();
    const user = auth.currentUser;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

    if (newPassword !== newPasswordConfirm) {
        showMessage('Yeni şifreler eşleşmiyor!', 'danger');
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        showMessage('Şifreniz başarıyla değiştirildi!', 'success');
        e.target.reset(); // Formu temizle
    } catch (error) {
        console.error("Şifre değiştirme hatası:", error);
        if (error.code === 'auth/wrong-password') {
            showMessage('Mevcut şifreniz yanlış.', 'danger');
        } else {
            showMessage('Şifre değiştirilirken bir hata oluştu.', 'danger');
        }
    }
}

// Hesabı silme
async function handleDeleteAccount() {
    const user = auth.currentUser;
    if (!confirm('Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        return;
    }
    try {
        // Önce Firestore'daki belgeyi sil
        await deleteDoc(doc(db, 'users', user.uid));
        // Sonra Auth kullanıcısını sil
        await deleteUser(user);
        alert('Hesabınız başarıyla silindi.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Hesap silme hatası:", error);
        showMessage('Hesap silinirken bir hata oluştu. Lütfen tekrar giriş yapıp deneyin.', 'danger');
    }
}

// Çıkış yapma
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Çıkış hatası:", error);
    }
}


// --- SAYFA YÜKLENDİĞİNDE ÇALIŞACAK KODLAR ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profilePicUpload')?.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            setProfilePhotoFileName();
            return;
        }

        if (!file.type.startsWith('image/')) {
            event.target.value = '';
            setProfilePhotoFileName();
            showMessage('Lütfen geçerli bir görsel dosyası seç.', 'warning');
            return;
        }

        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
        }

        previewObjectUrl = URL.createObjectURL(file);
        setProfilePhotoPreview(previewObjectUrl);
        setProfilePhotoFileName(`${file.name} seçildi`);
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Kullanıcı giriş yapmış, fonksiyonları ve olay dinleyicilerini bağla
            loadUserProfile(user);
            if (!listenersBound) {
                document.getElementById('userProfileForm').addEventListener('submit', handleProfileUpdate);
                document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
                document.getElementById('deleteAccountBtn').addEventListener('click', handleDeleteAccount);
                document.getElementById('logoutBtn').addEventListener('click', handleLogout);
                listenersBound = true;
            }
        } else {
            // Kullanıcı giriş yapmamış, login sayfasına yönlendir
            window.location.href = 'index.html';
        }
    });
});
