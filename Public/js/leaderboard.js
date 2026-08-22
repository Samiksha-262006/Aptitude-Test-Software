/**
 * Leaderboard Manager with LocalStorage Persistence
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
        if (!localStorage.getItem(LEADERBOARD_KEY)) {
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_SAMPLE_LEADERBOARD));
        }
    }

    getAllEntries() {
        try {
            const raw = localStorage.getItem(LEADERBOARD_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Error reading leaderboard", e);
            return [];
        }
    }

    saveEntry(entry) {
        const entries = this.getAllEntries();
        const newEntry = {
            id: "entry_" + Date.now(),
            ...entry,
            date: entry.date || this.formatCurrentDate()
        };
        entries.push(newEntry);
        
        // Sort: Primary by score DESC, Secondary by timeTakenSeconds ASC
        entries.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.timeTakenSeconds - b.timeTakenSeconds;
        });

        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
        return newEntry;
    }

    getRankForEntry(entryId) {
        const entries = this.getAllEntries();
        const index = entries.findIndex(e => e.id === entryId);
        return index !== -1 ? index + 1 : entries.length;
    }

    resetToDefault() {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_SAMPLE_LEADERBOARD));
        return DEFAULT_SAMPLE_LEADERBOARD;
    }

    clearAll() {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
        return [];
    }

    formatCurrentDate() {
        const d = new Date();
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
}

const leaderboardManager = new LeaderboardManager();
