// ============================================================
// register.js
// Handles Firebase auth state + form submission only.
// Dropdown population is handled by the plain <script> in
// register.html — no imports needed for that part.
// ============================================================

import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  ADMIN_EMAILS,
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {

  const errorMsg  = document.getElementById("error-msg");
  const form      = document.getElementById("register-form");

  // ── Pre-fill email + name from Google Auth ──────────────
  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "index.html"; return; }

    const emailField = document.getElementById("email");
    if (emailField) emailField.value = user.email;

    if (user.displayName) {
      const parts = user.displayName.trim().split(" ");
      const fnEl = document.getElementById("first-name");
      const lnEl = document.getElementById("last-name");
      if (fnEl && parts[0]) fnEl.value = parts[0];
      if (lnEl && parts.length > 1) lnEl.value = parts[parts.length - 1];
    }

    // Already completed? Redirect now
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists() && snap.data().isProfileComplete) {
      const data = snap.data();
      window.location.href = data.role === "admin"
        ? "admin-dashboard.html"
        : "checkin.html";
    }
  });

  // ── Form submit → save to Firestore ─────────────────────
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorMsg) errorMsg.style.display = "none";

      const schoolId  = document.getElementById("school-id")?.value.trim();
      const firstName = document.getElementById("first-name")?.value.trim();
      const mi        = document.getElementById("mi")?.value.trim();
      const lastName  = document.getElementById("last-name")?.value.trim();
      const college   = document.getElementById("college")?.value;
      const program   = document.getElementById("program")?.value;

      if (!schoolId || !firstName || !lastName || !college || !program) {
        if (errorMsg) {
          errorMsg.textContent = "Please fill in all required fields.";
          errorMsg.style.display = "block";
        }
        return;
      }

      const user = auth.currentUser;
      if (!user) { window.location.href = "index.html"; return; }

      const submitBtn = document.getElementById("submit-btn");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Saving…"; }

      try {
        const displayName = [firstName, mi ? mi + "." : "", lastName]
          .filter(Boolean).join(" ");

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          schoolId, firstName, mi: mi || "", lastName,
          displayName, college, program,
          photoURL: user.photoURL || "",
          isProfileComplete: true,
          isBlocked: false,
          createdAt: serverTimestamp(),
          role: ADMIN_EMAILS.includes(user.email) ? "admin" : "visitor",
        });

        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data();
        window.location.href = data.role === "admin"
          ? "admin-dashboard.html"
          : "checkin.html";

      } catch (err) {
        console.error(err);
        if (errorMsg) {
          errorMsg.textContent = "Failed to save your profile. Please try again.";
          errorMsg.style.display = "block";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Complete Registration";
        }
      }
    });
  }
});
