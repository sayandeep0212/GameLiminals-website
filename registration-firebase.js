// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyAe13QXrLdAG0g4Xd98FiaMeyoJCRYi5lM",
    authDomain: "gameliminals.firebaseapp.com",
    projectId: "gameliminals",
    storageBucket: "gameliminals.firebasestorage.app",
    messagingSenderId: "262478638152",
    appId: "1:262478638152:web:fd01af842dc2fbaa70fc7d"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= FORM =================
const form = document.getElementById("studentRegistrationForm");
const submitBtn = document.getElementById("submitBtn");

// ================= APPLICATION ID =================
function generateApplicationId() {
    return `GL-${Date.now().toString().slice(-6)}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
}

// ================= DUPLICATE CHECK =================
async function checkDuplicate(field, value, message) {
    const q = query(
        collection(db, "students"),
        where(field, "==", value),
        limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
        throw new Error(message);
    }
}

// ================= SUBMIT =================
form.addEventListener("submit", async(e) => {
    e.preventDefault();

    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    const data = {
        fullName: form.fullName.value.trim(),
        collegeName: form.collegeName.value.trim(),
        registrationNo: form.registrationNo.value.trim(),
        rollNo: form.rollNo.value.trim(),
        department: form.department.value.trim(),
        semester: form.semester.value,
        email: form.email.value.trim().toLowerCase(),
        phone: form.phone.value.trim(),
        whyJoin: form.whyJoin.value.trim(),
        remarks: form.remarks.value.trim(),
        applicationId: generateApplicationId(),
        status: "pending",
        createdAt: serverTimestamp()
    };

    try {
        // ===== UNIQUE CHECKS =====
        await checkDuplicate("email", data.email, "Email already registered!");
        await checkDuplicate("phone", data.phone, "Phone number already registered!");
        await checkDuplicate("rollNo", data.rollNo, "Roll number already registered!");
        await checkDuplicate("registrationNo", data.registrationNo, "Registration number already registered!");

        // ===== SAVE DATA =====
        await addDoc(collection(db, "students"), data);

        // ===== SUCCESS =====
        showSuccessPopup(data.applicationId);

        form.reset();
        form.collegeName.value = "Adamas University";

    } catch (err) {
        showError(err.message || "Something went wrong!");
        console.error(err);
    } finally {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
    }
});