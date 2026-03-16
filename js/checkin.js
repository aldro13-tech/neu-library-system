// ============================================================
// checkin.js
// ============================================================

import {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp,
} from "./firebase-config.js";
import { requireAuth, logout } from "./auth.js";

// ── Main ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  let currentUser, userData;

  try {
    // ── Use null so BOTH visitors and admins can access ──────
    // Passing "visitor" was causing admins to get redirected
    const result = await requireAuth(null);
    currentUser = result.user;
    userData    = result.userData;
  } catch {
    return;
  }

  // Fill in user info display bar
  const nameEl   = document.getElementById("user-name");
  const idEl     = document.getElementById("user-id");
  const avatarEl = document.getElementById("user-avatar");

  if (nameEl)   nameEl.textContent = userData.displayName || userData.email;
  if (idEl)     idEl.textContent   = userData.schoolId ? `ID: ${userData.schoolId}` : "";
  if (avatarEl && userData.photoURL) avatarEl.src = userData.photoURL;

  // ── Logout ────────────────────────────────────────────────
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // ── Sync radio buttons → hidden <select #purpose> ─────────
  document.querySelectorAll('input[name="purpose-radio"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const sel = document.getElementById("purpose");
      if (sel) sel.value = radio.value;
    });
  });

  // ── Form submit ───────────────────────────────────────────
  const form     = document.getElementById("checkin-form");
  const errorMsg = document.getElementById("error-msg");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorMsg) errorMsg.style.display = "none";

    const purpose = document.getElementById("purpose")?.value;

    if (!purpose) {
      if (errorMsg) {
        errorMsg.textContent = "Please select your purpose of visit.";
        errorMsg.style.display = "block";
      }
      return;
    }

    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
      submitBtn.disabled    = true;
      submitBtn.textContent = "Logging in…";
    }

    try {
      const visitData = {
        uid:         currentUser.uid,
        email:       currentUser.email,
        displayName: userData.displayName || currentUser.displayName || "",
        schoolId:    userData.schoolId    || "",
        college:     userData.college     || "",
        program:     userData.program     || "",
        purpose,
        checkInTime: serverTimestamp(),
        date:        new Date().toISOString().split("T")[0],
      };

      const visitRef = await addDoc(collection(db, "visits"), visitData);

      sessionStorage.setItem("lastVisitId", visitRef.id);
      sessionStorage.setItem("visitData", JSON.stringify({
        displayName: visitData.displayName,
        college:     visitData.college,
        purpose:     visitData.purpose,
        schoolId:    visitData.schoolId,
      }));

      window.location.href = "welcome.html";

    } catch (err) {
      console.error(err);
      if (errorMsg) {
        errorMsg.textContent   = "Failed to log your visit. Please try again.";
        errorMsg.style.display = "block";
      }
      if (submitBtn) {
        submitBtn.disabled    = false;
        submitBtn.textContent = "✔ Check In Now";
      }
    }
  });
});
