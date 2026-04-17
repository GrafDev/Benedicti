import { useState, useEffect } from 'react';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Layers, Play, Crown, Grid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Games.module.css';

export default function Games() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    
    // Load last used dictionary from localStorage
    const [selectedDictId, setSelectedDictId] = useState<string>(() => {
        return localStorage.getItem('lastUsedDictId') || 'default';
    });

    useEffect(() => {
        localStorage.setItem('lastUsedDictId', selectedDictId);
    }, [selectedDictId]);

    useEffect(() => {
        if (currentUser) {
            fetchDictionaries(currentUser.uid);
        }
    }, [currentUser, fetchDictionaries]);

    const handlePlay = (gameMode: string) => {
        navigate(`/play/${gameMode}/${selectedDictId}`);
    };

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>{t('nav.games')}</h1>
            
            <div className={styles.selectorSection}>
                <label className={styles.label}>{t('common.chooseDictionary')}</label>
                <select 
                    value={selectedDictId} 
                    onChange={(e) => setSelectedDictId(e.target.value)}
                    className={styles.select}
                >
                    <option value="default">English 2500</option>
                    <optgroup label={t('common.myDictionaries')}>
                        {dictionaries.map(dict => (
                            <option key={dict.id} value={dict.id}>
                                {dict.name} ({dict.wordCount} words)
                            </option>
                        ))}
                    </optgroup>
                </select>
            </div>

            <div className={styles.grid}>
                {/* Flashcards */}
                <div className={styles.gameCard}>
                    <div className={`${styles.iconContainer} ${styles.bgBlue}`}>
                        <Layers size={40} />
                    </div>
                    <h2 className={styles.gameTitle}>{t('games.flashcards.title')}</h2>
                    <p className={styles.gameDescription}>{t('games.flashcards.description')}</p>
                    <button 
                        onClick={() => handlePlay('flashcards')}
                        className={styles.playButton}
                    >
                        <Play size={18} /> {t('common.playNow')}
                    </button>
                </div>

                {/* N-back Word */}
                <div className={styles.gameCard}>
                    <div className={`${styles.iconContainer}`} style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e' }}>
                        <Crown size={40} />
                    </div>
                    <h2 className={styles.gameTitle}>{t('games.benedicto.title')}</h2>
                    <p className={styles.gameDescription}>{t('games.benedicto.description')}</p>
                    <button 
                        onClick={() => handlePlay('nback')}
                        className={styles.playButton}
                        style={{ background: 'linear-gradient(to right, #b45309, #d97706)' }}
                    >
                        <Play size={18} /> {t('common.playNow')}
                    </button>
                </div>
                
                {/* Match Pairs */}
                <div className={styles.gameCard}>
                    <div className={`${styles.iconContainer}`} style={{ background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)', color: '#5b21b6' }}>
                        <Grid size={40} />
                    </div>
                    <h2 className={styles.gameTitle}>{t('games.pairwords.title')}</h2>
                    <p className={styles.gameDescription}>{t('games.pairwords.description')}</p>
                    <button 
                        onClick={() => handlePlay('match-pairs')}
                        className={styles.playButton}
                        style={{ background: 'linear-gradient(to right, #7c3aed, #6d28d9)' }}
                    >
                        <Play size={18} /> {t('common.playNow')}
                    </button>
                </div>
            </div>
        </div>
    );
}
