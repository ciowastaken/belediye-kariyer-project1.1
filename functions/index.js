// Firebase Cloud Functions ve Firebase Admin SDK'yı içe aktarın
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin SDK'yı başlatın.
// Cloud Functions ortamında otomatik olarak projenize bağlanır.
admin.initializeApp();

/**
 * Belirli bir kullanıcının e-posta adresine göre ona "admin" rolü atayan Cloud Function.
 * Bu fonksiyon, bir yetkili (ya da ilk kurulumda geçici olarak yetkisiz) tarafından çağrılmalıdır.
 *
 * Bu bir 'callable' (çağrılabilir) fonksiyondur, yani istemci tarafından (web uygulamanızdan) kolayca çağrılabilir.
 *
 * @param {Object} data - Fonksiyona gönderilen veriler. `email` alanını içermelidir.
 * Örnek çağrı: `addAdminRole({ email: 'kullanici@example.com' })`
 * @param {Object} context - Çağıran kullanıcının kimlik doğrulama bilgilerini (UID, token vb.) içerir.
 */
exports.addAdminRole = functions.https.onCall(async (data, context) => {
    // Güvenlik Kontrolü (ÇOK ÖNEMLİ):
    // Bu fonksiyonu SADECE yetkili bir kullanıcının çağırmasına izin verin.
    // İLK KEZ BİR ADMIN ATIYORSANIZ, BU KONTROLÜ GEÇİCİ OLARAK YORUM SATIRI YAPINIZ!
    // İlk admini atadıktan SONRA, BU KONTROLÜ HEMEN GERİ AÇIN VE FONKSİYONU TEKRAR DAĞITIN!
    /*
    if (!context.auth || context.auth.token.admin !== true) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Bu işlemi gerçekleştirmek için admin yetkiniz bulunmamaktadır.'
        );
    }
    */

    const email = data.email; // Fonksiyon çağrılırken gönderilen e-posta

    // E-posta adresi belirtilmediyse hata fırlat
    if (!email) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'E-posta adresi belirtilmelidir.'
        );
    }

    try {
        // 1. E-posta adresine göre Firebase kullanıcısını al
        const user = await admin.auth().getUserByEmail(email);
        
        // 2. Kullanıcının özel taleplerini (Custom Claims) güncelle: "admin: true" claim'ini ekle
        // Bu, kullanıcının ID Token'ına "admin": true değerini ekler.
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        
        // 3. Kullanıcının oturumu açık ise, yeni ID token'ını alması için bilgilendir.
        // İstemci tarafında `user.getIdTokenResult(true)` çağrısı token'ı yeniler.
        
        console.log(`Kullanıcı ${email} (UID: ${user.uid}) admin rolü başarıyla atandı.`);
        return { message: `Başarılı! ${email} kullanıcısı artık admin yetkisine sahip.`, uid: user.uid };

    } catch (error) {
        console.error("Admin rolü atanırken hata:", error);
        // Hata durumlarını daha spesifik hale getir
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError(
                'not-found',
                'Belirtilen e-posta adresine sahip kullanıcı bulunamadı.'
            );
        } else {
            throw new functions.https.HttpsError(
                'internal',
                'Rol atama işlemi sırasında beklenmeyen bir hata oluştu.',
                error.message
            );
        }
    }
});
