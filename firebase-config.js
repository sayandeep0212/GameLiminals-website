// firebase-config.js
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAe13QXrLdAG0g4Xd98FiaMeyoJCRYi5lM",
    authDomain: "gameliminals.firebaseapp.com",
    projectId: "gameliminals",
    storageBucket: "gameliminals.firebasestorage.app",
    messagingSenderId: "262478638152",
    appId: "1:262478638152:web:fd01af842dc2fbaa70fc7d",
    measurementId: "G-6HSEQ5RZ6P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();