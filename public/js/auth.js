/**
 * Student Authentication & Attempt History Manager
 * Firebase Authentication + Firestore
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

class AuthManager {
    constructor() {
        this.activeStudent = null;
        this.authReady = false;

        this.authReadyPromise = new Promise((resolve) => {
            onAuthStateChanged(auth, async (user) => {
                try {
                    if (user) {
                        this.activeStudent = await this.getStudentByUID(user.uid);
                    } else {
                        this.activeStudent = null;
                    }
                } catch (error) {
                    console.error("Auth state error:", error);
                    this.activeStudent = null;
                } finally {
                    this.authReady = true;
                    resolve(this.activeStudent);
                }
            });
        });
    }

    // =========================================================
    // WAIT FOR FIREBASE AUTH STATE
    // =========================================================
    async waitForAuth() {
        await this.authReadyPromise;
        return this.activeStudent;
    }

    // =========================================================
    // REGISTER STUDENT
    // =========================================================
    async registerStudent(
        name,
        rollNo,
        branch,
        email,
        securityQuestion,
        securityAnswer,
        password
    ) {
        try {
            const cleanName = name.trim();
            const cleanRoll = rollNo.trim().toUpperCase();
            const cleanBranch = branch.trim();
            const cleanEmail = email.trim().toLowerCase();

            if (!cleanName) {
                return { success: false, message: "Please enter your full name." };
            }
            if (!cleanRoll) {
                return { success: false, message: "Please enter your roll number." };
            }
            if (!cleanBranch) {
                return { success: false, message: "Please select your department." };
            }
            if (!cleanEmail) {
                return { success: false, message: "Please enter your email address." };
            }
            if (!password || password.length < 6) {
                return { success: false, message: "Password must be at least 6 characters long." };
            }

            // -------------------------------------------------
            // CHECK WHETHER ROLL NUMBER ALREADY EXISTS
            // -------------------------------------------------
            try {
                const studentsRef = collection(db, "students");
                const rollQuery = query(studentsRef, where("rollNo", "==", cleanRoll));
                const rollSnapshot = await getDocs(rollQuery);

                if (!rollSnapshot.empty) {
                    return {
                        success: false,
                        message: `Roll No. ${cleanRoll} is already registered.`
                    };
                }
            } catch (firestoreCheckErr) {
                console.warn("Roll uniqueness check warning (proceeding with registration):", firestoreCheckErr);
            }

            // -------------------------------------------------
            // CREATE FIREBASE AUTH ACCOUNT
            // -------------------------------------------------
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                cleanEmail,
                password
            );

            const user = userCredential.user;

            // -------------------------------------------------
            // SAVE FIRESTORE PROFILE
            // -------------------------------------------------
            const regDate = new Date().toISOString().split('T')[0];
            const student = {
                uid: user.uid,
                name: cleanName,
                rollNo: cleanRoll,
                branch: cleanBranch,
                email: cleanEmail,
                securityQuestion: securityQuestion || "What is your favorite subject?",
                securityAnswer: (securityAnswer || "").trim().toLowerCase(),
                role: "student",
                registeredAt: regDate,
                createdAt: serverTimestamp()
            };

            try {
                await setDoc(doc(db, "students", user.uid), student);
            } catch (dbErr) {
                console.warn("Firestore save profile warning:", dbErr);
            }

            this.activeStudent = {
                ...student,
                uid: user.uid
            };

            return {
                success: true,
                student: this.activeStudent
            };
        } catch (error) {
            console.error("Registration error:", error);

            let message = "Registration failed. Please try again.";

            switch (error.code) {
                case "auth/email-already-in-use":
                    message = "This email address is already registered. Please login instead.";
                    break;
                case "auth/weak-password":
                    message = "Password must be at least 6 characters long.";
                    break;
                case "auth/invalid-email":
                    message = "Please enter a valid email address.";
                    break;
                case "auth/operation-not-allowed":
                    message = "Email/password authentication is not enabled in Firebase.";
                    break;
                case "auth/network-request-failed":
                    message = "Network error. Please check your internet connection.";
                    break;
                default:
                    if (error.message) {
                        message = error.message;
                    }
            }

            return {
                success: false,
                message
            };
        }
    }

    // =========================================================
    // LOGIN STUDENT USING ROLL NUMBER OR EMAIL
    // =========================================================
    async loginStudent(rollNo, password) {
        try {
            const cleanRoll = rollNo.trim().toUpperCase();

            if (!cleanRoll) {
                return { success: false, message: "Please enter your roll number." };
            }
            if (!password) {
                return { success: false, message: "Please enter your password." };
            }

            // -------------------------------------------------
            // FIND STUDENT BY ROLL NUMBER OR EMAIL
            // -------------------------------------------------
            let student = null;
            let studentEmail = null;

            try {
                const studentsRef = collection(db, "students");
                let q = query(studentsRef, where("rollNo", "==", cleanRoll));
                let snapshot = await getDocs(q);

                if (snapshot.empty) {
                    // Try by email if user entered email
                    const emailQ = query(studentsRef, where("email", "==", cleanRoll.toLowerCase()));
                    const emailSnapshot = await getDocs(emailQ);
                    if (!emailSnapshot.empty) {
                        snapshot = emailSnapshot;
                    }
                }

                if (!snapshot.empty) {
                    student = snapshot.docs[0].data();
                    student.uid = snapshot.docs[0].id;
                    studentEmail = student.email;
                }
            } catch (queryErr) {
                console.warn("Firestore student lookup warning:", queryErr);
            }

            // If found in Firestore, use registered email; if user entered direct email, use that
            const loginEmail = studentEmail || (cleanRoll.includes("@") ? cleanRoll.toLowerCase() : null);

            if (!loginEmail) {
                return {
                    success: false,
                    message: `No student registered with Roll No. ${cleanRoll}.`
                };
            }

            // -------------------------------------------------
            // FIREBASE LOGIN
            // -------------------------------------------------
            const userCredential = await signInWithEmailAndPassword(
                auth,
                loginEmail,
                password
            );

            const user = userCredential.user;

            if (!student) {
                student = await this.getStudentByUID(user.uid);
            }

            if (!student) {
                student = {
                    uid: user.uid,
                    name: user.displayName || cleanRoll,
                    rollNo: cleanRoll,
                    branch: "CSE",
                    email: user.email || loginEmail,
                    role: "student",
                    registeredAt: new Date().toISOString().split('T')[0]
                };
            }

            this.activeStudent = {
                ...student,
                uid: user.uid
            };

            return {
                success: true,
                student: this.activeStudent
            };
        } catch (error) {
            console.error("Login error:", error);

            let message = "Login failed. Please check your credentials.";

            switch (error.code) {
                case "auth/invalid-credential":
                case "auth/wrong-password":
                case "auth/invalid-login-credentials":
                    message = "Incorrect roll number or password.";
                    break;
                case "auth/user-not-found":
                    message = "No Firebase account was found for this student.";
                    break;
                case "auth/too-many-requests":
                    message = "Too many login attempts. Please try again later.";
                    break;
                case "auth/network-request-failed":
                    message = "Network error. Please check your internet connection.";
                    break;
                default:
                    if (error.message) {
                        message = error.message;
                    }
            }

            return {
                success: false,
                message
            };
        }
    }

    // =========================================================
    // GET STUDENT BY UID
    // =========================================================
    async getStudentByUID(uid) {
        try {
            if (!uid) return null;

            const studentRef = doc(db, "students", uid);
            const snapshot = await getDoc(studentRef);

            if (!snapshot.exists()) {
                const curUser = auth.currentUser;
                return {
                    uid,
                    name: curUser?.displayName || "Student",
                    rollNo: "STUDENT",
                    branch: "CSE",
                    email: curUser?.email || "",
                    role: "student",
                    registeredAt: new Date().toISOString().split('T')[0]
                };
            }

            const data = snapshot.data();
            return {
                uid,
                ...data,
                registeredAt: typeof data.registeredAt === "string" ? data.registeredAt : (data.registeredAt?.toDate?.() ? data.registeredAt.toDate().toISOString().split('T')[0] : "2026-08-19")
            };
        } catch (error) {
            console.error("Error getting student:", error);
            const curUser = auth.currentUser;
            if (curUser && curUser.uid === uid) {
                return {
                    uid,
                    name: curUser.displayName || "Student",
                    rollNo: "STUDENT",
                    branch: "CSE",
                    email: curUser.email || "",
                    role: "student",
                    registeredAt: "2026-08-19"
                };
            }
            return null;
        }
    }

    // =========================================================
    // GET ACTIVE STUDENT
    // =========================================================
    getActiveStudent() {
        return this.activeStudent;
    }

    // =========================================================
    // AUTHORIZATION CHECK
    // =========================================================
    isAuthorized() {
        return !!auth.currentUser || !!this.activeStudent;
    }

    // =========================================================
    // LOGOUT
    // =========================================================
    async logout() {
        try {
            await signOut(auth);
            this.activeStudent = null;
            return { success: true };
        } catch (error) {
            console.error("Logout error:", error);
            this.activeStudent = null;
            return { success: false, message: "Logout failed." };
        }
    }

    // =========================================================
    // SAVE TEST ATTEMPT
    // =========================================================
    async saveTestAttempt(attemptData) {
        const user = auth.currentUser;
        if (!user && !this.activeStudent) {
            console.error("No authenticated student.");
            return null;
        }

        try {
            const uid = user ? user.uid : this.activeStudent?.uid;
            const student = this.activeStudent || (user ? await this.getStudentByUID(user.uid) : null);

            const currentDateStr = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });

            const attempt = {
                userId: uid,
                studentName: student?.name || "Student",
                rollNo: student?.rollNo || "STUDENT",
                branch: student?.branch || "CSE",
                score: attemptData.score,
                total: attemptData.total || 20,
                percentage: attemptData.percentage,
                accuracy: attemptData.accuracy,
                timeTakenSeconds: attemptData.timeTakenSeconds,
                grade: attemptData.grade,
                categoryStats: attemptData.categoryStats,
                questions: attemptData.questions,
                userAnswers: attemptData.userAnswers,
                date: currentDateStr,
                createdAt: serverTimestamp()
            };

            const attemptsRef = collection(db, "test_attempts");
            const docRef = await addDoc(attemptsRef, attempt);

            return {
                id: docRef.id,
                ...attempt
            };
        } catch (error) {
            console.error("Error saving test attempt:", error);
            return null;
        }
    }

    // =========================================================
    // GET STUDENT ATTEMPTS (Chronological order: Attempt 1 first)
    // =========================================================
    async getStudentAttempts() {
        const user = auth.currentUser;
        const uid = user ? user.uid : this.activeStudent?.uid;

        if (!uid) {
            return [];
        }

        try {
            const attemptsRef = collection(db, "test_attempts");
            const q = query(
                attemptsRef,
                where("userId", "==", uid)
            );

            const snapshot = await getDocs(q);
            const rawAttempts = [];

            snapshot.forEach((attemptDoc) => {
                const data = attemptDoc.data();
                let dateStr = data.date;
                let timestampVal = 0;

                if (data.createdAt && typeof data.createdAt.toDate === "function") {
                    timestampVal = data.createdAt.toDate().getTime();
                    if (!dateStr) {
                        dateStr = data.createdAt.toDate().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                        });
                    }
                }

                rawAttempts.push({
                    id: attemptDoc.id,
                    ...data,
                    date: dateStr || "Recently",
                    _ts: timestampVal
                });
            });

            // Sort chronologically (oldest attempt first)
            rawAttempts.sort((a, b) => (a._ts || 0) - (b._ts || 0));

            // Assign attemptId sequential index (1, 2, 3...)
            return rawAttempts.map((att, idx) => ({
                ...att,
                attemptId: idx + 1
            }));
        } catch (error) {
            console.error("Error loading attempts:", error);
            return [];
        }
    }

    // =========================================================
    // SCORE COMPARISON
    // =========================================================
    async getScoreComparison(currentScore, currentPercentage) {
        const attempts = await this.getStudentAttempts();

        if (!attempts || attempts.length === 0) {
            return {
                hasPrevious: false,
                attemptNumber: 1
            };
        }

        // Most recent attempt is the last one in chronological list
        const previousAttempt = attempts[attempts.length - 1];

        const scoreDelta = currentScore - Number(previousAttempt.score || 0);
        const percentageDelta = parseFloat(
            (currentPercentage - Number(previousAttempt.percentage || 0)).toFixed(1)
        );

        const previousScores = attempts.map(attempt => Number(attempt.score || 0));
        const allScores = [...previousScores, currentScore];

        const avgScore = (
            allScores.reduce((sum, score) => sum + score, 0) / allScores.length
        ).toFixed(1);

        const bestScore = Math.max(...allScores);

        return {
            hasPrevious: true,
            attemptNumber: attempts.length + 1,
            previousAttemptNumber: attempts.length,
            previousScore: Number(previousAttempt.score || 0),
            previousPercentage: Number(previousAttempt.percentage || 0),
            previousDate: previousAttempt.date || "Previous attempt",
            scoreDelta,
            percentageDelta,
            avgScore,
            bestScore,
            isImproved: scoreDelta > 0,
            isSame: scoreDelta === 0
        };
    }

    // =========================================================
    // GET SECURITY QUESTION
    // =========================================================
    async getSecurityQuestion(rollNo) {
        try {
            const cleanRoll = rollNo.trim().toUpperCase();

            const studentsRef = collection(db, "students");
            let q = query(studentsRef, where("rollNo", "==", cleanRoll));
            let snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Also check if entered identifier is email
                const emailQ = query(studentsRef, where("email", "==", cleanRoll.toLowerCase()));
                const emailSnapshot = await getDocs(emailQ);
                if (!emailSnapshot.empty) {
                    snapshot = emailSnapshot;
                }
            }

            if (snapshot.empty) {
                return {
                    success: false,
                    message: "No account found with this Roll No."
                };
            }

            const studentDoc = snapshot.docs[0];
            const student = studentDoc.data();

            return {
                success: true,
                uid: studentDoc.id,
                name: student.name,
                rollNo: student.rollNo,
                branch: student.branch,
                email: student.email,
                securityQuestion: student.securityQuestion || "What is your favorite subject?"
            };
        } catch (error) {
            console.error("Security question error:", error);
            return {
                success: false,
                message: "Unable to find the account. Please check your network connection."
            };
        }
    }

    // =========================================================
    // VERIFY RECOVERY DETAILS
    // =========================================================
    async verifyRecoveryDetails(rollNo, answer) {
        try {
            const cleanRoll = rollNo.trim().toUpperCase();

            const studentsRef = collection(db, "students");
            let q = query(studentsRef, where("rollNo", "==", cleanRoll));
            let snapshot = await getDocs(q);

            if (snapshot.empty) {
                const emailQ = query(studentsRef, where("email", "==", cleanRoll.toLowerCase()));
                const emailSnapshot = await getDocs(emailQ);
                if (!emailSnapshot.empty) {
                    snapshot = emailSnapshot;
                }
            }

            if (snapshot.empty) {
                return {
                    success: false,
                    message: "Student account not found."
                };
            }

            const student = snapshot.docs[0].data();
            const storedAnswer = String(student.securityAnswer || "").trim().toLowerCase();
            const providedAnswer = String(answer || "").trim().toLowerCase();

            if (!storedAnswer || storedAnswer !== providedAnswer) {
                return {
                    success: false,
                    message: "Security answer is incorrect."
                };
            }

            return {
                success: true,
                message: "Identity verified."
            };
        } catch (error) {
            console.error("Recovery verification error:", error);
            return {
                success: false,
                message: "Unable to verify your identity."
            };
        }
    }

    // =========================================================
    // FIREBASE PASSWORD RESET EMAIL
    // =========================================================
    async sendPasswordReset(email) {
        try {
            await sendPasswordResetEmail(auth, email.trim());
            return {
                success: true,
                message: "Password reset email sent. Please check your inbox."
            };
        } catch (error) {
            console.error("Password reset error:", error);
            let message = "Unable to send password reset email.";

            if (error.code === "auth/user-not-found") {
                message = "No Firebase account was found with this email.";
            } else if (error.code === "auth/invalid-email") {
                message = "Please enter a valid email address.";
            }

            return { success: false, message };
        }
    }

    // =========================================================
    // RESET PASSWORD
    // =========================================================
    async resetPassword(rollNo, newPassword) {
        try {
            const result = await this.getSecurityQuestion(rollNo);
            if (!result.success) {
                return result;
            }

            if (!result.email) {
                return {
                    success: false,
                    message: "No email address is associated with this account."
                };
            }

            // Send password reset link to user's registered email
            const resetRes = await this.sendPasswordReset(result.email);
            if (resetRes.success) {
                return {
                    success: true,
                    message: `Password reset link sent to ${result.email}. Please follow the link to complete reset.`
                };
            }
            return resetRes;
        } catch (error) {
            console.error("Reset password error:", error);
            return {
                success: false,
                message: "Unable to start password reset."
            };
        }
    }

    // =========================================================
    // CHANGE PASSWORD FOR LOGGED IN STUDENT
    // =========================================================
    async changePassword(currentPassword, newPassword) {
        try {
            const user = auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    message: "You are not logged in."
                };
            }

            if (!newPassword || newPassword.length < 6) {
                return {
                    success: false,
                    message: "New password must be at least 6 characters."
                };
            }

            // Re-authenticate if user's email and current password are provided
            if (user.email && currentPassword) {
                try {
                    const credential = EmailAuthProvider.credential(user.email, currentPassword);
                    await reauthenticateWithCredential(user, credential);
                } catch (reauthErr) {
                    console.warn("Re-authentication notice:", reauthErr);
                    if (reauthErr.code === "auth/wrong-password" || reauthErr.code === "auth/invalid-credential") {
                        return {
                            success: false,
                            message: "Current password is incorrect."
                        };
                    }
                }
            }

            await updatePassword(user, newPassword);

            return {
                success: true,
                message: "Password changed successfully."
            };
        } catch (error) {
            console.error("Change password error:", error);
            let message = "Unable to change password.";

            if (error.code === "auth/requires-recent-login") {
                message = "For security, please log out and log in again before changing your password.";
            } else if (error.code === "auth/weak-password") {
                message = "New password must be at least 6 characters.";
            }

            return { success: false, message };
        }
    }
}

// =============================================================
// CREATE AUTH MANAGER INSTANCE
// =============================================================
const authManager = new AuthManager();

// Make available globally if needed
window.authManager = authManager;

// ES MODULE EXPORT
export { authManager };
