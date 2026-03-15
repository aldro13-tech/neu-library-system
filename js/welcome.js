// ============================================================
// welcome.js
// Reads the visit data stored in sessionStorage after check-in
// and displays the welcome card. Auto-redirects after timeout.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const raw = sessionStorage.getItem("visitData");

  if (!raw) {
    // No visit data – redirect to login
    window.location.href = "index.html";
    return;
  }

  const data = JSON.parse(raw);

  // Populate the welcome card
  const nameEl = document.getElementById("visitor-name");
  const collegeEl = document.getElementById("visitor-college");
  const purposeEl = document.getElementById("visitor-purpose");
  const idEl = document.getElementById("visitor-id");

  if (nameEl) nameEl.textContent = data.displayName || "Visitor";
  if (collegeEl) collegeEl.textContent = data.college || "";
  if (purposeEl) purposeEl.textContent = data.purpose || "";
  if (idEl) idEl.textContent = data.schoolId ? `ID: ${data.schoolId}` : "";

  // Set current date/time
  const timeEl = document.getElementById("visit-time");
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Clear session data after reading
  sessionStorage.removeItem("visitData");
  sessionStorage.removeItem("lastVisitId");

  // Auto-redirect countdown
  let seconds = 15;
  const countdownEl = document.getElementById("countdown");
  const interval = setInterval(() => {
    seconds--;
    if (countdownEl) countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(interval);
      window.location.href = "index.html";
    }
  }, 1000);

  // Manual return button
  const returnBtn = document.getElementById("return-btn");
  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      clearInterval(interval);
      window.location.href = "index.html";
    });
  }
});
