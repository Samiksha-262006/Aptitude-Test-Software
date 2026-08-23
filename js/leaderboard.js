/**
 * Shared Firestore Leaderboard Manager
 * Cloud Firestore + Persistent Multi-Student Synchronization
 * Displays EVERY registered student who logs in and takes the test with their personal BEST score.
 */

import {
    collection,
    doc,
    getDoc,
    setDoc,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

const SHARED_LB_LOCAL_KEY = "aptitude_all_students_leaderboard_v1";

const DEFAULT_SAMPLE_LEADERBOARD = [
    {
        id: "benchmark_1",
        userId: "benchmark_1",
        name: "Aarav Sharma",
        rollNo: "21CS042",
        branch: "CSE",
        score: 19,
        total: 20,
        percentage: 95.0,
        timeTakenSeconds: 742, // 12m 22s
        date: "2026-08-18 14:30"
    },
    {
        id: "benchmark_2",
        userId: "benchmark_2",
        name: "Priya Patel",
        rollNo: "21IT019",
        branch: "IT",
        score: 18,
        total: 20,
        percentage: 90.0,
        timeTakenSeconds: 810, // 13m 30s
        date: "2026-08-19 11:15"
    },
    {
        id: "benchmark_3",
        userId: "benchmark_3",
        name: "Rohan Kulkarni",
        rollNo: "21AI033",
        branch: "AI/DS",
        score: 17,
        total: 20,
        percentage: 85.0,
        timeTakenSeconds: 690, // 11m 30s
        date: "2026-08-19 16:45"
    },
    {
        id: "benchmark_4",
        userId: "benchmark_4",
        name: "Ananya Deshmukh",
        rollNo: "21EC012",
        branch: "EXTC",
        score: 16,
        total: 20,
        percentage: 80.0,
        timeTakenSeconds: 890,
        date: "2026-08-20 09:20"
    },
    {
        id: "benchmark_5",
        userId: "benchmark_5",
        name: "Vikram Singhania",
        rollNo: "21ME055",
        branch: "MECHANICAL",
        score: 15,
        total: 20,
        percentage: 75.0,
        timeTakenSeconds: 940,
        date: "2026-08-20 10:05"
    }
];

class LeaderboardManager {
    constructor() {
        this.cachedEntries = [];
    }

    /**
     * Get all multi-student local entries
     */
    getLocalRegistry() {
        try {
            if (typeof localStorage === "undefined") return [];
            const raw = localStorage.getItem(SHARED_LB_LOCAL_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Save an entry to the multi-student local registry
     */
    saveToLocalRegistry(entry) {
        try {
            if (typeof localStorage === "undefined") return;
            const existing = this.getLocalRegistry();
            const key = String(entry.rollNo || entry.userId || entry.name).trim().toUpperCase();

            const idx = existing.findIndex(e => 
                String(e.rollNo || e.userId || e.name).trim().toUpperCase() === key
            );

            if (idx !== -1) {
                const cur = existing[idx];
                const isBetter = Number(entry.score || 0) > Number(cur.score || 0) || 
                    (Number(entry.score || 0) === Number(cur.score || 0) && Number(entry.timeTakenSeconds || 9999) < Number(cur.timeTakenSeconds || 9999));
                if (isBetter) {
                    existing[idx] = { ...cur, ...entry };
                }
            } else {
                existing.push(entry);
            }

            localStorage.setItem(SHARED_LB_LOCAL_KEY, JSON.stringify(existing));
        } catch (e) {}
    }

    /**
     * Fetch all leaderboard entries from shared Cloud Firestore and local registry.
     * Guaranteed to display every student who took the test with their personal best score.
     */
    async getAllEntries() {
        try {
            const studentMap = new Map();

            // 1. Seed benchmark entries first
            for (const sample of DEFAULT_SAMPLE_LEADERBOARD) {
                const key = String(sample.rollNo || sample.name).trim().toUpperCase();
                studentMap.set(key, { ...sample });
            }

            // 2. Load all local students registry (persists across user logout/login on the same device)
            const localRegistry = this.getLocalRegistry();
            for (const student of localRegistry) {
                const key = String(student.rollNo || student.userId || student.name).trim().toUpperCase();
                if (!studentMap.has(key)) {
                    studentMap.set(key, { ...student });
                } else {
                    const existing = studentMap.get(key);
                    const isBetter = Number(student.score || 0) > Number(existing.score || 0) || 
                        (Number(student.score || 0) === Number(existing.score || 0) && Number(student.timeTakenSeconds || 9999) < Number(existing.timeTakenSeconds || 9999));
                    if (isBetter || existing.id?.startsWith("benchmark_")) {
                        studentMap.set(key, { ...student });
                    }
                }
            }

            // 3. Fetch all real student entries from Firestore 'leaderboard' collection
            try {
                const leaderboardCol = collection(db, "leaderboard");
                const snapshot = await getDocs(leaderboardCol);

                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const docId = docSnap.id;
                    const studentKey = String(data.rollNo || data.userId || docId).trim().toUpperCase();

                    let dateStr = data.date;
                    if (data.updatedAt && typeof data.updatedAt.toDate === "function") {
                        dateStr = data.updatedAt.toDate().toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        });
                    }

                    const entry = {
                        id: docId,
                        userId: data.userId || docId,
                        name: data.name || "Student",
                        rollNo: data.rollNo || "STUDENT",
                        branch: data.branch || "CSE",
                        score: Number(data.score || 0),
                        total: Number(data.total || 20),
                        percentage: Number(data.percentage || 0),
                        timeTakenSeconds: Number(data.timeTakenSeconds || 0),
                        date: dateStr || this.formatCurrentDate()
                    };

                    this.saveToLocalRegistry(entry);

                    if (!studentMap.has(studentKey)) {
                        studentMap.set(studentKey, entry);
                    } else {
                        const existing = studentMap.get(studentKey);
                        const isBetter = entry.score > existing.score || 
                            (entry.score === existing.score && entry.timeTakenSeconds < existing.timeTakenSeconds);
                        if (isBetter || existing.id?.startsWith("benchmark_")) {
                            studentMap.set(studentKey, entry);
                        }
                    }
                });
            } catch (firestoreErr) {
                console.warn("Firestore leaderboard read notice:", firestoreErr);
            }

            // 4. Ensure current active student's best score is included if available
            try {
                const activeStudent = (typeof window !== "undefined" && window.authManager?.getActiveStudent?.()) || null;
                if (activeStudent && typeof window !== "undefined" && window.authManager?.getStudentAttempts) {
                    const attempts = await window.authManager.getStudentAttempts();
                    if (attempts && attempts.length > 0) {
                        let bestAtt = attempts[0];
                        for (const att of attempts) {
                            const isBetter = Number(att.score || 0) > Number(bestAtt.score || 0) || 
                                (Number(att.score || 0) === Number(bestAtt.score || 0) && Number(att.timeTakenSeconds || 9999) < Number(bestAtt.timeTakenSeconds || 9999));
                            if (isBetter) {
                                bestAtt = att;
                            }
                        }

                        const activeKey = String(activeStudent.rollNo || activeStudent.uid).trim().toUpperCase();
                        const existing = studentMap.get(activeKey);
                        const activeScore = Number(bestAtt.score || 0);
                        const activeTime = Number(bestAtt.timeTakenSeconds || 0);

                        if (!existing || activeScore > existing.score || (activeScore === existing.score && activeTime < existing.timeTakenSeconds) || existing.id?.startsWith("benchmark_")) {
                            const activeEntry = {
                                id: activeStudent.uid || ("roll_" + activeStudent.rollNo),
                                userId: activeStudent.uid,
                                name: activeStudent.name,
                                rollNo: activeStudent.rollNo,
                                branch: activeStudent.branch,
                                score: activeScore,
                                total: Number(bestAtt.total || 20),
                                percentage: Number(bestAtt.percentage || 0),
                                timeTakenSeconds: activeTime,
                                date: bestAtt.date || this.formatCurrentDate()
                            };
                            studentMap.set(activeKey, activeEntry);
                            this.saveToLocalRegistry(activeEntry);

                            // Background sync to Firestore
                            const docRef = doc(db, "leaderboard", activeStudent.uid || ("roll_" + String(activeStudent.rollNo).toLowerCase()));
                            setDoc(docRef, { ...activeEntry, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
                        }
                    }
                }
            } catch (syncErr) {
                console.warn("Active student sync notice:", syncErr);
            }

            // 5. Convert to array and sort: Primary by score DESC, Secondary by time ASC
            const allEntries = Array.from(studentMap.values());

            allEntries.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.timeTakenSeconds - b.timeTakenSeconds;
            });

            this.cachedEntries = allEntries;
            return allEntries;
        } catch (error) {
            console.error("Leaderboard fetch error:", error);
            if (this.cachedEntries && this.cachedEntries.length > 0) {
                return this.cachedEntries;
            }
            return DEFAULT_SAMPLE_LEADERBOARD;
        }
    }

    /**
     * Save/update a student's test score in shared Cloud Firestore & Local multi-student registry.
     * Enforces BEST SCORE logic: a worse attempt never overwrites their existing best.
     */
    async saveEntry(entry) {
        try {
            const user = auth.currentUser;
            const activeStudent = (typeof window !== "undefined" && window.authManager?.getActiveStudent?.()) || null;
            
            const docId = entry.userId || user?.uid || activeStudent?.uid || ("roll_" + String(entry.rollNo || "student").trim().toLowerCase());
            
            const cleanName = entry.name || activeStudent?.name || user?.displayName || "Student";
            const cleanRoll = entry.rollNo || activeStudent?.rollNo || "STUDENT";
            const cleanBranch = entry.branch || activeStudent?.branch || "CSE";
            const newScore = Number(entry.score || 0);
            const newTime = Number(entry.timeTakenSeconds || 0);
            const newTotal = Number(entry.total || 20);
            const newPercentage = Number(entry.percentage || ((newScore / newTotal) * 100).toFixed(1));
            const currentDateStr = entry.date || this.formatCurrentDate();

            const docRef = doc(db, "leaderboard", docId);
            let isBest = true;
            let existingData = null;

            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    existingData = docSnap.data();
                    const existingScore = Number(existingData.score || 0);
                    const existingTime = Number(existingData.timeTakenSeconds || 99999);

                    // Better if higher score, or equal score with faster time
                    const isNewBetter = newScore > existingScore || 
                        (newScore === existingScore && newTime < existingTime);

                    if (!isNewBetter) {
                        isBest = false;
                    }
                }
            } catch (readErr) {
                console.warn("Could not check existing leaderboard doc:", readErr);
            }

            if (isBest) {
                const bestEntry = {
                    id: docId,
                    userId: docId,
                    name: cleanName,
                    rollNo: cleanRoll,
                    branch: cleanBranch,
                    score: newScore,
                    total: newTotal,
                    percentage: newPercentage,
                    timeTakenSeconds: newTime,
                    date: currentDateStr,
                    updatedAt: serverTimestamp()
                };

                this.saveToLocalRegistry(bestEntry);

                try {
                    await setDoc(docRef, bestEntry, { merge: true });
                } catch (writeErr) {
                    console.error("Firestore Leaderboard setDoc error:", writeErr);
                }

                await this.getAllEntries(); // refresh cache
                return bestEntry;
            } else {
                const existingEntry = {
                    id: docId,
                    userId: docId,
                    name: cleanName || existingData.name,
                    rollNo: cleanRoll || existingData.rollNo,
                    branch: cleanBranch || existingData.branch,
                    score: Number(existingData.score || 0),
                    total: Number(existingData.total || 20),
                    percentage: Number(existingData.percentage || 0),
                    timeTakenSeconds: Number(existingData.timeTakenSeconds || 0),
                    date: existingData.date || currentDateStr
                };

                this.saveToLocalRegistry(existingEntry);
                return existingEntry;
            }
        } catch (error) {
            console.error("Firestore Leaderboard save error:", error);
            this.saveToLocalRegistry(entry);
            return {
                id: entry.userId || "temp_id",
                ...entry
            };
        }
    }

    /**
     * Get computed rank for a specific entry ID or roll number.
     */
    async getRankForEntry(entryId) {
        try {
            const entries = await this.getAllEntries();
            const cleanTarget = String(entryId || "").trim().toUpperCase();
            const index = entries.findIndex(e => 
                String(e.id || "").trim().toUpperCase() === cleanTarget ||
                String(e.userId || "").trim().toUpperCase() === cleanTarget ||
                String(e.rollNo || "").trim().toUpperCase() === cleanTarget
            );
            return index !== -1 ? index + 1 : entries.length;
        } catch (error) {
            console.error("Error computing rank:", error);
            return 1;
        }
    }

    /**
     * Reset leaderboard to default benchmark sample data.
     */
    async resetToDefault() {
        try {
            if (typeof localStorage !== "undefined") {
                localStorage.removeItem(SHARED_LB_LOCAL_KEY);
            }
            for (const sample of DEFAULT_SAMPLE_LEADERBOARD) {
                const docRef = doc(db, "leaderboard", sample.id);
                await setDoc(docRef, {
                    ...sample,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
            return await this.getAllEntries();
        } catch (error) {
            console.warn("Could not seed default benchmarks to Firestore:", error);
            this.cachedEntries = DEFAULT_SAMPLE_LEADERBOARD;
            return DEFAULT_SAMPLE_LEADERBOARD;
        }
    }

    async clearAll() {
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem(SHARED_LB_LOCAL_KEY);
        }
        this.cachedEntries = [];
        return [];
    }

    formatCurrentDate() {
        const d = new Date();
        const pad = n => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
        )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    formatTime(seconds) {
        const totalSecs = Math.max(0, Math.floor(Number(seconds) || 0));
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins}m ${secs.toString().padStart(2, "0")}s`;
    }
}

const leaderboardManager = new LeaderboardManager();

// Make globally accessible in browser
if (typeof window !== "undefined") {
    window.leaderboardManager = leaderboardManager;
}

export { leaderboardManager };
