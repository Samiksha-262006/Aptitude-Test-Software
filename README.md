# 🏆 AptitudePro – Modern Aptitude Test Software (JIRA Task JTM-17)

A state-of-the-art, responsive, and feature-complete **Aptitude Test Software** with Cloud Firestore persistence, Firebase Authentication, and real-time cross-device competition leaderboards.

---

## 🌟 Key Highlights & Project Features

### 1️⃣ Student Authentication & Dashboard
- **Secure Firebase Authentication**: Email & password authentication with automatic UID ownership mapping.
- **Dual Password Recovery System**:
  - Security Question & Answer verification for direct password reset.
  - One-click password reset link sent to the registered email address.
- **Student Profile**: Full Name, Roll Number, and Department / Branch (CSE, IT, AI/DS, AI/ML, EXTC, EE, ME, CE).
- **Personalized Student Dashboard**: Overview of total tests taken, best score, average score, last attempt date, and full attempt history.

### 2️⃣ Aptitude Test Arena (20 MCQs with Live Timer)
- **20-Minute Real-Time Timer**: Synchronized countdown with warning pulse indicator and automatic submission upon timeout.
- **Section Distribution**:
  - 📊 **Quantitative Aptitude** (Percentages, Profit & Loss, Time & Work, Speed Distance & Time, Ratios, Number Series)
  - 🧠 **Logical Reasoning** (Blood Relations, Syllogisms, Coding-Decoding, Directions, Clocks & Calendars, Seating)
  - 📖 **Verbal Ability** (Synonyms/Antonyms, Spotting Errors, Sentence Correction, Idioms, One-Word Substitution)
- **Interactive Question Palette**: Real-time 1–20 question navigation grid indicating *Answered (Green)*, *Unanswered (Red)*, *Marked for Review (Purple)*, and *Current (Blue Glow)* statuses.
- **Category Filter Tabs**: Instant filtering by Quantitative, Logical Reasoning, and Verbal Ability.
- **Question Actions**: Clear Response, Mark for Review, Previous, Next, and Submit.
- **Keyboard Shortcuts**: `A`, `B`, `C`, `D` for options, `N` for Next, `P` for Previous, and `M` for Mark for Review.
- **Proctoring Integrity Monitor**: Detects and logs browser tab switches with audio warnings.

### 3️⃣ Automatic Results & Performance Analytics
- Instant computation of **Score (/20)**, **Percentage (%)**, **Accuracy Rate**, and **Grade Badge** (*Distinction, Merit, Pass, Needs Improvement*).
- **Interactive Sectional Breakdown**: Visual progress bars displaying category-wise mastery.
- **Competency Radar Chart**: Rendered natively via HTML5 Canvas for dynamic visual representation of student strengths.
- **Detailed Step-by-Step Solutions**: Complete answer review showing candidate's choice vs correct answer with in-depth mathematical/logical explanations.

### 4️⃣ Downloadable & Printable Certificate of Achievement
- Verified official completion certificate styled with gold border, student details, roll number, score, date, and verification seal.
- Direct **Print / Save as PDF** support with clean print styles.

### 5️⃣ Cloud Firestore Shared Leaderboard
- **Cloud Firestore-Backed**: Collection `leaderboard` is the authoritative source of truth across all devices and browsers.
- **One Document per Student**: Each registered student has exactly one document keyed by their Firebase Auth UID containing their single personal best score.
- **Best-Score Logic**: Higher score wins; ties are broken by faster completion time. Lower scoring attempts never overwrite a student's personal best.
- **Real-Time Rankings & Filtering**: Displays Rank (#1 Gold, #2 Silver, #3 Bronze badges), Candidate Name, Roll No, Branch, Score, Percentage, and Time Taken. Includes instant search and department filtering.
- **Offline Resilience**: LocalStorage is utilized solely as a non-authoritative local cache.

### 6️⃣ UI & UX Polish
- Futuristic **Glassmorphism Design** with smooth micro-interactions.
- **Dark & Light Mode** theme toggle.
- **Web Audio API Sound Engine** for clicks, option selections, timer alerts, and victory fanfare (with instant mute toggle).
- 100% Mobile, Tablet, and Desktop responsive layout.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Structure** | HTML5 Semantic Elements |
| **Styling** | Vanilla CSS3 (Custom Design System, Glassmorphism, Flexbox & CSS Grid, Print Styles) |
| **Logic & Engine** | Vanilla JavaScript ES6+ Modules (Web Audio API, HTML5 Canvas) |
| **Backend & Auth** | Firebase Authentication (Email/Password & Password Reset) |
| **Cloud Database** | Google Cloud Firestore (Modular SDK v12) |
| **Icons & Fonts** | Font Awesome 6.4, Google Fonts (*Outfit* & *Plus Jakarta Sans*) |
| **Hosting** | Vercel (Frontend) + Firebase Cloud Services (Backend Data Layer) |

---

## 🗄️ Cloud Firestore Architecture & Security

```
Cloud Firestore
├── students/{uid}          # Private Student Profile (name, rollNo, branch, email, securityQuestion)
├── email_index/{email}     # Fast recovery index for security question lookup
├── test_attempts/{docId}   # Private Test Attempt History (score, categoryStats, questions, userAnswers)
└── leaderboard/{uid}       # Shared Public Leaderboard (personal best score, rollNo, branch, timeTaken)
```

### Security Rules Summary
- **`students/{uid}`**: Students can read and update only their own profile document (`request.auth.uid == uid`).
- **`test_attempts/{attemptId}`**: Private attempt snapshots are readable and writable exclusively by the student who took the test.
- **`leaderboard/{uid}`**: Publicly readable so rankings are shared across devices, but writable only by the authenticated student for their own record.

---

## 🚀 How to Run the Project Locally

1. **Option A: Local Development Server (Recommended)**
   - Run the local dev server using Node.js:
   ```bash
   npm run dev
   ```
   - Open `http://localhost:3000` in your web browser.

2. **Option B: Any Static HTTP Server**
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

---

## ☁️ Deployment (Vercel)

The application is structured for zero-configuration static deployment on **Vercel**:
- **Frontend**: Vercel serves the static HTML, CSS, and ES Modules.
- **Backend / Data Layer**: Firebase Authentication and Cloud Firestore provide real-time cloud data persistence globally without requiring a separate Node.js backend server.

---

## 📁 File Structure

```
Aptitude Test Software/
├── index.html              # Main application entry point
├── README.md               # Project documentation
├── package.json            # Node.js project manifest & scripts
├── vercel.json             # Vercel deployment & routing configuration
├── firestore.rules         # Cloud Firestore security rules
├── local-server.js         # Lightweight local dev server
├── css/
│   └── style.css           # Design system, glassmorphism, responsive grid & print styling
├── js/
│   ├── firebase-config.js  # Firebase App, Authentication & Firestore initialization
│   ├── auth.js             # Firebase Authentication, profile management & password recovery
│   ├── questions.js        # Question database & randomized section generator
│   ├── sound.js            # Web Audio API sound synthesizer
│   ├── leaderboard.js      # Shared Firestore leaderboard manager & ranking engine
│   └── app.js              # Application core state, timer, proctoring & canvas chart
└── public/                 # Production-ready mirror structure for static hosting
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── firebase-config.js
        ├── auth.js
        ├── questions.js
        ├── sound.js
        ├── leaderboard.js
        └── app.js
```

---

## 🎯 Competition / Viva Talking Points

1. **Why Vanilla JS with Firebase Modular SDK?**
   - Maximum client performance, zero runtime overhead, instant page loads, with scalable cloud infrastructure for authentication and data persistence.
2. **How does the Leaderboard ensure fairness and cross-device sharing?**
   - Cloud Firestore's `leaderboard` collection acts as the shared single source of truth. Each student is identified by their Firebase Auth UID so they only appear once with their personal best score (higher score wins, tie-broken by fastest completion time).
3. **How is candidate privacy maintained?**
   - Detailed answers, question selections, and individual attempt histories are stored securely in `test_attempts` with Firestore Security Rules restricting access exclusively to the owning candidate. Only high-level competition scores are shared in `leaderboard`.
4. **How are the Analytics Charts generated?**
   - Rendered natively on an HTML5 `<canvas>` element using parametric polar coordinates, eliminating any heavy 3rd-party charting library.
