const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

async function assertAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bu işlem için giriş yapmalısınız.');
  }

  const snap = await db.collection('users').doc(context.auth.uid).get();
  const data = snap.exists ? snap.data() : {};
  const role = data.role || (data.isAdmin ? 'admin' : 'user');

  if (data.isAdmin !== true && role !== 'admin' && role !== 'yetkili') {
    throw new functions.https.HttpsError('permission-denied', 'Bu işlem için admin yetkisi gerekir.');
  }

  return { uid: context.auth.uid, role };
}

function normalizeRole(role) {
  if (['admin', 'yetkili', 'user'].includes(role)) return role;
  throw new functions.https.HttpsError('invalid-argument', 'Geçersiz rol değeri.');
}

async function setUserRoleData(data, actorUid) {
  const uid = data.uid;
  const email = data.email;
  const role = normalizeRole(data.role || 'user');

  if (!uid && !email) {
    throw new functions.https.HttpsError('invalid-argument', 'uid veya email göndermelisiniz.');
  }

  const userRecord = uid
    ? await admin.auth().getUser(uid)
    : await admin.auth().getUserByEmail(email);

  await admin.auth().setCustomUserClaims(userRecord.uid, {
    admin: role === 'admin',
    yetkili: role === 'yetkili',
    role
  });

  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: userRecord.email || email || '',
    role,
    isAdmin: role === 'admin',
    roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    roleUpdatedBy: actorUid
  }, { merge: true });

  return {
    uid: userRecord.uid,
    email: userRecord.email || '',
    role,
    message: 'Rol güncellendi.'
  };
}

exports.setUserRole = functions.https.onCall(async (data, context) => {
  const actor = await assertAdmin(context);
  return setUserRoleData(data, actor.uid);
});

exports.addAdminRole = functions.https.onCall(async (data, context) => {
  const actor = await assertAdmin(context);
  return setUserRoleData({ ...data, role: 'admin' }, actor.uid);
});

exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);

  if (!data.uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Silinecek kullanıcı uid değeri eksik.');
  }

  if (context.auth.uid === data.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Kendi hesabınızı bu işlemle silemezsiniz.');
  }

  await Promise.allSettled([
    admin.auth().deleteUser(data.uid),
    db.collection('users').doc(data.uid).delete()
  ]);

  return { uid: data.uid, message: 'Kullanıcı silindi.' };
});
