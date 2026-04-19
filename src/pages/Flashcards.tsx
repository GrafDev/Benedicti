import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronLeft, ChevronRight, RotateCcw, ArrowLeft, Volume2, ChevronDown } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import { saveRecentActivity } from '../utils/activity';
import type { Word } from '../types';
import styles from './Flashcards.module.css';

export default function Flashcards() {
    const { dictId } = useParams<{ dictId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchSharedWords = useDictionaryStore(state => state.fetchSharedWords);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    const markWordAsLearned = useDictionaryStore(state => state.markWordAsLearned);
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const storeWords = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);

    const [gameWords, setGameWords] = useState<Word[]>([]);
    const [initialCount, setInitialCount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFrontFirst] = useState(true);
    const [isDictSelectorOpen, setIsDictSelectorOpen] = useState(false);
    const [isMobileSetupOpen, setIsMobileSetupOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        if (currentUser) {
            fetchDictionaries(currentUser.uid);
        }
    }, [currentUser, fetchDictionaries]);

    useEffect(() => {
        const loadWords = async () => {
            setGameWords([]); // Clear current session before loading new data
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
        navigate(`/play/flashcards/${newDictId}`);
        setIsDictSelectorOpen(false);
    };

    // Track activity
    useEffect(() => {
        if (dictId && dictId !== 'default' && dictionaries.length > 0) {
            const currentDict = dictionaries.find(d => d.id === dictId);
            if (currentDict) {
                saveRecentActivity({
                    dictId,
                    dictName: currentDict.name,
                    mode: 'flashcards'
                });
            }
        }
    }, [dictId, dictionaries]);

    // Shuffle and set words for session only when words are first loaded
    useEffect(() => {
        // Only initialize if we don't have game words yet and we have store words
        if (storeWords.length > 0 && gameWords.length === 0) {
            // Filter out learned words from the study session
            const availableWords = storeWords.filter(w => !w.isLearned);
            
            const shuffled = [...availableWords]
                .sort(() => Math.random() - 0.5)
                .slice(0, 15); 
            setGameWords(shuffled);
            setInitialCount(shuffled.length);
            setCurrentIndex(0);
            setIsFlipped(false);
        } else if (storeWords.length === 0 && !loading) {
            setGameWords([]);
        }
    }, [storeWords, gameWords.length, loading]);

    const handleNext = useCallback(() => {
        if (currentIndex < gameWords.length - 1) {
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 150);
        }
    }, [currentIndex, gameWords.length]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
            }, 150);
        }
    }, [currentIndex]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleRestart = () => {
        const reshuffled = [...storeWords]
            .sort(() => Math.random() - 0.5)
            .slice(0, 15);
        setGameWords(reshuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleFlip();
            } else if (e.code === 'ArrowRight') {
                handleNext();
            } else if (e.code === 'ArrowLeft') {
                handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

    const handleMarkLearned = async () => {
        if (!currentUser) return;
        
        const currentWord = gameWords[currentIndex];
        
        // 1. Call store to mark in DB
        await markWordAsLearned(currentUser.uid, currentWord);
        
        // 2. Locally remove it from gameWords immediately for smooth UI
        const nextWords = gameWords.filter((_, idx) => idx !== currentIndex);
        setGameWords(nextWords);
        
        if (currentIndex >= nextWords.length && nextWords.length > 0) {
            setCurrentIndex(nextWords.length - 1);
        }
        setIsFlipped(false);
    };

    const isInitialLoading = loading && storeWords.length === 0;

    return (
        <div className={styles.container}>
            {isInitialLoading && (
                <button 
                    className={styles.floatingBackButton} 
                    onClick={() => navigate('/games')}
                    title={t('common.back')}
                >
                    <ArrowLeft size={24} />
                </button>
            )}

            {!isInitialLoading && (
                <div className={`${styles.setupContainer} ${loading ? styles.setupLoading : ''} ${gameWords.length > 0 ? styles.compactSetup : ''}`}>
                    <div className={styles.setupToolbar}>
                        <div className={styles.toolbarTitleRow}>
                            <button onClick={() => navigate('/games')} className={styles.backButtonInline} title={t('common.back')}>
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className={styles.royalTitle}>{t('games.flashcards.title')}</h1>
                            <button 
                                className={`${styles.mobileSetupToggle} ${isMobileSetupOpen ? styles.open : ''}`}
                                onClick={() => setIsMobileSetupOpen(!isMobileSetupOpen)}
                            >
                                <ChevronDown size={24} />
                            </button>
                        </div>

                        <div className={`${styles.setupControls} ${isMobileSetupOpen ? styles.open : ''}`}>
                            <div className={styles.dictSelector}>
                        <button 
                            className={styles.selectorHeader}
                            onClick={() => setIsDictSelectorOpen(!isDictSelectorOpen)}
                        >
                            <span className={styles.selectorLabel}>{t('common.dictionary')}</span>
                            <span className={styles.activeDictName}>
                                {dictId === 'default' ? 'English 2500' : dictionaries.find(d => d.id === dictId)?.name || '...'}
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
                                    ))
                                }
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>
            )}

            {isInitialLoading ? (
                <div className={styles.loading}>{t('common.loading')}</div>
            ) : gameWords.length === 0 ? (
                <div className={styles.empty}>
                    <h2>🎉 {t('common.allLearned')}</h2>
                    <p>{t('games.flashcards.sessionComplete')}</p>
                    <button onClick={handleRestart} className={styles.retryButton}>
                        {t('common.restart')}
                    </button>
                    <button onClick={() => navigate('/games')} className={styles.backButton}>
                        {t('common.back')}
                    </button>
                </div>
            ) : (() => {
                const currentWord = gameWords[currentIndex];
                const dictionary = dictionaries.find(d => d.id === dictId);
                const progress = initialCount > 0 ? ((initialCount - gameWords.length + currentIndex) / initialCount) * 100 : 0;

                return (
                    <div className={styles.gameArea}>
                        <div 
                            className={`${styles.cardContainer} ${isFlipped ? styles.flipped : ''}`}
                            onClick={handleFlip}
                        >
                            <div className={styles.cardInner}>
                                {/* Front */}
                                <div className={styles.cardFront}>
                                    <div className={styles.wordWrapper}>
                                        <button 
                                            className={styles.speakButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                speechService.speak(currentWord.original, dictionary?.sourceLang || 'en');
                                            }}
                                        >
                                            <Volume2 size={24} />
                                        </button>
                                        <h2 className={`${styles.wordText} ${
                                            (isFrontFirst ? currentWord.original : currentWord.translation).length > 16 ? styles.extraLongWord : 
                                            (isFrontFirst ? currentWord.original : currentWord.translation).length > 12 ? styles.longWord : ''
                                        }`}>
                                            {isFrontFirst ? currentWord.original : currentWord.translation}
                                        </h2>
                                    </div>
                                    <p className={styles.hint}>{t('common.clickToFlip')}</p>
                                </div>
                                {/* Back */}
                                <div className={styles.cardBack}>
                                    <div className={styles.wordWrapper}>
                                        <button 
                                            className={styles.speakButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                speechService.speak(currentWord.original, dictionary?.sourceLang || 'en');
                                            }}
                                        >
                                            <Volume2 size={24} />
                                        </button>
                                        <h2 className={`${styles.wordText} ${
                                            (isFrontFirst ? currentWord.translation : currentWord.original).length > 16 ? styles.extraLongWord : 
                                            (isFrontFirst ? currentWord.translation : currentWord.original).length > 12 ? styles.longWord : ''
                                        }`}>
                                            {isFrontFirst ? currentWord.translation : currentWord.original}
                                        </h2>
                                    </div>
                                    <p className={styles.hint}>{t('common.clickToFlip')}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.statsUnderCard}>
                            <div className={styles.progressColumn}>
                                <div className={styles.progressBar}>
                                    <div 
                                        className={styles.progressFill} 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className={styles.progressText}>
                                    {currentIndex + 1} / {gameWords.length}
                                </span>
                            </div>
                        </div>

                        <div className={styles.controls}>
                            <button 
                                onClick={handlePrev} 
                                disabled={currentIndex === 0}
                                className={styles.navButton}
                                title={t('common.back')}
                            >
                                <ChevronLeft size={32} />
                            </button>

                            <button 
                                onClick={handleMarkLearned} 
                                className={styles.learnedButton}
                                title={t('common.learned')}
                            >
                                {t('common.learned')}
                            </button>

                            <button 
                                onClick={handleNext} 
                                disabled={currentIndex === gameWords.length - 1}
                                className={styles.navButton}
                                title={t('games.nbackword.nextWord')}
                            >
                                <ChevronRight size={32} />
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
