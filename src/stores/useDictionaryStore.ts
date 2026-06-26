import { create } from 'zustand';
import { defaultWords } from '../data/defaultWords';
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
 * Helper to remove square brackets [...] and collapse multiple spaces.
 */
const cleanBrackets = (text: string): string => {
    if (!text) return '';
    return text.replace(/\[.*?\]/g, '').replace(/\s\s+/g, ' ').trim();
};

const KNOWN_LEARNED_DICTIONARY_NAMES = new Set([
    'выученные слова',
    'learned words',
    'learned dictionary',
]);

const isLearnedDictionaryReference = (dictionaryKey: string, data: { id?: unknown; name?: unknown }): boolean => {
    const stableId = typeof data.id === 'string' ? data.id : dictionaryKey;
    const normalizedName = typeof data.name === 'string' ? data.name.trim().toLowerCase() : '';

    return dictionaryKey === 'learned_dict'
        || stableId === 'learned_dict'
        || KNOWN_LEARNED_DICTIONARY_NAMES.has(normalizedName);
};

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
    fetchDictionaries: (userId?: string) => Promise<void>;
    addDictionary: (userId: string, name: string, sourceLang: string, targetLang: string) => Promise<void>;
    deleteDictionary: (userId: string, dictionaryId: string) => Promise<void>;

    // Word operations
    fetchWords: (userId: string | undefined, dictionaryId: string) => Promise<void>;
    addWord: (userId: string, dictionaryId: string, original: string, translation: string) => Promise<void>;
    updateWord: (userId: string, dictionaryId: string, wordId: string, data: Partial<Pick<Word, 'original' | 'translation'>>) => Promise<void>;
    deleteWord: (userId: string, dictionaryId: string, wordId: string) => Promise<void>;
    markWordAsLearned: (userId: string, word: Word) => Promise<void>;
    answerWordLeitner: (userId: string, word: Word, isCorrect: boolean) => Promise<void>;
    ensureLearnedDictionaryExists: (userId: string) => Promise<void>;

    // Shared dictionary operations
    fetchDefaultDictionary: () => Promise<void>;
    fetchSharedWords: (userId?: string) => Promise<void>;
    importDefaultDictionary: (jsonData: any) => Promise<void>;
    publishDictionary: (userId: string, dictionaryId: string) => Promise<void>;
    unpublishDictionary: (userId: string, dictionaryId: string) => Promise<void>;
    fetchSharedDictionaries: () => Promise<Dictionary[]>;
    cleanText: (text: string) => string;

    // Profile & Relationship operations
    userProfile: { isTeacher: boolean, students: string[], teachers: string[], beneId?: string } | null;
    beneIdMap: Record<string, string>;
    fetchProfile: (userId: string) => Promise<void>;
    toggleTeacherRole: (userId: string, isTeacher: boolean) => Promise<void>;
    generateBeneId: (userId: string, name: string) => Promise<string>;
    resolveBeneIds: (uids: string[]) => Promise<void>;
    addStudent: (teacherId: string, studentIdOrBeneId: string) => Promise<void>;
    removeStudent: (teacherId: string, studentId: string) => Promise<void>;
    addTeacher: (studentId: string, teacherIdOrBeneId: string) => Promise<void>;
    removeTeacher: (studentId: string, teacherId: string) => Promise<void>;
}

export const useDictionaryStore = create<DictionaryState>((set, get) => ({
    dictionaries: [
        {
            id: 'default',
            userId: 'admin',
            name: 'Дефолтный словарь',
            sourceLang: 'en',
            targetLang: 'ru',
            wordCount: 250,
            createdAt: Date.now(),
            isShared: true
        }
    ],
    words: defaultWords, // Initialize with embedded words
    loading: false,
    error: null,
    userProfile: null,
    beneIdMap: {},

    cleanText: (text: string) => {
        if (!text) return '';
        // 1. Remove brackets [...] and (...)
        let cleaned = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
        // 2. Take only first translation before ;
        return cleaned.split(';')[0].trim().replace(/\s\s+/g, ' ');
    },

    // ─── Dictionaries ────────────────────────────────────────────────────────────

    fetchDictionaries: async (userId?: string) => {
        const virtualDefault: Dictionary = {
            id: 'default',
            userId: 'admin',
            name: 'Дефолтный словарь',
            sourceLang: 'en',
            targetLang: 'ru',
            wordCount: 250,
            createdAt: Date.now(),
            isShared: true
        };

        if (!userId) {
            set(state => ({
                ...state,
                dictionaries: [virtualDefault],
                loading: false,
                error: null
            }));
            return;
        }

        set(state => ({ ...state, loading: true, error: null }));
        try {
            let dicts: Dictionary[] = [];

            // 1. Fetch Personal Dictionaries (only if logged in)
            if (userId) {
                try {
                    const snapshot = await dbGet(ref(db, `users/${userId}/dictionaries`));
                    if (snapshot.exists()) {
                        snapshot.forEach((child) => {
                            const data = child.val();
                            if (typeof data === 'object' && data !== null && data.name) {
                                dicts.push({
                                    id: child.key!,
                                    userId: userId as string,
                                    name: data.name,
                                    sourceLang: data.sourceLang,
                                    targetLang: data.targetLang,
                                    wordCount: data.wordCount || 0,
                                    createdAt: data.createdAt || Date.now(),
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Could not fetch personal dictionaries:', e);
                }
            }

            // 2. Fetch Shared Dictionaries (Public)
            const sharedDicts = await get().fetchSharedDictionaries();

            // 3. Fetch Teachers' Dictionaries (only if logged in)
            const teacherDicts: Dictionary[] = [];

            if (userId) {
                // Ensure profile is loaded first
                let profile = get().userProfile;
                if (!profile) {
                    await get().fetchProfile(userId);
                    profile = get().userProfile;
                }

                if (profile && profile.teachers && profile.teachers.length > 0) {
                    for (const teacherId of profile.teachers) {
                        try {
                            const teacherSnapshot = await dbGet(ref(db, `users/${teacherId}/dictionaries`));
                            if (teacherSnapshot.exists()) {
                                teacherSnapshot.forEach((child) => {
                                    const data = child.val();
                                    if (
                                        typeof data === 'object'
                                        && data !== null
                                        && data.name
                                        && !isLearnedDictionaryReference(child.key!, data)
                                    ) {
                                        teacherDicts.push({
                                            id: child.key!,
                                            userId: teacherId,
                                            name: data.name,
                                            sourceLang: data.sourceLang,
                                            targetLang: data.targetLang,
                                            wordCount: data.wordCount || 0,
                                            createdAt: data.createdAt || Date.now(),
                                            isTeacherDict: true // Mark as teacher dictionary
                                        });
                                    }
                                });
                            }
                        } catch (err) {
                            console.warn(`Could not fetch dictionaries for teacher ${teacherId}:`, err);
                            // Continue to next teacher
                        }
                    }
                }
            }

            // 4. Merge and resolve names
            const virtualDefault: Dictionary = {
                id: 'default',
                userId: 'admin',
                name: 'Дефолтный словарь',
                sourceLang: 'en',
                targetLang: 'ru',
                wordCount: 250,
                createdAt: Date.now(),
                isShared: true
            };

            const allDicts = [virtualDefault, ...dicts, ...sharedDicts, ...teacherDicts];

            // Resolve any teacher UIDs we found that might not be in the map
            const teacherUids = teacherDicts.map(d => d.userId);
            if (teacherUids.length > 0) {
                console.log('fetchDictionaries: resolving teacher UIDs:', teacherUids);
                await get().resolveBeneIds(teacherUids);
            }

            set(state => ({
                ...state,
                dictionaries: allDicts,
                loading: false,
                error: null
            }));
        } catch (error: any) {
            if (!error.message?.includes('Permission denied')) {
                console.error('fetchDictionaries error:', error);
            }
            set(state => ({ ...state, loading: false }));
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
        } catch (error: any) {
            if (!error.message?.includes('Permission denied')) {
                console.error('fetchSharedDictionaries error:', error);
            }
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

    fetchWords: async (userId: string | undefined, dictionaryId: string) => {
        if (dictionaryId === 'default' || dictionaryId === 'dict2500') {
            await get().fetchSharedWords(userId);
            return;
        }

        if (!userId) {
            set(state => ({ ...state, words: [], loading: false, error: null }));
            return;
        }

        // Safeguard: Ensure dictionaries are loaded first so we know ownerId/isTeacherDict/isShared
        const hasDict = get().dictionaries.some(d => d.id === dictionaryId);
        if (!hasDict) {
            try {
                await get().fetchDictionaries(userId);
            } catch (e) {
                console.warn('Safeguard fetchDictionaries failed:', e);
            }
        }

        set(state => ({ ...state, loading: true, error: null, words: [] }));
        try {
            // Find dictionary metadata to determine the path
            const dict = get().dictionaries.find(d => d.id === dictionaryId);
            const isForeign = dict ? (dict.userId !== userId || dict.isShared || dict.isTeacherDict) : false;

            let path;
            if (dict && dict.isShared) {
                path = `shared/dictionaries/${dictionaryId}/words`;
            } else {
                const ownerId = dict?.isTeacherDict ? dict.userId : (dict?.userId || userId);
                path = `users/${ownerId}/dictionaries/${dictionaryId}/words`;
            }

            console.log(`📡 Fetching words from path: ${path} (isForeign: ${isForeign})`);
            
            // Parallel fetch: words and user's private progress for this foreign dictionary
            const [snapshot, progressSnapshot] = await Promise.all([
                dbGet(ref(db, path)),
                isForeign ? dbGet(ref(db, `users/${userId}/dictionaryProgress/${dictionaryId}`)) : Promise.resolve(null)
            ]);

            const personalProgress = progressSnapshot && progressSnapshot.exists() ? progressSnapshot.val() : {};
            const words_list: Word[] = [];

            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const data = child.val();
                    const wordId = child.key!;

                    let box = data.box || 0;
                    let nextReview = data.nextReview || Date.now();
                    let isLearned = data.isLearned || false;

                    if (isForeign && personalProgress[wordId]) {
                        const prog = personalProgress[wordId];
                        box = prog.box !== undefined ? prog.box : box;
                        nextReview = prog.nextReview !== undefined ? prog.nextReview : nextReview;
                        isLearned = prog.isLearned !== undefined ? prog.isLearned : isLearned;
                    }

                    words_list.push({
                        id: wordId,
                        dictionaryId,
                        original: get().cleanText(data.original),
                        translation: get().cleanText(data.translation),
                        box,
                        nextReview,
                        isLearned,
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

            const cleanedOriginal = cleanBrackets(original);
            const cleanedTranslation = cleanBrackets(translation);

            const newWordRef = push(ref(db, path));
            const data = {
                original: cleanedOriginal,
                translation: cleanedTranslation,
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

            const cleanedData = { ...data };
            if (cleanedData.original !== undefined) {
                cleanedData.original = cleanBrackets(cleanedData.original);
            }
            if (cleanedData.translation !== undefined) {
                cleanedData.translation = cleanBrackets(cleanedData.translation);
            }

            await update(ref(db, path), cleanedData);
            set(state => ({
                ...state,
                words: (state.words || []).map((w) => (w.id === wordId ? { ...w, ...cleanedData } : w)),
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
            let sharedProgress: Record<string, { box: number, nextReview: number }> = {};
            if (userId) {
                const learnedSnapshot = await dbGet(ref(db, `users/${userId}/learnedSharedWords`));
                if (learnedSnapshot.exists()) {
                    learnedIds = learnedSnapshot.val() || {};
                }

                // Fetch user's progress for shared words
                const progressSnapshot = await dbGet(ref(db, `users/${userId}/sharedWordsProgress`));
                if (progressSnapshot.exists()) {
                    sharedProgress = progressSnapshot.val() || {};
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
                    const progress = sharedProgress[child.key!];
                    words_list.push({
                        id: child.key!,
                        dictionaryId: 'default', // Special ID
                        original: clean(data.original),
                        translation: clean(data.translation),
                        box: progress?.box || 0,
                        nextReview: progress?.nextReview || Date.now(),
                        createdAt: Date.now(),
                    });
                });
            } else {
                console.warn('⚠️ No data found at shared/dictionaries/dict2500/words');
            }
            set(state => ({ ...state, words: words_list, loading: false, error: null }));
        } catch (error: any) {
            if (!error.message?.includes('Permission denied')) {
                console.error('❌ fetchSharedWords error:', error);
            }
            // FALLBACK TO EMBEDDED WORDS
            set(state => ({ ...state, words: defaultWords, loading: false, error: null }));
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
            const dict = get().dictionaries.find(d => d.id === word.dictionaryId);
            const isForeign = dict ? (dict.userId !== userId || dict.isShared || dict.isTeacherDict) : false;

            if (word.dictionaryId === 'default') {
                // Mark in shared list for user
                await dbSet(ref(db, `users/${userId}/learnedSharedWords/${word.id}`), true);
            } else if (isForeign) {
                // Mark as learned in personal progress for this foreign dictionary
                await update(ref(db, `users/${userId}/dictionaryProgress/${word.dictionaryId}/${word.id}`), {
                    isLearned: true,
                    box: 5
                });
            } else {
                // Mark in the original own dictionary
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

    answerWordLeitner: async (userId: string, word: Word, isCorrect: boolean) => {
        try {
            const LEITNER_INTERVALS = [
                0,                        // Box 0: immediate
                24 * 60 * 60 * 1000,      // Box 1: 1 day (24h)
                3 * 24 * 60 * 60 * 1000,  // Box 2: 3 days
                7 * 24 * 60 * 60 * 1000,  // Box 3: 7 days
                14 * 24 * 60 * 60 * 1000, // Box 4: 14 days
                30 * 24 * 60 * 60 * 1000  // Box 5: 30 days
            ];

            let newBox = 0;
            if (isCorrect) {
                newBox = Math.min((word.box || 0) + 1, 5);
            } else {
                newBox = 0; // Reset to box 0 on error
            }

            const nextReview = Date.now() + LEITNER_INTERVALS[newBox];

            // 1. If it reached Box 5 (graduated), mark as learned and move to "Выученные слова"
            if (isCorrect && newBox === 5) {
                await get().markWordAsLearned(userId, word);
                return;
            }

            // 2. Otherwise update box & nextReview
            const dict = get().dictionaries.find(d => d.id === word.dictionaryId);
            const isForeign = dict ? (dict.userId !== userId || dict.isShared || dict.isTeacherDict) : false;

            if (word.dictionaryId === 'default') {
                // Update in user-specific shared progress
                await update(ref(db, `users/${userId}/sharedWordsProgress/${word.id}`), {
                    box: newBox,
                    nextReview
                });
            } else if (isForeign) {
                // Update in personal progress for this foreign dictionary
                await update(ref(db, `users/${userId}/dictionaryProgress/${word.dictionaryId}/${word.id}`), {
                    box: newBox,
                    nextReview,
                    isLearned: false
                });
            } else {
                // Update in the original dictionary
                await update(ref(db, `users/${userId}/dictionaries/${word.dictionaryId}/words/${word.id}`), {
                    box: newBox,
                    nextReview
                });
            }

            // 3. Update local state
            set(state => ({
                ...state,
                words: state.words.map(w => 
                    w.id === word.id 
                        ? { ...w, box: newBox, nextReview } 
                        : w
                )
            }));

        } catch (error: any) {
            console.error('answerWordLeitner error:', error);
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
    },

    // ─── Profile & Relationships ──────────────────────────────────────────────────
    fetchProfile: async (userId: string) => {
        try {
            const snapshot = await dbGet(ref(db, `users/${userId}/profile`));
            
            // Fetch teachers from shared relations
            const teachersSnap = await dbGet(ref(db, `shared/relations/student_teachers/${userId}`));
            const teachersList = teachersSnap.exists() ? Object.keys(teachersSnap.val()) : [];

            // Fetch students from shared relations
            const studentsSnap = await dbGet(ref(db, `shared/relations/teacher_students/${userId}`));
            const studentsList = studentsSnap.exists() ? Object.keys(studentsSnap.val()) : [];

            if (snapshot.exists()) {
                const data = snapshot.val();

                set(state => ({
                    ...state,
                    userProfile: {
                        isTeacher: data.isTeacher || false,
                        beneId: data.beneId,
                        students: studentsList,
                        teachers: teachersList
                    }
                }));
            } else {
                set(state => ({
                    ...state,
                    userProfile: { isTeacher: false, students: studentsList, teachers: teachersList, beneId: undefined }
                }));
            }

            // Resolve teacher and student names if any
            const profile = get().userProfile;
            if (profile) {
                const uidsToResolve = [...profile.teachers, ...profile.students];
                if (uidsToResolve.length > 0) {
                    get().resolveBeneIds(uidsToResolve);
                }
            }
        } catch (error) {
            console.error('fetchProfile error:', error);
        }
    },

    toggleTeacherRole: async (userId: string, isTeacher: boolean) => {
        try {
            await update(ref(db, `users/${userId}/profile`), { isTeacher });
            set(state => ({
                ...state,
                userProfile: state.userProfile ? { ...state.userProfile, isTeacher } : { isTeacher, students: [], teachers: [] }
            }));
        } catch (error) {
            console.error('toggleTeacherRole error:', error);
            throw error;
        }
    },

    generateBeneId: async (userId: string, name: string) => {
        try {
            // 1. Sanitize name
            let sanitized = name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9а-яА-Я_]/g, '');
            if (!sanitized) {
                sanitized = 'User';
            }

            // 2. Get or create user number
            const profileRef = ref(db, `users/${userId}/profile`);
            const profileSnap = await dbGet(profileRef);
            let userNumber = profileSnap.val()?.userNumber;

            if (!userNumber) {
                // Derive a unique number from UID - fast and no permissions required
                const hashValue = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                userNumber = (hashValue % 10000).toString().padStart(4, '0');
                await update(profileRef, { userNumber });
            }

            const candidate = `Bene_${sanitized}_${userNumber}`;

            // 3. Save mapping (BeneID -> UID for lookup when adding)
            await update(ref(db, `shared/bene_ids`), { [candidate]: userId });

            // 4. Save reverse mapping (UID -> BeneID for display in lists)
            await update(ref(db, `shared/uid_to_beneid`), { [userId]: candidate });

            if (profileSnap.val()?.beneId && profileSnap.val()?.beneId !== candidate) {
                await remove(ref(db, `shared/bene_ids/${profileSnap.val().beneId}`));
            }

            await update(profileRef, { beneId: candidate });

            set(state => {
                const updatedProfile = state.userProfile
                    ? { ...state.userProfile, beneId: candidate }
                    : { isTeacher: false, students: [], teachers: [], beneId: candidate };

                return {
                    ...state,
                    userProfile: updatedProfile
                };
            });

            return candidate;
        } catch (error) {
            console.error('generateBeneId error:', error);
            throw error;
        }
    },

    resolveBeneIds: async (uids: string[]) => {
        if (!uids || uids.length === 0) return;

        try {
            const currentMap = get().beneIdMap;
            const uidsToFetch = uids.filter(uid => !currentMap[uid]);

            if (uidsToFetch.length === 0) return;

            const newMatches: Record<string, string> = {};

            // Fetch missing names in parallel
            await Promise.all(uidsToFetch.map(async (uid) => {
                const snap = await dbGet(ref(db, `shared/uid_to_beneid/${uid}`));
                if (snap.exists()) {
                    newMatches[uid] = snap.val();
                }
            }));

            if (Object.keys(newMatches).length > 0) {
                set(state => ({
                    beneIdMap: { ...state.beneIdMap, ...newMatches }
                }));
            }
        } catch (error) {
            console.error('resolveBeneIds error:', error);
        }
    },

    addStudent: async (teacherId: string, studentIdOrBeneId: string) => {
        try {
            let studentId = studentIdOrBeneId.trim();

            // 1. Check if it's a BeneId (starts with Bene_)
            if (studentId.startsWith('Bene_')) {
                const idSnapshot = await dbGet(ref(db, `shared/bene_ids/${studentId}`));
                if (!idSnapshot.exists()) {
                    throw new Error('Пользователь с таким BeneID не найден');
                }
                const beneId = studentId;
                studentId = idSnapshot.val();

                // Seed the reverse map so it's immediate
                await update(ref(db, `shared/uid_to_beneid`), { [studentId]: beneId });
                set(state => ({
                    beneIdMap: { ...state.beneIdMap, [studentId]: beneId }
                }));
            }

            // 2. Link in teacher's profile (their own, they have permission)
            await update(ref(db, `users/${teacherId}/profile/students`), { [studentId]: true });

            // 3. Link in shared relations (instead of student's private profile)
            await update(ref(db, `shared/relations/teacher_students/${teacherId}`), { [studentId]: true });
            await update(ref(db, `shared/relations/student_teachers/${studentId}`), { [teacherId]: true });

            // Update local state
            const currentProfile = get().userProfile;
            if (currentProfile) {
                set(state => ({
                    ...state,
                    userProfile: {
                        ...currentProfile,
                        students: [...new Set([...currentProfile.students, studentId])]
                    }
                }));
            }
        } catch (error) {
            console.error('addStudent error:', error);
            throw error;
        }
    },

    removeStudent: async (teacherId: string, studentId: string) => {
        try {
            // 1. Remove from teacher's profile
            await remove(ref(db, `users/${teacherId}/profile/students/${studentId}`));

            // 2. Remove from shared relations
            await remove(ref(db, `shared/relations/teacher_students/${teacherId}/${studentId}`));
            await remove(ref(db, `shared/relations/student_teachers/${studentId}/${teacherId}`));

            // Update local state
            const currentProfile = get().userProfile;
            if (currentProfile) {
                set(state => ({
                    ...state,
                    userProfile: {
                        ...currentProfile,
                        students: currentProfile.students.filter(id => id !== studentId)
                    }
                }));
            }
        } catch (error) {
            console.error('removeStudent error:', error);
            throw error;
        }
    },

    addTeacher: async (studentId: string, teacherIdOrBeneId: string) => {
        try {
            let teacherId = teacherIdOrBeneId;

            // 1. Resolve BeneId if needed
            if (teacherId.startsWith('Bene_')) {
                const snap = await dbGet(ref(db, `shared/bene_ids/${teacherId}`));
                if (!snap.exists()) {
                    throw new Error('Учитель с таким BeneID не найден');
                }
                const beneId = teacherId;
                teacherId = snap.val();

                // Seed reverse map
                await update(ref(db, `shared/uid_to_beneid`), { [teacherId]: beneId });
                set(state => ({
                    beneIdMap: { ...state.beneIdMap, [teacherId]: beneId }
                }));
            }

            // 2. Update relations in both directions
            await update(ref(db, `shared/relations/student_teachers/${studentId}`), { [teacherId]: true });
            await update(ref(db, `shared/relations/teacher_students/${teacherId}`), { [studentId]: true });

            // 3. Update local state
            const currentProfile = get().userProfile;
            if (currentProfile) {
                set(state => ({
                    ...state,
                    userProfile: {
                        ...currentProfile,
                        teachers: [...new Set([...currentProfile.teachers, teacherId])]
                    }
                }));
            }

            // 4. Refresh dictionaries to show teacher's content
            await get().fetchDictionaries(studentId);
        } catch (error) {
            console.error('addTeacher error:', error);
            throw error;
        }
    },

    removeTeacher: async (studentId: string, teacherId: string) => {
        try {
            await remove(ref(db, `shared/relations/student_teachers/${studentId}/${teacherId}`));
            await remove(ref(db, `shared/relations/teacher_students/${teacherId}/${studentId}`));

            const currentProfile = get().userProfile;
            if (currentProfile) {
                set(state => ({
                    ...state,
                    userProfile: {
                        ...currentProfile,
                        teachers: currentProfile.teachers.filter(id => id !== teacherId)
                    }
                }));
            }
            // Refresh dictionaries
            await get().fetchDictionaries(studentId);
        } catch (error) {
            console.error('removeTeacher error:', error);
            throw error;
        }
    }
}));
