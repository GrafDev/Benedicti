import { initializeApp } from "firebase/app";
import { getDatabase, ref, set as dbSet } from "firebase/database";
import fs from "fs";

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
const db = getDatabase(app);

const dictData = JSON.parse(fs.readFileSync("./dict2500.json", "utf8"));
const results = dictData.results;

const processedWords = {};

results.forEach((item, index) => {
    const word = item.word;
    const meansObj = item.means;
    
    // Собираем перевод из всех непустых полей means
    const translations = [];
    Object.entries(meansObj).forEach(([part, text]) => {
        if (text && text.trim()) {
            translations.push(`[${part}] ${text}`);
        }
    });
    
    const translationString = translations.join("; ");
    
    processedWords[`word_${index}`] = {
        original: word,
        translation: translationString,
        transcription: item.transcription || "",
        popularity: item.popular || 0,
        number: item.number || 0
    };
});

const uploadData = {
    info: {
        name: "English 2500 (Default)",
        sourceLang: "en",
        targetLang: "ru",
        wordCount: results.length,
        createdAt: Date.now()
    },
    words: processedWords
};

console.log(`Prepared ${results.length} words. Starting upload to shared/dictionaries/dict2500...`);

dbSet(ref(db, "shared/dictionaries/dict2500"), uploadData)
    .then(() => {
        console.log("Upload successful!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Upload failed:", error);
        process.exit(1);
    });
