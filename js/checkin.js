// ============================================================
// checkin.js  –  self-contained (no external imports needed)
// ============================================================

import {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp,
} from "./firebase-config.js";
import { requireAuth, logout } from "./auth.js";

// ── All colleges defined right here ──────────────────────────
const COLLEGES = {
  "College of Accountancy": ["Bachelor of Science in Accountancy"],
  "College of Agriculture": ["Bachelor of Science in Agriculture"],
  "College of Arts and Sciences": [
    "Bachelor of Arts in Economics",
    "Bachelor of Arts in Political Science",
    "Bachelor of Science in Biology",
    "Bachelor of Science in Psychology",
    "Bachelor of Public Administration",
  ],
  "College of Business Administration": [
    "BS in Business Administration – Major in Financial Management",
    "BS in Business Administration – Major in Human Resource Development Management",
    "BS in Business Administration – Major in Legal Management",
    "BS in Business Administration – Major in Marketing Management",
    "Bachelor of Science in Entrepreneurship",
    "Bachelor of Science in Real Estate Management",
  ],
  "College of Communication": [
    "Bachelor of Arts in Broadcasting",
    "Bachelor of Arts in Communication",
    "Bachelor of Arts in Journalism",
  ],
  "College of Informatics and Computing Studies (CICS)": [
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Systems",
    "Bachelor of Library and Information Science",
    "BS in Entertainment and Multimedia Computing – Digital Animation Technology",
    "BS in Entertainment and Multimedia Computing – Game Development",
  ],
  "College of Criminology": ["Bachelor of Science in Criminology"],
  "College of Education": [
    "Bachelor of Elementary Education – General",
    "Bachelor of Elementary Education – Preschool Education",
    "Bachelor of Elementary Education – Special Education",
    "Bachelor of Secondary Education – English",
    "Bachelor of Secondary Education – Filipino",
    "Bachelor of Secondary Education – Mathematics",
    "Bachelor of Secondary Education – Science",
    "Bachelor of Secondary Education – Social Studies",
    "Bachelor of Secondary Education – MAPEH",
    "Bachelor of Secondary Education – Technology and Livelihood Education",
  ],
  "College of Engineering and Architecture": [
    "Bachelor of Science in Architecture",
    "Bachelor of Science in Astronomy",
    "Bachelor of Science in Civil Engineering",
    "Bachelor of Science in Electrical Engineering",
    "Bachelor of Science in Electronics Engineering",
    "Bachelor of Science in Industrial Engineering",
    "Bachelor of Science in Mechanical Engineering",
  ],
  "College of Medical Technology": ["Bachelor of Science in Medical Technology"],
  "College of Midwifery": ["Diploma in Midwifery"],
  "College of Music": [
    "Bachelor of Music – Choral Conducting",
    "Bachelor of Music – Music Education",
    "Bachelor of Music – Piano",
    "Bachelor of Music – Voice",
  ],
  "College of Nursing": ["Bachelor of Science in Nursing"],
  "College of Physical Therapy": ["Bachelor of Science in Physical Therapy"],
  "College of Respiratory Therapy": ["Bachelor of Science in Respiratory Therapy"],
  "School of International Relations": ["Bachelor of Arts in Foreign Service"],
  "College of Law": ["Juris Doctor (JD)"],
  "College of Medicine": ["Doctor of Medicine (MD)"],
  "School of Graduate Studies": [
    "Doctor of Philosophy (PhD) in Education",
    "Doctor in Business Administration (DBA)",
    "Master of Arts in Education (MAEd)",
    "Master in Business Administration (MBA)",
  ],
  "Administrative / Faculty / Staff": [
    "N/A – Faculty",
    "N/A – Staff",
    "N/A – Administration",
  ],
};

// ── Populate college <select> ─────────────────────────────────
function populateColleges(selectedCollege) {
  const sel = document.getElementById("college-confirm");
  if (!sel) return;
  sel.innerHTML = '<option value="">Select College / Department</option>';
  Object.keys(COLLEGES).forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    if (c === selectedCollege) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ── Main ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  let currentUser, userData;

  try {
    const result = await requireAuth("visitor");
    currentUser = result.user;
    userData = result.userData;
  } catch {
    return;
  }

  // Fill in user info display bar
  const nameEl    = document.getElementById("user-name");
  const collegeEl = document.getElementById("user-college");
  const idEl      = document.getElementById("user-id");
  const avatarEl  = document.getElementById("user-avatar");

  if (nameEl)    nameEl.textContent    = userData.displayName || userData.email;
  if (collegeEl) collegeEl.textContent = userData.college || "—";
  if (idEl)      idEl.textContent      = userData.schoolId ? `ID: ${userData.schoolId}` : "";
  if (avatarEl && userData.photoURL)   avatarEl.src = userData.photoURL;

  // Pre-select the user's registered college
  populateColleges(userData.college);

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
    const college = document.getElementById("college-confirm")?.value;

    if (!purpose) {
      if (errorMsg) {
        errorMsg.textContent = "Please select your purpose of visit.";
        errorMsg.style.display = "block";
      }
      return;
    }
    if (!college) {
      if (errorMsg) {
        errorMsg.textContent = "Please select your college / department.";
        errorMsg.style.display = "block";
      }
      return;
    }

    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in…";
    }

    try {
      const visitData = {
        uid:         currentUser.uid,
        email:       currentUser.email,
        displayName: userData.displayName || currentUser.displayName || "",
        schoolId:    userData.schoolId || "",
        college,
        program:     userData.program || "",
        purpose,
        checkInTime: serverTimestamp(),
        date:        new Date().toISOString().split("T")[0], // YYYY-MM-DD
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
        errorMsg.textContent = "Failed to log your visit. Please try again.";
        errorMsg.style.display = "block";
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "✔ Check In Now";
      }
    }
  });
});
