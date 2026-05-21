import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { defaultWords } from '../data/defaultWords';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { saveRecentActivity } from '../utils/activity';
import { Trophy, Shield, Sword, Crown, User, Landmark, Ghost, ChevronDown, Volume2, ArrowLeft, Sparkles } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import { soundService } from '../utils/soundUtils';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import type { Word } from '../types';
import styles from './NBack.module.css';

type Phase = 'SETUP' | 'MEMORIZE' | 'PLAY' | 'GAMEOVER';

interface Rank {
    id: string;
    name: string;
    n: number;
    optionsCount: number;
    icon: any;
    description: string;
    detailStr: string;
}

export default function NBack() {
    const { dictId } = useParams<{ dictId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { t, language } = useLanguage();

    const RANKS = useMemo<Rank[]>(() => [
        { id: 'peasant', name: t('ranks.peasant.name'), n: 1, optionsCount: 4, icon: Ghost, description: t('ranks.peasant.desc'), detailStr: `1 word • 4 variants` },
        { id: 'citizen', name: t('ranks.citizen.name'), n: 1, optionsCount: 6, icon: User, description: t('ranks.citizen.desc'), detailStr: `1 word • 6 variants` },
        { id: 'knight', name: t('ranks.knight.name'), n: 1, optionsCount: 8, icon: Sword, description: t('ranks.knight.desc'), detailStr: `1 word • 8 variants` },
        { id: 'baron', name: t('ranks.baron.name'), n: 2, optionsCount: 4, icon: Shield, description: t('ranks.baron.desc'), detailStr: `2 words • 4 variants` },
        { id: 'count', name: t('ranks.count.name'), n: 2, optionsCount: 6, icon: Landmark, description: t('ranks.count.desc'), detailStr: `2 words • 6 variants` },
        { id: 'duke', name: t('ranks.duke.name'), n: 2, optionsCount: 8, icon: Trophy, description: t('ranks.duke.desc'), detailStr: `2 words • 8 variants` },
        { id: 'king', name: t('ranks.king.name'), n: 3, optionsCount: 6, icon: Crown, description: t('ranks.king.desc'), detailStr: `3 words • 6 variants` },
        { id: 'emperor', name: t('ranks.emperor.name'), n: 4, optionsCount: 6, icon: Sparkles, description: t('ranks.emperor.desc'), detailStr: `4 words • 6 variants` },
    ], [t]);

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchSharedWords = useDictionaryStore(state => state.fetchSharedWords);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    const answerWordLeitner = useDictionaryStore(state => state.answerWordLeitner);
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const storeWords = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);

    const [phase, setPhase] = useState<Phase>('SETUP');
    const [isDictSelectorOpen, setIsDictSelectorOpen] = useState(false);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
    const [wordQueue, setWordQueue] = useState<Word[]>([]);
    const [currentIndexInQueue, setCurrentIndexInQueue] = useState(0);
    const [currentOptions, setCurrentOptions] = useState<Word[]>([]);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [penaltySeconds, setPenaltySeconds] = useState(0);
    const [errorWordId, setErrorWordId] = useState<string | null>(null);

    const [isEliteMode, setIsEliteMode] = useState(() => {
        const saved = localStorage.getItem('benedicti_nback_elite');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('benedicti_nback_elite', JSON.stringify(isEliteMode));
    }, [isEliteMode]);

    const timerRef = useRef<number | null>(null);
    const gameStartTimeRef = useRef<number>(0);

    // Track activity
    useEffect(() => {
        if (dictId && dictId !== 'default' && dictionaries.length > 0) {
            const currentDict = dictionaries.find(d => d.id === dictId);
            if (currentDict) {
                saveRecentActivity({
                    dictId,
                    dictName: currentDict.name,
                    mode: 'nbackword'
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
        navigate(`/play/nback/${newDictId}`);
        setIsDictSelectorOpen(false);
    };

    // Auto-speak in N-Back (sequenced audio)
    useEffect(() => {
        let isActive = true;

        const playSequence = async () => {
            if ((phase === 'MEMORIZE' || phase === 'PLAY') && wordQueue.length > 0) {
                const currentDict = dictionaries.find(d => d.id === dictId);
                const word = (phase === 'MEMORIZE'
                    ? wordQueue[currentIndexInQueue]
                    : wordQueue[wordQueue.length - 1]) as any;

                if (word && isActive) {
                    const text = word[word.displaySide];
                    const lang = word.displaySide === 'original'
                        ? (currentDict?.sourceLang || 'en')
                        : (currentDict?.targetLang || 'ru');

                    // 1. Initial wait for word to appear visually
                    await new Promise(r => setTimeout(r, 600));
                    if (!isActive) return;

                    // 2. Speak main word and WAIT for it to finish
                    await speechService.speak(text, lang);

                    // 3. If not elite mode, speak the hint (translation)
                    if (!isEliteMode && isActive) {
                        const hintText = word[word.displaySide === 'original' ? 'translation' : 'original'];
                        const hintLang = word.displaySide === 'original'
                            ? (currentDict?.targetLang || 'ru')
                            : (currentDict?.sourceLang || 'en');

                        // Brief natural pause between words
                        await new Promise(r => setTimeout(r, 400));
                        if (!isActive) return;

                        await speechService.speak(hintText, hintLang);
                    }
                }
            }
        };

        playSequence();

        return () => {
            isActive = false;
            speechService.cancel();
        };
    }, [phase, currentIndexInQueue, wordQueue[wordQueue.length - 1]?.id, isEliteMode]);

    const handleManualSpeak = (e: React.MouseEvent, word: any) => {
        e.stopPropagation();
        const currentDict = dictionaries.find(d => d.id === dictId);
        const text = word[word.displaySide];
        const lang = word.displaySide === 'original'
            ? (currentDict?.sourceLang || 'en')
            : (currentDict?.targetLang || 'ru');
        speechService.speak(text, lang);
    };

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, []);

    const SESSION_SIZE = 15;

    const generateOptions = useCallback((correctWord: any, count: number, distPool: any[]) => {
        const distractors = distPool
            .filter(w => w.id !== correctWord.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, count - 1);

        return [...distractors, correctWord].sort(() => Math.random() - 0.5);
    }, []);

    const startMemorizing = async (rank: Rank) => {
        // Filter out learned words and prioritize due words
        const unlearned = storeWords.filter(w => !w.isLearned);
        const now = Date.now();
        const dueWords = unlearned.filter(w => !w.nextReview || w.nextReview <= now);
        const notDueWords = unlearned.filter(w => w.nextReview && w.nextReview > now);

        const shuffledDue = [...dueWords].sort(() => Math.random() - 0.5);
        const shuffledNotDue = [...notDueWords].sort(() => Math.random() - 0.5);
        let pool = [...shuffledDue, ...shuffledNotDue];

        if (pool.length < SESSION_SIZE) {
            try {
                const learnedSnapshot = await get(ref(db, `users/${currentUser?.uid}/learnedSharedWords`));
                const learnedIds = learnedSnapshot.exists() ? learnedSnapshot.val() : {};

                const sharedSnapshot = await get(ref(db, 'shared/dictionaries/dict2500/words'));
                if (sharedSnapshot.exists()) {
                    const clean = (text: string) => {
                        if (!text) return '';
                        let cleaned = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
                        return cleaned.split(';')[0].trim();
                    };

                    const sharedPool: Word[] = [];
                    sharedSnapshot.forEach(child => {
                        if (!learnedIds[child.key!]) {
                            const data = child.val();
                            sharedPool.push({
                                id: child.key!,
                                dictionaryId: 'default',
                                original: clean(data.original),
                                translation: clean(data.translation),
                                box: 0,
                                nextReview: Date.now(),
                                createdAt: Date.now()
                            });
                        }
                    });

                    const needed = SESSION_SIZE - pool.length;
                    const additions = sharedPool.sort(() => Math.random() - 0.5).slice(0, needed);
                    pool = [...pool, ...additions];
                } else {
                    // Fallback to embedded if snapshot doesn't exist
                    const needed = SESSION_SIZE - pool.length;
                    pool = [...pool, ...defaultWords.slice(0, needed)];
                }
            } catch (err) {
                // Silence Permission denied and fallback
                const needed = SESSION_SIZE - pool.length;
                pool = [...pool, ...defaultWords.slice(0, needed)];
            }
        }

        if (pool.length < SESSION_SIZE) {
            alert(t('common.notEnoughWords'));
            return;
        }

        // Randomize 15 words and assign a display side (original or translation) to each
        const sessionWords = pool.sort(() => Math.random() - 0.5).slice(0, SESSION_SIZE).map(w => ({
            ...w,
            displaySide: (Math.random() > 0.5 ? 'original' : 'translation') as 'original' | 'translation'
        }));
        (window as any)._sessionWords = sessionWords;

        setSelectedRank(rank);
        setWordQueue(sessionWords.slice(0, rank.n));
        setCurrentIndexInQueue(0);
        setScore(0);
        setTimer(0);
        setPenaltySeconds(0);
        setPhase('MEMORIZE');
    };

    const handleNextMemorize = () => {
        if (!selectedRank || wordQueue.length === 0) return;

        if (currentIndexInQueue < selectedRank.n - 1) {
            setCurrentIndexInQueue(prev => prev + 1);
        } else {
            setPhase('PLAY');
            const sessionWords = (window as any)._sessionWords as any[];
            const firstGameWord = sessionWords[selectedRank.n];

            const newQueue = [...wordQueue, firstGameWord];
            setWordQueue(newQueue);

            const targetWord = newQueue[0];
            setCurrentOptions(generateOptions(targetWord, selectedRank.optionsCount, sessionWords));

            gameStartTimeRef.current = Date.now();
            startTimer();
        }
    };

    const startTimer = () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            setTimer((Date.now() - gameStartTimeRef.current) / 1000);
        }, 10);
    };

    const handleChoice = async (chosenWord: Word) => {
        if (!selectedRank || wordQueue.length === 0) return;

        const targetWord = wordQueue[0];
        const sessionWords = (window as any)._sessionWords as Word[];

        if (chosenWord.id === targetWord.id) {
            soundService.playSuccessSound();
            const currentTotalProcessed = selectedRank.n + 1 + score;
            const newScore = score + 1;
            setScore(newScore);

            // Record Leitner correct review
            if (currentUser) {
                answerWordLeitner(currentUser.uid, targetWord, true);
            }

            // Audio feedback for correct answer
            const currentDict = dictionaries.find(d => d.id === dictId);
            const answerSide = targetWord.displaySide === 'original' ? 'translation' : 'original';
            speechService.speak(chosenWord[answerSide], answerSide === 'original' ? (currentDict?.sourceLang || 'en') : (currentDict?.targetLang || 'ru'));

            if (currentTotalProcessed >= SESSION_SIZE) {
                if (timerRef.current) window.clearInterval(timerRef.current);
                setPhase('GAMEOVER');
                return;
            }

            const nextWord = sessionWords[currentTotalProcessed];
            const newQueue = [...wordQueue.slice(1), nextWord];
            setWordQueue(newQueue);

            const newTarget = newQueue[0] as any;
            setCurrentOptions(generateOptions(newTarget, selectedRank.optionsCount, sessionWords));
        } else {
            soundService.playErrorSound();
            setErrorWordId(chosenWord.id);
            setPenaltySeconds(prev => prev + 1);

            // Record Leitner incorrect review
            if (currentUser) {
                answerWordLeitner(currentUser.uid, targetWord, false);
            }

            setTimeout(() => {
                setErrorWordId(null);
            }, 600);
        }
    };

    const isInitialLoading = loading && storeWords.length === 0;

    const getInstructionSuffix = (n: number) => {
        if (language === 'ru') {
            if (n === 1) return t('games.nbackword.steps_one');
            if (n >= 2 && n <= 4) return t('games.nbackword.steps_few');
            return t('games.nbackword.steps_many');
        }
        return n === 1 ? t('games.nbackword.steps_one') : t('games.nbackword.steps_few');
    };

    return (
        <div className={styles.container}>
            {isInitialLoading || !hasAttemptedLoad ? (
                <div className={styles.loading}>{t('common.loading')}</div>
            ) : (
                <>
                    {phase === 'SETUP' ? (
                        <div className={styles.setupContainer}>
                            <div className={styles.setupToolbar}>
                                <div className={styles.toolbarTitleRow}>
                                    <button className={styles.backButtonInline} onClick={() => navigate('/games')}>
                                        <ArrowLeft size={24} />
                                    </button>
                                    <h1 className={styles.royalTitle}>NBACKWORD</h1>
                                </div>

                                <div className={styles.setupControls}>
                                    <div className={styles.dictSelector}>
                                        <div
                                            className={styles.selectorHeader}
                                            onClick={() => setIsDictSelectorOpen(!isDictSelectorOpen)}
                                        >
                                            <span className={styles.selectorLabel}>{t('common.dictionary')}:</span>
                                            <span className={styles.activeDictName}>
                                                {(!currentUser || dictId === 'default' || !dictId) 
                                                    ? 'Дефолтный словарь' 
                                                    : (dictionaries.find(d => d.id === dictId)?.name || '...')}
                                            </span>
                                            <ChevronDown size={14} className={`${styles.chevron} ${isDictSelectorOpen ? styles.open : ''}`} />
                                        </div>

                                        {isDictSelectorOpen && (
                                            <div className={styles.dictOptions}>
                                                <button
                                                    className={`${styles.dictTab} ${dictId === 'default' ? styles.activeTab : ''}`}
                                                    onClick={() => handleDictionaryChange('default')}
                                                >
                                                    {t('common.defaultDict')}
                                                </button>
                                                {dictionaries
                                                    .filter(d => d.id !== 'default' && !d.name.includes('Дефолтный словарь'))
                                                    .map(d => (
                                                        <button
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
                                                {isEliteMode ? t('games.nbackword.eliteMode') : t('games.nbackword.normalMode')}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.rankGrid}>
                                {RANKS.map(rank => (
                                    <div key={rank.id} className={styles.rankCard} onClick={() => startMemorizing(rank)}>
                                        <div className={styles.rankIcon}>
                                            <rank.icon size={32} />
                                        </div>
                                        <div className={styles.rankDetails}>
                                            <div className={styles.rankName}>{rank.name}</div>
                                            <div className={styles.rankDetailSub}>
                                                {rank.detailStr}: {rank.description}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.gameArea}>
                            <header className={styles.header}>
                                <button
                                    className={styles.backButton}
                                    onClick={() => {
                                        if (timerRef.current) window.clearInterval(timerRef.current);
                                        setPhase('SETUP');
                                    }}
                                    title={t('common.back')}
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <h1 className={styles.gameHeaderTitle}>NBACKWORD</h1>
                                <div className={styles.stats}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>{t('games.nbackword.score')}</span>
                                        <span className={styles.statValue}>{score}</span>
                                    </div>
                                </div>
                            </header>

                            {phase === 'MEMORIZE' && selectedRank && (
                                <div className={styles.memorizeContainer}>
                                    <h2 className={styles.royalTitle}>{t('games.nbackword.rememberN', { n: currentIndexInQueue + 1 })}</h2>
                                    <div className={styles.wordToRemember}>
                                        {(() => {
                                            const word = wordQueue[currentIndexInQueue] as any;
                                            const mainText = word[word.displaySide];
                                            const hintText = word[word.displaySide === 'original' ? 'translation' : 'original'];
                                            return (
                                                <div className={styles.wordWrapper}>
                                                    <div className={styles.wordWithSpeaker}>
                                                        <div className={styles.mainWord}>{mainText}</div>
                                                        <button
                                                            className={styles.playButton}
                                                            onClick={(e) => handleManualSpeak(e, word)}
                                                        >
                                                            <Volume2 size={24} />
                                                        </button>
                                                    </div>
                                                    {!isEliteMode && (
                                                        <div className={styles.translationHint}>— {hintText} —</div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className={styles.progressText}>
                                        <span style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 600 }}>
                                            {t('games.nbackword.prepareStatus', { current: currentIndexInQueue + 1, total: selectedRank.n })}
                                        </span>
                                    </div>
                                    <button className={styles.royalButton} onClick={handleNextMemorize}>
                                        {currentIndexInQueue < selectedRank.n - 1 ? t('games.nbackword.nextWord') : t('games.nbackword.start')}
                                    </button>
                                </div>
                            )}

                            {phase === 'PLAY' && selectedRank && (
                                <div className={styles.playPhaseContainer}>
                                    <div className={styles.playInnerContainer}>
                                        <div className={styles.gameHeader}>
                                            <div className={styles.score}>
                                                {t('games.nbackword.step', { current: score + 1, total: SESSION_SIZE - selectedRank.n })}
                                            </div>
                                            <div className={styles.timerWrapper}>
                                                <div className={styles.timer}>{timer.toFixed(2)}</div>
                                                {penaltySeconds > 0 && (
                                                    <div className={styles.penaltyBadge}>+{penaltySeconds}s</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.currentWordBox}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                {t('games.nbackword.rememberCurrent')}
                                            </div>
                                            <h2 className={styles.wordToRemember} style={{ margin: 0 }}>
                                                {(() => {
                                                    const word = wordQueue[wordQueue.length - 1] as any;
                                                    const mainText = word[word.displaySide];
                                                    const hintText = word[word.displaySide === 'original' ? 'translation' : 'original'];
                                                    return (
                                                        <div className={styles.wordWrapper}>
                                                            <div className={styles.wordWithSpeaker}>
                                                                <div className={styles.mainWord}>{mainText}</div>
                                                                <button
                                                                    className={styles.playButton}
                                                                    onClick={(e) => handleManualSpeak(e, word)}
                                                                >
                                                                    <Volume2 size={24} />
                                                                </button>
                                                            </div>
                                                            {!isEliteMode && (
                                                                <div className={styles.translationHint}>— {hintText} —</div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </h2>
                                        </div>

                                        <div className={styles.gameInstruction}>
                                            {t('games.nbackword.instruction', { n: selectedRank.n, steps: getInstructionSuffix(selectedRank.n) })}
                                        </div>

                                        <div className={styles.optionsList}>
                                            {currentOptions.map(option => {
                                                const targetWord = wordQueue[0] as any;
                                                const answerSide = targetWord.displaySide === 'original' ? 'translation' : 'original';
                                                return (
                                                    <button
                                                        key={option.id}
                                                        className={`${styles.optionButton} ${errorWordId === option.id ? styles.error : ''}`}
                                                        onClick={() => handleChoice(option)}
                                                    >
                                                        {option[answerSide]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {phase === 'GAMEOVER' && selectedRank && (
                                <div className={styles.results}>
                                    <h1 className={styles.royalTitle}>{t('games.nbackword.challengeCompleted')}</h1>
                                    <div className={styles.finalRankBadge}>
                                        <div className={styles.finalRankIcon}>
                                            <selectedRank.icon size={48} />
                                        </div>
                                        <div className={styles.finalRank}>{selectedRank.name}</div>
                                    </div>

                                    <div className={styles.resultsGrid}>
                                        <div className={styles.resultItem}>
                                            <span>{t('games.nbackword.pureTime')}</span>
                                            <strong>{timer.toFixed(2)}s</strong>
                                        </div>
                                        <div className={styles.resultItem}>
                                            <span>{t('games.nbackword.penalties')}</span>
                                            <strong style={{ color: '#ef4444' }}>+{penaltySeconds}s</strong>
                                        </div>
                                        <div className={styles.totalResult}>
                                            <span>{t('games.nbackword.total')}:</span>
                                            <strong>{(timer + penaltySeconds).toFixed(2)}s</strong>
                                        </div>
                                    </div>

                                    <div className={styles.resultsButtons}>
                                        <button className={styles.royalButton} onClick={() => setPhase('SETUP')}>
                                            {t('games.nbackword.repeatFeat')}
                                        </button>
                                        <button className={styles.secondaryButton} onClick={() => navigate('/games')}>
                                            {t('games.nbackword.returnToHall')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
