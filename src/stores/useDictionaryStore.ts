import { create } from 'zustand';
import {
    collection,
    addDoc,
    getDocs,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Dictionary } from '../types';

interface DictionaryState {
    dictionaries: Dictionary[];
    loading: boolean;
    error: string | null;
    fetchDictionaries: (userId: string) => Promise<void>;
    addDictionary: (userId: string, name: string, sourceLang: string, targetLang: string) => Promise<void>;
}

export const useDictionaryStore = create<DictionaryState>((set) => ({
    dictionaries: [],
    loading: false,
    error: null,

    fetchDictionaries: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const q = query(collection(db, 'users', userId, 'dictionaries'));
            const querySnapshot = await getDocs(q);
            const dicts: Dictionary[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                dicts.push({
                    id: doc.id,
                    userId,
                    name: data.name,
                    sourceLang: data.sourceLang,
                    targetLang: data.targetLang,
                    wordCount: data.wordCount || 0,
                    createdAt: data.createdAt?.toMillis() || Date.now(),
                });
            });
            set({ dictionaries: dicts, loading: false });
        } catch (error: any) {
            console.error("Error fetching dictionaries:", error);
            set({ error: error.message, loading: false });
        }
    },

    addDictionary: async (userId: string, name: string, sourceLang: string, targetLang: string) => {
        set({ loading: true, error: null });
        try {
            const docRef = await addDoc(collection(db, 'users', userId, 'dictionaries'), {
                name,
                sourceLang,
                targetLang,
                wordCount: 0,
                createdAt: serverTimestamp(),
            });

            const newDict: Dictionary = {
                id: docRef.id,
                userId,
                name,
                sourceLang,
                targetLang,
                wordCount: 0,
                createdAt: Date.now(),
            };

            set((state) => ({
                dictionaries: [...state.dictionaries, newDict],
                loading: false
            }));
        } catch (error: any) {
            console.error("Error adding dictionary:", error);
            set({ error: error.message, loading: false });
        }
    },
}));
