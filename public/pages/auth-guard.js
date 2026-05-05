// auth-guard.js

(function () {
    const firebaseConfig = {
      apiKey: "AIzaSyALJWbNPziCXnjbgAwbGxpeRafO0O29fy4",
      authDomain: "belediye-kariyer-project.firebaseapp.com",
      projectId: "belediye-kariyer-project",
      storageBucket: "belediye-kariyer-project.firebasestorage.app",
      messagingSenderId: "1018107908919",
      appId: "1:1018107908919:web:b750dff35acbed659d80b2",
      measurementId: "G-NZN8NGWDT7"
    };
  
    if (typeof firebase === "undefined") {
      console.error("Firebase SDK yüklenmemiş.");
      document.body.classList.remove("auth-loading");
      return;
    }
  
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  
    const auth = firebase.auth();
    const db = firebase.firestore();
  
    const pageType = document.body.dataset.authPage || "protected";
  
    function showPage() {
      document.body.classList.remove("auth-loading");
    }
  
    async function isAdminUser(user) {
      try {
        const snap = await db.collection("users").doc(user.uid).get();
        return snap.exists && snap.data().isAdmin === true;
      } catch (error) {
        console.error("Admin kontrol hatası:", error);
        return false;
      }
    }
  
    auth.onAuthStateChanged(async user => {
      try {
        if (pageType === "login") {
          if (!user) {
            showPage();
            return;
          }
  
          const adminMi = await isAdminUser(user);
  
          if (adminMi) {
            window.location.replace("admin_panel.html");
          } else {
            window.location.replace("anasayfa.html");
          }
  
          return;
        }
  
        if (pageType === "protected") {
          if (!user) {
            window.location.replace("login.html");
            return;
          }
  
          showPage();
          return;
        }
  
        if (pageType === "admin") {
          if (!user) {
            window.location.replace("login.html");
            return;
          }
  
          const adminMi = await isAdminUser(user);
  
          if (!adminMi) {
            window.location.replace("anasayfa.html");
            return;
          }
  
          showPage();
          return;
        }
  
        showPage();
      } catch (error) {
        console.error("Auth guard hatası:", error);
  
        if (pageType === "login") {
          showPage();
        } else {
          window.location.replace("login.html");
        }
      }
    });
  })();