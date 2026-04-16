import { create } from 'zustand';
import {
    ref,
    get,
    set as dbSet,
    push,
    remove,
    update,
    increment,
} from 'firebase/database';
import { db } from '../firebase';
import type { Dictionary, Word } from '../types';

/**
 * Store using Firebase Realtime Database.
 * Explicitly merging state in all set calls to prevent functions from disappearing.
 */

interface DictionaryState {
    dictionaries: Dictionary[];
    words: Word[];
    loading: boolean;
    error: string | null;

    // Dictionary operations
    fetchDictionaries: (userId: string) => Promise<void>;
    addDictionary: (userId: string, name: string, sourceLang: string, targetLang: string) => Promise<void>;
    deleteDictionary: (userId: string, dictionaryId: string) => Promise<void>;

    // Word operations
    fetchWords: (userId: string, dictionaryId: string) => Promise<void>;
    addWord: (userId: string, dictionaryId: string, original: string, translation: string) => Promise<void>;
    updateWord: (userId: string, dictionaryId: string, wordId: string, data: Partial<Pick<Word, 'original' | 'translation'>>) => Promise<void>;
    deleteWord: (userId: string, dictionaryId: string, wordId: string) => Promise<void>;
    markWordAsLearned: (userId: string, word: Word) => Promise<void>;
    ensureLearnedDictionaryExists: (userId: string) => Promise<void>;

    // Shared dictionary operations
    fetchDefaultDictionary: () => Promise<void>;
    fetchSharedWords: () => Promise<void>;
    importDefaultDictionary: (jsonData: any) => Promise<void>;
}

export const useDictionaryStore = create<DictionaryState>((set) => ({
    dictionaries: [],
    words: [],
    loading: false,
    error: null,

    // ─── Dictionaries ────────────────────────────────────────────────────────────

    fetchDictionaries: async (userId: string) => {
        set(state => ({ ...state, loading: true, error: null }));
        try {
            const snapshot = await get(ref(db, `users/${userId}/dictionaries`));
            const dicts: Dictionary[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const data = child.val();
                    if (typeof data === 'object' && data !== null && data.name) {
                        dicts.push({
                            id: child.key!,
                            userId,
                            name: data.name,
                            sourceLang: data.sourceLang,
                            targetLang: data.targetLang,
                            wordCount: data.wordCount || 0,
                            createdAt: data.createdAt || Date.now(),
                        });
                    }
                });
            }
            set(state => ({ ...state, dictionaries: dicts, loading: false, error: null }));
        } catch (error: any) {
            console.error('fetchDictionaries error:', error);
            set(state => ({ ...state, error: error.message, loading: false, dictionaries: [] }));
        }
    },

    addDictionary: async (userId, name, sourceLang, targetLang) => {
        set(state => ({ ...state, loading: true, error: null }));
        try {
            const newDictRef = push(ref(db, `users/${userId}/dictionaries`));
            const data = {
                name,
                sourceLang,
                targetLang,
                wordCount: 0,
                createdAt: Date.now(),
            };
            await dbSet(newDictRef, data);
            const newDict: Dictionary = {
                ...data,
                id: newDictRef.key!,
                userId,
            };
            set(state => ({
                ...state,
                dictionaries: [...(state.dictionaries || []), newDict],
                loading: false,
                error: null
            }));
        } catch (error: any) {
            console.error('addDictionary error:', error);
            set(state => ({ ...state, error: error.message, loading: false }));
        }
    },

    deleteDictionary: async (userId, dictionaryId) => {
        try {
            await remove(ref(db, `users/${userId}/dictionaries/${dictionaryId}`));
            set(state => ({
                ...state,
                dictionaries: (state.dictionaries || []).filter((d) => d.id !== dictionaryId),
                words: [],
                error: null
            }));
        } catch (error: any) {
            console.error('deleteDictionary error:', error);
            set(state => ({ ...state, error: error.message }));
        }
    },

    // ─── Words ───────────────────────────────────────────────────────────────────

    fetchWords: async (userId, dictionaryId) => {
        set(state => ({ ...state, loading: true, error: null, words: [] }));
        try {
            const snapshot = await get(ref(db, `users/${userId}/dictionaries/${dictionaryId}/words`));
            const words_list: Word[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const data = child.val();
                    // Filter out learned words during fetch
                    if (!data.isLearned) {
                        words_list.push({
                            id: child.key!,
                            dictionaryId,
                            original: data.original,
                            translation: data.translation,
                            box: data.box || 0,
                            nextReview: data.nextReview || Date.now(),
                            isLearned: data.isLearned || false,
                            createdAt: data.createdAt || Date.now(),
                        });
                    }
                });
            }
            set(state => ({ ...state, words: words_list, loading: false, error: null }));
        } catch (error: any) {
            console.error('fetchWords error:', error);
            set(state => ({ ...state, error: error.message, loading: false, words: [] }));
        }
    },

    addWord: async (userId, dictionaryId, original, translation) => {
        try {
            const newWordRef = push(ref(db, `users/${userId}/dictionaries/${dictionaryId}/words`));
            const data = {
                original,
                translation,
                box: 0,
                nextReview: Date.now(),
                createdAt: Date.now(),
            };
            await dbSet(newWordRef, data);
            await update(ref(db, `users/${userId}/dictionaries/${dictionaryId}`), {
                wordCount: increment(1),
            });
            const newWord: Word = {
                ...data,
                id: newWordRef.key!,
                dictionaryId,
            };
            set(state => ({
                ...state,
                words: [...(state.words || []), newWord],
                dictionaries: (state.dictionaries || []).map((d) =>
                    d.id === dictionaryId ? { ...d, wordCount: (d.wordCount || 0) + 1 } : d
                ),
                error: null
            }));
        } catch (error: any) {
            console.error('addWord error:', error);
            set(state => ({ ...state, error: error.message }));
        }
    },

    updateWord: async (userId, dictionaryId, wordId, data) => {
        try {
            await update(
                ref(db, `users/${userId}/dictionaries/${dictionaryId}/words/${wordId}`),
                data
            );
            set(state => ({
                ...state,
                words: (state.words || []).map((w) => (w.id === wordId ? { ...w, ...data } : w)),
                error: null
            }));
        } catch (error: any) {
            console.error('updateWord error:', error);
            set(state => ({ ...state, error: error.message }));
        }
    },

    deleteWord: async (userId, dictionaryId, wordId) => {
        try {
            await remove(ref(db, `users/${userId}/dictionaries/${dictionaryId}/words/${wordId}`));
            await update(ref(db, `users/${userId}/dictionaries/${dictionaryId}`), {
                wordCount: increment(-1),
            });
            set(state => ({
                ...state,
                words: (state.words || []).filter((w) => w.id !== wordId),
                dictionaries: (state.dictionaries || []).map((d) =>
                    d.id === dictionaryId
                        ? { ...d, wordCount: Math.max(0, (d.wordCount || 0) - 1) }
                        : d
                ),
                error: null
            }));
        } catch (error: any) {
            console.error('deleteWord error:', error);
            set(state => ({ ...state, error: error.message }));
        }
    },
    // ─── Shared Dictionaries ──────────────────────────────────────────────────

    fetchDefaultDictionary: async () => {
        try {
            const snapshot = await get(ref(db, 'shared/dictionaries/dict2500/info'));
            if (snapshot.exists()) {
                // We keep it separate from the user's dictionaries array
                // to avoid showing it in the main list.
            }
        } catch (error: any) {
            console.error('fetchDefaultDictionary error:', error);
        }
    },

    fetchSharedWords: async (userId?: string) => {
        set(state => ({ ...state, loading: true, error: null, words: [] }));
        try {
            // 1. Fetch user's learned shared words list first to filter them
            let learnedIds: Record<string, boolean> = {};
            if (userId) {
                const learnedSnapshot = await get(ref(db, `users/${userId}/learnedSharedWords`));
                if (learnedSnapshot.exists()) {
                    learnedIds = learnedSnapshot.val();
                }
            }

            console.log('📡 Fetching shared words from shared/dictionaries/dict2500/words...');
            const snapshot = await get(ref(db, 'shared/dictionaries/dict2500/words'));
            const words_list: Word[] = [];
            
            if (snapshot.exists()) {
                console.log('✅ Snapshot exists, items found:', snapshot.size);
                snapshot.forEach((child) => {
                    // Skip if marked as learned by THIS user
                    if (learnedIds[child.key!]) return;

                    const data = child.val();
                    words_list.push({
                        id: child.key!,
                        dictionaryId: 'default', // Special ID
                        original: data.original,
                        translation: data.translation,
                        box: 0,
                        nextReview: Date.now(),
                        createdAt: Date.now(),
                    });
                });
            } else {
                console.warn('⚠️ No data found at shared/dictionaries/dict2500/words');
            }
            set(state => ({ ...state, words: words_list, loading: false, error: null }));
        } catch (error: any) {
            console.error('❌ fetchSharedWords error:', error);
            set(state => ({ ...state, error: error.message, loading: false, words: [] }));
        }
    },

    importDefaultDictionary: async (jsonData: any) => {
        // ... (existing import logic) ...
    },

    ensureLearnedDictionaryExists: async (userId: string) => {
        try {
            const dictsSnapshot = await get(ref(db, `users/${userId}/dictionaries`));
            let found = false;
            
            if (dictsSnapshot.exists()) {
                dictsSnapshot.forEach((child) => {
                    if (child.val().id === 'learned_dict' || child.val().name === 'Выученные слова') {
                        found = true;
                    }
                });
            }

            if (!found) {
                const newDictRef = push(ref(db, `users/${userId}/dictionaries`));
                const newDict: Dictionary = {
                    id: 'learned_dict',
                    userId,
                    name: 'Выученные слова',
                    sourceLang: 'en',
                    targetLang: 'ru',
                    wordCount: 0,
                    createdAt: Date.now(),
                };
                await dbSet(newDictRef, newDict);
                console.log('✅ Created default "Learned Words" dictionary');
            }
        } catch (error) {
            console.error('ensureLearnedDictionaryExists error:', error);
        }
    },

    markWordAsLearned: async (userId: string, word: Word) => {
        try {
            // 1. Ensure "Learned Words" dictionary exists or find it
            const dictsSnapshot = await get(ref(db, `users/${userId}/dictionaries`));
            let learnedDictId = '';
            
            if (dictsSnapshot.exists()) {
                dictsSnapshot.forEach((child) => {
                    if (child.val().id === 'learned_dict' || child.val().name === 'Выученные слова') {
                        learnedDictId = child.key!;
                    }
                });
            }

            if (!learnedDictId) {
                // Create it
                const newDictRef = push(ref(db, `users/${userId}/dictionaries`));
                learnedDictId = newDictRef.key!;
                const newDict: Dictionary = {
                    id: 'learned_dict',
                    userId,
                    name: 'Выученные слова',
                    sourceLang: 'en',
                    targetLang: 'ru',
                    wordCount: 0,
                    createdAt: Date.now(),
                };
                await dbSet(newDictRef, newDict);
            }

            // 2. Add word to the learned dictionary
            const learnedWordRef = push(ref(db, `users/${userId}/dictionaries/${learnedDictId}/words`));
            const learnedWord = {
                ...word,
                dictionaryId: 'learned_dict',
                isLearned: true,
            };
            await dbSet(learnedWordRef, learnedWord);
            
            // Increment word count for learned dict
            await update(ref(db, `users/${userId}/dictionaries/${learnedDictId}`), {
                wordCount: increment(1)
            });

            // 3. Handle source tracking
            if (word.dictionaryId === 'default') {
                // Mark in shared list for user
                await dbSet(ref(db, `users/${userId}/learnedSharedWords/${word.id}`), true);
            } else {
                // Mark in the original personal dictionary
                // We need to find the word in the original dictionary and mark it
                // Note: word.id might be the key already
                await update(ref(db, `users/${userId}/dictionaries/${word.dictionaryId}/words/${word.id}`), {
                    isLearned: true
                });
            }

            // 4. Update local state to remove word from current game
            set(state => ({
                ...state,
                words: state.words.filter(w => w.id !== word.id)
            }));

        } catch (error: any) {
            console.error('markWordAsLearned error:', error);
            set(state => ({ ...state, error: error.message }));
        }
    }
}));
