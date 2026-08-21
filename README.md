# 🏆 AptitudePro – Modern Aptitude Test Software (JIRA Task JTM-17)

A state-of-the-art, responsive, and feature-complete **Aptitude Test Software** developed as a mini project for academic and technical competition requirements.

---

## 🌟 Key Highlights & Project Features

### 1️⃣ Student Details & Onboarding
- Candidate Profile capture: **Full Name**, **Roll Number / Enrollment No.**, and **Department / Branch** (CSE, IT, AI/DS, EXTC, EE, ME, CE).
- Pre-assessment instructions and scoring scheme briefing.

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

### 5️⃣ Persistent Competition Leaderboard
- `localStorage`-backed persistent Hall of Fame.
- Displays Rank (#1 Gold, #2 Silver, #3 Bronze badges), Candidate Name, Roll No, Branch, Score, Percentage, and Time Taken.
- Live search by candidate name / roll number and instant branch filter dropdown.

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
| **Logic & Engine** | Vanilla JavaScript ES6+ (Web Audio API, HTML5 Canvas, LocalStorage API) |
| **Icons & Fonts** | Font Awesome 6.4, Google Fonts (*Outfit* & *Plus Jakarta Sans*) |

---

## 🚀 How to Run the Project

1. **Option A: Direct File Open**
   - Double-click `index.html` to open directly in any modern web browser (Chrome, Edge, Firefox, Safari).

2. **Option B: Local Development Server**
   - Open terminal in the project directory:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
   - Open `http://localhost:8000` or the provided local URL in your browser.

---

## 📁 File Structure

```
Aptitude Test Software/
├── index.html              # Main application entry point
├── README.md               # Project documentation
├── css/
│   └── style.css           # Design system, glassmorphism, responsive grid & print styling
└── js/
    ├── questions.js        # Curated question database & session randomizer
    ├── sound.js            # Web Audio API sound synthesizer
    ├── leaderboard.js      # LocalStorage manager, ranking, search & filter
    └── app.js              # Application core state, timer, proctoring & canvas chart
```

---

## 🎯 Competition / Viva Talking Points

1. **Why Vanilla JS instead of heavy frameworks?**
   - Maximum performance, zero runtime overhead, instant page loads, and zero external build tool dependencies.
2. **How does the Timer & Proctoring work?**
   - The timer maintains exact remaining seconds with delta calculations and warns candidates under 3 minutes. Proctoring utilizes the browser `window.onblur` event to detect when the candidate switches focus away from the test tab.
3. **How is data persisted?**
   - The leaderboard is saved locally in browser `localStorage`, persisting scores and attempts across browser refreshes.
4. **How are the Analytics Charts generated?**
   - Rendered natively on an HTML5 `<canvas>` element using parametric polar coordinates, eliminating any heavy 3rd-party charting library.
