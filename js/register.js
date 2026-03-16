// ============================================================
// register.js
// Two-step registration:
//   Step 1 — Google sign-in to verify NEU email + set password
//   Step 2 — Complete profile (name, school ID, college, program)
//
// After registration the user can log in via:
//   a) Google sign-in button
//   b) Email + password they set here
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

import {
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── UI helpers ────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById("error-msg");
  if (el) { el.textContent = msg; el.style.display = "block"; }
}
function hideError() {
  const el = document.getElementById("error-msg");
  if (el) el.style.display = "none";
}

function goToStep2(user) {
  // Update step indicators
  document.getElementById("step-dot-1").className = "reg-step-dot done";
  document.getElementById("step-dot-1").textContent = "✓";
  document.getElementById("step-line-1").className  = "reg-step-line done";
  document.getElementById("step-dot-2").className   = "reg-step-dot active";

  // Show step 2, hide step 1
  document.getElementById("step-1").classList.remove("active");
  document.getElementById("step-2").classList.add("active");

  // Fill in auth bar and email field
  const emailBar = document.getElementById("auth-bar-email");
  const emailField = document.getElementById("email");
  if (emailBar)   emailBar.textContent = user.email;
  if (emailField) emailField.value     = user.email;

  // Pre-fill name from Google
  if (user.displayName) {
    const parts = user.displayName.trim().split(" ");
    const fnEl = document.getElementById("first-name");
    const lnEl = document.getElementById("last-name");
    if (fnEl && parts[0]) fnEl.value = parts[0];
    if (lnEl && parts.length > 1) lnEl.value = parts[parts.length - 1];
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  const errorMsg = document.getElementById("error-msg");

  // ── Check if already logged in ────────────────────────────
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));

    // Profile already complete — redirect
    if (snap.exists() && snap.data().isProfileComplete) {
      const data = snap.data();
      window.location.href = data.role === "admin"
        ? "role-select.html"
        : "checkin.html";
      return;
    }

    // Signed in but profile incomplete — jump to step 2
    window._googleAuthed = true;

    // Enable Next button if password is also filled
    const pw = document.getElementById("reg-password")?.value || "";
    const nextBtn = document.getElementById("step1-next-btn");
    if (nextBtn) nextBtn.disabled = pw.length < 8;

    goToStep2(user);
  });

  // ── STEP 1: Google sign-in button ─────────────────────────
  const googleBtn = document.getElementById("google-reg-btn");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      hideError();
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user   = result.user;

        if (!user.email.endsWith(ALLOWED_DOMAIN)) {
          await signOut(auth);
          showError(`Only ${ALLOWED_DOMAIN} accounts are allowed.`);
          return;
        }

        // Mark Google auth done
        window._googleAuthed = true;

        // Enable Next button if password already typed
        const pw = document.getElementById("reg-password")?.value || "";
        const nextBtn = document.getElementById("step1-next-btn");
        if (nextBtn) nextBtn.disabled = pw.length < 8;

        googleBtn.textContent = "✅ Google account verified";
        googleBtn.disabled    = true;
        googleBtn.style.background = "#E8F5E9";
        googleBtn.style.color      = "#2E7D32";
        googleBtn.style.border     = "1.5px solid #C8E6C9";

      } catch (err) {
        if (err.code === "auth/popup-closed-by-user") return;
        showError("Google sign-in failed. Please try again.");
        console.error(err);
      }
    });
  }

  // ── STEP 1: Next button ───────────────────────────────────
  const nextBtn = document.getElementById("step1-next-btn");
  if (nextBtn) {
    nextBtn.addEventListener("click", async () => {
      hideError();
      const user = auth.currentUser;
      if (!user) {
        showError("Please sign in with Google first.");
        return;
      }

      const pw      = document.getElementById("reg-password").value;
      const pwConf  = document.getElementById("reg-password-confirm").value;

      if (pw.length < 8) {
        showError("Password must be at least 8 characters.");
        return;
      }
      if (pw !== pwConf) {
        showError("Passwords do not match.");
        return;
      }

      nextBtn.disabled    = true;
      nextBtn.textContent = "Setting up…";

      try {
        // Link email+password credential to the Google account
        const credential = EmailAuthProvider.credential(user.email, pw);
        await linkWithCredential(user, credential);

        goToStep2(user);

      } catch (err) {
        if (err.code === "auth/provider-already-linked" ||
            err.code === "auth/email-already-in-use" ||
            err.code === "auth/credential-already-in-use") {
          // Password already linked — just proceed to step 2
          goToStep2(user);
        } else {
          console.error(err);
          showError("Failed to set password. Please try again.");
          nextBtn.disabled    = false;
          nextBtn.textContent = "Next: Complete Profile →";
        }
      }
    });
  }

  // ── STEP 2: Profile form submit ───────────────────────────
  const form = document.getElementById("register-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();

      const schoolId  = document.getElementById("school-id")?.value.trim();
      const firstName = document.getElementById("first-name")?.value.trim();
      const mi        = document.getElementById("mi")?.value.trim();
      const lastName  = document.getElementById("last-name")?.value.trim();
      const college   = document.getElementById("college")?.value;
      const program   = document.getElementById("program")?.value;

      if (!schoolId || !firstName || !lastName || !college || !program) {
        showError("Please fill in all required fields.");
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
          updatedAt: serverTimestamp(),
        }, { merge: true });

        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data();
        window.location.href = data.role === "admin"
          ? "role-select.html"
          : "checkin.html";

      } catch (err) {
        console.error(err);
        showError("Failed to save your profile. Please try again.");
        if (submitBtn) {
          submitBtn.disabled  = false;
          submitBtn.textContent = "Complete Registration";
        }
      }
    });
  }
});
