import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, Volume2, RefreshCw, Ghost, User, Sword, Shield, Landmark, Trophy, Crown, Sparkles, ChevronRight, BrainCircuit, Gamepad2, ChevronDown } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import { soundService } from '../utils/soundUtils';
import { saveRecentActivity } from '../utils/activity';
import type { Word } from '../types';
import styles from './MatchPairs.module.css';

interface MatchItem {
    id: string;
    text: string;
    isOriginal: boolean;
}

type Phase = 'SETUP' | 'PLAY' | 'GAMEOVER';

interface Rank {
    id: string;
    name: string;
    count: number;
    icon: any;
    description: string;
}

export default function MatchPairs() {
    const { dictId } = useParams<{ dictId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const RANKS = useMemo<Rank[]>(() => [
        { id: 'citizen', name: t('ranks.citizen.name'), count: 4, icon: User, description: `4 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.citizen.desc')}` },
        { id: 'knight', name: t('ranks.knight.name'), count: 5, icon: Sword, description: `5 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.knight.desc')}` },
        { id: 'baron', name: t('ranks.baron.name'), count: 6, icon: Shield, description: `6 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.baron.desc')}` },
        { id: 'count', name: t('ranks.count.name'), count: 7, icon: Landmark, description: `7 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.count.desc')}` },
        { id: 'duke', name: t('ranks.duke.name'), count: 8, icon: Trophy, description: `8 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.duke.desc')}` },
        { id: 'king', name: t('ranks.king.name'), count: 9, icon: Crown, description: `9 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.king.desc')}` },
        { id: 'emperor', name: t('ranks.emperor.name'), count: 10, icon: Sparkles, description: `10 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.emperor.desc')}` },
    ], [t]);

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchSharedWords = useDictionaryStore(state => state.fetchSharedWords);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
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
    
    const [phase, setPhase] = useState<Phase>('SETUP');
    const [status, setStatus] = useState<'playing' | 'preview' | 'complete'>('playing');
    const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
    const [isDictSelectorOpen, setIsDictSelectorOpen] = useState(false);

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
        localStorage.setItem('lastUsedDictId', newDictId);
        navigate(`/play/match-pairs/${newDictId}`);
        setIsDictSelectorOpen(false);
    };

    // Setup session
    const startLevel = useCallback((rank: Rank) => {
        if (storeWords.length < rank.count) {
            alert(t('games.pairwords.notEnoughWords', { rank: rank.name, count: rank.count }));
            return;
        }

        // Shuffle and take only 15 words for the session
        const shuffled = [...storeWords].sort(() => Math.random() - 0.5);
        const poolForSession = shuffled.slice(0, 15);
        
        setAllWordsPool(poolForSession);
        setTotalPairs(poolForSession.length);
        setScore(0);
        setMatchedIds(new Set());
        setCorrectIds(new Set());
        setTransitioningIds(new Set());
        setWrongIds(new Set());
        
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
    }, [storeWords, t]);

    useEffect(() => {
        localStorage.setItem('benedicti_match_elite', JSON.stringify(isEliteMode));
    }, [isEliteMode]);

    const handleChoice = useCallback((id: string, isOriginal: boolean) => {
        if (matchedIds.has(id) || correctIds.has(id)) return;

        if (isOriginal) {
            setSelectedLeftId(id);
            const word = allWordsPool.find(w => w.id === id);
            const dict = dictionaries.find(d => d.id === dictId);
            
            // Озвучиваем только если это первый выбор ИЛИ если выбор верный
            const isMatch = selectedRightId === id;
            if (word && (!selectedRightId || isMatch)) {
                speechService.speak(word.original, dict?.sourceLang || 'en');
            }
            
            if (selectedRightId) checkMatch(id, selectedRightId);
        } else {
            setSelectedRightId(id);
            const word = allWordsPool.find(w => w.id === id);
            const dict = dictionaries.find(d => d.id === dictId);
            
            // Озвучиваем только если это первый выбор ИЛИ если выбор верный
            const isMatch = selectedLeftId === id;
            if (word && (!selectedLeftId || isMatch)) {
                speechService.speak(word.translation, dict?.targetLang || 'ru');
            }
            
            if (selectedLeftId) checkMatch(selectedLeftId, id);
        }
    }, [selectedLeftId, selectedRightId, matchedIds, correctIds, isEliteMode, allWordsPool, dictionaries, dictId]);

    const checkMatch = (leftId: string, rightId: string) => {
        if (leftId === rightId) {
            // Correct logic
            soundService.playSuccessSound();
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
            soundService.playErrorSound();
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

    const isInitialLoading = loading && storeWords.length === 0;

    const renderSetup = () => (
        <div className={`${styles.setupContainer} ${loading ? styles.setupLoading : ''}`}>
            <h1 className={styles.royalTitle}>{t('games.pairwords.title')}</h1>

            <div className={styles.dictSelector}>
                <button 
                    className={styles.selectorHeader}
                    onClick={() => setIsDictSelectorOpen(!isDictSelectorOpen)}
                >
                    <span className={styles.selectorLabel}>{t('common.dictionary')}</span>
                    <span className={styles.activeDictName}>
                        {dictId === 'default' ? 'English 2500' : dictionaries.find(d => d.id === dictId)?.name || t('common.dictionary')}
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
                        {dictionaries
                            .filter(d => d.id !== 'default' && !d.name.includes('English 2500'))
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

            <p style={{ margin: '1.5rem 0', color: '#94a3b8' }}>{t('common.chooseMight')}</p>
            
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

            <div className={styles.rankGrid}>
                {RANKS.map((rank) => {
                    const isLocked = storeWords.length < rank.count;
                    return (
                        <button 
                            key={rank.id} 
                            className={`${styles.rankCard} ${isLocked ? styles.locked : ''}`}
                            onClick={() => !isLocked && startLevel(rank)}
                            disabled={loading}
                        >
                            <div className={styles.rankIcon}>
                                <rank.icon size={32} />
                            </div>
                            <div className={styles.rankDetails}>
                                <h3 className={styles.rankName}>{rank.name}</h3>
                                <div className={styles.rankDetailSub}>
                                    {rank.description}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            {storeWords.length === 0 && !loading && (
                <div className={styles.noWordsWarning}>
                    {t('games.pairwords.noWords')}
                </div>
            )}
        </div>
    );

    const isAllDone = matchedIds.size === allWordsPool.length && allWordsPool.length > 0;

    return (
        <div className={styles.container}>
            {(phase === 'SETUP' || isInitialLoading) && (
                <button onClick={() => navigate('/games')} className={styles.floatingBackButton} title={t('common.back')}>
                    <ArrowLeft size={24} />
                </button>
            )}

            {isInitialLoading ? (
                <div className={styles.loading}>{t('common.loading')}</div>
            ) : (
                phase === 'SETUP' ? (
                    renderSetup()
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
                            </div>
                            <div className={styles.currentRankLabel}>
                                {selectedRank?.icon && <selectedRank.icon size={18} />}
                                <span>{selectedRank?.name}</span>
                            </div>
                        </header>

                        <div className={styles.gameArea}>
                            {!isAllDone ? (
                                <>
                                    <div className={styles.gameControls}>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${(matchedIds.size / totalPairs) * 100}%` }} />
                                        </div>
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
                                    <div className={styles.successIcon}>
                                        <Sparkles size={64} />
                                    </div>
                                    <h2>🎉 {t('common.greatJob')}</h2>
                                    <p>{t('games.pairwords.conqueredRank', { rank: selectedRank?.name || '' })}</p>
                                    <div className={styles.finalScore}>{t('games.pairwords.score')}: {score}</div>
                                    <button onClick={() => setPhase('SETUP')} className={styles.restartButton}>
                                        <RefreshCw size={20} /> {t('common.playAgain')}
                                    </button>
                                    <button onClick={() => navigate('/games')} className={styles.menuButton}>
                                        {t('common.menu')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )
            )}
        </div>
    );
}
