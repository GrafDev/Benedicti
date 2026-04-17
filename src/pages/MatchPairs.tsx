import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Volume2, RefreshCw } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import type { Word } from '../types';
import styles from './MatchPairs.module.css';

interface MatchItem {
    id: string;
    text: string;
    isOriginal: boolean;
}

export default function MatchPairs() {
    const { dictId } = useParams<{ dictId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchSharedWords = useDictionaryStore(state => state.fetchSharedWords);
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
    const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set());
    
    const [isEliteMode, setIsEliteMode] = useState(() => {
        const saved = localStorage.getItem('benedicti_match_elite');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const [score, setScore] = useState(0);
    const [totalPairs, setTotalPairs] = useState(0);
    
    const nextWordIndex = useRef(0);

    // Initial Load
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

    // Setup session
    useEffect(() => {
        if (storeWords.length > 0) {
            const shuffled = [...storeWords].sort(() => Math.random() - 0.5);
            setAllWordsPool(shuffled);
            setTotalPairs(shuffled.length);
            setScore(0);
            setMatchedIds(new Set());
            setCorrectIds(new Set());
            
            // Pick initial 5
            const initialBatch = shuffled.slice(0, 5);
            nextWordIndex.current = 5;

            const left = initialBatch.map(w => ({ id: w.id, text: w.original, isOriginal: true }))
                .sort(() => Math.random() - 0.5);
            const right = initialBatch.map(w => ({ id: w.id, text: w.translation, isOriginal: false }))
                .sort(() => Math.random() - 0.5);
                
            setLeftColumn(left);
            setRightColumn(right);
        }
    }, [storeWords]);

    useEffect(() => {
        localStorage.setItem('benedicti_match_elite', JSON.stringify(isEliteMode));
    }, [isEliteMode]);

    const handleChoice = useCallback((id: string, isOriginal: boolean) => {
        if (matchedIds.has(id) || correctIds.has(id)) return;

        if (isOriginal) {
            setSelectedLeftId(id);
            const word = allWordsPool.find(w => w.id === id);
            const dict = dictionaries.find(d => d.id === dictId);
            if (word) speechService.speak(word.original, dict?.sourceLang || 'en');
            
            if (selectedRightId) checkMatch(id, selectedRightId);
        } else {
            setSelectedRightId(id);
            const word = allWordsPool.find(w => w.id === id);
            const dict = dictionaries.find(d => d.id === dictId);
            if (word) speechService.speak(word.translation, dict?.targetLang || 'ru');
            
            if (selectedLeftId) checkMatch(selectedLeftId, id);
        }
    }, [selectedLeftId, selectedRightId, matchedIds, correctIds, isEliteMode, allWordsPool, dictionaries, dictId]);

    const checkMatch = (leftId: string, rightId: string) => {
        if (leftId === rightId) {
            // Correct logic
            setCorrectIds(prev => new Set([...prev, leftId]));
            setScore(prev => prev + 1);
            setSelectedLeftId(null);
            setSelectedRightId(null);

            // Wait 1s and transition
            setTimeout(() => {
                setCorrectIds(prev => {
                    const next = new Set(prev);
                    next.delete(leftId);
                    return next;
                });
                // Phase 2: Show empty button for a bit
                setTransitioningIds(prev => new Set([...prev, leftId]));
                
                setTimeout(() => {
                    replaceWord(leftId);
                    setTransitioningIds(prev => {
                        const next = new Set(prev);
                        next.delete(leftId);
                        return next;
                    });
                }, 800);
            }, 1000);
        } else {
            // Wrong
            setWrongIds(new Set([leftId, rightId]));
            setTimeout(() => {
                setWrongIds(new Set());
                setSelectedLeftId(null);
                setSelectedRightId(null);
            }, 800);
        }
    };

    const replaceWord = (oldId: string) => {
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

    const handleRestart = () => {
        const reshuffled = [...storeWords].sort(() => Math.random() - 0.5);
        setAllWordsPool(reshuffled);
        setTotalPairs(reshuffled.length);
        setScore(0);
        setMatchedIds(new Set());
        setCorrectIds(new Set());
        
        const initialBatch = reshuffled.slice(0, 5);
        nextWordIndex.current = 5;
        setLeftColumn(initialBatch.map(w => ({ id: w.id, text: w.original, isOriginal: true })).sort(() => Math.random() - 0.5));
        setRightColumn(initialBatch.map(w => ({ id: w.id, text: w.translation, isOriginal: false })).sort(() => Math.random() - 0.5));
    };

    if (loading) return <div className={styles.container}><div className={styles.loading}>Загрузка...</div></div>;

    const isAllDone = matchedIds.size === allWordsPool.length && allWordsPool.length > 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate('/games')} className={styles.backButton}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>Match Pairs</h1>
                <div style={{ width: 44 }}></div>
            </div>

            <div className={styles.gameArea}>
                {!isAllDone ? (
                    <>
                        <div className={styles.controls}>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${(matchedIds.size / totalPairs) * 100}%` }} />
                            </div>
                            <div className={styles.stats}>
                                {matchedIds.size} / {totalPairs}
                            </div>
                            <label className={styles.eliteToggle}>
                                <input 
                                    type="checkbox" 
                                    checked={isEliteMode} 
                                    onChange={(e) => setIsEliteMode(e.target.checked)}
                                />
                                <span className={styles.toggleLabel}>Elite Mode</span>
                            </label>
                        </div>

                        <div className={styles.columns}>
                            <div className={styles.column}>
                                {leftColumn.map((item, idx) => (
                                    item ? (
                                        <button
                                            key={`left-${item.id}`}
                                            className={`${styles.card} 
                                                ${selectedLeftId === item.id ? styles.selected : ''} 
                                                ${correctIds.has(item.id) ? styles.correct : ''} 
                                                ${wrongIds.has(item.id) && selectedLeftId === item.id ? styles.wrong : ''}`}
                                            onClick={() => handleChoice(item.id, true)}
                                            disabled={transitioningIds.has(item.id)}
                                        >
                                            {!transitioningIds.has(item.id) && (
                                                isEliteMode ? <Volume2 size={24} /> : item.text
                                            )}
                                        </button>
                                    ) : <div key={`left-empty-${idx}`} className={styles.emptySlot} />
                                ))}
                            </div>
                            <div className={styles.column}>
                                {rightColumn.map((item, idx) => (
                                    item ? (
                                        <button
                                            key={`right-${item.id}`}
                                            className={`${styles.card} 
                                                ${selectedRightId === item.id ? styles.selected : ''} 
                                                ${correctIds.has(item.id) ? styles.correct : ''} 
                                                ${wrongIds.has(item.id) && selectedRightId === item.id ? styles.wrong : ''}`}
                                            onClick={() => handleChoice(item.id, false)}
                                            disabled={transitioningIds.has(item.id)}
                                        >
                                            {!transitioningIds.has(item.id) && item.text}
                                        </button>
                                    ) : <div key={`right-empty-${idx}`} className={styles.emptySlot} />
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.results}>
                        <h2>🎉 Отличная работа!</h2>
                        <p>Вы сопоставили все слова в этом наборе.</p>
                        <div className={styles.finalScore}>Счет: {score}</div>
                        <button onClick={handleRestart} className={styles.restartButton}>
                            <RefreshCw size={20} /> Играть снова
                        </button>
                        <button onClick={() => navigate('/games')} className={styles.menuButton}>
                            В меню
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
