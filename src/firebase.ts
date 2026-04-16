import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAlHgwCP6QdDWlhiMzFPvqiWvJiIkR8NgY",
  authDomain: "benodict.firebaseapp.com",
  databaseURL: "https://benodict-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "benodict",
  storageBucket: "benodict.firebasestorage.app",
  messagingSenderId: "598707951457",
  appId: "1:598707951457:web:ae9cc0ea7d60e04bead720"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// ✅ Using Realtime Database (databaseURL already configured)
export const db = getDatabase(app);
export const storage = getStorage(app);

// Analytics — safe init (may fail with adblockers)
try {
  getAnalytics(app);
} catch (e) {
  console.warn('Analytics not available:', e);
}
