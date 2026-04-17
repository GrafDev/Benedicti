export interface Dictionary {
    id: string;
    userId: string;
    name: string;
    sourceLang: string;
    targetLang: string;
    wordCount: number;
    createdAt: number;
    isShared?: boolean;
}

export interface Word {
    id: string;
    dictionaryId: string;
    original: string;
    translation: string;
    box: number; // For Leitner system (0-5)
    nextReview: number; // Timestamp
    isLearned?: boolean;
    createdAt: number;
    displaySide?: 'original' | 'translation';
}
