// ============================================================
// constants.js
// Shared application-wide constants.
// Import this file in any module that needs college/purpose
// lists — avoids circular dependencies between register.js
// and checkin.js.
// ============================================================

/** Map of college names → array of programs */
export const COLLEGES = {
  "College of Accountancy": [
    "Bachelor of Science in Accountancy",
  ],
  "College of Agriculture": [
    "Bachelor of Science in Agriculture",
  ],
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
  "College of Criminology": [
    "Bachelor of Science in Criminology",
  ],
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
  "College of Medical Technology": [
    "Bachelor of Science in Medical Technology",
  ],
  "College of Midwifery": [
    "Diploma in Midwifery",
  ],
  "College of Music": [
    "Bachelor of Music – Choral Conducting",
    "Bachelor of Music – Music Education",
    "Bachelor of Music – Piano",
    "Bachelor of Music – Voice",
  ],
  "College of Nursing": [
    "Bachelor of Science in Nursing",
  ],
  "College of Physical Therapy": [
    "Bachelor of Science in Physical Therapy",
  ],
  "College of Respiratory Therapy": [
    "Bachelor of Science in Respiratory Therapy",
  ],
  "School of International Relations": [
    "Bachelor of Arts in Foreign Service",
  ],
  "College of Law": [
    "Juris Doctor (JD)",
  ],
  "College of Medicine": [
    "Doctor of Medicine (MD)",
  ],
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

/** Ordered list of purposes shown on the check-in screen */
export const PURPOSES = [
  "Reading / Browsing Books",
  "Research / Thesis Work",
  "Use of Library Computer",
  "Doing Assignments / Schoolwork",
  "Borrowing / Returning Books",
  "Group Study",
  "Attending Library Event",
  "Other",
];

/** Roles available in the system */
export const ROLES = {
  VISITOR: "visitor",
  ADMIN: "admin",
};

/** Domain restriction for institutional email */
export const ALLOWED_DOMAIN = "@neu.edu.ph";