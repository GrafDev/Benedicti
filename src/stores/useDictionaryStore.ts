import { create } from 'zustand';
import {
    ref,
    get as dbGet,
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
    fetchSharedWords: (userId?: string) => Promise<void>;
    importDefaultDictionary: (jsonData: any) => Promise<void>;
    publishDictionary: (userId: string, dictionaryId: string) => Promise<void>;
    unpublishDictionary: (userId: string, dictionaryId: string) => Promise<void>;
    fetchSharedDictionaries: () => Promise<Dictionary[]>;
    cleanText: (text: string) => string;
}

export const useDictionaryStore = create<DictionaryState>((set, get) => ({
    dictionaries: [],
    words: [],
    loading: false,
    error: null,
 
    cleanText: (text: string) => {
        if (!text) return '';
        // 1. Remove brackets [...] and (...)
        let cleaned = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
        // 2. Take only first translation before ;
        return cleaned.split(';')[0].trim().replace(/\s\s+/g, ' ');
    },

    // ─── Dictionaries ────────────────────────────────────────────────────────────

    fetchDictionaries: async (userId: string) => {
        set(state => ({ ...state, loading: true, error: null }));
        try {
            const snapshot = await dbGet(ref(db, `users/${userId}/dictionaries`));
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
            
            // 2. Fetch Shared Dictionaries
            const sharedDicts = await get().fetchSharedDictionaries();
            
            // 3. Merge and set
            set(state => ({ 
                ...state, 
                dictionaries: [...dicts, ...sharedDicts], 
                loading: false, 
                error: null 
            }));
        } catch (error: any) {
            console.error('fetchDictionaries error:', error);
            set(state => ({ ...state, error: error.message, loading: false, dictionaries: [] }));
        }
    },

    fetchSharedDictionaries: async () => {
        try {
            const snapshot = await dbGet(ref(db, 'shared/dictionaries'));
            const sharedDicts: Dictionary[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const data = child.val().info;
                    if (data && data.name) {
                        sharedDicts.push({
                            id: child.key!,
                            userId: data.publishedBy || 'admin',
                            name: data.name,
                            sourceLang: data.sourceLang,
                            targetLang: data.targetLang,
                            wordCount: data.wordCount || 0,
                            createdAt: data.createdAt || Date.now(),
                            isShared: true
                        });
                    }
                });
            }
            return sharedDicts;
        } catch (error) {
            console.error('fetchSharedDictionaries error:', error);
            return [];
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
            const dict = get().dictionaries.find(d => d.id === dictionaryId);
            
            let path = `users/${userId}/dictionaries/${dictionaryId}/words`;
            if (dict?.isShared) {
                path = `shared/dictionaries/${dictionaryId}/words`;
            }

            const snapshot = await dbGet(ref(db, path));
            const words_list: Word[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const data = child.val();
                    words_list.push({
                        id: child.key!,
                        dictionaryId,
                        original: get().cleanText(data.original),
                        translation: get().cleanText(data.translation),
                        box: data.box || 0,
                        nextReview: data.nextReview || Date.now(),
                        isLearned: data.isLearned || false,
                        createdAt: data.createdAt || Date.now(),
                    });
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
            const dict = get().dictionaries.find(d => d.id === dictionaryId);
            
            let path = `users/${userId}/dictionaries/${dictionaryId}/words`;
            let dictPath = `users/${userId}/dictionaries/${dictionaryId}`;
            
            if (dict?.isShared) {
                path = `shared/dictionaries/${dictionaryId}/words`;
                dictPath = `shared/dictionaries/${dictionaryId}/info`;
            }

            const newWordRef = push(ref(db, path));
            const data = {
                original,
                translation,
                box: 0,
                nextReview: Date.now(),
                createdAt: Date.now(),
            };
            await dbSet(newWordRef, data);
            await update(ref(db, dictPath), {
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
            const dict = get().dictionaries.find(d => d.id === dictionaryId);
            
            let path = `users/${userId}/dictionaries/${dictionaryId}/words/${wordId}`;
            if (dict?.isShared) {
                path = `shared/dictionaries/${dictionaryId}/words/${wordId}`;
            }

            await update(ref(db, path), data);
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
            const dict = get().dictionaries.find(d => d.id === dictionaryId);
            
            let path = `users/${userId}/dictionaries/${dictionaryId}/words/${wordId}`;
            let dictPath = `users/${userId}/dictionaries/${dictionaryId}`;
            
            if (dict?.isShared) {
                path = `shared/dictionaries/${dictionaryId}/words/${wordId}`;
                dictPath = `shared/dictionaries/${dictionaryId}/info`;
            }

            await remove(ref(db, path));
            await update(ref(db, dictPath), {
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
            const snapshot = await dbGet(ref(db, 'shared/dictionaries/dict2500/info'));
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
                const learnedSnapshot = await dbGet(ref(db, `users/${userId}/learnedSharedWords`));
                if (learnedSnapshot.exists()) {
                    learnedIds = learnedSnapshot.val();
                }
            }

            console.log('📡 Fetching shared words from shared/dictionaries/dict2500/words...');
            const snapshot = await dbGet(ref(db, 'shared/dictionaries/dict2500/words'));
            const words_list: Word[] = [];
            
            if (snapshot.exists()) {
                console.log('✅ Snapshot exists, items found:', snapshot.size);
                const clean = (text: string) => {
                    if (!text) return '';
                    // 1. Remove brackets [...] and (...)
                    let cleaned = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
                    // 2. Take only the first part before the first semicolon
                    return cleaned.split(';')[0].trim();
                };

                snapshot.forEach((child) => {
                    // Skip if marked as learned by THIS user
                    if (learnedIds[child.key!]) return;

                    const data = child.val();
                    words_list.push({
                        id: child.key!,
                        dictionaryId: 'default', // Special ID
                        original: clean(data.original),
                        translation: clean(data.translation),
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

    importDefaultDictionary: async (_jsonData: any) => {
        // ... (existing import logic) ...
    },

    ensureLearnedDictionaryExists: async (userId: string) => {
        try {
            const dictsSnapshot = await dbGet(ref(db, `users/${userId}/dictionaries`));
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
            const dictsSnapshot = await dbGet(ref(db, `users/${userId}/dictionaries`));
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
    },

    publishDictionary: async (userId: string, dictionaryId: string) => {
        set(state => ({ ...state, loading: true, error: null }));
        try {
            // 1. Get dictionary info
            const dictRef = ref(db, `users/${userId}/dictionaries/${dictionaryId}`);
            const dictSnapshot = await dbGet(dictRef);
            if (!dictSnapshot.exists()) throw new Error('Словарь не найден');
            
            const dictData = dictSnapshot.val();
            const wordsSnapshot = await dbGet(ref(db, `users/${userId}/dictionaries/${dictionaryId}/words`));
            
            // 2. Prepare for shared storage (use a descriptive ID if possible, or keep the old one)
            const sharedPath = `shared/dictionaries/${dictionaryId}`;
            
            // 3. Set info and words to shared node
            await dbSet(ref(db, `${sharedPath}/info`), {
                name: dictData.name,
                sourceLang: dictData.sourceLang,
                targetLang: dictData.targetLang,
                wordCount: dictData.wordCount || 0,
                createdAt: Date.now(),
                publishedBy: userId
            });

            if (wordsSnapshot.exists()) {
                await dbSet(ref(db, `${sharedPath}/words`), wordsSnapshot.val());
            }

            // 4. Delete the original personal dictionary
            await remove(dictRef);

            // 5. Update local state
            set(state => ({
                ...state,
                dictionaries: state.dictionaries.filter(d => d.id !== dictionaryId),
                loading: false
            }));
            
            console.log(`✅ Dictionary ${dictData.name} published and removed from personal.`);
        } catch (error: any) {
            console.error('publishDictionary error:', error);
            set(state => ({ ...state, error: error.message, loading: false }));
            throw error;
        }
    },

    unpublishDictionary: async (userId: string, dictionaryId: string) => {
        set(state => ({ ...state, loading: true, error: null }));
        try {
            // 1. Get shared info
            const sharedRef = ref(db, `shared/dictionaries/${dictionaryId}`);
            const sharedSnapshot = await dbGet(sharedRef);
            if (!sharedSnapshot.exists()) throw new Error('Общий словарь не найден');
            
            const sharedData = sharedSnapshot.val();
            const info = sharedData.info;
            const words = sharedData.words;

            // 2. Map back to personal
            const personalRef = ref(db, `users/${userId}/dictionaries/${dictionaryId}`);
            await dbSet(personalRef, {
                name: info.name,
                sourceLang: info.sourceLang,
                targetLang: info.targetLang,
                wordCount: info.wordCount || 0,
                createdAt: info.createdAt || Date.now()
            });

            if (words) {
                await dbSet(ref(db, `users/${userId}/dictionaries/${dictionaryId}/words`), words);
            }

            // 3. Remove from shared
            await remove(sharedRef);

            // 4. Update local state
            set(state => ({
                ...state,
                dictionaries: state.dictionaries.map(d => 
                    d.id === dictionaryId ? { ...d, isShared: false, userId } : d
                ),
                loading: false
            }));
            
            console.log(`✅ Dictionary ${info.name} unpublished and moved to personal.`);
        } catch (error: any) {
            console.error('unpublishDictionary error:', error);
            set(state => ({ ...state, error: error.message, loading: false }));
            throw error;
        }
    }
}));
