// ============================================================
// pdf-report.js
// Generates downloadable PDF reports from dashboard data
// using jsPDF + jsPDF-AutoTable.
// ============================================================

// jsPDF is loaded via CDN in admin-dashboard.html

export function generatePDFReport(visits, filterLabel) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const NOW = new Date().toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  });

  // ── Header bar ───────────────────────────────────────────
  doc.setFillColor(10, 36, 99); // NEU dark blue
  doc.rect(0, 0, 297, 28, "F");

  doc.setFillColor(249, 198, 31); // NEU yellow
  doc.rect(0, 28, 297, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("NEW ERA UNIVERSITY LIBRARY", 148, 11, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Visitor Log Report", 148, 18, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Period: ${filterLabel}   |   Generated: ${NOW}`, 148, 24, { align: "center" });

  // ── Summary stats ─────────────────────────────────────────
  doc.setTextColor(10, 36, 99);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Summary", 14, 38);

  doc.setDrawColor(249, 198, 31);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 283, 40);

  // College breakdown
  const collegeCounts = {};
  const purposeCounts = {};
  visits.forEach((v) => {
    const c = v.college || "Unknown";
    const p = v.purpose || "Unknown";
    collegeCounts[c] = (collegeCounts[c] || 0) + 1;
    purposeCounts[p] = (purposeCounts[p] || 0) + 1;
  });

  const summaryData = [
    ["Total Visitors", visits.length],
    ["Unique Colleges", Object.keys(collegeCounts).length],
    ...Object.entries(collegeCounts).map(([k, v]) => [`  • ${k}`, v]),
  ];

  doc.autoTable({
    startY: 43,
    head: [["Category", "Count"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [10, 36, 99], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [235, 242, 255] },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 30, halign: "center" } },
    margin: { left: 14 },
    tableWidth: 140,
  });

  // Purpose breakdown on same row to the right
  const purposeData = Object.entries(purposeCounts).map(([k, v]) => [k, v]);
  doc.autoTable({
    startY: 43,
    head: [["Purpose of Visit", "Count"]],
    body: purposeData,
    theme: "striped",
    headStyles: { fillColor: [10, 36, 99], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [235, 242, 255] },
    columnStyles: { 1: { cellWidth: 25, halign: "center" } },
    margin: { left: 165 },
    tableWidth: 118,
  });

  // ── Visit log table ───────────────────────────────────────
  const afterSummaryY = Math.max(
    doc.lastAutoTable.finalY,
    doc.previousAutoTable?.finalY || 0
  ) + 8;

  doc.setTextColor(10, 36, 99);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Visitor Log", 14, afterSummaryY);

  doc.setDrawColor(249, 198, 31);
  doc.line(14, afterSummaryY + 2, 283, afterSummaryY + 2);

  const tableRows = visits.map((v) => [
    v.displayName || "—",
    v.schoolId || "—",
    v.college || "—",
    v.program || "—",
    v.purpose || "—",
    v.checkInTime?.toDate
      ? v.checkInTime.toDate().toLocaleString("en-PH")
      : "—",
  ]);

  doc.autoTable({
    startY: afterSummaryY + 5,
    head: [["Name", "School ID", "College", "Program", "Purpose", "Check-in Time"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [10, 36, 99], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 25 },
      2: { cellWidth: 60 },
      3: { cellWidth: 50 },
      4: { cellWidth: 45 },
      5: { cellWidth: 50 },
    },
  });

  // ── Footer ────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(10, 36, 99);
    doc.rect(0, 200, 297, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      `NEU Library Visitor Management System  |  Page ${i} of ${pageCount}  |  Confidential`,
      148,
      206,
      { align: "center" }
    );
  }

  // ── Save ──────────────────────────────────────────────────
  const filename = `NEU_Library_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
