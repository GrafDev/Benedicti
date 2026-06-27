import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, Volume2, RefreshCw, User, Sword, Shield, Landmark, Trophy, Crown, Sparkles, ChevronDown, BookOpen, CheckCircle2, LockKeyhole, Play, Target, type LucideIcon } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import { soundService } from '../utils/soundUtils';
import { saveRecentActivity } from '../utils/activity';
import type { Word } from '../types';
import styles from './MatchPairs.module.css';
import { ref, get as dbGet, set as dbSet } from 'firebase/database';
import { db } from '../firebase';

interface MatchItem {
    id: string;
    text: string;
    isOriginal: boolean;
}

interface MatchColumnEntry {
    item: MatchItem | null;
    slotIndex: number;
}

type Phase = 'SETUP' | 'PLAY' | 'GAMEOVER';

interface Rank {
    id: string;
    name: string;
    count: number;
    icon: LucideIcon;
    badgeSrc: string;
    description: string;
}

interface ReplacementGuard {
    pairId: string;
    leftSlotIndex: number;
    rightSlotIndex: number;
    repeatCount: number;
    otherPairAttempts: number;
}

const REPLACEMENT_REPEAT_SHUFFLE_THRESHOLD = 2;
const REPLACEMENT_OTHER_ATTEMPT_RESET_THRESHOLD = 2;

export default function MatchPairs() {
    const { dictId } = useParams<{ dictId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { language, t } = useLanguage();

    const RANKS = useMemo<Rank[]>(() => [
        { id: 'citizen', name: t('ranks.citizen.name'), count: 4, icon: User, badgeSrc: '/assets/match-pairs/ranks/citizen-badge.png', description: `4 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.citizen.desc')}` },
        { id: 'knight', name: t('ranks.knight.name'), count: 5, icon: Sword, badgeSrc: '/assets/match-pairs/ranks/knight-badge.png', description: `5 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.knight.desc')}` },
        { id: 'baron', name: t('ranks.baron.name'), count: 6, icon: Shield, badgeSrc: '/assets/match-pairs/ranks/baron-badge.png', description: `6 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.baron.desc')}` },
        { id: 'count', name: t('ranks.count.name'), count: 7, icon: Landmark, badgeSrc: '/assets/match-pairs/ranks/count-badge.png', description: `7 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.count.desc')}` },
        { id: 'duke', name: t('ranks.duke.name'), count: 8, icon: Trophy, badgeSrc: '/assets/match-pairs/ranks/duke-badge.png', description: `8 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.duke.desc')}` },
        { id: 'king', name: t('ranks.king.name'), count: 9, icon: Crown, badgeSrc: '/assets/match-pairs/ranks/king-badge.png', description: `9 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.king.desc')}` },
        { id: 'emperor', name: t('ranks.emperor.name'), count: 10, icon: Sparkles, badgeSrc: '/assets/match-pairs/ranks/emperor-badge.png', description: `10 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.emperor.desc')}` },
    ], [t]);

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchSharedWords = useDictionaryStore(state => state.fetchSharedWords);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    const answerWordLeitner = useDictionaryStore(state => state.answerWordLeitner);
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const storeWords = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);

    const [allWordsPool, setAllWordsPool] = useState<Word[]>([]);
    const [leftColumn, setLeftColumn] = useState<(MatchItem | null)[]>([]);
    const [rightColumn, setRightColumn] = useState<(MatchItem | null)[]>([]);

    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
    const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());
    const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
    const [isShuffling, setIsShuffling] = useState(false);
    const [newlyAppearingIds, setNewlyAppearingIds] = useState<Set<string>>(new Set());

    const [isEliteMode, setIsEliteMode] = useState(() => {
        const saved = localStorage.getItem('benedicti_match_elite');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const [score, setScore] = useState(0);
    const [totalPairs, setTotalPairs] = useState(0);

    const nextWordIndex = useRef(0);

    const [phase, setPhase] = useState<Phase>('SETUP');
    const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
    const [isDictSelectorOpen, setIsDictSelectorOpen] = useState(false);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [isMobileSetupOpen, setIsMobileSetupOpen] = useState(false);

    const [timer, setTimer] = useState(0);
    const [errors, setErrors] = useState(0);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const replacementGuardsRef = useRef<ReplacementGuard[]>([]);

    const [perfectRanks, setPerfectRanks] = useState<Record<string, boolean>>({});

    const playableWords = useMemo(() => {
        return storeWords.filter(word => word.original.trim() && word.translation.trim());
    }, [storeWords]);

    useEffect(() => {
        const loadPerfectRanks = async () => {
            const activeDictId = dictId || 'default';
            
            // 1. Load from localStorage as fallback
            const localData: Record<string, boolean> = {};
            RANKS.forEach(rank => {
                const isPerfect = localStorage.getItem(`benedicti_match_perfect_${activeDictId}_${rank.id}`) === 'true';
                if (isPerfect) {
                    localData[rank.id] = true;
                }
            });
            setPerfectRanks(localData);

            // 2. Load from Firebase and merge
            if (currentUser) {
                try {
                    const path = `users/${currentUser.uid}/matchPairsProgress/${activeDictId}`;
                    const snapshot = await dbGet(ref(db, path));
                    if (snapshot.exists()) {
                        const fbData = snapshot.val() as Record<string, boolean>;
                        setPerfectRanks(prev => ({
                            ...prev,
                            ...fbData
                        }));
                        // Sync to localStorage
                        Object.entries(fbData).forEach(([rankId, value]) => {
                            if (value) {
                                localStorage.setItem(`benedicti_match_perfect_${activeDictId}_${rankId}`, 'true');
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Failed to load progression from Firebase:', e);
                }
            }
        };

        loadPerfectRanks();
    }, [currentUser, dictId, RANKS]);

    const resultTitle = useMemo(() => {
        const isRu = language === 'ru';
        if (errors === 0) {
            return isRu ? "🏆 Идеальный результат!" : "🏆 Perfect Score!";
        } else if (errors <= 3) {
            return isRu ? "🎉 Отличная работа!" : "🎉 Great Job!";
        } else if (errors <= 10) {
            return isRu ? "👍 Хорошая попытка!" : "👍 Good Effort!";
        } else {
            return isRu ? "💪 Нужно больше тренироваться!" : "💪 Keep Practicing!";
        }
    }, [errors, language]);

    const resultMessage = useMemo(() => {
        if (errors === 0) {
            return t('games.pairwords.conqueredRank', { rank: selectedRank?.name || '' });
        } else {
            return language === 'ru' 
                ? "Для покорения ранга завершите игру без ошибок." 
                : "To conquer the rank, complete the game without errors.";
        }
    }, [errors, selectedRank, language, t]);

    // Track activity
    useEffect(() => {
        if (dictId && dictId !== 'default' && dictionaries.length > 0) {
            const currentDict = dictionaries.find(d => d.id === dictId);
            if (currentDict) {
                saveRecentActivity({
                    dictId,
                    dictName: currentDict.name,
                    mode: 'match-pairs'
                });
            }
        }
    }, [dictId, dictionaries]);

    // Initial Load
    useEffect(() => {
        fetchDictionaries(currentUser?.uid);
    }, [currentUser, fetchDictionaries]);

    useEffect(() => {
        const loadWords = async () => {
            setHasAttemptedLoad(false);
            if (dictId === 'default' || !dictId) {
                await fetchWords(currentUser?.uid, 'default');
            } else if (dictId) {
                await fetchWords(currentUser?.uid, dictId);
            }
            setHasAttemptedLoad(true);
        };
        loadWords();
    }, [dictId, currentUser, fetchWords, fetchSharedWords]);

    const handleDictionaryChange = (newDictId: string) => {
        localStorage.setItem('lastUsedDictId', newDictId);
        navigate(`/play/match-pairs/${newDictId}`);
        setIsDictSelectorOpen(false);
    };

    // Setup session
    const startLevel = useCallback((rank: Rank) => {
        const now = Date.now();
        const dueWords = playableWords.filter(w => !w.isLearned && (!w.nextReview || w.nextReview <= now));
        const otherWords = playableWords.filter(w => w.isLearned || (w.nextReview && w.nextReview > now));

        const shuffledDue = [...dueWords].sort(() => Math.random() - 0.5);
        const shuffledOther = [...otherWords].sort(() => Math.random() - 0.5);
        const pool = [...shuffledDue, ...shuffledOther];

        if (pool.length < rank.count) {
            alert(t('games.pairwords.notEnoughWords', { rank: rank.name, count: rank.count }));
            return;
        }

        // Take only 15 words for the session
        const poolForSession = pool.slice(0, 15);

        setAllWordsPool(poolForSession);
        setTotalPairs(poolForSession.length);
        setScore(0);
        setErrors(0);
        setTimer(0);
        startTimeRef.current = Date.now();
        setMatchedIds(new Set());
        setCorrectIds(new Set());
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setIsShuffling(false);
        replacementGuardsRef.current = [];
        setWrongIds(new Set());
        setNewlyAppearingIds(new Set());

        setSelectedRank(rank);

        // Pick initial batch based on rank
        const initialBatch = poolForSession.slice(0, rank.count);
        nextWordIndex.current = rank.count;

        const left = initialBatch.map(w => ({ id: w.id, text: w.original, isOriginal: true }))
            .sort(() => Math.random() - 0.5);
        const right = initialBatch.map(w => ({ id: w.id, text: w.translation, isOriginal: false }))
            .sort(() => Math.random() - 0.5);

        setLeftColumn(left);
        setRightColumn(right);
        setPhase('PLAY');
    }, [playableWords, t]);

    useEffect(() => {
        localStorage.setItem('benedicti_match_elite', JSON.stringify(isEliteMode));
    }, [isEliteMode]);

    const isAllDone = matchedIds.size === allWordsPool.length && allWordsPool.length > 0;

    useEffect(() => {
        if (isAllDone && errors === 0 && selectedRank) {
            const activeDictId = dictId || 'default';
            
            // 1. Update React state
            setPerfectRanks(prev => ({
                ...prev,
                [selectedRank.id]: true
            }));

            // 2. Save to LocalStorage
            localStorage.setItem(`benedicti_match_perfect_${activeDictId}_${selectedRank.id}`, 'true');

            // 3. Save to Firebase
            if (currentUser) {
                const path = `users/${currentUser.uid}/matchPairsProgress/${activeDictId}/${selectedRank.id}`;
                dbSet(ref(db, path), true).catch(e => {
                    console.warn('Failed to save progression to Firebase:', e);
                });
            }
        }
    }, [isAllDone, errors, selectedRank, dictId, currentUser]);

    // Timer logic
    useEffect(() => {
        if (phase === 'PLAY' && !isAllDone) {
            // Ensure we have a start time if we just moved to PLAY
            if (!startTimeRef.current) startTimeRef.current = Date.now();

            timerRef.current = window.setInterval(() => {
                if (startTimeRef.current) {
                    const elapsed = Date.now() - startTimeRef.current;
                    setTimer(elapsed);
                }
            }, 50); // Update every 50ms for smoothness without overhead
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            if (phase === 'SETUP') startTimeRef.current = null;
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, isAllDone]);

    const formatTime = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        const tenths = Math.floor((ms % 1000) / 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
    };

    const shuffleColumns = useCallback(() => {
        const shuffle = <T,>(array: T[]): T[] => {
            return [...array].sort(() => Math.random() - 0.5);
        };

        const appearingIds = new Set<string>();

        setLeftColumn(prev => {
            const shuffled = shuffle(prev);
            shuffled.forEach(item => {
                if (item) appearingIds.add(item.id);
            });
            return shuffled;
        });

        setRightColumn(prev => {
            const shuffled = shuffle(prev);
            shuffled.forEach(item => {
                if (item) appearingIds.add(item.id);
            });
            return shuffled;
        });

        setNewlyAppearingIds(appearingIds);

        setTimeout(() => {
            setNewlyAppearingIds(prev => {
                const next = new Set(prev);
                appearingIds.forEach(id => next.delete(id));
                return next;
            });
        }, 1000);
    }, []);

    const triggerReplacementShuffle = useCallback(() => {
        setIsShuffling(true);
        replacementGuardsRef.current = [];

        // Cascade fadeOut animation is idx * 40ms + transition (200ms).
        // For ~5-10 elements, 450ms is perfect to let it fully fade out before shuffle.
        setTimeout(() => {
            shuffleColumns();
            setIsShuffling(false);
        }, 450);

        // Reset selection to prevent incorrect matches after shuffle
        setSelectedLeftId(null);
        setSelectedRightId(null);
    }, [shuffleColumns]);

    const recordCompletedOtherPairAttempt = useCallback((completedPairId: string) => {
        replacementGuardsRef.current = replacementGuardsRef.current
            .map(guard => guard.pairId === completedPairId
                ? guard
                : { ...guard, otherPairAttempts: guard.otherPairAttempts + 1 }
            )
            .filter(guard =>
                guard.pairId === completedPairId
                || guard.otherPairAttempts < REPLACEMENT_OTHER_ATTEMPT_RESET_THRESHOLD
            );
    }, []);

    const replaceWordOnPlace = (oldId: string) => {
        const leftSlotIndex = leftColumn.findIndex(item => item?.id === oldId);
        const rightSlotIndex = rightColumn.findIndex(item => item?.id === oldId);

        setMatchedIds(prev => {
            const next = new Set(prev);
            next.add(oldId);
            return next;
        });
        setCorrectIds(prev => {
            const next = new Set(prev);
            next.delete(oldId);
            return next;
        });

        // Pick next word from pool
        const nextWord = allWordsPool[nextWordIndex.current];
        nextWordIndex.current += 1;

        if (nextWord) {
            replacementGuardsRef.current = [
                ...replacementGuardsRef.current,
                {
                    pairId: nextWord.id,
                    leftSlotIndex,
                    rightSlotIndex,
                    repeatCount: 1,
                    otherPairAttempts: 0
                }
            ];

            // Mark new word as currently appearing (non-clickable, fading in)
            setNewlyAppearingIds(prev => {
                const next = new Set(prev);
                next.add(nextWord.id);
                return next;
            });

            // Remove from newlyAppearingIds after 1 second (1000ms)
            setTimeout(() => {
                setNewlyAppearingIds(prev => {
                    const next = new Set(prev);
                    next.delete(nextWord.id);
                    return next;
                });
            }, 1000);
        } else {
            replacementGuardsRef.current = replacementGuardsRef.current.filter(guard => guard.pairId !== oldId);
        }

        setLeftColumn(prev => prev.map(item =>
            item?.id === oldId
                ? (nextWord ? { id: nextWord.id, text: nextWord.original, isOriginal: true } : null)
                : item
        ));
        setRightColumn(prev => prev.map(item =>
            item?.id === oldId
                ? (nextWord ? { id: nextWord.id, text: nextWord.translation, isOriginal: false } : null)
                : item
        ));
    };

    const checkMatch = (leftId: string, rightId: string) => {
        if (leftId === rightId) {
            // Correct logic
            soundService.playSuccessSound();
            setCorrectIds(prev => new Set([...prev, leftId]));
            setScore(prev => prev + 1);
            setSelectedLeftId(null);
            setSelectedRightId(null);
            recordCompletedOtherPairAttempt(leftId);
            replacementGuardsRef.current = replacementGuardsRef.current.filter(guard => guard.pairId !== leftId);

            // Record Leitner correct review
            const matchedWord = allWordsPool.find(w => w.id === leftId);
            if (matchedWord && currentUser) {
                answerWordLeitner(currentUser.uid, matchedWord, true);
            }

            // Wait 600ms and transition
            setTimeout(() => {
                setCorrectIds(prev => {
                    const next = new Set(prev);
                    next.delete(leftId);
                    return next;
                });
                
                replaceWordOnPlace(leftId);
            }, 600);
        } else {
            // Wrong
            soundService.playErrorSound();
            setErrors(prev => prev + 1);
            setWrongIds(new Set([leftId, rightId]));

            // Record Leitner incorrect review for both words involved in the incorrect match
            const leftWord = allWordsPool.find(w => w.id === leftId);
            const rightWord = allWordsPool.find(w => w.id === rightId);
            if (leftWord && currentUser) {
                answerWordLeitner(currentUser.uid, leftWord, false);
            }
            if (rightWord && currentUser) {
                answerWordLeitner(currentUser.uid, rightWord, false);
            }

            setTimeout(() => {
                setWrongIds(new Set());
                setSelectedLeftId(null);
                setSelectedRightId(null);
            }, 800);
        }
    };

    const handleChoice = (id: string, isOriginal: boolean, slotIndex: number) => {
        if (matchedIds.has(id) || correctIds.has(id)) return;

        const isCompletingCorrectMatch = (isOriginal && selectedRightId === id) || (!isOriginal && selectedLeftId === id);

        if (!isCompletingCorrectMatch) {
            const touchedGuard = replacementGuardsRef.current.find(guard =>
                guard.pairId === id || (isOriginal ? guard.leftSlotIndex === slotIndex : guard.rightSlotIndex === slotIndex)
            );

            if (touchedGuard) {
                const repeatCount = touchedGuard.repeatCount + 1;

                if (repeatCount >= REPLACEMENT_REPEAT_SHUFFLE_THRESHOLD) {
                    triggerReplacementShuffle();
                    return;
                }

                replacementGuardsRef.current = replacementGuardsRef.current.map(guard =>
                    guard === touchedGuard
                        ? { ...guard, repeatCount, otherPairAttempts: 0 }
                        : guard
                );
            } else {
                const selectedOppositeId = isOriginal ? selectedRightId : selectedLeftId;
                const isCompletingOtherPairAttempt = Boolean(selectedOppositeId);

                if (isCompletingOtherPairAttempt) {
                    replacementGuardsRef.current = replacementGuardsRef.current
                        .map(guard => ({ ...guard, otherPairAttempts: guard.otherPairAttempts + 1 }))
                        .filter(guard => guard.otherPairAttempts < REPLACEMENT_OTHER_ATTEMPT_RESET_THRESHOLD);
                }
            }
        }

        if (isOriginal) {
            setSelectedLeftId(id);
            const word = allWordsPool.find(w => w.id === id);
            const dict = dictionaries.find(d => d.id === dictId);

            // Play sound only if it's the first selection OR a correct match
            const isMatch = selectedRightId === id;
            if (word && (!selectedRightId || isMatch)) {
                speechService.speak(word.original, dict?.sourceLang || 'en');
            }

            if (selectedRightId) checkMatch(id, selectedRightId);
        } else {
            setSelectedRightId(id);
            const word = allWordsPool.find(w => w.id === id);
            const dict = dictionaries.find(d => d.id === dictId);

            // Play sound only if it's the first selection OR a correct match
            const isMatch = selectedLeftId === id;
            if (word && (!selectedLeftId || isMatch)) {
                speechService.speak(word.translation, dict?.targetLang || 'ru');
            }

            if (selectedLeftId) checkMatch(selectedLeftId, id);
        }
    };

    const isInitialLoading = loading && storeWords.length === 0;

    const toColumnEntries = (items: (MatchItem | null)[]): MatchColumnEntry[] => (
        items.map((item, slotIndex) => ({ item, slotIndex }))
    );

    const renderMatchCard = (entry: MatchColumnEntry, idx: number, isOriginal: boolean, keyPrefix: string) => {
        const item = entry.item;

        return item ? (
            <button
                key={`${keyPrefix}-${item.id}`}
                style={{
                    transitionDelay: isShuffling ? `${idx * 40}ms` : '0ms',
                    animationDelay: newlyAppearingIds.has(item.id) ? `${idx * 40}ms` : '0ms'
                }}
                className={`${styles.card}
                    ${(isOriginal ? selectedLeftId : selectedRightId) === item.id ? styles.selected : ''}
                    ${correctIds.has(item.id) ? styles.correct : ''}
                    ${wrongIds.has(item.id) && (isOriginal ? selectedLeftId : selectedRightId) === item.id ? styles.wrong : ''}
                    ${newlyAppearingIds.has(item.id) ? styles.appearing : ''}
                    ${isShuffling ? styles.fadeOut : ''}`}
                onClick={() => handleChoice(item.id, isOriginal, entry.slotIndex)}
                disabled={isShuffling || newlyAppearingIds.has(item.id)}
            >
                {isEliteMode && isOriginal ? <Volume2 size={24} /> : item.text}
            </button>
        ) : <div key={`${keyPrefix}-empty-${entry.slotIndex}-${idx}`} className={styles.emptySlot} />;
    };

    const renderMatchColumn = (entries: MatchColumnEntry[], isOriginal: boolean, keyPrefix: string) => (
        <div className={styles.column}>
            {entries.map((entry, idx) => renderMatchCard(entry, idx, isOriginal, keyPrefix))}
        </div>
    );

    const leftColumnEntries = toColumnEntries(leftColumn);
    const rightColumnEntries = toColumnEntries(rightColumn);
    const tabletSplitIndex = Math.ceil(leftColumnEntries.length / 2);
    const tabletLeftFirst = leftColumnEntries.slice(0, tabletSplitIndex);
    const tabletLeftSecond = leftColumnEntries.slice(tabletSplitIndex);
    const getTabletTranslations = (sourceEntries: MatchColumnEntry[]) => {
        const sourceIds = new Set(sourceEntries.flatMap(entry => entry.item ? [entry.item.id] : []));
        const translations = rightColumnEntries.filter(entry => entry.item && sourceIds.has(entry.item.id));
        return [
            ...translations,
            ...Array.from({ length: Math.max(sourceEntries.length - translations.length, 0) }, (_, index) => ({
                item: null,
                slotIndex: -index - 1
            }))
        ];
    };
    const tabletRightFirst = getTabletTranslations(tabletLeftFirst);
    const tabletRightSecond = getTabletTranslations(tabletLeftSecond);

    const renderSetup = () => {
        const isRu = language === 'ru';
        const activeDictionaryName = (!currentUser || dictId === 'default' || !dictId)
            ? t('common.defaultDict')
            : (dictionaries.find(d => d.id === dictId)?.name || '...');
        const completedRanks = RANKS.filter(rank => perfectRanks[rank.id]).length;
        const availableRanks = RANKS.filter((rank, index) => {
            const isPreviousPerfect = index === 0 || perfectRanks[RANKS[index - 1].id] === true;
            return playableWords.length >= rank.count && isPreviousPerfect;
        }).length;

        const rankViews = RANKS.map((rank, index) => {
            const isPreviousPerfect = index === 0 || perfectRanks[RANKS[index - 1].id] === true;
            const hasEnoughWords = playableWords.length >= rank.count;
            const isLocked = !hasEnoughWords || !isPreviousPerfect;
            const isPerfect = perfectRanks[rank.id] === true;

            let lockReason = '';
            if (!hasEnoughWords) {
                lockReason = isRu
                    ? `Нужно ${rank.count} слов`
                    : `Needs ${rank.count} words`;
            } else if (!isPreviousPerfect) {
                lockReason = isRu
                    ? `Нужен идеальный ранг "${RANKS[index - 1].name}"`
                    : `Requires perfect "${RANKS[index - 1].name}" rank`;
            }

            const statusLabel = isPerfect
                ? (isRu ? 'Идеально' : 'Perfect')
                : isLocked
                    ? (isRu ? 'Закрыто' : 'Locked')
                    : (isRu ? 'Готово' : 'Ready');

            return {
                rank,
                index,
                isLocked,
                isPerfect,
                statusLabel,
                lockReason,
            };
        });

        return (
        <div className={`${styles.setupShell} ${loading ? styles.setupLoading : ''}`}>
            <div className={`${styles.setupContainer} ${loading ? styles.setupLoading : ''} ${phase !== 'SETUP' ? styles.compactSetup : ''}`}>
                <div className={styles.setupToolbar}>
                    <div className={styles.toolbarTitleRow}>
                        <button type="button" onClick={() => navigate('/games')} className={styles.backButtonInline} title={t('common.back')}>
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className={styles.royalTitle}>{t('games.pairwords.title')}</h1>
                            <p className={styles.setupSubtitle}>{t('games.pairwords.description')}</p>
                        </div>
                        <button
                            type="button"
                            className={`${styles.mobileSetupToggle} ${isMobileSetupOpen ? styles.open : ''}`}
                            onClick={() => setIsMobileSetupOpen(!isMobileSetupOpen)}
                            aria-label={isRu ? 'Показать настройки' : 'Show settings'}
                        >
                            <ChevronDown size={24} />
                        </button>
                    </div>

                    <div className={`${styles.setupControls} ${isMobileSetupOpen ? styles.open : ''}`}>
                        <div className={styles.dictSelector}>
                            <button
                                type="button"
                                className={styles.selectorHeader}
                                onClick={() => setIsDictSelectorOpen(!isDictSelectorOpen)}
                            >
                                <span className={styles.selectorLabel}>{t('common.dictionary')}</span>
                                <span className={styles.activeDictName}>
                                    {activeDictionaryName}
                                </span>
                                <ChevronDown size={18} className={`${styles.chevron} ${isDictSelectorOpen ? styles.open : ''}`} />
                            </button>

                            {isDictSelectorOpen && (
                                <div className={styles.dictOptions}>
                                    <button
                                        type="button"
                                        className={`${styles.dictTab} ${dictId === 'default' ? styles.activeTab : ''}`}
                                        onClick={() => handleDictionaryChange('default')}
                                    >
                                        {t('common.defaultDict')}
                                    </button>
                                    {dictionaries
                                        .filter(d => d.id !== 'default' && !d.name.includes('English 2500'))
                                        .map(d => (
                                            <button
                                                type="button"
                                                key={d.id}
                                                className={`${styles.dictTab} ${dictId === d.id ? styles.activeTab : ''}`}
                                                onClick={() => handleDictionaryChange(d.id)}
                                            >
                                                {d.name}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.difficultyContainer}>
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={isEliteMode}
                                    onChange={(e) => setIsEliteMode(e.target.checked)}
                                    className={styles.hiddenCheckbox}
                                />
                                <div className={`${styles.customToggle} ${isEliteMode ? styles.active : ''}`}>
                                    <div className={styles.toggleThumb} />
                                </div>
                                <span className={styles.toggleText}>
                                    {isEliteMode ? t('games.pairwords.eliteMode') : t('games.pairwords.normalMode')}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className={styles.setupSummary}>
                    <div className={styles.summaryItem}>
                        <BookOpen size={18} />
                        <span className={styles.summaryLabel}>{isRu ? 'Слов' : 'Words'}</span>
                        <strong>{playableWords.length}</strong>
                    </div>
                    <div className={styles.summaryItem}>
                        <Target size={18} />
                        <span className={styles.summaryLabel}>{isRu ? 'Доступно' : 'Open'}</span>
                        <strong>{availableRanks}/{RANKS.length}</strong>
                    </div>
                    <div className={styles.summaryItem}>
                        <CheckCircle2 size={18} />
                        <span className={styles.summaryLabel}>{isRu ? 'Идеально' : 'Perfect'}</span>
                        <strong>{completedRanks}</strong>
                    </div>
                </div>
            </div>

            <div className={styles.setupBody}>
                <aside className={styles.rankPath} aria-label={isRu ? 'Прогресс рангов' : 'Rank progress'}>
                    {rankViews.map(({ rank, index, isLocked, isPerfect, statusLabel }) => (
                        <div
                            key={rank.id}
                            className={`${styles.pathStep} ${isLocked ? styles.lockedPath : ''} ${isPerfect ? styles.perfectPath : ''} ${!isLocked && !isPerfect ? styles.readyPath : ''}`}
                        >
                            <div className={styles.pathMarker}>
                                <img className={styles.pathBadge} src={rank.badgeSrc} alt="" aria-hidden="true" />
                                {isPerfect && <CheckCircle2 className={styles.pathStateIcon} size={13} />}
                                {isLocked && <LockKeyhole className={styles.pathStateIcon} size={13} />}
                            </div>
                            <div className={styles.pathCopy}>
                                <span>{rank.name}</span>
                                <small>{statusLabel}</small>
                            </div>
                            <span className={styles.pathCount}>{index + 1}</span>
                        </div>
                    ))}
                </aside>

                <div className={styles.rankGrid}>
                    {rankViews.map(({ rank, index, isLocked, isPerfect, statusLabel, lockReason }) => (
                            <button
                                type="button"
                                key={rank.id}
                                className={`${styles.rankCard} ${isLocked ? styles.locked : ''} ${isPerfect ? styles.perfect : ''} ${!isLocked && !isPerfect ? styles.ready : ''}`}
                                onClick={() => !isLocked && startLevel(rank)}
                                disabled={loading || isLocked}
                            >
                                <div className={styles.rankBadgeStage}>
                                    <img className={styles.rankBadge} src={rank.badgeSrc} alt="" aria-hidden="true" />
                                    <span className={styles.rankLevelCue}>{index + 1}</span>
                                    {isPerfect && <CheckCircle2 className={styles.rankStateIcon} size={18} />}
                                    {isLocked && <LockKeyhole className={styles.rankStateIcon} size={18} />}
                                </div>
                                <div className={styles.rankDetails}>
                                    <div className={styles.rankTitleRow}>
                                        <h3 className={styles.rankName}>{rank.name}</h3>
                                        <span className={`${styles.rankStatus} ${isLocked ? styles.statusLocked : ''} ${isPerfect ? styles.statusPerfect : ''}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <div className={styles.rankDetailSub}>
                                        {isLocked ? (
                                            <span className={styles.lockReasonText}>{lockReason}</span>
                                        ) : (
                                            <>
                                                <span>{rank.description}</span>
                                                <span className={styles.rankAction}>
                                                    <Play size={14} /> {isRu ? 'Начать' : 'Start'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                </div>
            </div>

            {playableWords.length === 0 && !loading && (
                <div className={styles.noWordsWarning}>
                    {t('games.pairwords.noWords')}
                </div>
            )}
        </div>
        );
    };



    return (
        <div className={`${styles.container} ${phase === 'PLAY' ? styles.gameplayContainer : ''}`}>
            {isInitialLoading && (
                <button onClick={() => navigate('/games')} className={styles.floatingBackButton} title={t('common.back')}>
                    <ArrowLeft size={24} />
                </button>
            )}

            {isInitialLoading || !hasAttemptedLoad ? (
                <div className={styles.loading}>{t('common.loading')}</div>
            ) : phase === 'SETUP' ? (
                renderSetup()
            ) : allWordsPool.length === 0 ? (
                <div className={styles.empty}>
                    <h2>🎉 {t('common.allLearned')}</h2>
                    <p>{t('games.flashcards.sessionComplete')}</p>
                    <button onClick={() => setPhase('SETUP')} className={styles.retryButton}>
                        {t('common.restart')}
                    </button>
                    <button onClick={() => navigate('/games')} className={styles.backButton}>
                        {t('common.back')}
                    </button>
                </div>
            ) : (
                <>
                    <header className={styles.header}>
                        <button onClick={() => setPhase('SETUP')} className={styles.backButton} title={t('common.back')}>
                            <ArrowLeft size={24} />
                        </button>
                        <div className={styles.stats}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('games.pairwords.score')}</span>
                                <span className={styles.statValue}>{score} / {totalPairs}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('common.time')}</span>
                                <span className={styles.statValue}>{formatTime(timer)}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('common.errors')}</span>
                                <span className={styles.statValue} style={{ color: errors > 0 ? '#ef4444' : 'inherit' }}>{errors}</span>
                            </div>
                        </div>
                        <div className={styles.currentRankLabel}>
                            {selectedRank?.icon && <selectedRank.icon size={18} />}
                            <span>{selectedRank?.name}</span>
                        </div>
                    </header>

                    <div className={styles.gameArea}>
                        {!isAllDone && (
                            <>
                                <div className={styles.gameControls}>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${(matchedIds.size / totalPairs) * 100}%` }} />
                                    </div>
                                </div>

                                <div className={`${styles.columns} ${styles.desktopColumns}`}>
                                    {renderMatchColumn(leftColumnEntries, true, 'left')}
                                    {renderMatchColumn(rightColumnEntries, false, 'right')}
                                </div>

                                <div className={`${styles.columns} ${styles.tabletColumns}`}>
                                    {renderMatchColumn(tabletLeftFirst, true, 'tablet-left-a')}
                                    {renderMatchColumn(tabletRightFirst, false, 'tablet-right-a')}
                                    {renderMatchColumn(tabletLeftSecond, true, 'tablet-left-b')}
                                    {renderMatchColumn(tabletRightSecond, false, 'tablet-right-b')}
                                </div>
                            </>
                        )}
                    </div>

                    {isAllDone && (
                        <div className={styles.resultsOverlay}>
                            <div className={styles.results}>
                                <div className={styles.successIcon}>
                                    <Sparkles size={64} />
                                </div>
                                <h2>{resultTitle}</h2>
                                <p>{resultMessage}</p>

                                <div className={styles.finalStatsGrid}>
                                    <div className={styles.finalStatCard}>
                                        <div className={styles.finalStatLabel}>{t('common.score')}</div>
                                        <div className={styles.finalStatValue}>{score}</div>
                                    </div>
                                    <div className={styles.finalStatCard}>
                                        <div className={styles.finalStatLabel}>{t('common.time')}</div>
                                        <div className={styles.finalStatValue}>{formatTime(timer)}</div>
                                    </div>
                                    <div className={styles.finalStatCard}>
                                        <div className={styles.finalStatLabel}>{t('common.errors')}</div>
                                        <div className={styles.finalStatValue} style={{ color: errors > 0 ? '#ef4444' : 'inherit' }}>{errors}</div>
                                    </div>
                                </div>
                                <button onClick={() => setPhase('SETUP')} className={styles.restartButton}>
                                    <RefreshCw size={20} /> {t('common.playAgain')}
                                </button>
                                <button onClick={() => navigate('/games')} className={styles.menuButton}>
                                    {t('common.menu')}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
