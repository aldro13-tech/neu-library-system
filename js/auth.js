// ============================================================
// auth.js
// Handles Google OAuth login, domain enforcement, blocked-user
// check, and session routing for the NEU Library system.
// ============================================================

import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  ALLOWED_DOMAIN,
  ADMIN_EMAILS,
} from "./firebase-config.js";

// ── DOM helpers ──────────────────────────────────────────────
const showError = (msg) => {
  const el = document.getElementById("error-msg");
  if (el) { el.textContent = msg; el.style.display = "block"; }
};
const hideError = () => {
  const el = document.getElementById("error-msg");
  if (el) el.style.display = "none";
};

// ── Google Sign-In ───────────────────────────────────────────
export async function loginWithGoogle() {
  hideError();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 1. Domain check
    if (!user.email.endsWith(ALLOWED_DOMAIN)) {
      await signOut(auth);
      showError(`Only ${ALLOWED_DOMAIN} accounts are allowed.`);
      return;
    }

    // 2. Fetch or create user document
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Auto-create minimal profile; redirect to register to complete
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        role: "visitor",
        isBlocked: false,
        createdAt: serverTimestamp(),
        isProfileComplete: false,
      });
      window.location.href = "register.html";
      return;
    }

    const userData = userSnap.data();

    // 3. Block check
    if (userData.isBlocked) {
      await signOut(auth);
      showError("Your access has been blocked by the library administrator. Please contact library staff.");
      return;
    }

    // 4. Profile completeness check
    if (!userData.isProfileComplete) {
      window.location.href = "register.html";
      return;
    }

    // 5. Role-based redirect
    if (userData.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "checkin.html";
    }

  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") return;
    if (err.code === "auth/unauthorized-domain") {
      showError(`Only ${ALLOWED_DOMAIN} accounts are permitted.`);
      return;
    }
    console.error(err);
    showError("Login failed. Please try again.");
  }
}

// ── Logout ───────────────────────────────────────────────────
export async function logout() {
  await signOut(auth);
  window.location.href = "index.html";
}

// ── Auth Guard (call on every protected page) ────────────────
export function requireAuth(allowedRole = null) {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        window.location.href = "index.html";
        reject("Not authenticated");
        return;
      }
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        window.location.href = "register.html";
        reject("No profile");
        return;
      }
      const data = userSnap.data();
      if (data.isBlocked) {
        await signOut(auth);
        window.location.href = "index.html";
        reject("Blocked");
        return;
      }
      if (allowedRole && data.role !== allowedRole) {
        window.location.href = data.role === "admin" ? "admin-dashboard.html" : "checkin.html";
        reject("Wrong role");
        return;
      }
      resolve({ user, userData: data });
    });
  });
}

// ── Current user data helper ─────────────────────────────────
export async function getCurrentUserData() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) { resolve(null); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      resolve(snap.exists() ? { user, userData: snap.data() } : null);
    });
  });
}
