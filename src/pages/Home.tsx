import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Trophy,
    Book,
    Gamepad2,
    Sparkles
} from 'lucide-react';
import { ref, get as dbGet } from 'firebase/database';
import { db } from '../firebase';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import styles from './Home.module.css';

import { getRecentActivities, type RecentActivity } from '../utils/activity';
import { GAMES_COUNT } from '../constants/games';

export default function Home() {
    const { currentUser } = useAuth();
    const { dictionaries, fetchDictionaries } = useDictionaryStore();
    const { t } = useLanguage();
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [personalBest, setPersonalBest] = useState<number>(0);
    const [globalBest, setGlobalBest] = useState<{ score: number; username: string } | null>(null);

    useEffect(() => {
        fetchDictionaries(currentUser?.uid);
    }, [currentUser, fetchDictionaries]);

    useEffect(() => {
        setRecentActivities(getRecentActivities());
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const loadRecords = async () => {
            try {
                // 1. Load Personal Best
                const personalRef = ref(db, `users/${currentUser.uid}/dictSaberHighScore`);
                const personalSnapshot = await dbGet(personalRef);
                let maxPersonal = 0;
                if (personalSnapshot.exists()) {
                    const data = personalSnapshot.val();
                    if (typeof data === 'object' && data !== null) {
                        Object.values(data).forEach((val: any) => {
                            if (typeof val === 'number' && val > maxPersonal) {
                                maxPersonal = val;
                            }
                        });
                    }
                }
                setPersonalBest(maxPersonal);

                // 2. Load Global Best
                const globalRef = ref(db, 'shared/dictSaberHighScore');
                const globalSnapshot = await dbGet(globalRef);
                let maxGlobal: { score: number; username: string } | null = null;
                if (globalSnapshot.exists()) {
                    const data = globalSnapshot.val();
                    if (typeof data === 'object' && data !== null) {
                        Object.values(data).forEach((val: any) => {
                            if (val && typeof val === 'object' && typeof val.score === 'number') {
                                if (!maxGlobal || val.score > maxGlobal.score) {
                                    maxGlobal = {
                                        score: val.score,
                                        username: val.username || 'Anonymous'
                                    };
                                }
                            }
                        });
                    }
                }
                setGlobalBest(maxGlobal);
            } catch (error) {
                console.error('Error loading DictSaber highscores:', error);
            }
        };

        loadRecords();
    }, [currentUser]);

    // Derived statistics
    const totalDictionaries = dictionaries.length;
    const totalWords = dictionaries.reduce((acc, dict) => acc + (dict.wordCount || 0), 0);
    const homeTitleName = currentUser
        ? (currentUser.displayName || currentUser.email?.split('@')[0] || '').toUpperCase()
        : t('common.guest').toUpperCase();

    const getMostPopularDictionaryName = () => {
        if (dictionaries.length === 0) return t('home.none');
        if (!recentActivities.length) return dictionaries[0]?.name || t('home.none');
        
        const counts: Record<string, number> = {};
        let popularDictId = recentActivities[0].dictId;
        let maxCount = 0;

        recentActivities.forEach(act => {
            counts[act.dictId] = (counts[act.dictId] || 0) + 1;
            if (counts[act.dictId] > maxCount) {
                maxCount = counts[act.dictId];
                popularDictId = act.dictId;
            }
        });

        const popularDict = dictionaries.find(d => d.id === popularDictId);
        return popularDict ? popularDict.name : dictionaries[0].name;
    };

    const popularDictName = getMostPopularDictionaryName();

    // Fallback logic if no activity




    const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
        <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${colorClass}`}>
                <Icon size={24} />
            </div>
            <div>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
            </div>
        </div>
    );

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.mainTitle}>
                        {t('home.title')} <span className={styles.sovereign}>{homeTitleName}</span>
                    </h1>
                    <p className={styles.subtitle}>{t('home.subtitle')}</p>
                </div>
            </header>
            
            <div className={styles.quickActions}>
                <Link to="/dictionaries" className={`${styles.quickActionCard} ${styles.dictAction}`}>
                    <div className={styles.actionIcon}>
                        <Book size={28} />
                    </div>
                    <div className={styles.actionContent}>
                        <span className={styles.actionLabel}>{t('nav.dictionaries')}</span>
                        <span className={styles.actionSub}>
                            {totalDictionaries > 0 ? t('home.dictCount', { count: totalDictionaries }) : t('home.createDict')}
                        </span>
                    </div>
                </Link>
                <Link to="/games" className={`${styles.quickActionCard} ${styles.gameAction}`}>
                    <div className={styles.actionIcon}>
                        <Gamepad2 size={28} />
                    </div>
                    <div className={styles.actionContent}>
                        <span className={styles.actionLabel}>{t('nav.games')}</span>
                        <span className={styles.actionSub}>{t('home.gameCount', { count: GAMES_COUNT })}</span>
                    </div>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    icon={Book}
                    label={t('home.totalWords')}
                    value={totalWords}
                    colorClass={styles.bgBlue}
                />
                <StatCard
                    icon={Trophy}
                    label={t('home.mostPopular')}
                    value={popularDictName}
                    colorClass={styles.bgYellow}
                />
                <StatCard
                    icon={Gamepad2}
                    label={globalBest 
                        ? t('home.dictSaberStats', { worldScore: globalBest.score, username: globalBest.username }) 
                        : t('home.dictSaberRecord')
                    }
                    value={personalBest}
                    colorClass={styles.bgPurple}
                />
            </div>

            <div className={styles.contentGrid}>
                {/* Gem of the Day Card */}
                <div className={`${styles.promoCard} ${styles.gemCard}`}>
                    <div className={styles.promoLabel}>{t('home.gemOfDay')}</div>
                    <div className={styles.gemContent}>
                        <h2 className={styles.gemWord}>Pristine</h2>
                        <div className={styles.gemTranslation}>чистый, нетронутый</div>
                    </div>
                    <p className={styles.gemExample}>
                        "A sovereign's mind must remain pristine for the coming conquest."
                    </p>
                    <div className={styles.gemDecoration}>
                        <Sparkles size={120} />
                    </div>
                </div>

                {/* Weekly Goal Card */}
                <div className={`${styles.promoCard} ${styles.goalCard}`}>
                    <div className={styles.goalHeader}>
                        <div className={styles.promoLabel}>{t('home.weeklyGoal')}</div>
                        <Trophy size={18} className={styles.goalTrophy} />
                    </div>
                    
                    <div className={styles.goalContent}>
                        <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: '65%' }} />
                            </div>
                        </div>
                        <div className={styles.goalStats}>
                            <span className={styles.goalMetricLabel}>{t('home.proProgress')}</span>
                            <span className={styles.goalMetricValue}>65%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
