// /js/emailList.js
import { db } from "./firebaseConfig.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("email-form");
  const status = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;

    try {
      await addDoc(collection(db, "emails"), {
        email: email,
        timestamp: new Date()
      });
      status.textContent = "✅ Thanks for subscribing!";
      form.reset();
    } catch (err) {
      console.error("Error adding email:", err);
      status.textContent = "❌ Something went wrong. Try again.";
    }
  });
});
