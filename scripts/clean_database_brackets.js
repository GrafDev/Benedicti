import { initializeApp } from "firebase/app";
import { getDatabase, ref, get as dbGet, update as dbUpdate, set as dbSet } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAlHgwCP6QdDWlhiMzFPvqiWvJiIkR8NgY",
  authDomain: "benodict.firebaseapp.com",
  databaseURL: "https://benodict-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "benodict",
  storageBucket: "benodict.firebasestorage.app",
  messagingSenderId: "598707951457",
  appId: "1:598707951457:web:ae9cc0ea7d60e04bead720"
};

const args = process.argv.slice(2);
const write = args.includes("--write");
const force = args.includes("--force");
const pathArg = args.find((arg) => arg.startsWith("--path="));
const wordsPath = pathArg ? pathArg.slice("--path=".length) : "shared/dictionaries/dict2500/words";
const markerKey = wordsPath.replace(/[^a-zA-Z0-9_-]/g, "_");
const markerPath = `maintenance/migrations/bracketCleanupV1/${markerKey}`;

const cleanBrackets = (text) => {
  if (typeof text !== "string") return text;
  return text.replace(/\[.*?\]/g, "").replace(/\s\s+/g, " ").trim();
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const wordsRef = ref(db, wordsPath);
const markerRef = ref(db, markerPath);

console.log(`Bracket cleanup target: ${wordsPath}`);
console.log(`Mode: ${write ? "write" : "dry-run"}`);

if (write && !force) {
  const markerSnapshot = await dbGet(markerRef);
  if (markerSnapshot.exists()) {
    console.log(`Migration marker already exists at ${markerPath}. Use --force to run again.`);
    process.exit(0);
  }
}

const snapshot = await dbGet(wordsRef);
if (!snapshot.exists()) {
  console.log("No words found at target path.");
  process.exit(0);
}

const updates = {};
let changedWords = 0;

for (const [wordId, wordData] of Object.entries(snapshot.val())) {
  if (!wordData || typeof wordData !== "object") continue;

  const cleanedOriginal = cleanBrackets(wordData.original);
  const cleanedTranslation = cleanBrackets(wordData.translation);

  if (cleanedOriginal !== wordData.original) {
    updates[`${wordId}/original`] = cleanedOriginal;
  }

  if (cleanedTranslation !== wordData.translation) {
    updates[`${wordId}/translation`] = cleanedTranslation;
  }

  if (cleanedOriginal !== wordData.original || cleanedTranslation !== wordData.translation) {
    changedWords++;
  }
}

console.log(`Words needing cleanup: ${changedWords}`);

if (!write) {
  console.log("Dry-run only. Re-run with --write to update Firebase.");
  process.exit(0);
}

if (changedWords > 0) {
  await dbUpdate(wordsRef, updates);
}

await dbSet(markerRef, {
  completedAt: new Date().toISOString(),
  targetPath: wordsPath,
  changedWords
});

console.log(`Bracket cleanup complete. Marker written to ${markerPath}.`);
