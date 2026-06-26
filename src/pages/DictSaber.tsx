import { useState, useEffect, useCallback, useRef, useMemo, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, RefreshCw, Sparkles, ChevronDown, Volume2, Trophy, Crown } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import { saveRecentActivity } from '../utils/activity';
import type { Word } from '../types';
import styles from './DictSaber.module.css';
import { ref, get as dbGet, set as dbSet } from 'firebase/database';
import { db } from '../firebase';
import { defaultWords } from '../data/defaultWords';

interface ActiveSaberCard {
    id: string; // unique instance id
    wordId: string; // word id in dictionary
    text: string;
    isOriginal: boolean;
    lane: number; // 0, 1, 2, 3
    progress: number; // 0 to 100
    totalCards: number; // Исходное количество карточек в ряду
}

interface SlashedSaberCard {
    id: string;
    wordId: string;
    text: string;
    isOriginal: boolean;
    lane: number;
    progress: number;
    totalCards: number;
}

interface GameRow {
    id: string;
    progress: number;
    cards: ActiveSaberCard[];
}

type Phase = 'SETUP' | 'PLAY' | 'GAMEOVER' | 'VICTORY';
type SpeedMode = 'slow' | 'normal' | 'fast' | 'insane';

const pickRandomWord = (words: Word[]): Word => {
    return words[Math.floor(Math.random() * words.length)];
};

// Вспомогательный генератор сбалансированных рядов с гарантированным ограничением расстояния на пары <= 3
const generateGameRows = (words: Word[]): GameRow[] => {
    const numWords = words.length;
    
    for (let attempt = 0; attempt < 2000; attempt++) {
        const r_orig = new Array(numWords).fill(-1);
        const r_trans = new Array(numWords).fill(-1);
        
        for (let i = 0; i < numWords; i++) {
            const base = Math.max(0, Math.floor(i * 1.1));
            const r1 = base + Math.floor(Math.random() * 2);
            
            const diff = (Math.floor(Math.random() * 3) + 1) * (Math.random() > 0.5 ? 1 : -1);
            let r2 = r1 + diff;
            if (r2 < 0) r2 = 0;
            
            if (Math.abs(r1 - r2) > 3) {
                r2 = r1 + Math.sign(diff) * 3;
            }
            
            if (Math.random() > 0.5) {
                r_orig[i] = r1;
                r_trans[i] = r2;
            } else {
                r_orig[i] = r2;
                r_trans[i] = r1;
            }
        }
        
        const maxRowIndex = Math.max(...r_orig, ...r_trans);
        const tempRows: ActiveSaberCard[][] = Array.from({ length: maxRowIndex + 1 }, () => []);
        
        for (let i = 0; i < numWords; i++) {
            const word = words[i];
            const origCard: ActiveSaberCard = {
                id: `${word.id}-orig-${Math.random()}`,
                wordId: word.id,
                text: word.original,
                isOriginal: true,
                lane: 0,
                progress: -6,
                totalCards: 1 // Будет перезаписано
            };
            const transCard: ActiveSaberCard = {
                id: `${word.id}-trans-${Math.random()}`,
                wordId: word.id,
                text: word.translation,
                isOriginal: false,
                lane: 0,
                progress: -6,
                totalCards: 1 // Будет перезаписано
            };
            
            tempRows[r_orig[i]].push(origCard);
            tempRows[r_trans[i]].push(transCard);
        }
        
        let valid = true;
        for (let r = 0; r <= maxRowIndex; r++) {
            if (tempRows[r].length < 1 || tempRows[r].length > 2) {
                valid = false;
                break;
            }
        }
        
        if (valid) {
            return tempRows.map((rowCards, rIdx) => {
                const shuffled = [...rowCards].sort(() => Math.random() - 0.5);
                shuffled.forEach((card, cIdx) => {
                    card.lane = cIdx;
                    card.totalCards = shuffled.length; // Фиксируем исходный размер ряда!
                });
                return {
                    id: `row-${rIdx}-${Math.random()}`,
                    progress: 8 - rIdx * 7.5, // Каждые 7.5% прогресса - новый ряд
                    cards: shuffled
                };
            });
        }
    }
    
    // Гарантированный фолбек на случай провала рандома
    const tempRows: ActiveSaberCard[][] = Array.from({ length: numWords * 2 }, () => []);
    words.forEach((word, i) => {
        const r1 = i;
        const r2 = i + 2;
        
        const origCard: ActiveSaberCard = {
            id: `${word.id}-orig-${Math.random()}`,
            wordId: word.id,
            text: word.original,
            isOriginal: true,
            lane: 0,
            progress: -6,
            totalCards: 2
        };
        const transCard: ActiveSaberCard = {
            id: `${word.id}-trans-${Math.random()}`,
            wordId: word.id,
            text: word.translation,
            isOriginal: false,
            lane: 0,
            progress: -6,
            totalCards: 2
        };
        
        tempRows[r1].push(origCard);
        tempRows[r2].push(transCard);
    });
    
    const filteredTempRows = tempRows.filter(r => r.length > 0);
    return filteredTempRows.map((rowCards, rIdx) => {
        const shuffled = [...rowCards].sort(() => Math.random() - 0.5);
        shuffled.forEach((card, cIdx) => {
            card.lane = cIdx;
            card.totalCards = shuffled.length; // Фиксируем исходный размер ряда!
        });
        return {
            id: `row-${rIdx}-${Math.random()}`,
            progress: 8 - rIdx * 7.5,
            cards: shuffled
        };
    });
};

export default function DictSaber() {
    const { dictId } = useParams<{ dictId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { language, t } = useLanguage();

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    const answerWordLeitner = useDictionaryStore(state => state.answerWordLeitner);
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const storeWords = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);

    const [phase, setPhase] = useState<Phase>('SETUP');
    const [isDictSelectorOpen, setIsDictSelectorOpen] = useState(false);

    // Game configurations
    const [speedMode, setSpeedMode] = useState<SpeedMode>(() => {
        const saved = localStorage.getItem('benedicti_saber_speed');
        return (saved as SpeedMode) || 'normal';
    });
    const [isEliteMode, setIsEliteMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('benedicti_saber_elite');
        return saved !== null ? JSON.parse(saved) : false;
    });

    // Game stats
    const [activeRows, setActiveRows] = useState<GameRow[]>([]);
    const [slashedCards, setSlashedCards] = useState<SlashedSaberCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [energy, setEnergy] = useState(5);
    
    const [wrongCards, setWrongCards] = useState<Set<string>>(new Set());
    const [showFlash, setShowFlash] = useState(false);
    const [comboPulse, setComboPulse] = useState(false);

    // Highscore states
    const [personalRecord, setPersonalRecord] = useState<number>(0);
    const [globalRecord, setGlobalRecord] = useState<{ score: number; username: string } | null>(null);
    const [isNewPersonalRecord, setIsNewPersonalRecord] = useState(false);
    const [isNewGlobalRecord, setIsNewGlobalRecord] = useState(false);

    // Refs for game loop and timing
    const requestRef = useRef<number | null>(null);
    const previousTimeRef = useRef<number | null>(null);
    const spawnTimerRef = useRef<number>(0);
    const spawnIndexRef = useRef<number>(0);
    const activeRowsRef = useRef<GameRow[]>([]);
    const phaseRef = useRef<Phase>('SETUP');
    const scoreRef = useRef<number>(0);
    const energyRef = useRef<number>(5);
    const saveHighscoresRef = useRef<(finalScore: number) => Promise<void> | void>(() => undefined);
    const failedWordsRef = useRef<Set<string>>(new Set());
    
    const allWordsPoolRef = useRef<Word[]>([]);
    const speedMultiplierRef = useRef<number>(1.0);
    
    // Рефы для других словарей и общего словаря
    const otherDictionariesWordsRef = useRef<Word[]>([]);
    const commonWordsRef = useRef<Word[]>([]);

    // Рефы для неиспользованных слов в текущей игре
    const unusedCurrentDictWordsRef = useRef<Word[]>([]);
    const unusedOtherDictWordsRef = useRef<Word[]>([]);
    const unusedCommonDictWordsRef = useRef<Word[]>([]);

    // Реф для отслеживания правильных ответов на каждое слово в текущей сессии
    const wordCorrectCountRef = useRef<Record<string, number>>({});
    
    // Общий счетчик правильных ответов в сессии
    const sessionCorrectAnswersCountRef = useRef<number>(0);
    
    const activeDict = useMemo(() => {
        return dictionaries.find(d => d.id === (dictId || 'default'));
    }, [dictionaries, dictId]);

    // Save recent activity
    useEffect(() => {
        if (dictId && dictId !== 'default' && dictionaries.length > 0) {
            const currentDict = dictionaries.find(d => d.id === dictId);
            if (currentDict) {
                saveRecentActivity({
                    dictId,
                    dictName: currentDict.name,
                    mode: 'dictsaber'
                });
            }
        }
    }, [dictId, dictionaries]);

    // Load dictionary metadata
    useEffect(() => {
        fetchDictionaries(currentUser?.uid);
    }, [currentUser, fetchDictionaries]);

    // Load words in dictionary
    useEffect(() => {
        const loadWords = async () => {
            if (dictId === 'default' || !dictId) {
                await fetchWords(currentUser?.uid, 'default');
            } else if (dictId) {
                await fetchWords(currentUser?.uid, dictId);
            }
        };
        loadWords();
    }, [dictId, currentUser, fetchWords]);

    // Загрузка слов из других словарей и общего словаря
    useEffect(() => {
        const loadExternal = async () => {
            if (!currentUser) return;

            const cleanText = (text: string) => {
                if (!text) return '';
                const cleaned = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
                return cleaned.split(';')[0].trim();
            };

            try {
                // 1. Загрузка общего словаря
                const commonSnapshot = await dbGet(ref(db, 'shared/dictionaries/dict2500/words'));
                if (commonSnapshot.exists()) {
                    const commonList: Word[] = [];
                    commonSnapshot.forEach((child) => {
                        const data = child.val();
                        commonList.push({
                            id: child.key!,
                            dictionaryId: 'default',
                            original: cleanText(data.original),
                            translation: cleanText(data.translation),
                            box: data.box || 0,
                            nextReview: data.nextReview || Date.now(),
                            createdAt: Date.now(),
                        });
                    });
                    commonWordsRef.current = commonList;
                } else {
                    commonWordsRef.current = defaultWords;
                }
            } catch (e) {
                console.warn('Failed to load common dict words from Firebase, fallback to defaultWords:', e);
                commonWordsRef.current = defaultWords;
            }

            try {
                // 2. Загрузка слов из других словарей пользователя
                const otherDicts = dictionaries.filter(
                    d => d.id !== dictId && d.id !== 'default' && d.id !== 'learned_dict'
                );
                
                const allOtherWords: Word[] = [];
                const promises = otherDicts.map(async (dict) => {
                    let path;
                    if (dict.isShared) {
                        path = `shared/dictionaries/${dict.id}/words`;
                    } else {
                        const ownerId = dict.isTeacherDict ? dict.userId : dict.userId;
                        path = `users/${ownerId}/dictionaries/${dict.id}/words`;
                    }
                    
                    try {
                        const snapshot = await dbGet(ref(db, path));
                        if (snapshot.exists()) {
                            snapshot.forEach((child) => {
                                const data = child.val();
                                allOtherWords.push({
                                    id: child.key!,
                                    dictionaryId: dict.id,
                                    original: cleanText(data.original),
                                    translation: cleanText(data.translation),
                                    box: data.box || 0,
                                    nextReview: data.nextReview || Date.now(),
                                    createdAt: data.createdAt || Date.now(),
                                });
                            });
                        }
                    } catch (err) {
                        console.warn(`Failed to load words for dictionary ${dict.id}:`, err);
                    }
                });

                await Promise.all(promises);
                otherDictionariesWordsRef.current = allOtherWords;
            } catch (e) {
                console.warn('Failed to load other dictionaries words:', e);
            }
        };

        if (dictionaries.length > 0) {
            loadExternal();
        }
    }, [currentUser, dictionaries, dictId]);

    // Load personal and global highscores
    useEffect(() => {
        const loadRecords = async () => {
            const activeDictId = dictId || 'default';
            
            // 1. Personal record
            if (currentUser) {
                try {
                    const pPath = `users/${currentUser.uid}/dictSaberHighScore/${activeDictId}`;
                    const pSnapshot = await dbGet(ref(db, pPath));
                    if (pSnapshot.exists()) {
                        setPersonalRecord(pSnapshot.val() as number);
                    } else {
                        setPersonalRecord(0);
                    }
                } catch (e) {
                    console.warn('Failed to load personal highscore:', e);
                    setPersonalRecord(0);
                }
            } else {
                setPersonalRecord(0);
            }

            // 2. Global record
            try {
                const gPath = `shared/dictSaberHighScore/${activeDictId}`;
                const gSnapshot = await dbGet(ref(db, gPath));
                if (gSnapshot.exists()) {
                    setGlobalRecord(gSnapshot.val() as { score: number; username: string });
                } else {
                    setGlobalRecord(null);
                }
            } catch (e) {
                console.warn('Failed to load global highscore:', e);
                setGlobalRecord(null);
            }
        };

        loadRecords();
    }, [currentUser, dictId]);

    // Save user preferences
    useEffect(() => {
        localStorage.setItem('benedicti_saber_speed', speedMode);
    }, [speedMode]);

    useEffect(() => {
        localStorage.setItem('benedicti_saber_elite', JSON.stringify(isEliteMode));
    }, [isEliteMode]);

    const handleDictionaryChange = (newDictId: string) => {
        localStorage.setItem('lastUsedDictId', newDictId);
        navigate(`/play/dictsaber/${newDictId}`);
        setIsDictSelectorOpen(false);
    };

    // Calculate speed coefficients
    const speedCoeff = useMemo(() => {
        switch (speedMode) {
            case 'slow': return 1.2; // progress per second
            case 'normal': return 2.8;
            case 'fast': return 4.5;
            case 'insane': return 6.5;
        }
    }, [speedMode]);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        energyRef.current = energy;
    }, [energy]);

    const cancelCurrentAnimationFrame = useCallback(() => {
        if (requestRef.current !== null) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
    }, []);

    // Save highscores callback
    const saveHighscores = useCallback(async (finalScore: number) => {
        const activeDictId = dictId || 'default';
        setIsNewPersonalRecord(false);
        setIsNewGlobalRecord(false);

        // 1. Personal record
        if (currentUser) {
            if (finalScore > personalRecord) {
                setPersonalRecord(finalScore);
                setIsNewPersonalRecord(true);
                try {
                    const pPath = `users/${currentUser.uid}/dictSaberHighScore/${activeDictId}`;
                    await dbSet(ref(db, pPath), finalScore);
                } catch (e) {
                    console.error('Failed to save personal highscore:', e);
                }
            }
        }

        // 2. Global record
        const currentGlobalScore = globalRecord?.score || 0;
        if (finalScore > currentGlobalScore) {
            setIsNewGlobalRecord(true);
            const newGlobal = {
                score: finalScore,
                username: currentUser?.displayName || currentUser?.email?.split('@')[0] || (language === 'ru' ? 'Аноним' : 'Anonymous')
            };
            setGlobalRecord(newGlobal);
            try {
                const gPath = `shared/dictSaberHighScore/${activeDictId}`;
                await dbSet(ref(db, gPath), newGlobal);
            } catch (e) {
                console.error('Failed to save global highscore:', e);
            }
        }
    }, [currentUser, dictId, personalRecord, globalRecord, language]);

    useEffect(() => {
        saveHighscoresRef.current = saveHighscores;
    }, [saveHighscores]);

    const endGame = useCallback(() => {
        if (phaseRef.current !== 'PLAY') return;

        phaseRef.current = 'GAMEOVER';
        cancelCurrentAnimationFrame();
        setPhase('GAMEOVER');
        saveHighscoresRef.current(scoreRef.current);
    }, [cancelCurrentAnimationFrame]);

    const returnToSetup = useCallback(() => {
        phaseRef.current = 'SETUP';
        cancelCurrentAnimationFrame();
        previousTimeRef.current = null;
        setPhase('SETUP');
    }, [cancelCurrentAnimationFrame]);

    // Start Level
    const startGame = () => {
        if (storeWords.length < 4) {
            alert(t('games.pairwords.notEnoughWords', { rank: 'DictSaber', count: 4 }));
            return;
        }

        // 1. Инициализация рефов для неиспользованных слов
        // Для текущего словаря перемешиваем его слова
        const shuffledStoreWords = [...storeWords].sort(() => Math.random() - 0.5);
        
        // Начальный пул активных слов: 8 слов (или меньше, если словарь мал)
        const initialActiveCount = Math.min(8, shuffledStoreWords.length);
        const initialActiveWords = shuffledStoreWords.slice(0, initialActiveCount);
        
        // Остальные слова текущего словаря идут в неиспользованные текущего
        unusedCurrentDictWordsRef.current = shuffledStoreWords.slice(initialActiveCount);
        
        // Неиспользованные слова из других словарей пользователя (перемешанные)
        unusedOtherDictWordsRef.current = [...otherDictionariesWordsRef.current].sort(() => Math.random() - 0.5);
        
        // Неиспользованные слова из общего словаря (перемешанные)
        unusedCommonDictWordsRef.current = [...commonWordsRef.current].sort(() => Math.random() - 0.5);

        // Если активных слов меньше 8, добираем из других словарей или общего до 8
        const activePool = [...initialActiveWords];
        while (activePool.length < 8) {
            if (unusedOtherDictWordsRef.current.length > 0) {
                activePool.push(unusedOtherDictWordsRef.current.shift()!);
            } else if (unusedCommonDictWordsRef.current.length > 0) {
                activePool.push(unusedCommonDictWordsRef.current.shift()!);
            } else {
                break; // Фолбек на случай если вообще ничего нет
            }
        }

        // Заполняем активный пул
        allWordsPoolRef.current = activePool;
        speedMultiplierRef.current = 1.0;

        // Сбрасываем счетчики правильных ответов
        wordCorrectCountRef.current = {};
        sessionCorrectAnswersCountRef.current = 0;

        setIsNewPersonalRecord(false);
        setIsNewGlobalRecord(false);
        cancelCurrentAnimationFrame();

        // Генерируем первую пачку рядов из 12 слов
        const initialWords: Word[] = [];
        for (let i = 0; i < 12; i++) {
            initialWords.push(pickRandomWord(allWordsPoolRef.current));
        }
        
        // Генерируем ряды с ограничением расстояния на пары <= 3
        const generatedRows = generateGameRows(initialWords);
        
        setActiveRows(generatedRows);
        setSlashedCards([]);
        setSelectedCardId(null);
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setEnergy(5);
        scoreRef.current = 0;
        energyRef.current = 5;
        setWrongCards(new Set());
        setShowFlash(false);

        failedWordsRef.current.clear();

        activeRowsRef.current = generatedRows;
        spawnIndexRef.current = 0;
        spawnTimerRef.current = 0;
        previousTimeRef.current = null;

        phaseRef.current = 'PLAY';
        setPhase('PLAY');
    };

    // Connect game loop
    useEffect(() => {
        if (phase !== 'PLAY') {
            cancelCurrentAnimationFrame();
            previousTimeRef.current = null;
            return;
        }

        const updateGame = (time: number) => {
            if (phaseRef.current !== 'PLAY') return;

            if (previousTimeRef.current === null) {
                previousTimeRef.current = time;
                requestRef.current = requestAnimationFrame(updateGame);
                return;
            }

            const delta = (time - previousTimeRef.current) / 1000; // seconds
            previousTimeRef.current = time;

            // Move rows and handle vertical falling
            const movedRows = activeRowsRef.current.map(row => ({
                ...row,
                progress: row.progress + (speedCoeff * speedMultiplierRef.current) * delta
            }));

            // Process burning rows (progress >= 100)
            let livesDeducted = 0;
            let remainingRows: GameRow[] = [];
            const missedWords: Word[] = [];

            movedRows.forEach(row => {
                if (row.progress >= 100) {
                    // Row burned in lava!
                    row.cards.forEach(card => {
                        const wordId = card.wordId;
                        // If we haven't registered a fail for this word yet, deduct a life
                        if (!failedWordsRef.current.has(wordId)) {
                            failedWordsRef.current.add(wordId);
                            livesDeducted += 1;

                            const missedWord = allWordsPoolRef.current.find(w => w.id === wordId);
                            if (missedWord) {
                                missedWords.push(missedWord);
                            }
                        }
                    });
                } else {
                    remainingRows.push(row);
                }
            });

            if (livesDeducted > 0) {
                // Record Leitner error for each unique missed word (only once!)
                if (currentUser) {
                    missedWords.forEach(word => {
                        answerWordLeitner(currentUser.uid, word, false);
                    });
                }

                // Reset selection if the selected card was in a burned row
                setSelectedCardId(prev => {
                    if (prev) {
                        const isSelectedCardBurned = !remainingRows.some(row =>
                            row.cards.some(c => c.id === prev)
                        );
                        if (isSelectedCardBurned) {
                            return null;
                        }
                    }
                    return prev;
                });

                setShowFlash(true);
                setTimeout(() => setShowFlash(false), 300);

                setCombo(0);
                const nextEnergy = energyRef.current - livesDeducted;
                energyRef.current = nextEnergy;
                setEnergy(nextEnergy);
                if (nextEnergy <= 0) {
                    endGame();
                }
            }

            // Infinite Mode: Respawn new rows dynamically when remaining rows are low (< 8)
            if (remainingRows.length < 8 && allWordsPoolRef.current.length > 0) {
                const nextBatch: Word[] = [];
                for (let i = 0; i < 8; i++) {
                    const randWord = allWordsPoolRef.current[Math.floor(Math.random() * allWordsPoolRef.current.length)];
                    nextBatch.push(randWord);
                }
                const nextRows = generateGameRows(nextBatch);
                
                let lastProgress = 8;
                if (remainingRows.length > 0) {
                    lastProgress = Math.min(...remainingRows.map(r => r.progress));
                }
                
                const shiftedRows = nextRows.map((row, idx) => ({
                    ...row,
                    progress: lastProgress - 7.5 - idx * 7.5
                }));
                
                remainingRows = [...remainingRows, ...shiftedRows];
            }

            // Update active rows reference and state
            activeRowsRef.current = remainingRows;
            setActiveRows(remainingRows);

            // Repeat
            if (energyRef.current > 0 && phaseRef.current === 'PLAY') {
                requestRef.current = requestAnimationFrame(updateGame);
            }
        };

        if (requestRef.current === null) {
            requestRef.current = requestAnimationFrame(updateGame);
        }

        return () => {
            cancelCurrentAnimationFrame();
        };
    }, [phase, speedCoeff, currentUser, answerWordLeitner, endGame, cancelCurrentAnimationFrame]);

    // Card Click Handler
    const handleCardClick = (cardId: string) => {
        if (phase !== 'PLAY') return;

        let clickedCard: ActiveSaberCard | null = null;
        let clickedRow: GameRow | null = null;

        for (const row of activeRows) {
            const card = row.cards.find(c => c.id === cardId);
            if (card) {
                clickedCard = card;
                clickedRow = row;
                break;
            }
        }

        if (!clickedCard || !clickedRow) return;

        // Play pronunciation for originals
        if (clickedCard.isOriginal) {
            speechService.speak(clickedCard.text, activeDict?.sourceLang || 'en');
        }

        if (selectedCardId === null) {
            // First choice
            setSelectedCardId(cardId);
        } else if (selectedCardId === cardId) {
            // Deselect on click again
            setSelectedCardId(null);
        } else {
            // Second choice
            let firstCard: ActiveSaberCard | null = null;
            let firstRow: GameRow | null = null;

            for (const row of activeRows) {
                const card = row.cards.find(c => c.id === selectedCardId);
                if (card) {
                    firstCard = card;
                    firstRow = row;
                    break;
                }
            }

            if (!firstCard || !firstRow) {
                setSelectedCardId(cardId);
                return;
            }

            if (firstCard.wordId === clickedCard.wordId && firstCard.isOriginal !== clickedCard.isOriginal) {
                // Correct match!
                // 1. Leitner progression update
                const matchedWord = allWordsPoolRef.current.find(w => w.id === clickedCard.wordId);
                if (matchedWord && currentUser) {
                    answerWordLeitner(currentUser.uid, matchedWord, true);
                }

                // 2. Score & Combo calculations
                let currentCombo = 0;
                setCombo(prev => {
                    const nextCombo = prev + 1;
                    currentCombo = nextCombo;
                    if (nextCombo > maxCombo) setMaxCombo(nextCombo);
                    
                    // Visual pulse effect for combo increase
                    setComboPulse(true);
                    setTimeout(() => setComboPulse(false), 200);
                    
                    return nextCombo;
                });

                // Apply score based on difficulty and combo
                const currentComboMultiplier = Math.min(Math.floor(currentCombo / 3) + 1, 4);
                const difficultyMultiplier = speedMode === 'slow' ? 0.5 : speedMode === 'normal' ? 1.0 : speedMode === 'fast' ? 1.5 : 2.0;
                const points = Math.round(10 * currentComboMultiplier * difficultyMultiplier);
                setScore(prev => {
                    const nextScore = prev + points;
                    scoreRef.current = nextScore;
                    return nextScore;
                });

                // 3. Dynamic speed increase (на 3% за верный ответ для большего драйва)
                speedMultiplierRef.current += 0.03;

                // 4. Логика отслеживания правильных ответов на конкретное слово
                const wordId = clickedCard.wordId;
                wordCorrectCountRef.current[wordId] = (wordCorrectCountRef.current[wordId] || 0) + 1;

                // Увеличиваем общий счетчик правильных ответов сессии
                sessionCorrectAnswersCountRef.current += 1;

                // 5. Динамический приток слов:
                // При каждом правильном ответе добавляется 1 новое слово в пул
                let newWord: Word | null = null;
                if (unusedCurrentDictWordsRef.current.length > 0) {
                    newWord = unusedCurrentDictWordsRef.current.shift()!;
                } else if (unusedOtherDictWordsRef.current.length > 0) {
                    newWord = unusedOtherDictWordsRef.current.shift()!;
                } else if (unusedCommonDictWordsRef.current.length > 0) {
                    newWord = unusedCommonDictWordsRef.current.shift()!;
                }

                if (newWord) {
                    allWordsPoolRef.current.push(newWord);
                    console.log(`[DictSaber] Added word to active pool: "${newWord.original}"`);
                }

                // Каждые 3 правильных ответа: гарантированно добавляем еще одно дополнительное слово из другого словаря
                if (sessionCorrectAnswersCountRef.current % 3 === 0) {
                    let bonusWord: Word | null = null;
                    if (unusedOtherDictWordsRef.current.length > 0) {
                        bonusWord = unusedOtherDictWordsRef.current.shift()!;
                    } else if (unusedCommonDictWordsRef.current.length > 0) {
                        bonusWord = unusedCommonDictWordsRef.current.shift()!;
                    }

                    if (bonusWord) {
                        allWordsPoolRef.current.push(bonusWord);
                        console.log(`[DictSaber] Added BONUS word to active pool: "${bonusWord.original}"`);
                    }
                }

                // Исключение слова после 5 правильных ответов
                if (wordCorrectCountRef.current[wordId] >= 5) {
                    allWordsPoolRef.current = allWordsPoolRef.current.filter(w => w.id !== wordId);
                    console.log(`[DictSaber] Word ID "${wordId}" reached 5 correct answers and is excluded from future spawns.`);
                }

                // 6. Trigger Slashed animations
                const slashA: SlashedSaberCard = {
                    id: firstCard.id,
                    wordId: firstCard.wordId,
                    text: firstCard.text,
                    isOriginal: firstCard.isOriginal,
                    lane: firstCard.lane,
                    progress: firstRow.progress,
                    totalCards: firstCard.totalCards || 1
                };
                const slashB: SlashedSaberCard = {
                    id: clickedCard.id,
                    wordId: clickedCard.wordId,
                    text: clickedCard.text,
                    isOriginal: clickedCard.isOriginal,
                    lane: clickedCard.lane,
                    progress: clickedRow.progress,
                    totalCards: clickedCard.totalCards || 1
                };

                setSlashedCards(prev => [...prev, slashA, slashB]);
                
                // Clear slashed after animation finishes (700ms)
                setTimeout(() => {
                    setSlashedCards(prev => prev.filter(c => c.id !== slashA.id && c.id !== slashB.id));
                }, 700);

                // 7. Remove from active rows
                const updatedRows = activeRowsRef.current.map(row => {
                    const remainingCardsInRow = row.cards.filter(c => c.id !== firstCard.id && c.id !== clickedCard.id);
                    return {
                        ...row,
                        cards: remainingCardsInRow
                    };
                }).filter(row => row.cards.length > 0);

                activeRowsRef.current = updatedRows;
                setActiveRows(updatedRows);
                setSelectedCardId(null);
            } else {
                // Incorrect match!
                // Record Leitner review failures
                const wordA = allWordsPoolRef.current.find(w => w.id === firstCard.wordId);
                const wordB = allWordsPoolRef.current.find(w => w.id === clickedCard.wordId);
                if (wordA && currentUser) answerWordLeitner(currentUser.uid, wordA, false);
                if (wordB && currentUser) answerWordLeitner(currentUser.uid, wordB, false);

                // Shake animation for incorrect items
                setWrongCards(new Set([firstCard.id, clickedCard.id]));
                setTimeout(() => {
                    setWrongCards(new Set());
                }, 400);

                setCombo(0);
                setSelectedCardId(null);
            }
        }
    };


    // Calculate 2D position for vertical falling cards in row-based waterfall (no rigid columns)
    const getCardStyle = (
        cardIndex: number,
        totalCards: number,
        progress: number
    ): CSSProperties & { '--card-width-percent'?: string } => {
        if (progress < 0) {
            return { display: 'none' };
        }
        
        // Vertical position: from 0% (top) to 100% (bottom / lava)
        const topPercent = progress;
        const opacity = Math.min(1, (progress + 2) / 5);

        // Distribute cards horizontally based on their index in the row
        let leftPercent = 50;
        let widthPercent = 48;
        if (totalCards === 2) {
            leftPercent = cardIndex === 0 ? 25 : 75;
            widthPercent = 48;
        } else if (totalCards === 3) {
            leftPercent = cardIndex === 0 ? 17 : cardIndex === 1 ? 50 : 83;
            widthPercent = 30;
        }

        return {
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            transform: 'translate(-50%, -50%)',
            opacity,
            zIndex: Math.floor(progress),
            '--card-width-percent': `${widthPercent}%`
        };
    };

    // Setup screen rendering
    const renderSetup = () => (
        <div className={styles.setupContainer}>
            <div className={styles.titleRow}>
                <button onClick={() => navigate('/games')} className={styles.backButtonInline} title={t('common.back')}>
                    <ArrowLeft size={22} />
                </button>
                <h1 className={styles.neonTitle}>{t('games.dictsaber.title')}</h1>
            </div>

            <div className={styles.setupSection}>
                <span className={styles.sectionLabel}>{t('common.dictionary')}</span>
                <button
                    className={styles.dictSelectorButton}
                    onClick={() => setIsDictSelectorOpen(!isDictSelectorOpen)}
                >
                    <span>
                        {(!currentUser || dictId === 'default' || !dictId) 
                            ? t('common.defaultDict') 
                            : (activeDict?.name || '...')}
                    </span>
                    <ChevronDown size={18} />
                </button>

                {isDictSelectorOpen && (
                    <div className={styles.dictDropdown}>
                        <button
                            className={`${styles.dictOption} ${(!dictId || dictId === 'default') ? styles.dictOptionActive : ''}`}
                            onClick={() => handleDictionaryChange('default')}
                        >
                            {t('common.defaultDict')}
                        </button>
                        {dictionaries
                            .filter(d => d.id !== 'default')
                            .map(d => (
                                <button
                                    key={d.id}
                                    className={`${styles.dictOption} ${dictId === d.id ? styles.dictOptionActive : ''}`}
                                    onClick={() => handleDictionaryChange(d.id)}
                                >
                                    {d.name}
                                </button>
                            ))}
                    </div>
                )}
            </div>

            <div className={styles.setupSection}>
                <span className={styles.sectionLabel}>{t('games.dictsaber.speed')}</span>
                <div className={styles.speedGrid}>
                    {(['slow', 'normal', 'fast', 'insane'] as SpeedMode[]).map(mode => (
                        <button
                            key={mode}
                            className={`${styles.speedBtn} ${speedMode === mode ? styles.speedBtnActive : ''}`}
                            onClick={() => setSpeedMode(mode)}
                        >
                            {t(`games.dictsaber.speed${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.setupSection}>
                <div className={styles.toggleContainer} onClick={() => setIsEliteMode(!isEliteMode)}>
                    <div className={styles.toggleLabel}>
                        <span className={styles.toggleTitle}>{t('games.dictsaber.eliteMode')}</span>
                        <span className={styles.toggleDesc}>
                            {language === 'ru' 
                                ? 'Слова скрыты за динамиком. Воспринимайте на слух!' 
                                : 'Words are hidden. Recognize them by ear!'}
                        </span>
                    </div>
                    <div className={`${styles.customToggle} ${isEliteMode ? styles.customToggleActive : ''}`}>
                        <div className={styles.toggleThumb} />
                    </div>
                </div>
            </div>

            {storeWords.length < 4 && !loading && (
                <div className={styles.noWordsWarning}>
                    {t('games.dictsaber.noWords')}
                </div>
            )}

            {/* Records Dashboard */}
            <div className={styles.recordsBlock}>
                <div className={styles.recordCard}>
                    <div className={`${styles.recordIcon} ${styles.personalIcon}`}>
                        <Trophy size={20} />
                    </div>
                    <div className={styles.recordInfo}>
                        <span className={styles.recordLabel}>
                            {language === 'ru' ? 'Рекорд' : 'Best'}
                        </span>
                        <span className={styles.recordValue}>{personalRecord || 0}</span>
                    </div>
                </div>

                <div className={styles.recordCard}>
                    <div className={`${styles.recordIcon} ${styles.globalIcon}`}>
                        <Crown size={20} />
                    </div>
                    <div className={styles.recordInfo}>
                        <span className={styles.recordLabel}>
                            {language === 'ru' ? 'Топ мира' : 'Global Top'}
                        </span>
                        <span className={styles.recordValue}>{globalRecord?.score || 0}</span>
                        {globalRecord && (
                            <span className={styles.recordUser} title={globalRecord.username}>
                                {globalRecord.username}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <button
                className={styles.startBtn}
                onClick={startGame}
                disabled={loading || storeWords.length < 4}
            >
                {t('games.dictsaber.play')}
            </button>
        </div>
    );

    // Score multipliers helper
    const comboMultiplier = Math.min(Math.floor(combo / 3) + 1, 4);

    return (
        <div className={`${styles.container} ${phase === 'SETUP' ? styles.containerSetup : ''}`}>
            {showFlash && <div className={styles.flashScreen} />}

            {phase === 'SETUP' ? (
                renderSetup()
            ) : (
                <>
                    {/* Game Header */}
                    <header className={styles.header}>
                        <button onClick={returnToSetup} className={styles.backButton} title={t('common.back')}>
                            <ArrowLeft size={24} />
                        </button>
                        
                        <div className={styles.stats}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('games.dictsaber.score')}</span>
                                <span className={`${styles.statValue} ${styles.scoreVal}`}>{score}</span>
                            </div>
                            
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('games.dictsaber.combo')}</span>
                                <span className={`${styles.statValue} ${styles.comboVal} ${comboPulse ? styles.comboPulse : ''}`}>
                                    x{comboMultiplier} <span style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)'}}>({combo})</span>
                                </span>
                            </div>

                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('games.dictsaber.lives')}</span>
                                <div className={styles.energyBarContainer}>
                                    <div className={styles.energyBarFill} style={{ width: `${(energy / 5) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* 3D Highway Area */}
                    <div className={styles.gameArea}>
                        <div className={styles.highway}>
                            {/* Active moving cards */}
                            {activeRows.map(row => 
                                row.cards.map(card => {
                                    const isSelected = selectedCardId === card.id;
                                    const isWrong = wrongCards.has(card.id);
                                    const hideText = isEliteMode && card.isOriginal;
                                    const isHot = row.progress > 80;

                                    return (
                                        <div
                                            key={card.id}
                                            className={`${styles.card3D} ${card.isOriginal ? styles.cardOriginal : styles.cardTranslation} ${isSelected ? styles.cardSelected : ''} ${isWrong ? styles.cardWrong : ''} ${isHot ? styles.cardHot : ''}`}
                                            style={getCardStyle(card.lane, card.totalCards || 1, row.progress)}
                                            onClick={() => handleCardClick(card.id)}
                                        >
                                            <div className={styles.cardInner}>
                                                {hideText ? (
                                                    <div className={styles.speakerIcon}>
                                                        <Volume2 size={24} />
                                                    </div>
                                                ) : (
                                                    <span className={styles.cardText} title={card.text}>
                                                        {card.text}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Slashed flying animations */}
                            {slashedCards.map(card => (
                                <div
                                    key={`slash-${card.id}`}
                                    className={`${styles.slashedCard} ${card.isOriginal ? styles.cardOriginal : styles.cardTranslation}`}
                                    style={getCardStyle(card.lane, card.totalCards, card.progress)}
                                >
                                    <div className={`${styles.half} ${styles.leftHalf} ${styles.leftHalfAnim}`}>
                                        {isEliteMode && card.isOriginal ? (
                                            <Volume2 size={16} />
                                        ) : (
                                            <span className={styles.cardText} title={card.text}>
                                                {card.text}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`${styles.half} ${styles.rightHalf} ${styles.rightHalfAnim}`}>
                                        {isEliteMode && card.isOriginal ? (
                                            <Volume2 size={16} />
                                        ) : (
                                            <span className={styles.cardText} title={card.text}>
                                                {card.text}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Laser Slash Line at the bottom */}
                            <div className={styles.laserLine} />
                        </div>
                    </div>
                </>
            )}

            {/* Results Screen */}
            {(phase === 'GAMEOVER' || phase === 'VICTORY') && (() => {
                const titleText = isNewGlobalRecord
                    ? (language === 'ru' ? '🏆 Новый рекорд мира!' : '🏆 New World Record!')
                    : isNewPersonalRecord
                        ? (language === 'ru' ? '🎉 Новый рекорд!' : '🎉 New Highscore!')
                        : t('games.dictsaber.gameOver');

                const messageText = isNewGlobalRecord
                    ? (language === 'ru' ? 'Вы превзошли всех в этом словаре! Невероятно!' : 'You outperformed everyone on this dictionary! Incredible!')
                    : isNewPersonalRecord
                        ? (language === 'ru' ? 'Отличный результат, ваш лучший счет обновлен!' : 'Great job, your highscore has been updated!')
                        : (language === 'ru' 
                            ? 'Не расстраивайтесь! Каждая ошибка — это шаг к знанию.' 
                            : 'Don\'t give up! Every mistake is a learning step.');

                return (
                    <div className={styles.resultsOverlay}>
                        <div className={styles.results}>
                            <div className={styles.successIcon} style={{ color: isNewGlobalRecord ? '#d946ef' : isNewPersonalRecord ? '#00f2fe' : '#f43f5e' }}>
                                {isNewGlobalRecord ? (
                                    <Crown size={60} />
                                ) : isNewPersonalRecord ? (
                                    <Trophy size={60} />
                                ) : (
                                    <Sparkles size={60} />
                                )}
                            </div>
                            
                            <h2 className={`${styles.resultsTitle} ${isNewPersonalRecord || isNewGlobalRecord ? styles.titleVictory : styles.titleGameOver}`}>
                                {titleText}
                            </h2>
                            
                            <p className={styles.resultsMsg}>
                                {messageText}
                            </p>

                            <div className={styles.finalStatsGrid}>
                                <div className={styles.finalStatCard}>
                                    <div className={styles.finalStatLabel}>{t('common.score')}</div>
                                    <div className={styles.finalStatValue} style={{color: '#00f2fe'}}>{score}</div>
                                </div>
                                <div className={styles.finalStatCard}>
                                    <div className={styles.finalStatLabel}>{language === 'ru' ? 'Макс. Комбо' : 'Max Combo'}</div>
                                    <div className={styles.finalStatValue} style={{color: '#d946ef'}}>{maxCombo}</div>
                                </div>
                            </div>

                            <button onClick={startGame} className={styles.restartButton}>
                                <RefreshCw size={18} /> {t('common.playAgain')}
                            </button>
                            <button onClick={returnToSetup} className={styles.menuButton}>
                                {t('common.menu')}
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
