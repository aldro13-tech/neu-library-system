// ============================================================
// checkin.js — multiple purpose selection via checkboxes
// ============================================================

import {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp,
} from "./firebase-config.js";
import { requireAuth, logout } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  let currentUser, userData;

  try {
    // null = allow both visitors AND admins
    const result = await requireAuth(null);
    currentUser = result.user;
    userData    = result.userData;
  } catch {
    return;
  }

  // ── Fill user info bar ────────────────────────────────────
  const nameEl   = document.getElementById("user-name");
  const idEl     = document.getElementById("user-id");
  const avatarEl = document.getElementById("user-avatar");

  if (nameEl)   nameEl.textContent = userData.displayName || userData.email;
  if (idEl)     idEl.textContent   = userData.schoolId ? `ID: ${userData.schoolId}` : "";
  if (avatarEl && userData.photoURL) avatarEl.src = userData.photoURL;

  // ── Logout ────────────────────────────────────────────────
  document.getElementById("logout-btn")
    ?.addEventListener("click", logout);

  // ── Form submit ───────────────────────────────────────────
  const form     = document.getElementById("checkin-form");
  const errorMsg = document.getElementById("error-msg");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorMsg) errorMsg.style.display = "none";

    // Collect ALL checked purposes
    const checked = Array.from(
      document.querySelectorAll('input[name="purpose-check"]:checked')
    ).map(cb => cb.value);

    if (checked.length === 0) {
      if (errorMsg) {
        errorMsg.textContent   = "Please select at least one purpose of visit.";
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
      // Join multiple purposes with " | " for readable storage
      const purposeString = checked.join(" | ");

      const visitData = {
        uid:         currentUser.uid,
        email:       currentUser.email,
        displayName: userData.displayName || currentUser.displayName || "",
        schoolId:    userData.schoolId    || "",
        college:     userData.college     || "",
        program:     userData.program     || "",
        purpose:     purposeString,
        purposes:    checked,            // also store as array for filtering
        checkInTime: serverTimestamp(),
        date:        new Date().toISOString().split("T")[0],
      };

      const visitRef = await addDoc(collection(db, "visits"), visitData);

      sessionStorage.setItem("lastVisitId", visitRef.id);
      sessionStorage.setItem("visitData", JSON.stringify({
        displayName: visitData.displayName,
        college:     visitData.college,
        purpose:     purposeString,
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
