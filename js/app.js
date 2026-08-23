import { authManager } from "./auth.js";
import { leaderboardManager } from "./leaderboard.js";

/**
 * Main Application Controller
 * Handles Session, Live Test Engine, Question Randomization, Score Progression,
 * Clear Answer Reviews, Attempt History Inspection, and Smart Certificate Navigation.
 */

// Application State
const AppState = {
    currentScreen: 'authView',
    activeStudent: null,

    // Active Test State
    questions: [],
    currentIndex: 0,
    userAnswers: {}, // { [questionIndex]: optionIndex }
    markedForReview: new Set(),
    visitedQuestions: new Set(),

    // Timer State
    totalTimeSeconds: 20 * 60,
    timeRemaining: 20 * 60,
    timerInterval: null,
    testStartTime: null,
    testEndTime: null,

    // Proctoring
    tabSwitchCount: 0,
    maxTabSwitches: 3,
    isTestActive: false,

    // Navigation & Certificate Tracking
    activeCategoryFilter: 'ALL',
    currentCertData: null,
    previousScreenBeforeCert: 'dashboardView'
};

// DOM Initialization
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initSoundToggle();
    initPasswordToggles();
    initAuthListeners();
    initForgotPassword();
    initAccountSettingsModal();
    bindTestEventListeners();
    setupKeyboardShortcuts();
    setupProctoring();
    await checkExistingSession();
});

/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';

    toast.innerHTML = `
        <i class="fas fa-${icon}" style="font-size: 1.1rem;"></i>
        <div style="flex:1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/* ==========================================================================
   PASSWORD VISIBILITY TOGGLES
   ========================================================================== */
function initPasswordToggles() {
    document.querySelectorAll('.pwd-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                }
            }
        });
    });
}

/* ==========================================================================
   SESSION & NAVIGATION WITH AUTHORIZATION GUARD
   ========================================================================== */
async function checkExistingSession() {
    await authManager.waitForAuth();
    const student = authManager.getActiveStudent();
    if (student) {
        AppState.activeStudent = student;
        updateNavUserBadge(student);
        await renderStudentDashboard();
        showScreen('dashboardView');
    } else {
        showScreen('authView');
    }
}

function updateNavUserBadge(student) {
    const userBadge = document.getElementById('navUserBadge');
    const userName = document.getElementById('navUserName');
    const navLeaderboardBtn = document.getElementById('navLeaderboardBtn');

    if (userBadge && userName) {
        if (student) {
            userBadge.style.display = 'inline-flex';
            userName.textContent = student.name;
            if (navLeaderboardBtn) navLeaderboardBtn.style.display = 'inline-flex';
        } else {
            userBadge.style.display = 'none';
            if (navLeaderboardBtn) navLeaderboardBtn.style.display = 'none';
        }
    }
}

function showScreen(screenId) {
    // Route Authorization Guard
    const protectedScreens = ['dashboardView', 'instructionView', 'testView', 'resultView', 'certificateView'];
    if (protectedScreens.includes(screenId) && !authManager.isAuthorized()) {
        showToast('🔒 Access Restricted: Please log in or create an account to access this section.', 'warning', 4000);
        screenId = 'authView';
    }

    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        AppState.currentScreen = screenId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/* ==========================================================================
   THEME & AUDIO CONTROLS
   ========================================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem('aptitude_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('aptitude_theme', nextTheme);
            updateThemeIcon(nextTheme);
            soundManager.playClick();
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function initSoundToggle() {
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    
    const updateIcon = (isMuted) => {
        if (soundIcon) {
            soundIcon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        }
    };

    updateIcon(soundManager.isMuted);

    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', () => {
            const isMuted = soundManager.toggleMute();
            updateIcon(isMuted);
            if (!isMuted) soundManager.playClick();
        });
    }
}

/* ==========================================================================
   AUTH LISTENERS (LOGIN, REGISTRATION, LOGOUT)
   ========================================================================== */
function initAuthListeners() {
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabRegister = document.getElementById('tabRegisterBtn');
    const formLogin = document.getElementById('loginFormContainer');
    const formRegister = document.getElementById('registerFormContainer');
    const formForgot = document.getElementById('forgotFormContainer');

    // ============================================================
    // LOGIN / REGISTER TABS
    // ============================================================
    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            soundManager.playClick();
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');

            if (formLogin) formLogin.style.display = 'block';
            if (formRegister) formRegister.style.display = 'none';
            if (formForgot) formForgot.style.display = 'none';
        });

        tabRegister.addEventListener('click', () => {
            soundManager.playClick();
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');

            if (formRegister) formRegister.style.display = 'block';
            if (formLogin) formLogin.style.display = 'none';
            if (formForgot) formForgot.style.display = 'none';
        });
    }

    // ============================================================
    // CUSTOM BRANCH
    // ============================================================
    const regBranchSelect = document.getElementById('regBranch');
    const customBranchWrapper = document.getElementById('customBranchWrapper');
    const customBranchInput = document.getElementById('customBranchInput');

    if (regBranchSelect && customBranchWrapper) {
        regBranchSelect.addEventListener('change', () => {
            if (regBranchSelect.value === 'OTHER') {
                customBranchWrapper.style.display = 'block';
                if (customBranchInput) customBranchInput.required = true;
            } else {
                customBranchWrapper.style.display = 'none';
                if (customBranchInput) {
                    customBranchInput.required = false;
                    customBranchInput.value = '';
                }
            }
        });
    }

    // ============================================================
    // STUDENT REGISTRATION
    // ============================================================
    const studentRegisterForm = document.getElementById('studentRegisterForm');

    if (studentRegisterForm) {
        studentRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            soundManager.playClick();

            const name = document.getElementById('regName')?.value.trim() || '';
            const rollNo = document.getElementById('regRoll')?.value.trim() || '';
            const email = document.getElementById('regEmail')?.value.trim() || '';
            const securityQuestion = document.getElementById('regSecurityQuestion')?.value || '';
            const securityAnswer = document.getElementById('regSecurityAnswer')?.value.trim() || '';
            const password = document.getElementById('regPassword')?.value || '';
            const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';

            let branch = document.getElementById('regBranch')?.value || '';
            if (branch === 'OTHER') {
                const customBranch = customBranchInput?.value.trim() || '';
                if (!customBranch) {
                    showToast('Please specify your custom department name.', 'warning');
                    return;
                }
                branch = customBranch;
            }

            if (!name) {
                showToast('Please enter your full name.', 'warning');
                return;
            }
            if (!rollNo) {
                showToast('Please enter your roll number.', 'warning');
                return;
            }
            if (!email) {
                showToast('Please enter your email address.', 'warning');
                return;
            }
            if (!branch) {
                showToast('Please select your department.', 'warning');
                return;
            }
            if (!securityQuestion) {
                showToast('Please select a security question.', 'warning');
                return;
            }
            if (!securityAnswer) {
                showToast('Please enter your security answer.', 'warning');
                return;
            }
            if (password.length < 6) {
                showToast('Password must be at least 6 characters long.', 'warning');
                return;
            }
            if (password !== confirmPassword) {
                showToast('Passwords do not match. Please verify and re-enter.', 'error');
                return;
            }

            const submitButton = studentRegisterForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton?.innerHTML || '';
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            }

            try {
                const result = await authManager.registerStudent(
                    name,
                    rollNo,
                    branch,
                    email,
                    securityQuestion,
                    securityAnswer,
                    password
                );

                if (!result || !result.success) {
                    showToast(result?.message || 'Registration failed. Please try again.', 'error', 5000);
                    return;
                }

                AppState.activeStudent = result.student;
                updateNavUserBadge(result.student);
                await renderStudentDashboard();

                showToast(`Welcome aboard, ${result.student.name}! Your student profile has been created.`, 'success', 4000);
                showScreen('dashboardView');
                studentRegisterForm.reset();

                if (customBranchWrapper) customBranchWrapper.style.display = 'none';
            } catch (error) {
                console.error('Registration error:', error);
                showToast(error.message || 'Registration failed. Please try again.', 'error', 5000);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText || 'Register & Proceed <i class="fas fa-check"></i>';
                }
            }
        });
    }

    // ============================================================
    // STUDENT LOGIN
    // ============================================================
    const studentLoginForm = document.getElementById('studentLoginForm');

    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            soundManager.playClick();

            const email = document.getElementById('loginEmail')?.value.trim() || document.getElementById('loginRoll')?.value.trim() || '';
            const password = document.getElementById('loginPassword')?.value || '';

            if (!email) {
                showToast('Please enter your registered email address.', 'warning');
                return;
            }
            if (!password) {
                showToast('Please enter your password.', 'warning');
                return;
            }

            const submitButton = studentLoginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton?.innerHTML || '';
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
            }

            try {
                const result = await authManager.loginStudent(email, password);

                if (!result || !result.success) {
                    showToast(result?.message || 'Login failed. Please check your credentials.', 'error');
                    return;
                }

                AppState.activeStudent = result.student;
                updateNavUserBadge(result.student);
                await renderStudentDashboard();

                showToast(`Welcome back, ${result.student.name}!`, 'success');
                showScreen('dashboardView');
            } catch (error) {
                console.error('Login error:', error);
                showToast(error.message || 'Login failed. Please try again.', 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText || 'Log In to Dashboard <i class="fas fa-arrow-right"></i>';
                }
            }
        });
    }

    // ============================================================
    // LOGOUT
    // ============================================================
    const logoutBtn = document.getElementById('logoutBtn');
    const navLogoutBtn = document.getElementById('navLogoutBtn');

    const handleLogout = async () => {
        if (confirm("Are you sure you want to log out of your student account?")) {
            soundManager.playClick();
            await authManager.logout();
            AppState.activeStudent = null;
            updateNavUserBadge(null);
            showToast('You have been logged out successfully.', 'info');
            showScreen('authView');
        }
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (navLogoutBtn) navLogoutBtn.addEventListener('click', handleLogout);
}

/* ==========================================================================
   FORGOT PASSWORD & ACCOUNT RECOVERY
   ========================================================================== */
function initForgotPassword() {
    const forgotLinkBtn = document.getElementById('forgotPasswordLinkBtn');
    const backToLoginBtn = document.getElementById('backToLoginFromForgotBtn');
    const forgotDoneLoginBtn = document.getElementById('forgotDoneLoginBtn');
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabRegister = document.getElementById('tabRegisterBtn');
    
    const formLogin = document.getElementById('loginFormContainer');
    const formRegister = document.getElementById('registerFormContainer');
    const formForgot = document.getElementById('forgotFormContainer');

    const step1Form = document.getElementById('forgotStep1Form');
    const step2Form = document.getElementById('forgotStep2Form');
    const step3Form = document.getElementById('forgotStep3Form');
    const successBox = document.getElementById('forgotSuccessBox');
    const successMsg = document.getElementById('forgotSuccessMessage');

    const pill1 = document.getElementById('recStepPill1');
    const pill2 = document.getElementById('recStepPill2');
    const pill3 = document.getElementById('recStepPill3');

    const directSendEmailBtn = document.getElementById('directSendEmailLinkBtn');
    const step2SendEmailBtn = document.getElementById('forgotSendEmailFromStep2Btn');
    const step2BackBtn = document.getElementById('forgotBackToStep1Btn');

    let currentRecoveryEmail = '';

    const setRecoveryStep = (step) => {
        if (step1Form) step1Form.style.display = step === 1 ? 'block' : 'none';
        if (step2Form) step2Form.style.display = step === 2 ? 'block' : 'none';
        if (step3Form) step3Form.style.display = step === 3 ? 'block' : 'none';
        if (successBox) successBox.style.display = step === 4 ? 'block' : 'none';

        if (pill1) {
            pill1.className = 'rec-step' + (step === 1 ? ' active' : (step > 1 ? ' completed' : ''));
        }
        if (pill2) {
            pill2.className = 'rec-step' + (step === 2 ? ' active' : (step > 2 ? ' completed' : ''));
        }
        if (pill3) {
            pill3.className = 'rec-step' + (step === 3 ? ' active' : (step > 3 ? ' completed' : ''));
        }
    };

    const switchToForgot = () => {
        soundManager.playClick();
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.remove('active');
        if (formLogin) formLogin.style.display = 'none';
        if (formRegister) formRegister.style.display = 'none';
        if (formForgot) formForgot.style.display = 'block';
        setRecoveryStep(1);
    };

    const switchToLogin = () => {
        soundManager.playClick();
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
        if (formLogin) formLogin.style.display = 'block';
        if (formRegister) formRegister.style.display = 'none';
        if (formForgot) formForgot.style.display = 'none';
        setRecoveryStep(1);
    };

    if (forgotLinkBtn) forgotLinkBtn.addEventListener('click', switchToForgot);
    if (backToLoginBtn) backToLoginBtn.addEventListener('click', switchToLogin);
    if (forgotDoneLoginBtn) forgotDoneLoginBtn.addEventListener('click', switchToLogin);

    // ============================================================
    // STEP 1: FIND ACCOUNT BY EMAIL
    // ============================================================
    if (step1Form) {
        step1Form.addEventListener('submit', async (e) => {
            e.preventDefault();
            soundManager.playClick();

            const email = (document.getElementById('forgotEmail')?.value || '').trim().toLowerCase();
            if (!email) {
                showToast('Please enter your registered email address.', 'warning');
                return;
            }

            const submitBtn = step1Form.querySelector('button[type="submit"]');
            const origBtnText = submitBtn?.innerHTML || '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding account...';
            }

            try {
                const res = await authManager.getSecurityQuestion(email);
                if (!res.success) {
                    showToast(res.message || 'No account found with this email.', 'error');
                    return;
                }

                currentRecoveryEmail = email;

                const candidateName = document.getElementById('forgotCandidateName');
                const candidateMeta = document.getElementById('forgotCandidateMeta');
                const questionDisplay = document.getElementById('forgotSecurityQuestionDisplay');

                if (candidateName) candidateName.textContent = res.name || 'Registered Student';
                if (candidateMeta) candidateMeta.textContent = `Roll No: ${res.rollNo || 'STUDENT'} • ${res.branch || 'CSE'}`;
                if (questionDisplay) questionDisplay.textContent = res.securityQuestion || 'What is your favorite subject?';

                const answerInput = document.getElementById('forgotSecurityAnswer');
                if (answerInput) answerInput.value = '';

                setRecoveryStep(2);
                showToast('Account found! Please answer your security question.', 'info');
            } catch (err) {
                console.error('Account lookup error:', err);
                showToast('Unable to find account. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnText || 'Find Account <i class="fas fa-search"></i>';
                }
            }
        });
    }

    // Direct email link from Step 1
    if (directSendEmailBtn) {
        directSendEmailBtn.addEventListener('click', async () => {
            soundManager.playClick();
            const email = (document.getElementById('forgotEmail')?.value || '').trim().toLowerCase();
            if (!email) {
                showToast('Please enter your registered email address above first.', 'warning');
                return;
            }

            directSendEmailBtn.disabled = true;
            try {
                const res = await authManager.sendPasswordReset(email);
                if (!res.success) {
                    showToast(res.message, 'error');
                    return;
                }

                showToast(res.message, 'success', 6000);
                setRecoveryStep(4);
                if (successMsg) {
                    successMsg.innerHTML = `We have sent a secure password reset link to <strong>${email}</strong>. Please check your inbox (and spam folder) to set your new password, then return here to log in.`;
                }

                const loginEmailInput = document.getElementById('loginEmail');
                if (loginEmailInput) loginEmailInput.value = email;
            } catch (err) {
                showToast('Unable to send password reset email.', 'error');
            } finally {
                directSendEmailBtn.disabled = false;
            }
        });
    }

    // ============================================================
    // STEP 2: VERIFY SECURITY ANSWER
    // ============================================================
    if (step2Form) {
        step2Form.addEventListener('submit', async (e) => {
            e.preventDefault();
            soundManager.playClick();

            const answer = (document.getElementById('forgotSecurityAnswer')?.value || '').trim();
            if (!answer) {
                showToast('Please enter your security answer.', 'warning');
                return;
            }

            const submitBtn = step2Form.querySelector('button[type="submit"]');
            const origBtnText = submitBtn?.innerHTML || '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            }

            try {
                const res = await authManager.verifyRecoveryDetails(currentRecoveryEmail, answer);
                if (!res.success) {
                    showToast(res.message, 'error', 5000);
                    return;
                }

                setRecoveryStep(3);
                showToast('Answer verified! Please choose your new password.', 'success');
            } catch (err) {
                showToast('Verification failed. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnText || 'Verify Answer <i class="fas fa-check"></i>';
                }
            }
        });
    }

    // Step 2 Back to Step 1
    if (step2BackBtn) {
        step2BackBtn.addEventListener('click', () => {
            soundManager.playClick();
            setRecoveryStep(1);
        });
    }

    // Step 2 Send Email Link Fallback
    if (step2SendEmailBtn) {
        step2SendEmailBtn.addEventListener('click', async () => {
            soundManager.playClick();
            if (!currentRecoveryEmail) {
                showToast('Please enter your email address first.', 'warning');
                setRecoveryStep(1);
                return;
            }

            step2SendEmailBtn.disabled = true;
            try {
                const res = await authManager.sendPasswordReset(currentRecoveryEmail);
                if (!res.success) {
                    showToast(res.message, 'error');
                    return;
                }

                showToast(res.message, 'success', 6000);
                setRecoveryStep(4);
                if (successMsg) {
                    successMsg.innerHTML = `We have sent a secure password reset link to <strong>${currentRecoveryEmail}</strong>. Please check your inbox (and spam folder) to set your new password, then return here to log in.`;
                }

                const loginEmailInput = document.getElementById('loginEmail');
                if (loginEmailInput) loginEmailInput.value = currentRecoveryEmail;
            } catch (err) {
                showToast('Unable to send password reset email.', 'error');
            } finally {
                step2SendEmailBtn.disabled = false;
            }
        });
    }

    // ============================================================
    // STEP 3: RESET PASSWORD
    // ============================================================
    if (step3Form) {
        step3Form.addEventListener('submit', async (e) => {
            e.preventDefault();
            soundManager.playClick();

            const newPass = document.getElementById('forgotNewPassword')?.value || '';
            const confirmPass = document.getElementById('forgotConfirmPassword')?.value || '';

            if (newPass.length < 6) {
                showToast('New password must be at least 6 characters.', 'warning');
                return;
            }
            if (newPass !== confirmPass) {
                showToast('New password and confirm password do not match.', 'error');
                return;
            }

            const submitBtn = step3Form.querySelector('button[type="submit"]');
            const origBtnText = submitBtn?.innerHTML || '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating password...';
            }

            try {
                const res = await authManager.resetPassword(currentRecoveryEmail, newPass);
                if (!res.success) {
                    showToast(res.message || 'Unable to update password.', 'error');
                    return;
                }

                showToast(res.message, 'success', 6000);
                setRecoveryStep(4);
                if (successMsg) {
                    successMsg.innerHTML = `Your identity has been verified! A secure password reset link has been dispatched to <strong>${currentRecoveryEmail}</strong> to finalize your new password.`;
                }

                const loginEmailInput = document.getElementById('loginEmail');
                if (loginEmailInput) loginEmailInput.value = currentRecoveryEmail;
            } catch (err) {
                showToast('Password reset failed. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnText || 'Update Password & Log In <i class="fas fa-save"></i>';
                }
            }
        });
    }
}

/* ==========================================================================
   ACCOUNT SETTINGS & CHANGE PASSWORD MODAL
   ========================================================================== */
function initAccountSettingsModal() {
    const settingsBtn = document.getElementById('accountSettingsBtn');
    const settingsModal = document.getElementById('accountSettingsModal');
    const changePassForm = document.getElementById('changePasswordForm');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            soundManager.playClick();
            const student = authManager.getActiveStudent();
            if (!student) return;

            const nameEl = document.getElementById('settingsStudentName');
            const metaEl = document.getElementById('settingsStudentMeta');
            const dateEl = document.getElementById('settingsRegisteredDate');

            if (nameEl) nameEl.textContent = student.name;
            if (metaEl) metaEl.textContent = `${student.rollNo} • Department of ${student.branch}`;
            if (dateEl) dateEl.textContent = `Member since: ${student.registeredAt || '2026-08-19'}`;

            if (changePassForm) changePassForm.reset();
            settingsModal.classList.add('active');
        });
    }

    if (changePassForm) {
        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            soundManager.playClick();

            const student = authManager.getActiveStudent();
            if (!student) return;

            const currentPass = document.getElementById('changeCurrentPassword')?.value || '';
            const newPass = document.getElementById('changeNewPassword')?.value || '';
            const confirmPass = document.getElementById('changeConfirmPassword')?.value || '';

            if (newPass.length < 6) {
                showToast('New password must be at least 6 characters.', 'warning');
                return;
            }

            if (newPass !== confirmPass) {
                showToast('New passwords do not match.', 'error');
                return;
            }

            const submitBtn = changePassForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const res = await authManager.changePassword(currentPass, newPass);
                if (!res.success) {
                    showToast(res.message, 'error');
                    return;
                }

                showToast('✅ Password changed successfully!', 'success');
                changePassForm.reset();
                if (settingsModal) settingsModal.classList.remove('active');
            } catch (err) {
                showToast('Unable to change password. Please try again.', 'error');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
}

/* ==========================================================================
   STUDENT DASHBOARD & HISTORICAL TEST INSPECTION
   ========================================================================== */
async function renderStudentDashboard() {
    const student = authManager.getActiveStudent();
    if (!student) return;

    const attempts = await authManager.getStudentAttempts();

    const nameEl = document.getElementById('dashStudentName');
    const rollEl = document.getElementById('dashStudentRoll');
    const branchEl = document.getElementById('dashStudentBranch');

    if (nameEl) nameEl.textContent = student.name;
    if (rollEl) rollEl.textContent = student.rollNo;
    if (branchEl) branchEl.textContent = student.branch;

    const totalAttempts = attempts.length;
    const dashTotalTestsEl = document.getElementById('dashTotalTests');
    if (dashTotalTestsEl) dashTotalTestsEl.textContent = totalAttempts;

    const bestScoreEl = document.getElementById('dashBestScore');
    const avgScoreEl = document.getElementById('dashAvgScore');
    const lastAttemptDateEl = document.getElementById('dashLastAttemptDate');

    if (totalAttempts > 0) {
        const scores = attempts.map(a => Number(a.score || 0));
        const bestScore = Math.max(...scores);
        const avgScore = (scores.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(1);
        const latestAttempt = attempts[totalAttempts - 1];

        if (bestScoreEl) bestScoreEl.textContent = `${bestScore} / 20`;
        if (avgScoreEl) avgScoreEl.textContent = `${avgScore} / 20`;
        if (lastAttemptDateEl) lastAttemptDateEl.textContent = latestAttempt.date;
    } else {
        if (bestScoreEl) bestScoreEl.textContent = `N/A`;
        if (avgScoreEl) avgScoreEl.textContent = `N/A`;
        if (lastAttemptDateEl) lastAttemptDateEl.textContent = `Never`;
    }

    // Render Previous Attempts History Table (newest first)
    const historyBody = document.getElementById('dashHistoryTableBody');
    if (historyBody) {
        historyBody.innerHTML = '';

        if (totalAttempts === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
                        No tests taken yet. Click <strong>"Start New Aptitude Test"</strong> above to begin your first session!
                    </td>
                </tr>`;
        } else {
            [...attempts].reverse().forEach((att) => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.title = "Click to inspect full test details and solutions";
                tr.innerHTML = `
                    <td><strong>Attempt #${att.attemptId}</strong></td>
                    <td><strong style="color:#38bdf8; font-size:1rem;">${att.score} / ${att.total || 20}</strong></td>
                    <td><span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981; font-weight:700;">${att.percentage}%</span></td>
                    <td><span class="badge-grade" style="font-size:0.75rem; padding: 2px 8px;">${att.grade || 'Completed'}</span></td>
                    <td>${leaderboardManager.formatTime(att.timeTakenSeconds || 0)}</td>
                    <td style="font-size:0.85rem; color:var(--text-muted);">${att.date}</td>
                    <td style="white-space: nowrap;">
                        <button class="btn btn-primary btn-sm view-attempt-btn" style="padding:0.35rem 0.65rem; font-size:0.8rem; margin-right:4px;" data-attempt="${att.attemptId}">
                            <i class="fas fa-eye"></i> Full Report
                        </button>
                        <button class="btn btn-secondary btn-sm view-past-cert-btn" style="padding:0.35rem 0.65rem; font-size:0.8rem;" data-attempt="${att.attemptId}">
                            <i class="fas fa-certificate"></i> Cert
                        </button>
                    </td>
                `;

                // Row click opens the full test details
                tr.addEventListener('click', (e) => {
                    if (e.target.closest('.view-past-cert-btn')) return; // let cert button handle itself
                    openAttemptDetailsModal(student, att);
                });

                historyBody.appendChild(tr);
            });

            // Bind Certificate Buttons
            document.querySelectorAll('.view-past-cert-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const attId = parseInt(e.currentTarget.getAttribute('data-attempt'));
                    const targetAtt = attempts.find(a => a.attemptId === attId);
                    if (targetAtt) {
                        openCertificateForAttempt(student, targetAtt, 'dashboardView');
                    }
                });
            });
        }
    }
}

/**
 * Opens Full Information & Detailed Solutions for a specific past attempt
 */
function openAttemptDetailsModal(student, attempt) {
    soundManager.playClick();

    document.getElementById('attModalTitle').textContent = `Full Test Report – Attempt #${attempt.attemptId}`;
    document.getElementById('attModalDate').textContent = `Taken on ${attempt.date}`;

    // Fill Summary Metrics
    document.getElementById('attModalScore').textContent = `${attempt.score} / ${attempt.total || 20}`;
    document.getElementById('attModalPercentage').textContent = `${attempt.percentage}%`;
    document.getElementById('attModalGrade').textContent = attempt.grade || 'Completed';
    document.getElementById('attModalTime').textContent = leaderboardManager.formatTime(attempt.timeTakenSeconds || 0);

    // Fill Category Bars
    const catStats = attempt.categoryStats || {
        "Quantitative Aptitude": { correct: 0, total: 7 },
        "Logical Reasoning": { correct: 0, total: 7 },
        "Verbal Ability": { correct: 0, total: 6 }
    };

    const qStats = catStats["Quantitative Aptitude"] || { correct: 0, total: 7 };
    const lStats = catStats["Logical Reasoning"] || { correct: 0, total: 7 };
    const vStats = catStats["Verbal Ability"] || { correct: 0, total: 6 };

    const qPct = Math.round((qStats.correct / (qStats.total || 1)) * 100);
    const lPct = Math.round((lStats.correct / (lStats.total || 1)) * 100);
    const vPct = Math.round((vStats.correct / (vStats.total || 1)) * 100);

    document.getElementById('attModalQuantScore').textContent = `${qStats.correct}/${qStats.total} (${qPct}%)`;
    document.getElementById('attModalLogicScore').textContent = `${lStats.correct}/${lStats.total} (${lPct}%)`;
    document.getElementById('attModalVerbalScore').textContent = `${vStats.correct}/${vStats.total} (${vPct}%)`;

    document.getElementById('attModalQuantFill').style.width = `${qPct}%`;
    document.getElementById('attModalLogicFill').style.width = `${lPct}%`;
    document.getElementById('attModalVerbalFill').style.width = `${vPct}%`;

    // Render Detailed Questions with Explicit Choice & Correct Answer indicators
    const container = document.getElementById('attModalQuestionsList');
    renderQuestionReviewList(container, attempt.questions || [], attempt.userAnswers || {});

    // Bind Certificate Button inside modal
    const certBtn = document.getElementById('attModalCertBtn');
    if (certBtn) {
        certBtn.onclick = () => {
            closeAllModals();
            openCertificateForAttempt(student, attempt, 'dashboardView');
        };
    }

    document.getElementById('attemptDetailsModal').classList.add('active');
}

/* ==========================================================================
   EVENT LISTENERS FOR TEST & SCREEN ACTIONS
   ========================================================================== */
function bindTestEventListeners() {
    const dashStartTestBtn = document.getElementById('dashStartTestBtn');
    if (dashStartTestBtn) {
        dashStartTestBtn.addEventListener('click', () => {
            soundManager.playClick();
            prepareInstructionScreen();
            showScreen('instructionView');
        });
    }

    const startTestBtn = document.getElementById('startTestBtn');
    if (startTestBtn) {
        startTestBtn.addEventListener('click', startAptitudeTest);
    }

    const backToDashBtn = document.getElementById('backToDashBtn');
    if (backToDashBtn) {
        backToDashBtn.addEventListener('click', () => showScreen('dashboardView'));
    }

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const clearBtn = document.getElementById('clearBtn');
    const markReviewBtn = document.getElementById('markReviewBtn');
    const submitTestBtn = document.getElementById('submitTestBtn');
    const paletteSubmitBtn = document.getElementById('paletteSubmitBtn');

    if (prevBtn) prevBtn.addEventListener('click', goToPreviousQuestion);
    if (nextBtn) nextBtn.addEventListener('click', goToNextQuestion);
    if (clearBtn) clearBtn.addEventListener('click', clearCurrentAnswer);
    if (markReviewBtn) markReviewBtn.addEventListener('click', toggleMarkForReview);
    
    if (submitTestBtn) submitTestBtn.addEventListener('click', confirmAndSubmitTest);
    if (paletteSubmitBtn) paletteSubmitBtn.addEventListener('click', confirmAndSubmitTest);

    const secTabs = document.querySelectorAll('.sec-tab');
    secTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            secTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            AppState.activeCategoryFilter = e.currentTarget.getAttribute('data-cat');
            filterQuestionDisplay();
            soundManager.playClick();
        });
    });

    const reviewAnswersBtn = document.getElementById('reviewAnswersBtn');
    const viewCertificateBtn = document.getElementById('viewCertificateBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    const navLeaderboardBtn = document.getElementById('navLeaderboardBtn');
    const retakeTestBtn = document.getElementById('retakeTestBtn');
    const backToDashboardFromResultBtn = document.getElementById('backToDashboardFromResultBtn');

    if (reviewAnswersBtn) reviewAnswersBtn.addEventListener('click', () => {
        openCurrentReviewModal();
    });

    if (viewCertificateBtn) viewCertificateBtn.addEventListener('click', () => {
        if (AppState.currentCertData) {
            AppState.previousScreenBeforeCert = 'resultView'; // Record origin
            renderCertificate(AppState.currentCertData);
            showScreen('certificateView');
        }
    });

    if (leaderboardBtn) leaderboardBtn.addEventListener('click', openLeaderboardModal);
    if (navLeaderboardBtn) navLeaderboardBtn.addEventListener('click', openLeaderboardModal);
    if (retakeTestBtn) retakeTestBtn.addEventListener('click', resetAndRetake);
    
    if (backToDashboardFromResultBtn) backToDashboardFromResultBtn.addEventListener('click', async () => {
        await renderStudentDashboard();
        showScreen('dashboardView');
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    const lbSearch = document.getElementById('leaderboardSearch');
    const lbBranchFilter = document.getElementById('leaderboardBranchFilter');
    if (lbSearch) lbSearch.addEventListener('input', renderLeaderboardTable);
    if (lbBranchFilter) lbBranchFilter.addEventListener('change', renderLeaderboardTable);

    const resetLeaderboardBtn = document.getElementById('resetLeaderboardBtn');
    if (resetLeaderboardBtn) {
        resetLeaderboardBtn.addEventListener('click', async () => {
            if (confirm("Reset leaderboard to default competition benchmark scores?")) {
                await leaderboardManager.resetToDefault();
                await renderLeaderboardTable();
                soundManager.playClick();
            }
        });
    }

    // Certificate Print & Smart Backtracking Button
    const printCertBtn = document.getElementById('printCertBtn');
    const certBackBtn = document.getElementById('certBackBtn');
    
    if (printCertBtn) {
        printCertBtn.addEventListener('click', () => {
            window.print();
        });
    }

    if (certBackBtn) {
        certBackBtn.addEventListener('click', async () => {
            soundManager.playClick();
            const targetScreen = AppState.previousScreenBeforeCert || 'dashboardView';
            if (targetScreen === 'dashboardView') {
                await renderStudentDashboard();
            }
            showScreen(targetScreen);
        });
    }

    const proctorAcknowledgeBtn = document.getElementById('proctorAcknowledgeBtn');
    if (proctorAcknowledgeBtn) {
        proctorAcknowledgeBtn.addEventListener('click', () => {
            document.getElementById('proctorModal').classList.remove('active');
            soundManager.playClick();
        });
    }
}

function prepareInstructionScreen() {
    const student = AppState.activeStudent;
    if (!student) return;

    document.getElementById('summaryCandidateName').textContent = student.name;
    document.getElementById('summaryCandidateRoll').textContent = student.rollNo;
    document.getElementById('summaryCandidateBranch').textContent = student.branch;
}

/* ==========================================================================
   LIVE TEST ENGINE
   ========================================================================== */
function startAptitudeTest() {
    soundManager.playClick();

    // Fresh randomized questions
    AppState.questions = generateTestQuestions();
    AppState.currentIndex = 0;
    AppState.userAnswers = {};
    AppState.markedForReview.clear();
    AppState.visitedQuestions.clear();
    AppState.visitedQuestions.add(0);
    AppState.tabSwitchCount = 0;
    AppState.isTestActive = true;
    AppState.timeRemaining = AppState.totalTimeSeconds;
    AppState.testStartTime = new Date();

    const candidateNameEl = document.getElementById('headerCandidateName');
    const candidateMetaEl = document.getElementById('headerCandidateMeta');
    if (candidateNameEl) candidateNameEl.textContent = AppState.activeStudent.name;
    if (candidateMetaEl) candidateMetaEl.textContent = `${AppState.activeStudent.rollNo} • ${AppState.activeStudent.branch}`;

    renderQuestionPalette();
    renderCurrentQuestion();
    startTimer();

    showScreen('testView');
}

function renderCurrentQuestion() {
    const q = AppState.questions[AppState.currentIndex];
    if (!q) return;

    AppState.visitedQuestions.add(AppState.currentIndex);

    document.getElementById('questionIndexBadge').textContent = `Question ${AppState.currentIndex + 1} of ${AppState.questions.length}`;
    document.getElementById('questionCategoryBadge').textContent = `${q.category} • ${q.topic}`;
    document.getElementById('questionText').textContent = q.question;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    const currentSelected = AppState.userAnswers[AppState.currentIndex];

    q.options.forEach((optText, optIndex) => {
        const optionEl = document.createElement('div');
        optionEl.className = `option-item ${currentSelected === optIndex ? 'selected' : ''}`;
        optionEl.innerHTML = `
            <div class="option-indicator">${letters[optIndex]}</div>
            <div class="option-content">${optText}</div>
        `;
        optionEl.addEventListener('click', () => selectOption(optIndex));
        optionsContainer.appendChild(optionEl);
    });

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = AppState.currentIndex === 0;
    if (nextBtn) {
        if (AppState.currentIndex === AppState.questions.length - 1) {
            nextBtn.innerHTML = `Finish & Submit <i class="fas fa-check-circle"></i>`;
        } else {
            nextBtn.innerHTML = `Next Question <i class="fas fa-arrow-right"></i>`;
        }
    }

    const markReviewBtn = document.getElementById('markReviewBtn');
    if (markReviewBtn) {
        const isMarked = AppState.markedForReview.has(AppState.currentIndex);
        markReviewBtn.innerHTML = isMarked
            ? `<i class="fas fa-bookmark"></i> Unmark Review`
            : `<i class="far fa-bookmark"></i> Mark for Review`;
        markReviewBtn.className = isMarked ? 'btn btn-warning' : 'btn btn-secondary';
    }

    updatePaletteStatus();
}

function selectOption(optIndex) {
    soundManager.playOptionSelect();
    AppState.userAnswers[AppState.currentIndex] = optIndex;
    renderCurrentQuestion();
    updatePaletteStatus();
}

function clearCurrentAnswer() {
    soundManager.playClick();
    delete AppState.userAnswers[AppState.currentIndex];
    renderCurrentQuestion();
    updatePaletteStatus();
}

function toggleMarkForReview() {
    soundManager.playClick();
    if (AppState.markedForReview.has(AppState.currentIndex)) {
        AppState.markedForReview.delete(AppState.currentIndex);
    } else {
        AppState.markedForReview.add(AppState.currentIndex);
    }
    renderCurrentQuestion();
    updatePaletteStatus();
}

function goToNextQuestion() {
    soundManager.playClick();
    if (AppState.currentIndex < AppState.questions.length - 1) {
        AppState.currentIndex++;
        renderCurrentQuestion();
    } else {
        confirmAndSubmitTest();
    }
}

function goToPreviousQuestion() {
    soundManager.playClick();
    if (AppState.currentIndex > 0) {
        AppState.currentIndex--;
        renderCurrentQuestion();
    }
}

function jumpToQuestion(index) {
    if (index >= 0 && index < AppState.questions.length) {
        soundManager.playClick();
        AppState.currentIndex = index;
        renderCurrentQuestion();
    }
}

/* ==========================================================================
   PALETTE & TIMER
   ========================================================================== */
function renderQuestionPalette() {
    const grid = document.getElementById('paletteGrid');
    if (!grid) return;

    grid.innerHTML = '';
    AppState.questions.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.id = `palette-btn-${idx}`;
        btn.className = 'palette-btn';
        btn.textContent = idx + 1;
        btn.setAttribute('data-index', idx);
        btn.addEventListener('click', () => jumpToQuestion(idx));
        grid.appendChild(btn);
    });

    updatePaletteStatus();
}

function updatePaletteStatus() {
    let answeredCount = 0;
    let markedCount = 0;

    AppState.questions.forEach((_, idx) => {
        const btn = document.getElementById(`palette-btn-${idx}`);
        if (!btn) return;

        btn.className = 'palette-btn';

        const isAnswered = AppState.userAnswers[idx] !== undefined;
        const isMarked = AppState.markedForReview.has(idx);
        const isCurrent = idx === AppState.currentIndex;

        if (isAnswered) answeredCount++;
        if (isMarked) markedCount++;

        if (isMarked) {
            btn.classList.add('marked');
        } else if (isAnswered) {
            btn.classList.add('answered');
        } else if (AppState.visitedQuestions.has(idx)) {
            btn.classList.add('unanswered');
        }

        if (isCurrent) {
            btn.classList.add('current');
        }
    });

    const answeredCountBadge = document.getElementById('paletteAnsweredCount');
    if (answeredCountBadge) {
        answeredCountBadge.textContent = `${answeredCount} / ${AppState.questions.length} Solved`;
    }
}

function filterQuestionDisplay() {
    const filter = AppState.activeCategoryFilter;
    if (filter === 'ALL') return;

    const targetIdx = AppState.questions.findIndex(q => q.category === filter);
    if (targetIdx !== -1) {
        jumpToQuestion(targetIdx);
    }
}

function startTimer() {
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);

    const timerClockEl = document.getElementById('timerClock');
    const progressBarEl = document.getElementById('timerProgressBar');
    const timerPillEl = document.getElementById('timerPill');

    const updateDisplay = () => {
        const mins = Math.floor(AppState.timeRemaining / 60);
        const secs = AppState.timeRemaining % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (timerClockEl) timerClockEl.textContent = timeStr;

        const progressPercent = (AppState.timeRemaining / AppState.totalTimeSeconds) * 100;
        if (progressBarEl) progressBarEl.style.width = `${progressPercent}%`;

        if (AppState.timeRemaining <= 180) {
            if (timerPillEl) timerPillEl.classList.add('warning-pulse');
            soundManager.playTick();
        } else {
            if (timerPillEl) timerPillEl.classList.remove('warning-pulse');
        }

        if (AppState.timeRemaining <= 0) {
            clearInterval(AppState.timerInterval);
            alert("⏰ Time is up! Your aptitude test is being submitted automatically.");
            finishAndEvaluateTest();
        } else {
            AppState.timeRemaining--;
        }
    };

    updateDisplay();
    AppState.timerInterval = setInterval(updateDisplay, 1000);
}

function setupProctoring() {
    window.addEventListener('blur', () => {
        if (!AppState.isTestActive) return;

        AppState.tabSwitchCount++;
        soundManager.playWarning();

        const countEl = document.getElementById('tabSwitchCount');
        if (countEl) countEl.textContent = AppState.tabSwitchCount;

        const proctorModal = document.getElementById('proctorModal');
        if (proctorModal) proctorModal.classList.add('active');

        if (AppState.tabSwitchCount >= AppState.maxTabSwitches) {
            alert("🚨 Maximum tab switch violations exceeded. Submitting test automatically for integrity.");
            closeAllModals();
            finishAndEvaluateTest();
        }
    });
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (!AppState.isTestActive) return;
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

        const key = e.key.toUpperCase();
        if (key === 'A') selectOption(0);
        else if (key === 'B') selectOption(1);
        else if (key === 'C') selectOption(2);
        else if (key === 'D') selectOption(3);
        else if (key === 'N' || key === 'ARROW_RIGHT') goToNextQuestion();
        else if (key === 'P' || key === 'ARROW_LEFT') goToPreviousQuestion();
        else if (key === 'M') toggleMarkForReview();
    });
}

/* ==========================================================================
   EVALUATION & SCORE COMPARISON
   ========================================================================== */
function confirmAndSubmitTest() {
    const answeredCount = Object.keys(AppState.userAnswers).length;
    const unansweredCount = AppState.questions.length - answeredCount;

    const msg = unansweredCount > 0
        ? `You have answered ${answeredCount} of 20 questions.\n${unansweredCount} questions are still unattempted.\n\nAre you sure you want to submit your test?`
        : `You have answered all 20 questions!\n\nAre you sure you want to submit?`;

    if (confirm(msg)) {
        finishAndEvaluateTest();
    }
}

async function finishAndEvaluateTest() {
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);
    AppState.isTestActive = false;
    AppState.testEndTime = new Date();

    const timeSpentSeconds = AppState.totalTimeSeconds - AppState.timeRemaining;

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    const categoryStats = {
        "Quantitative Aptitude": { total: 0, correct: 0 },
        "Logical Reasoning": { total: 0, correct: 0 },
        "Verbal Ability": { total: 0, correct: 0 }
    };

    AppState.questions.forEach((q, idx) => {
        const cat = q.category;
        if (!categoryStats[cat]) categoryStats[cat] = { total: 0, correct: 0 };
        categoryStats[cat].total++;

        const userAns = AppState.userAnswers[idx];
        if (userAns === undefined) {
            unattemptedCount++;
        } else if (userAns === q.correct) {
            correctCount++;
            categoryStats[cat].correct++;
        } else {
            wrongCount++;
        }
    });

    const totalQuestions = AppState.questions.length;
    const score = correctCount;
    const percentage = parseFloat(((score / totalQuestions) * 100).toFixed(1));
    const attemptedCount = correctCount + wrongCount;
    const accuracy = attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(1) : 0;

    let grade = "Distinction 🏆";
    let gradeClass = "distinction";
    if (percentage >= 85) {
        grade = "Distinction 🏆";
        gradeClass = "distinction";
    } else if (percentage >= 70) {
        grade = "Merit ⭐";
        gradeClass = "merit";
    } else if (percentage >= 50) {
        grade = "Pass 👍";
        gradeClass = "pass";
    } else {
        grade = "Needs Improvement 💡";
        gradeClass = "fail";
    }

    soundManager.playSuccess();

    // Compute Comparison BEFORE saving new attempt
    const comparison = await authManager.getScoreComparison(score, percentage);

    // Save full test snapshot (including questions & userAnswers) to Firestore
    try {
        await authManager.saveTestAttempt({
            score,
            total: totalQuestions,
            percentage,
            accuracy,
            timeTakenSeconds: timeSpentSeconds,
            grade,
            categoryStats,
            questions: AppState.questions,
            userAnswers: AppState.userAnswers
        });
    } catch (saveError) {
        console.error("Test attempt persistence error:", saveError);
        showToast("⚠️ Could not save attempt to Cloud Firestore: " + (saveError?.message || "Storage error"), "error", 6000);
    }

    // Save into Shared Firestore Leaderboard
    const student = AppState.activeStudent || {
        name: "Student",
        rollNo: "STUDENT",
        branch: "CSE"
    };

    const entry = await leaderboardManager.saveEntry({
        userId: authManager.getActiveStudent()?.uid || student.uid,
        name: student.name,
        rollNo: student.rollNo,
        branch: student.branch,
        score: score,
        total: totalQuestions,
        percentage: percentage,
        timeTakenSeconds: timeSpentSeconds
    });

    const userRank = await leaderboardManager.getRankForEntry(entry?.id || student.uid || student.rollNo);

    // Populate Results Screen
    const resStudentName = document.getElementById('resultStudentName');
    if (resStudentName) resStudentName.textContent = student.name;

    const resScoreNum = document.getElementById('resScoreNum');
    if (resScoreNum) resScoreNum.textContent = score;

    const resScoreTotal = document.getElementById('resScoreTotal');
    if (resScoreTotal) resScoreTotal.textContent = `/ ${totalQuestions}`;

    const resPercentageText = document.getElementById('resPercentageText');
    if (resPercentageText) resPercentageText.textContent = `${percentage}% Overall Score`;

    const gradeBadge = document.getElementById('resGradeBadge');
    if (gradeBadge) {
        gradeBadge.textContent = grade;
        gradeBadge.className = `badge-grade ${gradeClass}`;
    }

    const circleProgress = document.getElementById('resultCircleProgress');
    if (circleProgress) {
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        circleProgress.style.strokeDasharray = `${circumference}`;
        const offset = circumference - (percentage / 100) * circumference;
        setTimeout(() => {
            circleProgress.style.strokeDashoffset = `${offset}`;
        }, 150);
    }

    renderComparisonCard(comparison, score, percentage);

    const statCorrect = document.getElementById('statCorrectCount');
    const statWrong = document.getElementById('statWrongCount');
    const statUnattempted = document.getElementById('statUnattemptedCount');
    const statAccuracy = document.getElementById('statAccuracyRate');
    const statTime = document.getElementById('statTimeTaken');
    const statRank = document.getElementById('statLeaderboardRank');

    if (statCorrect) statCorrect.textContent = correctCount;
    if (statWrong) statWrong.textContent = wrongCount;
    if (statUnattempted) statUnattempted.textContent = unattemptedCount;
    if (statAccuracy) statAccuracy.textContent = `${accuracy}%`;
    if (statTime) statTime.textContent = leaderboardManager.formatTime(timeSpentSeconds);
    if (statRank) statRank.textContent = `#${userRank}`;

    renderCategoryBars(categoryStats);
    renderPerformanceChart(categoryStats);

    AppState.currentCertData = {
        studentName: student.name,
        rollNo: student.rollNo,
        branch: student.branch,
        score: score,
        total: totalQuestions,
        percentage: percentage,
        grade: grade,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    showScreen('resultView');
}

function renderComparisonCard(comp, currentScore, currentPercentage) {
    const compBox = document.getElementById('scoreComparisonBox');
    if (!compBox) return;

    if (!comp.hasPrevious) {
        compBox.innerHTML = `
            <div class="comp-card first-attempt">
                <div class="comp-icon"><i class="fas fa-flag-checkered"></i></div>
                <div class="comp-info">
                    <h4>First Assessment Completed! 🎯</h4>
                    <p>Great job taking your initial test. Take another attempt anytime to track your score improvement and growth.</p>
                </div>
            </div>
        `;
    } else {
        const isImproved = comp.scoreDelta > 0;
        const isSame = comp.scoreDelta === 0;
        const deltaSign = isImproved ? '+' : '';
        const deltaClass = isImproved ? 'improved' : (isSame ? 'steady' : 'declined');

        let headline = `🎉 Score Improved by ${deltaSign}${comp.scoreDelta} marks (${deltaSign}${comp.percentageDelta}%)!`;
        let desc = `You improved your performance compared to Attempt #${comp.previousAttemptNumber} (${comp.previousScore}/20 on ${comp.previousDate}).`;

        if (isSame) {
            headline = `👍 Consistent Score (${currentScore}/20)`;
            desc = `You matched your score from Attempt #${comp.previousAttemptNumber}. Keep solving to push past your personal best!`;
        } else if (!isImproved) {
            headline = `💡 Performance Update (${deltaSign}${comp.scoreDelta} marks)`;
            desc = `Current: ${currentScore}/20 vs Previous: ${comp.previousScore}/20. Review step-by-step solutions below to sharpen weak topics!`;
        }

        compBox.innerHTML = `
            <div class="comp-card ${deltaClass}">
                <div class="comp-icon">
                    <i class="fas ${isImproved ? 'fa-arrow-trend-up' : (isSame ? 'fa-equals' : 'fa-arrow-trend-down')}"></i>
                </div>
                <div class="comp-info">
                    <div class="comp-header">
                        <h4>${headline}</h4>
                        <span class="comp-badge ${deltaClass}">Attempt #${comp.attemptNumber}</span>
                    </div>
                    <p>${desc}</p>
                    <div class="comp-metrics-strip">
                        <div><small>Previous Score:</small> <strong>${comp.previousScore}/20 (${comp.previousPercentage}%)</strong></div>
                        <div><small>Current Score:</small> <strong>${currentScore}/20 (${currentPercentage}%)</strong></div>
                        <div><small>Personal Best:</small> <strong>${comp.bestScore}/20</strong></div>
                        <div><small>Average Score:</small> <strong>${comp.avgScore}/20</strong></div>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderCategoryBars(categoryStats) {
    const quantStats = categoryStats["Quantitative Aptitude"] || { correct: 0, total: 7 };
    const logicStats = categoryStats["Logical Reasoning"] || { correct: 0, total: 7 };
    const verbalStats = categoryStats["Verbal Ability"] || { correct: 0, total: 6 };

    const qPct = Math.round((quantStats.correct / (quantStats.total || 1)) * 100);
    const lPct = Math.round((logicStats.correct / (logicStats.total || 1)) * 100);
    const vPct = Math.round((verbalStats.correct / (verbalStats.total || 1)) * 100);

    const quantScore = document.getElementById('catQuantScore');
    const logicScore = document.getElementById('catLogicScore');
    const verbalScore = document.getElementById('catVerbalScore');

    if (quantScore) quantScore.textContent = `${quantStats.correct}/${quantStats.total} (${qPct}%)`;
    if (logicScore) logicScore.textContent = `${logicStats.correct}/${logicStats.total} (${lPct}%)`;
    if (verbalScore) verbalScore.textContent = `${verbalStats.correct}/${verbalStats.total} (${vPct}%)`;

    setTimeout(() => {
        const qFill = document.getElementById('catQuantFill');
        const lFill = document.getElementById('catLogicFill');
        const vFill = document.getElementById('catVerbalFill');

        if (qFill) qFill.style.width = `${qPct}%`;
        if (lFill) lFill.style.width = `${lPct}%`;
        if (vFill) vFill.style.width = `${vPct}%`;
    }, 200);
}

function renderPerformanceChart(categoryStats) {
    const canvas = document.getElementById('performanceCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const quantStats = categoryStats["Quantitative Aptitude"] || { correct: 0, total: 7 };
    const logicStats = categoryStats["Logical Reasoning"] || { correct: 0, total: 7 };
    const verbalStats = categoryStats["Verbal Ability"] || { correct: 0, total: 6 };

    const scores = [
        quantStats.correct / (quantStats.total || 1),
        logicStats.correct / (logicStats.total || 1),
        verbalStats.correct / (verbalStats.total || 1)
    ];

    const labels = ["Quantitative", "Logical", "Verbal"];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = 75;

    const levels = [0.25, 0.5, 0.75, 1.0];
    levels.forEach(level => {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI / 3) - (Math.PI / 2);
            const x = centerX + Math.cos(angle) * maxRadius * level;
            const y = centerY + Math.sin(angle) * maxRadius * level;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI / 3) - (Math.PI / 2);
        const endX = centerX + Math.cos(angle) * maxRadius;
        const endY = centerY + Math.sin(angle) * maxRadius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.stroke();

        const labelX = centerX + Math.cos(angle) * (maxRadius + 22);
        const labelY = centerY + Math.sin(angle) * (maxRadius + 22);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${labels[i]} (${Math.round(scores[i] * 100)}%)`, labelX, labelY);
    }

    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI / 3) - (Math.PI / 2);
        const currentRadius = Math.max(scores[i] * maxRadius, 8);
        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.7)");
    gradient.addColorStop(1, "rgba(6, 182, 212, 0.35)");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI / 3) - (Math.PI / 2);
        const currentRadius = Math.max(scores[i] * maxRadius, 8);
        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;

        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

/* ==========================================================================
   CLEAR & VISUALLY EXPLICIT QUESTION REVIEW RENDERER
   ========================================================================== */
function openCurrentReviewModal() {
    soundManager.playClick();
    const container = document.getElementById('reviewModalList');
    if (!container) return;

    renderQuestionReviewList(container, AppState.questions, AppState.userAnswers);
    document.getElementById('reviewModal').classList.add('active');
}

/**
 * Reusable function to render detailed questions with explicit
 * "Your Answer" vs "Correct Answer" badges and colored cards.
 */
function renderQuestionReviewList(container, questions, userAnswers) {
    container.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    questions.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        const isCorrect = userAns === q.correct;
        const isUnattempted = userAns === undefined;

        let statusClass = 'correct';
        let statusText = 'Correct (+1)';
        let cardClass = 'is-correct';

        if (isUnattempted) {
            statusClass = 'unattempted';
            statusText = 'Unattempted (0)';
            cardClass = 'is-unattempted';
        } else if (!isCorrect) {
            statusClass = 'wrong';
            statusText = 'Incorrect (0)';
            cardClass = 'is-wrong';
        }

        // Prepare Selected vs Correct Text
        const userAnsText = isUnattempted 
            ? '<span style="color:#f59e0b; font-weight:700;"><i class="fas fa-minus-circle"></i> Not Attempted</span>'
            : (isCorrect 
                ? `<span style="color:#10b981; font-weight:700;"><i class="fas fa-check-circle"></i> Option ${letters[userAns]}: ${q.options[userAns]}</span>`
                : `<span style="color:#ef4444; font-weight:700;"><i class="fas fa-times-circle"></i> Option ${letters[userAns]}: ${q.options[userAns]}</span>`);

        const correctAnsText = `<span style="color:#10b981; font-weight:700;"><i class="fas fa-check-double"></i> Option ${letters[q.correct]}: ${q.options[q.correct]}</span>`;

        const reviewItem = document.createElement('div');
        reviewItem.className = `review-item ${cardClass}`;
        
        let optionsHtml = '';
        q.options.forEach((optText, optIdx) => {
            let optClass = 'neutral';
            let labelBadge = `<span class="opt-tag">Option ${letters[optIdx]}</span>`;

            if (optIdx === q.correct && optIdx === userAns) {
                optClass = 'correct-answer selected-answer';
                labelBadge = `<span class="opt-tag tag-success"><i class="fas fa-check"></i> Your Choice & Correct</span>`;
            } else if (optIdx === q.correct) {
                optClass = 'correct-answer';
                labelBadge = `<span class="opt-tag tag-success"><i class="fas fa-check"></i> Correct Answer</span>`;
            } else if (optIdx === userAns) {
                optClass = 'user-wrong';
                labelBadge = `<span class="opt-tag tag-danger"><i class="fas fa-times"></i> Your Choice</span>`;
            }

            optionsHtml += `
                <div class="review-opt-card ${optClass}">
                    <div class="opt-card-header">
                        <span class="opt-letter">${letters[optIdx]}</span>
                        ${labelBadge}
                    </div>
                    <div class="opt-card-text">${optText}</div>
                </div>
            `;
        });

        reviewItem.innerHTML = `
            <div class="review-meta">
                <span class="review-qnum">Question ${idx + 1} • <span class="category-tag">${q.category}</span></span>
                <span class="review-status-tag ${statusClass}">${statusText}</span>
            </div>
            
            <div class="review-qtext">${q.question}</div>

            <!-- Explicit Choice Strip -->
            <div class="choice-summary-strip">
                <div class="choice-box">
                    <small>Your Chosen Answer:</small>
                    <div>${userAnsText}</div>
                </div>
                <div class="choice-box">
                    <small>Correct Answer:</small>
                    <div>${correctAnsText}</div>
                </div>
            </div>

            <div class="review-options-grid">${optionsHtml}</div>

            <div class="review-explanation">
                <strong><i class="fas fa-lightbulb" style="color:#fbbf24;"></i> Step-by-Step Solution:</strong>
                <div style="margin-top:4px;">${q.explanation}</div>
            </div>
        `;

        container.appendChild(reviewItem);
    });
}

/* ==========================================================================
   LEADERBOARD MODAL
   ========================================================================== */
async function openLeaderboardModal() {
    soundManager.playClick();
    document.getElementById('leaderboardModal').classList.add('active');
    await renderLeaderboardTable();
}

async function renderLeaderboardTable() {
    const tableBody = document.getElementById('leaderboardTableBody');
    if (!tableBody) return;

    const searchTerm = (document.getElementById('leaderboardSearch')?.value || '').toLowerCase();
    const branchFilter = document.getElementById('leaderboardBranchFilter')?.value || 'ALL';

    const entries = await leaderboardManager.getAllEntries();
    tableBody.innerHTML = '';

    const filtered = entries.filter(entry => {
        const matchesSearch = entry.name.toLowerCase().includes(searchTerm) || 
                              entry.rollNo.toLowerCase().includes(searchTerm);
        const matchesBranch = branchFilter === 'ALL' || entry.branch === branchFilter;
        return matchesSearch && matchesBranch;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No leaderboard records found matching your filters.</td></tr>`;
        return;
    }

    filtered.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        const rank = idx + 1;

        let rankBadgeClass = 'rank-other';
        if (rank === 1) rankBadgeClass = 'rank-1';
        else if (rank === 2) rankBadgeClass = 'rank-2';
        else if (rank === 3) rankBadgeClass = 'rank-3';

        tr.innerHTML = `
            <td><span class="rank-badge ${rankBadgeClass}">${rank}</span></td>
            <td><strong>${entry.name}</strong></td>
            <td><code>${entry.rollNo}</code></td>
            <td><span class="badge" style="background:rgba(99,102,241,0.15); color:#818cf8; font-weight:600;">${entry.branch}</span></td>
            <td><strong style="color:#38bdf8;">${entry.score} / ${entry.total || 20}</strong></td>
            <td><span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981; font-weight:700;">${entry.percentage}%</span></td>
            <td style="font-size:0.85rem; color:var(--text-muted);">${leaderboardManager.formatTime(entry.timeTakenSeconds)}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function closeAllModals() {
    soundManager.playClick();
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

/* ==========================================================================
   CERTIFICATE VIEWER & SMART NAVIGATION
   ========================================================================== */
function renderCertificate(certData) {
    document.getElementById('certStudentName').textContent = certData.studentName;
    document.getElementById('certStudentMeta').textContent = `Roll No: ${certData.rollNo} • Department of ${certData.branch}`;
    document.getElementById('certScore').textContent = `${certData.score}/${certData.total || 20}`;
    document.getElementById('certPercentage').textContent = `${certData.percentage}%`;
    document.getElementById('certGrade').textContent = (certData.grade || 'Distinction').replace(/[^\w\s]/gi, '').trim();
    document.getElementById('certDate').textContent = certData.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update Back button text dynamically
    const backBtn = document.getElementById('certBackBtn');
    if (backBtn) {
        const origin = AppState.previousScreenBeforeCert || 'dashboardView';
        backBtn.innerHTML = origin === 'resultView'
            ? `<i class="fas fa-arrow-left"></i> Back to Test Results`
            : `<i class="fas fa-arrow-left"></i> Back to Dashboard`;
    }
}

function openCertificateForAttempt(student, attempt, originScreen = 'dashboardView') {
    soundManager.playClick();
    AppState.previousScreenBeforeCert = originScreen;
    const certData = {
        studentName: student.name,
        rollNo: student.rollNo,
        branch: student.branch,
        score: attempt.score,
        total: attempt.total || 20,
        percentage: attempt.percentage,
        grade: attempt.grade || 'Merit',
        date: attempt.date
    };
    renderCertificate(certData);
    showScreen('certificateView');
}

function resetAndRetake() {
    soundManager.playClick();
    prepareInstructionScreen();
    showScreen('instructionView');
}
