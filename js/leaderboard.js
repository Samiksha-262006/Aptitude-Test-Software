/**
 * Leaderboard Manager with LocalStorage Persistence
 * Stores and displays only each student's BEST test score (no duplicates per student)
 * Supports updated departments: AI/ML, AI/DS, CSE, ETC, MECHANICAL, ELECTRICAL, CIVIL, IT, EXTC, ATC, OTHER
 */

const LEADERBOARD_KEY = "aptitude_test_leaderboard_v2";

const DEFAULT_SAMPLE_LEADERBOARD = [
    {
        id: "entry_1",
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
        id: "entry_2",
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
        id: "entry_3",
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
        id: "entry_4",
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
        id: "entry_5",
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
        this.init();
    }

    init() {
        if (typeof localStorage !== "undefined" && !localStorage.getItem(LEADERBOARD_KEY)) {
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_SAMPLE_LEADERBOARD));
        }
    }

    /**
     * Get all leaderboard entries, ensuring each student only has their single BEST score.
     */
    getAllEntries() {
        try {
            if (typeof localStorage === "undefined") {
                return DEFAULT_SAMPLE_LEADERBOARD;
            }
            const raw = localStorage.getItem(LEADERBOARD_KEY);
            const list = raw ? JSON.parse(raw) : [];

            // Map each student to their highest score
            const bestPerStudent = new Map();

            for (const item of list) {
                // Determine canonical student key: normalized rollNo, or userId, or name
                const studentKey = String(item.rollNo || item.userId || item.name || "")
                    .trim()
                    .toUpperCase();

                if (!studentKey) {
                    continue;
                }

                if (!bestPerStudent.has(studentKey)) {
                    bestPerStudent.set(studentKey, item);
                } else {
                    const currentBest = bestPerStudent.get(studentKey);
                    const itemScore = Number(item.score || 0);
                    const bestScore = Number(currentBest.score || 0);
                    const itemTime = Number(item.timeTakenSeconds || 99999);
                    const bestTime = Number(currentBest.timeTakenSeconds || 99999);

                    // Comparison: higher score wins; on tie, faster time wins
                    const isNewBetter =
                        itemScore > bestScore ||
                        (itemScore === bestScore && itemTime < bestTime);

                    if (isNewBetter) {
                        bestPerStudent.set(studentKey, {
                            ...currentBest,
                            ...item,
                            name: item.name || currentBest.name,
                            branch: item.branch || currentBest.branch
                        });
                    }
                }
            }

            const uniqueEntries = Array.from(bestPerStudent.values());

            // Sort: Primary by score DESC, Secondary by timeTakenSeconds ASC
            uniqueEntries.sort((a, b) => {
                const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
                if (scoreDiff !== 0) {
                    return scoreDiff;
                }
                return Number(a.timeTakenSeconds || 0) - Number(b.timeTakenSeconds || 0);
            });

            // Keep storage clean & synchronized
            try {
                localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(uniqueEntries));
            } catch (e) {}

            return uniqueEntries;
        } catch (e) {
            console.error("Error reading leaderboard", e);
            return [];
        }
    }

    /**
     * Save/update a test attempt in the leaderboard only if it is the student's personal best score.
     */
    saveEntry(entry) {
        const entries = this.getAllEntries();
        const studentKey = String(entry.rollNo || entry.userId || entry.name || "")
            .trim()
            .toUpperCase();

        const existingIndex = entries.findIndex(
            e =>
                String(e.rollNo || e.userId || e.name || "")
                    .trim()
                    .toUpperCase() === studentKey
        );

        let savedEntry = null;

        if (existingIndex !== -1) {
            const existing = entries[existingIndex];
            const newScore = Number(entry.score || 0);
            const existingScore = Number(existing.score || 0);
            const newTime = Number(entry.timeTakenSeconds || 99999);
            const existingTime = Number(existing.timeTakenSeconds || 99999);

            const isBetter =
                newScore > existingScore ||
                (newScore === existingScore && newTime < existingTime);

            if (isBetter) {
                // Update to new personal best
                savedEntry = {
                    ...existing,
                    ...entry,
                    id: existing.id,
                    name: entry.name || existing.name,
                    branch: entry.branch || existing.branch,
                    date: entry.date || this.formatCurrentDate()
                };
                entries[existingIndex] = savedEntry;
            } else {
                // Keep previous best score on leaderboard, update name/branch if changed
                savedEntry = {
                    ...existing,
                    name: entry.name || existing.name,
                    branch: entry.branch || existing.branch
                };
                entries[existingIndex] = savedEntry;
            }
        } else {
            // New student entry
            savedEntry = {
                id: "entry_" + Date.now(),
                ...entry,
                date: entry.date || this.formatCurrentDate()
            };
            entries.push(savedEntry);
        }

        // Sort: Primary by score DESC, Secondary by timeTakenSeconds ASC
        entries.sort((a, b) => {
            const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
            if (scoreDiff !== 0) {
                return scoreDiff;
            }
            return Number(a.timeTakenSeconds || 0) - Number(b.timeTakenSeconds || 0);
        });

        if (typeof localStorage !== "undefined") {
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
        }
        return savedEntry;
    }

    getRankForEntry(entryId) {
        const entries = this.getAllEntries();
        const index = entries.findIndex(e => e.id === entryId);
        return index !== -1 ? index + 1 : entries.length;
    }

    resetToDefault() {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_SAMPLE_LEADERBOARD));
        }
        return DEFAULT_SAMPLE_LEADERBOARD;
    }

    clearAll() {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
        }
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
