// ============================================================
// admin-dashboard.js
// Powers the admin dashboard: visit statistics, date-range
// filtering, college breakdowns, user search, block/unblock.
// Now includes filters for purpose, college, and visitor type.
// ============================================================

import {
  auth,
  db,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from "./firebase-config.js";
import { requireAuth, logout } from "./auth.js";

let visitsChart = null;
let collegeChart = null;
let allVisits = [];      // raw fetched visits
let filteredVisits = []; // after applying dropdowns

// ── All colleges list (for filter dropdown) ───────────────────
const ALL_COLLEGES = [
  "College of Accountancy",
  "College of Agriculture",
  "College of Arts and Sciences",
  "College of Business Administration",
  "College of Communication",
  "College of Informatics and Computing Studies (CICS)",
  "College of Criminology",
  "College of Education",
  "College of Engineering and Architecture",
  "College of Medical Technology",
  "College of Midwifery",
  "College of Music",
  "College of Nursing",
  "College of Physical Therapy",
  "College of Respiratory Therapy",
  "School of International Relations",
  "College of Law",
  "College of Medicine",
  "School of Graduate Studies",
  "Administrative / Faculty / Staff",
];

// ── Visitor type detector ─────────────────────────────────────
function getVisitorType(visit) {
  const college = (visit.college || "").toLowerCase();
  const program = (visit.program || "").toLowerCase();
  if (
    college.includes("administrative") ||
    program.includes("faculty") ||
    program.includes("staff") ||
    program.includes("administration") ||
    program.includes("n/a")
  ) {
    if (program.includes("faculty")) return "faculty";
    return "staff";
  }
  return "student";
}

// ── Date range helpers ─────────────────────────────────────────
function getDateRange(filter) {
  const now = new Date();
  const start = new Date();
  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      const from = document.getElementById("date-from").value;
      const to   = document.getElementById("date-to").value;
      if (!from || !to) return null;
      return {
        start: new Date(from + "T00:00:00"),
        end:   new Date(to   + "T23:59:59"),
      };
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
}

// ── Fetch visits from Firestore ───────────────────────────────
async function fetchVisits(range) {
  const q = query(
    collection(db, "visits"),
    where("checkInTime", ">=", Timestamp.fromDate(range.start)),
    where("checkInTime", "<=", Timestamp.fromDate(range.end)),
    orderBy("checkInTime", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Apply the 3 dropdown filters ──────────────────────────────
function applyFilters(visits) {
  const purpose     = document.getElementById("filter-purpose")?.value || "";
  const college     = document.getElementById("filter-college")?.value || "";
  const visitorType = document.getElementById("filter-visitor-type")?.value || "";

  return visits.filter((v) => {
    if (purpose     && v.purpose !== purpose)                    return false;
    if (college     && v.college !== college)                    return false;
    if (visitorType && getVisitorType(v) !== visitorType)        return false;
    return true;
  });
}

// ── Aggregate helpers ─────────────────────────────────────────
function aggregateByCollege(visits) {
  const counts = {};
  visits.forEach((v) => {
    const c = v.college || "Unknown";
    counts[c] = (counts[c] || 0) + 1;
  });
  return counts;
}

function aggregateByDay(visits) {
  const counts = {};
  visits.forEach((v) => {
    const d = v.date || "Unknown";
    counts[d] = (counts[d] || 0) + 1;
  });
  const sorted = Object.keys(counts).sort();
  return { labels: sorted, data: sorted.map((k) => counts[k]) };
}

function aggregateByPurpose(visits) {
  const counts = {};
  visits.forEach((v) => {
    const p = v.purpose || "Unknown";
    counts[p] = (counts[p] || 0) + 1;
  });
  return counts;
}

// ── Render stat cards ─────────────────────────────────────────
function renderStatCards(visits) {
  document.getElementById("stat-total").textContent = visits.length;

  const colleges = new Set(visits.map((v) => v.college));
  document.getElementById("stat-colleges").textContent = colleges.size;

  const today      = new Date().toISOString().split("T")[0];
  const todayCount = visits.filter((v) => v.date === today).length;
  document.getElementById("stat-today").textContent = todayCount;

  const purposeAgg = aggregateByPurpose(visits);
  const topPurpose = Object.entries(purposeAgg).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("stat-top-purpose").textContent =
    topPurpose ? topPurpose[0] : "—";

  // Extra cards
  const students = visits.filter((v) => getVisitorType(v) === "student").length;
  const faculty  = visits.filter((v) => getVisitorType(v) === "faculty").length;
  const staff    = visits.filter((v) => getVisitorType(v) === "staff").length;
  const studentEl = document.getElementById("stat-students");
  const facultyEl = document.getElementById("stat-faculty");
  const staffEl   = document.getElementById("stat-staff");
  if (studentEl) studentEl.textContent = students;
  if (facultyEl) facultyEl.textContent = faculty;
  if (staffEl)   staffEl.textContent   = staff;
}

// ── Chart colors ──────────────────────────────────────────────
const CHART_COLORS = [
  "#0A3B7E","#1565C0","#1976D2","#F9C61F","#FDD835",
  "#FFEE58","#42A5F5","#64B5F6","#0D47A1","#FFC107",
];

// ── Daily bar chart ───────────────────────────────────────────
function renderDailyChart(visits) {
  const { labels, data } = aggregateByDay(visits);
  const ctx = document.getElementById("daily-chart").getContext("2d");
  if (visitsChart) visitsChart.destroy();
  visitsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Visitors",
        data,
        backgroundColor: "#0A3B7E",
        borderColor: "#F9C61F",
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#0A2463", titleColor: "#F9C61F", bodyColor: "#fff" },
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: "#555", stepSize: 1 }, grid: { color: "#eee" } },
        x: { ticks: { color: "#555" }, grid: { display: false } },
      },
    },
  });
}

// ── College doughnut chart ────────────────────────────────────
function renderCollegeChart(visits) {
  const agg    = aggregateByCollege(visits);
  const labels = Object.keys(agg);
  const data   = Object.values(agg);
  const ctx    = document.getElementById("college-chart").getContext("2d");
  if (collegeChart) collegeChart.destroy();
  collegeChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderColor: "#fff",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { font: { size: 11 }, color: "#333" } },
        tooltip: { backgroundColor: "#0A2463", titleColor: "#F9C61F", bodyColor: "#fff" },
      },
      cutout: "65%",
    },
  });
}

// ── Visit log table ───────────────────────────────────────────
function renderVisitTable(visits) {
  const tbody = document.getElementById("visit-table-body");
  tbody.innerHTML = "";
  if (visits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="no-data">No visits found for this period.</td></tr>`;
    return;
  }
  visits.slice(0, 50).forEach((v) => {
    const time = v.checkInTime?.toDate
      ? v.checkInTime.toDate().toLocaleString("en-PH")
      : "—";
    const type = getVisitorType(v);
    const typeBadge =
      type === "faculty" ? `<span class="type-badge faculty">Faculty</span>` :
      type === "staff"   ? `<span class="type-badge staff">Staff</span>` :
                           `<span class="type-badge student">Student</span>`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.displayName || "—"}</td>
      <td>${v.schoolId || "—"}</td>
      <td>${v.college || "—"}</td>
      <td>${v.purpose || "—"}</td>
      <td>${typeBadge}</td>
      <td>${time}</td>
      <td><span class="visit-badge">Logged</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Populate college filter dropdown ─────────────────────────
function populateCollegeFilter() {
  const sel = document.getElementById("filter-college");
  if (!sel) return;
  ALL_COLLEGES.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

// ── Full dashboard refresh (fetch + filter + render) ─────────
async function refreshDashboard() {
  const filter = document.getElementById("date-filter").value;
  const range  = getDateRange(filter);
  if (!range) { alert("Please select valid From and To dates."); return; }

  document.getElementById("loading-overlay").style.display = "flex";

  try {
    allVisits      = await fetchVisits(range);
    filteredVisits = applyFilters(allVisits);
    renderStatCards(filteredVisits);
    renderDailyChart(filteredVisits);
    renderCollegeChart(filteredVisits);
    renderVisitTable(filteredVisits);
  } catch (err) {
    console.error("Dashboard load error:", err);
  } finally {
    document.getElementById("loading-overlay").style.display = "none";
  }
}

// ── Re-filter without re-fetching Firestore ───────────────────
function refilter() {
  filteredVisits = applyFilters(allVisits);
  renderStatCards(filteredVisits);
  renderDailyChart(filteredVisits);
  renderCollegeChart(filteredVisits);
  renderVisitTable(filteredVisits);
}

// ── User search & block toggle ────────────────────────────────
async function searchUsers(term) {
  if (!term || term.length < 2) {
    document.getElementById("user-search-results").innerHTML = "";
    return;
  }
  const snap   = await getDocs(collection(db, "users"));
  const lower  = term.toLowerCase();
  const results = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(
      (u) =>
        u.displayName?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower) ||
        u.schoolId?.toLowerCase().includes(lower)
    );
  renderUserResults(results);
}

function renderUserResults(users) {
  const container = document.getElementById("user-search-results");
  container.innerHTML = "";
  if (users.length === 0) {
    container.innerHTML = `<p class="no-results">No users found.</p>`;
    return;
  }
  users.forEach((u) => {
    const card = document.createElement("div");
    card.className = "user-result-card";
    card.innerHTML = `
      <div class="user-result-info">
        <strong>${u.displayName || "No Name"}</strong>
        <span>${u.email}</span>
        <span class="user-college-tag">${u.college || "Unknown"}</span>
      </div>
      <div class="user-result-actions">
        <span class="status-badge ${u.isBlocked ? "blocked" : "active"}">
          ${u.isBlocked ? "Blocked" : "Active"}
        </span>
        <button class="block-btn ${u.isBlocked ? "unblock" : "block"}"
          data-uid="${u.id}" data-blocked="${u.isBlocked}">
          ${u.isBlocked ? "Unblock" : "Block"}
        </button>
      </div>
    `;

    // Click card body (not the block button) → open modal
    card.addEventListener("click", (e) => {
      if (e.target.closest(".block-btn")) return;
      openUserModal(u);
    });

    container.appendChild(card);
  });

  container.querySelectorAll(".block-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const uid              = btn.dataset.uid;
      const currentlyBlocked = btn.dataset.blocked === "true";
      btn.disabled    = true;
      btn.textContent = "Updating…";
      try {
        await updateDoc(doc(db, "users", uid), { isBlocked: !currentlyBlocked });
        await searchUsers(document.getElementById("user-search-input").value);
      } catch (err) {
        console.error(err);
        alert("Failed to update user status.");
      }
    });
  });
}

// ── User visit modal ──────────────────────────────────────────
let modalUserData   = null;
let modalUserVisits = [];

async function openUserModal(userData) {
  modalUserData = userData;

  // Fill header
  document.getElementById("modal-user-name").textContent   = userData.displayName || "No Name";
  document.getElementById("modal-user-email").textContent  = userData.email;
  document.getElementById("modal-user-college").textContent = userData.college || "Unknown";
  document.getElementById("modal-visit-body").innerHTML    =
    `<tr><td colspan="4" class="no-data">Loading visits…</td></tr>`;
  document.getElementById("modal-stat-total").textContent   = "…";
  document.getElementById("modal-stat-last").textContent    = "…";
  document.getElementById("modal-stat-purpose").textContent = "…";

  // Open modal
  document.getElementById("user-modal").classList.add("open");

  // Fetch this user's visits
  try {
    const q    = query(
      collection(db, "visits"),
      where("uid", "==", userData.id),
      orderBy("checkInTime", "desc")
    );
    const snap = await getDocs(q);
    modalUserVisits = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderModalVisits(modalUserVisits);
  } catch (err) {
    console.error("Modal fetch error:", err);
    document.getElementById("modal-visit-body").innerHTML =
      `<tr><td colspan="4" class="no-data">Failed to load visits.</td></tr>`;
  }
}

function renderModalVisits(visits) {
  // Stat cards
  document.getElementById("modal-stat-total").textContent = visits.length;

  if (visits.length > 0) {
    const last = visits[0].checkInTime?.toDate
      ? visits[0].checkInTime.toDate().toLocaleDateString("en-PH")
      : "—";
    document.getElementById("modal-stat-last").textContent = last;

    const purposeCounts = {};
    visits.forEach((v) => {
      const p = v.purpose || "Unknown";
      purposeCounts[p] = (purposeCounts[p] || 0) + 1;
    });
    const top = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0];
    const topLabel = top ? top[0].split(" | ")[0] : "—"; // show first purpose if multiple
    document.getElementById("modal-stat-purpose").textContent = topLabel;
  } else {
    document.getElementById("modal-stat-last").textContent    = "—";
    document.getElementById("modal-stat-purpose").textContent = "—";
  }

  // Table
  const tbody = document.getElementById("modal-visit-body");
  tbody.innerHTML = "";
  if (visits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="no-data">No visits recorded yet.</td></tr>`;
    return;
  }
  visits.forEach((v) => {
    const time = v.checkInTime?.toDate
      ? v.checkInTime.toDate().toLocaleString("en-PH") : "—";
    const dateOnly = v.date || "—";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dateOnly}</td>
      <td>${v.purpose || "—"}</td>
      <td>${time}</td>
      <td><span class="visit-badge">Logged</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function closeUserModal() {
  document.getElementById("user-modal").classList.remove("open");
  modalUserData   = null;
  modalUserVisits = [];
}

function generateUserPDF() {
  if (!modalUserData || !window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const pdoc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const NOW  = new Date().toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" });

  // Header
  pdoc.setFillColor(10, 36, 99);
  pdoc.rect(0, 0, 210, 28, "F");
  pdoc.setFillColor(249, 198, 31);
  pdoc.rect(0, 28, 210, 3, "F");
  pdoc.setFont("helvetica", "bold");
  pdoc.setFontSize(14);
  pdoc.setTextColor(255, 255, 255);
  pdoc.text("NEW ERA UNIVERSITY LIBRARY", 105, 11, { align: "center" });
  pdoc.setFontSize(9);
  pdoc.setFont("helvetica", "normal");
  pdoc.text("Individual Visitor Report", 105, 18, { align: "center" });
  pdoc.text(`Generated: ${NOW}`, 105, 24, { align: "center" });

  // User info block
  pdoc.setTextColor(10, 36, 99);
  pdoc.setFont("helvetica", "bold");
  pdoc.setFontSize(12);
  pdoc.text(modalUserData.displayName || "Unknown", 14, 40);
  pdoc.setFont("helvetica", "normal");
  pdoc.setFontSize(9);
  pdoc.setTextColor(80, 80, 80);
  pdoc.text(`Email: ${modalUserData.email}`, 14, 47);
  pdoc.text(`College: ${modalUserData.college || "—"}`, 14, 53);
  pdoc.text(`School ID: ${modalUserData.schoolId || "—"}`, 14, 59);
  pdoc.text(`Total Visits: ${modalUserVisits.length}`, 14, 65);

  // Divider
  pdoc.setDrawColor(249, 198, 31);
  pdoc.setLineWidth(0.5);
  pdoc.line(14, 70, 196, 70);

  // Visit log table
  const rows = modalUserVisits.map((v) => [
    v.date || "—",
    v.purpose || "—",
    v.checkInTime?.toDate
      ? v.checkInTime.toDate().toLocaleString("en-PH") : "—",
  ]);

  pdoc.autoTable({
    startY: 74,
    head:   [["Date", "Purpose", "Check-in Time"]],
    body:   rows,
    theme:  "striped",
    headStyles:         { fillColor: [10, 36, 99], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles:         { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    margin: { left: 14, right: 14 },
    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 100 }, 2: { cellWidth: 50 } },
  });

  // Footer
  const pages = pdoc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdoc.setPage(i);
    pdoc.setFillColor(10, 36, 99);
    pdoc.rect(0, 285, 210, 12, "F");
    pdoc.setTextColor(255, 255, 255);
    pdoc.setFontSize(7);
    pdoc.text(
      `NEU Library Visitor Management System  |  Page ${i} of ${pages}  |  Confidential`,
      105, 292, { align: "center" }
    );
  }

  const safe = (modalUserData.displayName || "visitor").replace(/\s+/g, "_");
  pdoc.save(`NEU_Library_${safe}_visits.pdf`);
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { userData } = await requireAuth("admin");
    document.getElementById("admin-name").textContent =
      userData.displayName || userData.email;
  } catch {
    return;
  }

  populateCollegeFilter();

  // Logout
  document.getElementById("logout-btn").addEventListener("click", logout);

  // Date filter
  const filterSelect = document.getElementById("date-filter");
  const customRange  = document.getElementById("custom-range");
  filterSelect.addEventListener("change", () => {
    customRange.style.display = filterSelect.value === "custom" ? "flex" : "none";
    if (filterSelect.value !== "custom") refreshDashboard();
  });
  document.getElementById("apply-custom").addEventListener("click", refreshDashboard);

  // Purpose / college / visitor-type filters (no refetch needed)
  ["filter-purpose", "filter-college", "filter-visitor-type"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", refilter);
  });

  // User search
  let searchTimer;
  document.getElementById("user-search-input").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchUsers(e.target.value.trim()), 400);
  });

  // Modal close
  document.getElementById("modal-close-btn").addEventListener("click", closeUserModal);
  document.getElementById("user-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeUserModal();
  });

  // Modal PDF
  document.getElementById("modal-pdf-btn").addEventListener("click", generateUserPDF);

  await refreshDashboard();
});

export { allVisits, filteredVisits, aggregateByCollege, aggregateByPurpose, aggregateByDay };