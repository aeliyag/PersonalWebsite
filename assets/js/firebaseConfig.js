import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCerPf4L4NpIByhLadOHa0Nu1A_Rf7gmjU',
  authDomain: 'personal-website-6ce29.firebaseapp.com',
  projectId: 'personal-website-6ce29',
  storageBucket: 'personal-website-6ce29.firebasestorage.app',
  messagingSenderId: '187433654893',
  appId: '1:187433654893:web:1282260123e9926fcabd64',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
