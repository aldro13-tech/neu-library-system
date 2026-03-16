// ============================================================
// register.js
// Two-step registration:
//   Step 1 — verify identity via Google OR typed email+password
//   Step 2 — complete profile (name, school ID, college, program)
//
// After registration the user can log in via:
//   a) Google sign-in button
//   b) Email + the password they set here
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
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Helpers ───────────────────────────────────────────────────
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
  const d1 = document.getElementById("step-dot-1");
  const l1 = document.getElementById("step-line-1");
  const d2 = document.getElementById("step-dot-2");
  if (d1) { d1.className = "reg-step-dot done"; d1.textContent = "✓"; }
  if (l1)   l1.className  = "reg-step-line done";
  if (d2)   d2.className  = "reg-step-dot active";

  // Switch panels
  document.getElementById("step-1").classList.remove("active");
  document.getElementById("step-2").classList.add("active");

  // Fill verified email bar
  const emailBar   = document.getElementById("auth-bar-email");
  const emailField = document.getElementById("email");
  if (emailBar)   emailBar.textContent = user.email;
  if (emailField) emailField.value     = user.email;

  // Pre-fill name from Google (if available)
  if (user.displayName) {
    const parts = user.displayName.trim().split(" ");
    const fnEl = document.getElementById("first-name");
    const lnEl = document.getElementById("last-name");
    if (fnEl && parts[0])          fnEl.value = parts[0];
    if (lnEl && parts.length > 1)  lnEl.value = parts[parts.length - 1];
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // ── If already signed in and profile complete → redirect ──
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists() && snap.data().isProfileComplete) {
      const data = snap.data();
      window.location.href = data.role === "admin"
        ? "role-select.html" : "checkin.html";
      return;
    }
    // Signed in but profile incomplete → jump to step 2
    goToStep2(user);
  });

  // ── Google button ─────────────────────────────────────────
  document.getElementById("google-reg-btn")
    ?.addEventListener("click", async () => {
      hideError();
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user   = result.user;

        if (!user.email.endsWith(ALLOWED_DOMAIN)) {
          await signOut(auth);
          showError(`Only ${ALLOWED_DOMAIN} accounts are allowed.`);
          return;
        }

        // Try to link email+password if the user typed a password
        const pw = document.getElementById("reg-password")?.value || "";
        if (pw.length >= 8) {
          try {
            const cred = EmailAuthProvider.credential(user.email, pw);
            await linkWithCredential(user, cred);
          } catch (linkErr) {
            // Already linked — fine, ignore
            if (!["auth/provider-already-linked",
                  "auth/credential-already-in-use",
                  "auth/email-already-in-use"].includes(linkErr.code)) {
              console.warn("Link warning:", linkErr.code);
            }
          }
        }

        goToStep2(user);

      } catch (err) {
        if (err.code === "auth/popup-closed-by-user") return;
        showError("Google sign-in failed. Please try again.");
        console.error(err);
      }
    });

  // ── Manual email → Next button ────────────────────────────
  document.getElementById("step1-next-btn")
    ?.addEventListener("click", async () => {
      hideError();

      const emailInput = document.getElementById("reg-email")?.value.trim();
      const pw         = document.getElementById("reg-password")?.value;
      const pwConf     = document.getElementById("reg-password-confirm")?.value;

      // If user already signed in via Google, skip email/password check
      if (auth.currentUser) {
        // Just validate passwords if they typed them
        if (pw && pw.length < 8) {
          showError("Password must be at least 8 characters."); return;
        }
        if (pw && pw !== pwConf) {
          showError("Passwords do not match."); return;
        }
        if (pw && pw.length >= 8) {
          try {
            const cred = EmailAuthProvider.credential(auth.currentUser.email, pw);
            await linkWithCredential(auth.currentUser, cred);
          } catch (e) { /* already linked */ }
        }
        goToStep2(auth.currentUser);
        return;
      }

      // Manual email registration
      if (!emailInput) {
        showError("Please sign in with Google or enter your email address."); return;
      }
      if (!emailInput.endsWith(ALLOWED_DOMAIN)) {
        showError(`Only ${ALLOWED_DOMAIN} email addresses are accepted.`); return;
      }
      if (!pw || pw.length < 8) {
        showError("Password must be at least 8 characters."); return;
      }
      if (pw !== pwConf) {
        showError("Passwords do not match."); return;
      }

      const btn = document.getElementById("step1-next-btn");
      btn.disabled    = true;
      btn.textContent = "Creating account…";

      try {
        // Create account with email + password
        const cred = await createUserWithEmailAndPassword(auth, emailInput, pw);
        const user = cred.user;

        // Create minimal Firestore document
        await setDoc(doc(db, "users", user.uid), {
          uid:               user.uid,
          email:             user.email,
          displayName:       "",
          photoURL:          "",
          role:              ADMIN_EMAILS.includes(user.email) ? "admin" : "visitor",
          isBlocked:         false,
          createdAt:         serverTimestamp(),
          isProfileComplete: false,
        });

        goToStep2(user);

      } catch (err) {
        const msgs = {
          "auth/email-already-in-use":
            "An account with this email already exists. Please sign in instead.",
          "auth/invalid-email":
            "Please enter a valid email address.",
          "auth/weak-password":
            "Password is too weak. Use at least 8 characters.",
        };
        showError(msgs[err.code] || "Registration failed. Please try again.");
        btn.disabled    = false;
        btn.textContent = "Next: Complete Profile →";
        console.error(err);
      }
    });

  // ── Step 2: Profile form ──────────────────────────────────
  document.getElementById("register-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();

      const schoolId  = document.getElementById("school-id")?.value.trim();
      const firstName = document.getElementById("first-name")?.value.trim();
      const mi        = document.getElementById("mi")?.value.trim();
      const lastName  = document.getElementById("last-name")?.value.trim();
      const college   = document.getElementById("college")?.value;
      const program   = document.getElementById("program")?.value;

      if (!schoolId || !firstName || !lastName || !college || !program) {
        showError("Please fill in all required fields."); return;
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
          photoURL:          user.photoURL || "",
          isProfileComplete: true,
          isBlocked:         false,
          updatedAt:         serverTimestamp(),
        }, { merge: true });

        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data();
        window.location.href = data.role === "admin"
          ? "role-select.html" : "checkin.html";

      } catch (err) {
        console.error(err);
        showError("Failed to save your profile. Please try again.");
        if (submitBtn) {
          submitBtn.disabled  = false;
          submitBtn.textContent = "Complete Registration";
        }
      }
    });
});
