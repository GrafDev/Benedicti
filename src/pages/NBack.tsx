import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Shield, Sword, Crown, User, Coins, Landmark, Ghost, ChevronDown } from 'lucide-react';
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
}

const RANKS: Rank[] = [
    { id: 'peasant', name: 'Крестьянин', n: 1, optionsCount: 4, icon: Ghost, description: 'Запоминайте вчерашнее' },
    { id: 'merchant', name: 'Купец', n: 1, optionsCount: 6, icon: Coins, description: 'Учет каждой сделки' },
    { id: 'citizen', name: 'Горожанин', n: 2, optionsCount: 4, icon: User, description: 'Слухи по городу' },
    { id: 'knight', name: 'Рыцарь', n: 2, optionsCount: 6, icon: Sword, description: 'Кодекс чести и памяти' },
    { id: 'baron', name: 'Барон', n: 3, optionsCount: 6, icon: Shield, description: 'Управление поместьем' },
    { id: 'count', name: 'Граф', n: 3, optionsCount: 8, icon: Landmark, description: 'Интриги при дворе' },
    { id: 'duke', name: 'Герцог', n: 4, optionsCount: 8, icon: Trophy, description: 'Правая рука короля' },
    { id: 'king', name: 'Король', n: 5, optionsCount: 10, icon: Crown, description: 'Властелин памяти' },
];

export default function NBack() {
    const { dictId } = useParams<{ dictId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchSharedWords = useDictionaryStore(state => state.fetchSharedWords);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const storeWords = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);

    const [phase, setPhase] = useState<Phase>('SETUP');
    const [isDictSelectorOpen, setIsDictSelectorOpen] = useState(false);
    const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
    const [wordQueue, setWordQueue] = useState<Word[]>([]);
    const [currentIndexInQueue, setCurrentIndexInQueue] = useState(0);
    const [currentOptions, setCurrentOptions] = useState<Word[]>([]);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [penaltySeconds, setPenaltySeconds] = useState(0);
    const [errorWordId, setErrorWordId] = useState<string | null>(null);

    const [isEliteMode, setIsEliteMode] = useState(true);
    const timerRef = useRef<number | null>(null);
    const gameStartTimeRef = useRef<number>(0);

    // Track activity
    useEffect(() => {
        if (dictId && dictId !== 'default' && dictionaries.length > 0) {
            const currentDict = dictionaries.find(d => d.id === dictId);
            if (currentDict) {
                localStorage.setItem('benedicti_last_activity', JSON.stringify({
                    dictId,
                    dictName: currentDict.name,
                    mode: 'nback',
                    timestamp: Date.now()
                }));
            }
        }
    }, [dictId, dictionaries]);

    // Initial Load
    useEffect(() => {
        if (currentUser) {
            fetchDictionaries(currentUser.uid);
        }
    }, [currentUser, fetchDictionaries]);

    useEffect(() => {
        const loadWords = async () => {
            if (dictId === 'default') {
                await fetchSharedWords(currentUser?.uid);
            } else if (currentUser && dictId) {
                await fetchWords(currentUser.uid, dictId);
            }
        };
        loadWords();
    }, [dictId, currentUser, fetchWords, fetchSharedWords]);

    const handleDictionaryChange = (newDictId: string) => {
        navigate(`/play/nback/${newDictId}`);
        setIsDictSelectorOpen(false);
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
        let pool = [...storeWords];

        if (pool.length < SESSION_SIZE) {
            const learnedSnapshot = await get(ref(db, `users/${currentUser?.uid}/learnedSharedWords`));
            const learnedIds = learnedSnapshot.exists() ? learnedSnapshot.val() : {};
            
            const sharedSnapshot = await get(ref(db, 'shared/dictionaries/dict2500/words'));
            if (sharedSnapshot.exists()) {
                console.log('✅ Snapshot exists, items found:', sharedSnapshot.size);
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
            }
        }

        if (pool.length < SESSION_SIZE) {
            alert('Недостаточно слов в словарях для начала игры!');
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
            const currentTotalProcessed = selectedRank.n + 1 + score;
            const newScore = score + 1;
            setScore(newScore);
            
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
            setErrorWordId(chosenWord.id);
            setPenaltySeconds(prev => prev + 1);
            setTimeout(() => {
                setErrorWordId(null);
            }, 600);
        }
    };

    if (loading) return <div className={styles.container}>Загрузка...</div>;

    const totalFinalTime = timer + penaltySeconds;

    return (
        <div className={styles.container}>
            {phase === 'SETUP' && (
                <div className={styles.setupContainer}>
                    <h1 className={styles.royalTitle}>Трон Бенедикта</h1>
                    
                    <div className={styles.dictSelector}>
                        <button 
                            className={styles.selectorHeader}
                            onClick={() => setIsDictSelectorOpen(!isDictSelectorOpen)}
                        >
                            <span className={styles.selectorLabel}>Словарь:</span>
                            <span className={styles.activeDictName}>
                                {dictId === 'default' ? 'English 2500' : dictionaries.find(d => d.id === dictId)?.name || 'Мой словарь'}
                            </span>
                            <ChevronDown size={18} className={`${styles.chevron} ${isDictSelectorOpen ? styles.open : ''}`} />
                        </button>
                        
                        {isDictSelectorOpen && (
                            <div className={styles.dictOptions}>
                                <button 
                                    className={`${styles.dictTab} ${dictId === 'default' ? styles.activeTab : ''}`}
                                    onClick={() => handleDictionaryChange('default')}
                                >
                                    English 2500
                                </button>
                                {dictionaries.map(d => (
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

                    <p>Выберите ваш титул и начните путь к престолу</p>
                    
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
                                {isEliteMode ? 'Элитный режим (Без перевода)' : 'Обычный режим (С подсказками)'}
                            </span>
                        </label>
                    </div>

                    <div className={styles.rankGrid}>
                        {RANKS.map(rank => (
                            <div key={rank.id} className={styles.rankCard} onClick={() => startMemorizing(rank)}>
                                <rank.icon size={32} className={styles.rankIcon} />
                                <div className={styles.rankName}>{rank.name}</div>
                                <div className={styles.rankDetails}>N={rank.n} • {rank.optionsCount} вариантов</div>
                                <small>{rank.description}</small>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'MEMORIZE' && selectedRank && (
                <div className={styles.memorizeContainer}>
                    <h2 className={styles.royalTitle}>Запомните {currentIndexInQueue + 1}</h2>
                    <div className={styles.wordToRemember}>
                        {(() => {
                            const word = wordQueue[currentIndexInQueue] as any;
                            const mainText = word[word.displaySide];
                            const hintText = word[word.displaySide === 'original' ? 'translation' : 'original'];
                            return (
                                <div className={styles.wordWrapper}>
                                    <div className={styles.mainWord}>{mainText}</div>
                                    {!isEliteMode && (
                                        <div className={styles.translationHint}>— {hintText} —</div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                    <div className={styles.progressText} style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 600 }}>
                        Подготовка: {currentIndexInQueue + 1} из {selectedRank.n} слов
                    </div>
                    <button className={styles.royalButton} onClick={handleNextMemorize}>
                        {currentIndexInQueue < selectedRank.n - 1 ? 'Следующее Слово' : 'К Трону!'}
                    </button>
                </div>
            )}

            {phase === 'PLAY' && selectedRank && (
                <div className={styles.playPhaseContainer}>
                    <div className={styles.gameArea}>
                        <div className={styles.gameHeader}>
                            <div className={styles.score}>
                                Шаг: {score + 1} / {SESSION_SIZE - selectedRank.n}
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
                                Запомните текущее:
                            </div>
                            <h2 className={styles.wordToRemember} style={{ margin: 0 }}>
                                {(() => {
                                    const word = wordQueue[wordQueue.length - 1] as any;
                                    const mainText = word[word.displaySide];
                                    const hintText = word[word.displaySide === 'original' ? 'translation' : 'original'];
                                    return (
                                        <div className={styles.wordWrapper}>
                                            <div className={styles.mainWord}>{mainText}</div>
                                            {!isEliteMode && (
                                                <div className={styles.translationHint}>— {hintText} —</div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </h2>
                        </div>

                        <div className={styles.gameInstruction}>
                            Выберите перевод того, что было {selectedRank.n} {selectedRank.n === 1 ? 'шаг' : 'шага'} назад:
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
                <div className={styles.gameOverContainer}>
                    <h1 className={styles.royalTitle}>Испытание завершено</h1>
                    <div className={styles.finalRankBadge}>
                        <selectedRank.icon size={48} color="#fde047" />
                        <div className={styles.finalRank}>{selectedRank.name}</div>
                    </div>
                    
                    <div className={styles.resultsGrid}>
                        <div className={styles.resultItem}>
                            <span>Чистое время:</span>
                            <strong>{timer.toFixed(2)}с</strong>
                        </div>
                        <div className={styles.resultItem}>
                            <span>Штрафы:</span>
                            <strong style={{ color: '#ef4444' }}>+{penaltySeconds}с</strong>
                        </div>
                        <div className={styles.totalResult}>
                            <span>Итог:</span>
                            <strong>{totalFinalTime.toFixed(2)}с</strong>
                        </div>
                    </div>

                    <button className={styles.royalButton} onClick={() => setPhase('SETUP')}>
                        Начать заново
                    </button>
                    <br />
                    <button className={styles.backButton} onClick={() => navigate('/games')}>
                        В главное меню
                    </button>
                </div>
            )}
        </div>
    );
}
