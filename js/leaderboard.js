/**
 * Shared Firestore Leaderboard Manager
 * Cloud Firestore Real-time Synchronization
 * Loads and displays ONLY genuine registered student records from collection 'leaderboard'.
 * Stores exactly ONE document per student containing their personal BEST score.
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

const SHARED_LB_CACHE_KEY = "aptitude_leaderboard_cache_v2";

class LeaderboardManager {
    constructor() {
        this.cachedEntries = [];
    }

    /**
     * Get cached leaderboard entries
     */
    getLocalCache() {
        try {
            if (typeof localStorage === "undefined") return [];
            const raw = localStorage.getItem(SHARED_LB_CACHE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Update local cache
     */
    setLocalCache(entries) {
        try {
            if (typeof localStorage === "undefined") return;
            localStorage.setItem(SHARED_LB_CACHE_KEY, JSON.stringify(entries));
        } catch (e) {}
    }

    /**
     * Fetch all genuine student leaderboard entries from shared Cloud Firestore.
     * Returns ONLY real registered student records, each appearing exactly once with their personal best score.
     */
    async getAllEntries() {
        try {
            const studentMap = new Map();

            // 1. Fetch real student entries from Firestore 'leaderboard' collection
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

                    if (!studentMap.has(studentKey)) {
                        studentMap.set(studentKey, entry);
                    } else {
                        const existing = studentMap.get(studentKey);
                        const isBetter = entry.score > existing.score || 
                            (entry.score === existing.score && entry.timeTakenSeconds < existing.timeTakenSeconds);
                        if (isBetter) {
                            studentMap.set(studentKey, entry);
                        }
                    }
                });
            } catch (firestoreErr) {
                console.warn("Firestore leaderboard fetch notice:", firestoreErr);
            }

            // 2. Ensure current active student's top attempt is included if available
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

                        if (!existing || activeScore > existing.score || (activeScore === existing.score && activeTime < existing.timeTakenSeconds)) {
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

                            // Background sync to Firestore
                            const docRef = doc(db, "leaderboard", activeStudent.uid || ("roll_" + String(activeStudent.rollNo).toLowerCase()));
                            setDoc(docRef, { ...activeEntry, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
                        }
                    }
                }
            } catch (syncErr) {
                console.warn("Active student sync notice:", syncErr);
            }

            // 3. Convert to array and sort: Primary by score DESC, Secondary by time ASC
            const allEntries = Array.from(studentMap.values());

            allEntries.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.timeTakenSeconds - b.timeTakenSeconds;
            });

            this.cachedEntries = allEntries;
            this.setLocalCache(allEntries);
            return allEntries;
        } catch (error) {
            console.error("Leaderboard fetch error:", error);
            const cached = this.getLocalCache();
            if (cached && cached.length > 0) {
                return cached;
            }
            return [];
        }
    }

    /**
     * Save/update a student's test score in shared Cloud Firestore.
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

                try {
                    await setDoc(docRef, bestEntry, { merge: true });
                } catch (writeErr) {
                    console.error("Firestore Leaderboard setDoc error:", writeErr);
                }

                await this.getAllEntries(); // refresh cache
                return bestEntry;
            } else {
                return {
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
            }
        } catch (error) {
            console.error("Firestore Leaderboard save error:", error);
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
     * Reset leaderboard cache
     */
    async resetToDefault() {
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem(SHARED_LB_CACHE_KEY);
        }
        this.cachedEntries = [];
        return await this.getAllEntries();
    }

    async clearAll() {
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem(SHARED_LB_CACHE_KEY);
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
