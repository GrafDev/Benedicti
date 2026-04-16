import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, RotateCcw, ArrowLeft, Settings2 } from 'lucide-react';
import type { Word } from '../types';
import styles from './Flashcards.module.css';

export default function Flashcards() {
    const { dictId } = useParams<{ dictId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchSharedWords = useDictionaryStore(state => state.fetchSharedWords);
    const markWordAsLearned = useDictionaryStore(state => state.markWordAsLearned);
    const storeWords = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);
    const error = useDictionaryStore(state => state.error);

    const [gameWords, setGameWords] = useState<Word[]>([]);
    const [initialCount, setInitialCount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFrontFirst, setIsFrontFirst] = useState(true);

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

    // Shuffle and set words for session
    useEffect(() => {
        if (storeWords.length > 0) {
            // Filter out learned words from the study session
            const availableWords = storeWords.filter(w => !w.isLearned);
            
            const shuffled = [...availableWords]
                .sort(() => Math.random() - 0.5)
                .slice(0, 50); 
            setGameWords(shuffled);
            setInitialCount(shuffled.length);
            setCurrentIndex(0);
            setIsFlipped(false);
        }
    }, [storeWords]);

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
            .slice(0, 50);
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

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading cards...</div>
            </div>
        );
    }

    if (gameWords.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <h2>🎉 All words learned!</h2>
                    <p>Good job! You've gone through all the words in this session.</p>
                    <button onClick={handleRestart} className={styles.retryButton}>
                        Study Again
                    </button>
                    <button onClick={() => navigate('/games')} className={styles.backButton}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const currentWord = gameWords[currentIndex];
    // Calculate progress: how many words were already passed (learned or skipped)
    const progress = initialCount > 0 ? ((initialCount - gameWords.length + currentIndex) / initialCount) * 100 : 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate('/games')} className={styles.circularButton} title="Back to Games">
                    <ArrowLeft size={24} />
                </button>
                {/* Space holder or title */}
                <div className={styles.headerTitle}>Flashcards</div>
                <div style={{ width: 44 }}></div> {/* Balance for symmetry */}
            </div>

            <div className={styles.gameArea}>
                <div 
                    className={`${styles.cardContainer} ${isFlipped ? styles.flipped : ''}`}
                    onClick={handleFlip}
                >
                    <div className={styles.cardInner}>
                        {/* Front */}
                        <div className={styles.cardFront}>
                            <h2 className={styles.wordText}>
                                {isFrontFirst ? currentWord.original : currentWord.translation}
                            </h2>
                            <p className={styles.hint}>Click to flip</p>
                        </div>
                        {/* Back */}
                        <div className={styles.cardBack}>
                            <h2 className={styles.wordText}>
                                {isFrontFirst ? currentWord.translation : currentWord.original}
                            </h2>
                            <p className={styles.hint}>Click to flip</p>
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
                        title="Previous (Arrow Left)"
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <button 
                        onClick={handleMarkLearned} 
                        className={styles.learnedButton}
                        title="I know this word!"
                    >
                        Learned
                    </button>

                    <button 
                        onClick={handleNext} 
                        disabled={currentIndex === gameWords.length - 1}
                        className={styles.navButton}
                        title="Next (Arrow Right)"
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>

                <button 
                    onClick={handleRestart} 
                    className={styles.restartButton}
                    title="Reset session"
                >
                    <RotateCcw size={16} /> Restart Session
                </button>
            </div>
        </div>
    );
}
