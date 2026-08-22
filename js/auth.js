/**
 * Student Authentication & Attempt History Manager
 * Manages Accounts, Sessions, LocalStorage Persistence, Security Questions,
 * Password Recovery (Forgot Password), and Route Authorization.
 */

const AUTH_STORAGE_KEY = "aptitude_students_db_v4";
const ACTIVE_SESSION_KEY = "aptitude_active_student_roll_v4";

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
            // Seed initial demo student with complete Attempt 1 snapshot & security question
            const sampleQuestions = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK.slice(0, 20) : []).map((q, idx) => ({
                ...q,
                sessionIndex: idx + 1,
                originalId: q.id
            }));

            // Create sample answers for 14 correct, 4 wrong, 2 unattempted
            const sampleUserAnswers = {};
            sampleQuestions.forEach((q, idx) => {
                if (idx < 14) {
                    sampleUserAnswers[idx] = q.correct; // correct
                } else if (idx < 18) {
                    sampleUserAnswers[idx] = (q.correct + 1) % 4; // wrong
                }
                // 18, 19 remain unattempted
            });

            const demoDB = {
                "21CS045": {
                    name: "Samiksha Sharma",
                    rollNo: "21CS045",
                    branch: "CSE",
                    email: "samiksha@college.edu",
                    securityQuestion: "What is your favorite subject?",
                    securityAnswer: "Computer Science",
                    password: "123",
                    registeredAt: "2026-08-19 10:00",
                    attempts: [
                        {
                            attemptId: 1,
                            score: 14,
                            total: 20,
                            percentage: 70.0,
                            accuracy: "77.8",
                            timeTakenSeconds: 820,
                            date: "2026-08-19 10:30",
                            grade: "Merit ⭐",
                            categoryStats: {
                                "Quantitative Aptitude": { correct: 5, total: 7 },
                                "Logical Reasoning": { correct: 5, total: 7 },
                                "Verbal Ability": { correct: 4, total: 6 }
                            },
                            questions: sampleQuestions,
                            userAnswers: sampleUserAnswers
                        }
                    ]
                }
            };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoDB));
        }
    }

    getStudentsDB() {
        try {
            const raw = localStorage.getItem(AUTH_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.error("Error reading students DB", e);
            return {};
        }
    }

    saveStudentsDB(db) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(db));
    }

    getStudentByRoll(rollNo) {
        if (!rollNo) return null;
        const cleanRoll = rollNo.trim().toUpperCase();
        const db = this.getStudentsDB();
        return db[cleanRoll] || null;
    }

    registerStudent(name, rollNo, branch, email, securityQuestion, securityAnswer, password) {
        const cleanRoll = rollNo.trim().toUpperCase();
        const db = this.getStudentsDB();

        if (db[cleanRoll]) {
            return { success: false, message: `Student with Roll No. ${cleanRoll} is already registered. Please log in.` };
        }

        const newStudent = {
            name: name.trim(),
            rollNo: cleanRoll,
            branch: branch.trim(),
            email: (email || "").trim(),
            securityQuestion: (securityQuestion || "What is your favorite subject?").trim(),
            securityAnswer: (securityAnswer || "Aptitude").trim().toLowerCase(),
            password: password,
            registeredAt: this.formatDate(new Date()),
            attempts: []
        };

        db[cleanRoll] = newStudent;
        this.saveStudentsDB(db);
        this.setActiveSession(cleanRoll);

        return { success: true, student: newStudent };
    }

    loginStudent(rollNo, password) {
        const cleanRoll = rollNo.trim().toUpperCase();
        const db = this.getStudentsDB();
        const student = db[cleanRoll];

        if (!student) {
            return { success: false, message: `No student registered with Roll No. ${cleanRoll}. Please create an account.` };
        }

        if (student.password !== password) {
            return { success: false, message: `Incorrect password for Roll No. ${cleanRoll}.` };
        }

        this.setActiveSession(cleanRoll);
        return { success: true, student };
    }

    /**
     * Get security question for student account recovery
     */
    getSecurityQuestion(rollNo) {
        const cleanRoll = rollNo.trim().toUpperCase();
        const student = this.getStudentByRoll(cleanRoll);

        if (!student) {
            return { 
                success: false, 
                message: `No student found with Roll No. "${cleanRoll}". Please check your roll number or register.` 
            };
        }

        return {
            success: true,
            rollNo: cleanRoll,
            name: student.name,
            branch: student.branch,
            email: student.email || "Registered Student Email",
            securityQuestion: student.securityQuestion || "What is your favorite subject?"
        };
    }

    /**
     * Verify security answer during password recovery
     */
    verifyRecoveryDetails(rollNo, securityAnswer) {
        const cleanRoll = rollNo.trim().toUpperCase();
        const student = this.getStudentByRoll(cleanRoll);

        if (!student) {
            return { success: false, message: "Student account not found." };
        }

        const storedAns = (student.securityAnswer || "Computer Science").trim().toLowerCase();
        const enteredAns = (securityAnswer || "").trim().toLowerCase();

        if (storedAns !== enteredAns) {
            return { 
                success: false, 
                message: "Security answer did not match. Please verify your answer and try again." 
            };
        }

        return { success: true, student };
    }

    /**
     * Reset password after identity verification
     */
    resetPassword(rollNo, newPassword) {
        const cleanRoll = rollNo.trim().toUpperCase();
        const db = this.getStudentsDB();
        const student = db[cleanRoll];

        if (!student) {
            return { success: false, message: "Student account not found." };
        }

        if (!newPassword || newPassword.length < 3) {
            return { success: false, message: "New password must be at least 3 characters long." };
        }

        student.password = newPassword;
        student.lastPasswordReset = this.formatDate(new Date());
        db[cleanRoll] = student;
        this.saveStudentsDB(db);

        return { 
            success: true, 
            message: `Password reset successfully for Roll No. ${cleanRoll}! You can now log in.` 
        };
    }

    /**
     * Change password from inside the authenticated dashboard
     */
    changePassword(rollNo, currentPassword, newPassword) {
        const cleanRoll = rollNo.trim().toUpperCase();
        const db = this.getStudentsDB();
        const student = db[cleanRoll];

        if (!student) {
            return { success: false, message: "User session invalid. Please log in again." };
        }

        if (student.password !== currentPassword) {
            return { success: false, message: "Current password does not match our records." };
        }

        if (!newPassword || newPassword.length < 3) {
            return { success: false, message: "New password must be at least 3 characters long." };
        }

        student.password = newPassword;
        student.lastPasswordReset = this.formatDate(new Date());
        db[cleanRoll] = student;
        this.saveStudentsDB(db);

        return { success: true, message: "Password updated successfully!" };
    }

    setActiveSession(rollNo) {
        localStorage.setItem(ACTIVE_SESSION_KEY, rollNo.trim().toUpperCase());
    }

    getActiveStudent() {
        const rollNo = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (!rollNo) return null;
        const db = this.getStudentsDB();
        return db[rollNo] || null;
    }

    /**
     * Check authorization guard for protected views
     */
    isAuthorized() {
        const student = this.getActiveStudent();
        return !!student;
    }

    logout() {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
    }

    saveTestAttempt(attemptData) {
        const student = this.getActiveStudent();
        if (!student) return null;

        const db = this.getStudentsDB();
        const cleanRoll = student.rollNo;

        const attemptId = (student.attempts?.length || 0) + 1;
        const newAttempt = {
            attemptId,
            score: attemptData.score,
            total: attemptData.total,
            percentage: attemptData.percentage,
            accuracy: attemptData.accuracy,
            timeTakenSeconds: attemptData.timeTakenSeconds,
            grade: attemptData.grade,
            categoryStats: attemptData.categoryStats,
            questions: attemptData.questions,
            userAnswers: attemptData.userAnswers,
            date: this.formatDate(new Date())
        };

        if (!student.attempts) student.attempts = [];
        student.attempts.push(newAttempt);

        db[cleanRoll] = student;
        this.saveStudentsDB(db);

        return newAttempt;
    }

    /**
     * Compare current attempt with previous attempt(s)
     */
    getScoreComparison(currentScore, currentPercentage) {
        const student = this.getActiveStudent();
        if (!student || !student.attempts || student.attempts.length === 0) {
            return {
                hasPrevious: false,
                attemptNumber: 1
            };
        }

        const totalAttempts = student.attempts.length;
        const previousAttempt = student.attempts[totalAttempts - 1];

        const scoreDelta = currentScore - previousAttempt.score;
        const percentageDelta = parseFloat((currentPercentage - previousAttempt.percentage).toFixed(1));

        const allScores = student.attempts.map(a => a.score);
        const avgScore = (allScores.reduce((acc, val) => acc + val, currentScore) / (totalAttempts + 1)).toFixed(1);
        const bestScore = Math.max(...allScores, currentScore);

        return {
            hasPrevious: true,
            attemptNumber: totalAttempts + 1,
            previousAttemptNumber: previousAttempt.attemptId || totalAttempts,
            previousScore: previousAttempt.score,
            previousPercentage: previousAttempt.percentage,
            previousDate: previousAttempt.date,
            scoreDelta,
            percentageDelta,
            avgScore,
            bestScore,
            isImproved: scoreDelta > 0,
            isSame: scoreDelta === 0
        };
    }

    formatDate(date) {
        const d = new Date(date);
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
}

const authManager = new AuthManager();
