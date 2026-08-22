import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCz0ReOo88Q1-qjByJ5Snns5PC157mSZBU",
    authDomain: "aptitude-software-test.firebaseapp.com",
    projectId: "aptitude-software-test",
    storageBucket: "aptitude-software-test.firebasestorage.app",
    messagingSenderId: "313035066772",
    appId: "1:313035066772:web:83a4467f6ae2420cf85381",
    measurementId: "G-6Y46BRTCRC"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);