# 📚 NEU Library Visitor Management System

A digital logbook web application for tracking and analyzing library visits at **New Era University**. Built with vanilla HTML, CSS, and JavaScript — powered by **Firebase** (Authentication + Firestore).

---

## 🗂️ Project File Structure

```
neu-library/
├── index.html              ← Login page (entry point)
├── register.html           ← New user registration / complete profile
├── checkin.html            ← Visitor check-in form
├── welcome.html            ← Check-in success screen
├── admin-dashboard.html    ← Admin statistics dashboard
│
├── css/
│   ├── main.css            ← Shared styles (login, register, checkin, welcome)
│   └── admin.css           ← Admin dashboard styles
│
├── js/
│   ├── firebase-config.js  ← Firebase app init & shared exports
│   ├── auth.js             ← Authentication logic (Google, email/pass, guards)
│   ├── register.js         ← Registration form logic
│   ├── checkin.js          ← Check-in form logic & Firestore write
│   ├── admin-dashboard.js  ← Dashboard stats, charts, user management
│   ├── pdf-report.js       ← PDF report generation (jsPDF)
│   └── welcome.js          ← Welcome screen display logic
│
├── assets/
│   ├── library-bg.jpg      ← Right panel background image (add your own)
│   ├── favicon.ico         ← Browser tab icon
│   └── default-avatar.png  ← Fallback user avatar
│
├── firestore.rules         ← Firestore security rules
├── firebase.json           ← Firebase Hosting config
└── README.md               ← This file
```

---

## 🏗️ Firestore Database Schema

### Collection: `users`
| Field            | Type      | Description                              |
|------------------|-----------|------------------------------------------|
| `uid`            | string    | Firebase Auth UID (document ID)          |
| `email`          | string    | @neu.edu.ph institutional email          |
| `schoolId`       | string    | Student/employee ID number               |
| `firstName`      | string    | First name                               |
| `mi`             | string    | Middle initial                           |
| `lastName`       | string    | Last name                                |
| `displayName`    | string    | Full formatted name                      |
| `college`        | string    | College or department                    |
| `program`        | string    | Degree program                           |
| `role`           | string    | `"visitor"` or `"admin"`                 |
| `isBlocked`      | boolean   | `true` = denied access                   |
| `isProfileComplete` | boolean | Must be `true` before check-in allowed  |
| `photoURL`       | string    | Google profile photo URL                 |
| `createdAt`      | timestamp | Account creation time                    |

### Collection: `visits`
| Field          | Type      | Description                                |
|----------------|-----------|--------------------------------------------|
| `uid`          | string    | Visitor's Firebase UID                     |
| `email`        | string    | Visitor's email                            |
| `displayName`  | string    | Visitor's full name                        |
| `schoolId`     | string    | School ID                                  |
| `college`      | string    | College at time of visit                   |
| `program`      | string    | Program at time of visit                   |
| `purpose`      | string    | Purpose of visit                           |
| `checkInTime`  | timestamp | Firestore server timestamp                 |
| `date`         | string    | `YYYY-MM-DD` for easy date filtering       |

---

## 🚀 Setup Guide

### Step 1 — Create a Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g., `neu-library-system`)
3. Enable **Google Analytics** (optional)

### Step 2 — Enable Authentication
1. In Firebase Console → **Authentication** → **Get Started**
2. Enable **Google** sign-in provider
3. Set **Authorized domain**: add `localhost` and your GitHub Pages domain
4. (Optional) Enable **Email/Password** provider for manual login

### Step 3 — Create Firestore Database
1. Firebase Console → **Firestore Database** → **Create Database**
2. Start in **Production mode**
3. Choose a region (e.g., `asia-southeast1` for Philippines)

### Step 4 — Configure Security Rules
1. In Firestore → **Rules** tab
2. Copy the contents of `firestore.rules` and paste → **Publish**

### Step 5 — Get Your Firebase Config
1. Firebase Console → ⚙️ **Project Settings** → **Your apps**
2. Click **Add app** → Web (`</>`)
3. Register the app → copy the `firebaseConfig` object

### Step 6 — Add Config to Project
Open `js/firebase-config.js` and replace the placeholder:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Step 7 — Set Admin Email(s)
In `js/firebase-config.js`, add admin emails:
```javascript
const ADMIN_EMAILS = ["yourname@neu.edu.ph"];
```

### Step 8 — Add Assets
Place these files in the `assets/` folder:
- `library-bg.jpg` — A photo of the NEU Library interior (1920×1080 recommended)
- `favicon.ico` — NEU logo or book icon
- `default-avatar.png` — A default user silhouette

---

## 📤 Publishing to GitHub Pages

### Option A — GitHub Pages (Static Hosting)

> ⚠️ GitHub Pages works if your Firebase project is configured correctly with your GH Pages domain in Authorized Domains.

1. **Create a GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: NEU Library Visitor System"
   ```

2. **Create a new repo on GitHub** → `neu-library-system` (public or private)

3. **Push your code**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/neu-library-system.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**
   - Go to your repo → **Settings** → **Pages**
   - Source: **Deploy from a branch** → `main` → `/ (root)`
   - Save → your site will be at `https://YOUR_USERNAME.github.io/neu-library-system/`

5. **Add your GitHub Pages URL to Firebase Auth**
   - Firebase Console → Authentication → Settings → **Authorized domains**
   - Click **Add domain** → paste `YOUR_USERNAME.github.io`

---

### Option B — Firebase Hosting (Recommended for production)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize hosting** (run from project root)
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Public directory: `.` (current folder)
   - Single-page app: **No**

4. **Deploy**
   ```bash
   firebase deploy
   ```
   Your site will be at `https://your-project-id.web.app`

---

## 👤 User Roles

| Role      | Access                                                  |
|-----------|---------------------------------------------------------|
| `visitor` | Login → Check-in form → Welcome screen                  |
| `admin`   | Dashboard → Statistics → User management → PDF export   |

To promote a user to admin:
1. Go to **Firestore Console** → `users` collection
2. Find the user's document → Edit `role` field → set to `"admin"`
3. You can also add their email to `ADMIN_EMAILS` in `firebase-config.js`

---

## 🔒 Security Notes

- Only `@neu.edu.ph` emails are accepted (enforced both client-side and via Firestore rules)
- Blocked users (`isBlocked: true`) are denied access at login
- Visitors can only create their own visit logs — cannot read others'
- Admins can read all logs and manage users
- Visit logs are **immutable** — they cannot be edited after creation

---

## 📦 Dependencies (loaded via CDN — no npm needed)

| Library         | Version | Purpose                    |
|-----------------|---------|----------------------------|
| Firebase JS SDK | 10.12.2 | Auth + Firestore            |
| Chart.js        | 4.4.3   | Dashboard charts            |
| jsPDF           | 2.5.1   | PDF report generation       |
| jsPDF-AutoTable | 3.8.2   | Tables in PDF reports       |
| Google Fonts    | —       | Playfair Display + Source Sans 3 |

---

## 🎨 Color Palette

| Color       | Hex       | Usage                        |
|-------------|-----------|------------------------------|
| Navy Blue   | `#0A2463` | Primary brand, headers, buttons |
| Mid Blue    | `#1A4B9B` | Hover states, accents        |
| Light Blue  | `#2E6FD9` | Links, secondary accents     |
| NEU Gold    | `#F9C61F` | Highlights, check-in button  |
| White       | `#FFFFFF` | Backgrounds, text on dark    |

---

## 📞 Support

For issues with this system, contact the NEU Library IT administrator or refer to the [Firebase Documentation](https://firebase.google.com/docs).
