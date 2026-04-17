import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Layers,
    Trophy,
    Book,
    TrendingUp,
    Zap,
    Gamepad2,
    Sparkles,
    ChevronRight,
    BrainCircuit,
    Sword
} from 'lucide-react';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import styles from './Home.module.css';

import { getRecentActivities, type RecentActivity } from '../utils/activity';

export default function Home() {
    const { currentUser } = useAuth();
    const { dictionaries, fetchDictionaries } = useDictionaryStore();
    const { t } = useLanguage();
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

    useEffect(() => {
        if (currentUser) {
            fetchDictionaries(currentUser.uid);
        }
    }, [currentUser, fetchDictionaries]);

    useEffect(() => {
        setRecentActivities(getRecentActivities());
    }, []);

    // Derived statistics
    const totalDictionaries = dictionaries.length;
    const totalWords = dictionaries.reduce((acc, dict) => acc + (dict.wordCount || 0), 0);

    // Fallback logic if no activity
    const getGameTitle = (mode: string) => {
        switch (mode) {
            case 'nback':
            case 'nbackword': return t('games.nbackword.title');
            case 'flashcards': return t('games.flashcards.title');
            case 'match-pairs': return t('games.pairwords.title');
            default: return 'GAME';
        }
    };


    const getResumePath = (act: RecentActivity) => `/play/${act.mode}/${act.dictId}`;

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
            {/* Header / Welcome */}
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.mainTitle} dangerouslySetInnerHTML={{
                        __html: t('home.title', {
                            className: styles.sovereign,
                            name: currentUser
                                ? (currentUser.displayName || currentUser.email?.split('@')[0] || '').toUpperCase()
                                : t('common.guest').toUpperCase()
                        })
                    }} />
                    <p className={styles.subtitle}>{t('home.subtitle')}</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    icon={Layers}
                    label={t('nav.dictionaries')}
                    value={totalDictionaries}
                    colorClass={styles.bgBlue}
                />
                <StatCard
                    icon={Book}
                    label={t('home.totalWords')}
                    value={totalWords}
                    colorClass={styles.bgYellow}
                />
                <StatCard
                    icon={Zap}
                    label={t('home.eliteQuest')}
                    value="English 2500"
                    colorClass={styles.bgGreen}
                />
            </div>

            <div className={styles.contentGrid}>
                {/* Main Dashboard Area */}
                <div className={styles.mainArea}>
                    {/* Recent Games Area */}
                    {recentActivities.length > 0 ? (
                        <div className={recentActivities.length >= 2 ? styles.recentGamesGrid : ''}>
                            {recentActivities.slice(0, 2).map((act, index) => {
                                const dict = dictionaries.find(d => d.id === act.dictId);
                                const wordCount = dict?.wordCount || 0;

                                // Determine theme based on game mode
                                let themeClass = styles.defaultTheme;
                                let ModeIcon = TrendingUp;

                                if (act.mode === 'nback' || act.mode === 'nbackword') {
                                    themeClass = styles.nbackTheme;
                                    ModeIcon = BrainCircuit;
                                } else if (act.mode === 'flashcards') {
                                    themeClass = styles.flashcardsTheme;
                                    ModeIcon = Gamepad2;
                                } else if (act.mode === 'match-pairs') {
                                    themeClass = styles.matchTheme;
                                    ModeIcon = Sword;
                                }

                                return (
                                    <div key={`${act.dictId}-${act.mode}-${index}`} className={`${styles.resumeCard} ${themeClass}`}>
                                        <div className={styles.sparkleDecor}>
                                            <Sparkles size={160} />
                                        </div>

                                        <div className={styles.resumeBadge}>
                                            <ModeIcon size={14} /> {act.dictName}
                                        </div>
                                        <h2 className={styles.resumeTitle}>
                                            {getGameTitle(act.mode)}
                                        </h2>
                                        <p className={styles.resumeText}
                                            dangerouslySetInnerHTML={{ __html: t('home.masteryWords', { count: wordCount }) }} />

                                        <Link
                                            to={getResumePath(act)}
                                            className={styles.resumeButton}
                                        >
                                            {t('common.playNow')} <ChevronRight size={18} />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.resumeCard} style={{ textAlign: 'center', background: 'rgba(30,30,50,0.2)' }}>
                            <h2 className={styles.resumeTitle} style={{ fontSize: '2rem' }}>{t('home.throneAwaits')}</h2>
                            <p className={styles.resumeText} style={{ margin: '0 auto 2rem' }}>
                                {t('home.createFirstDict')}
                            </p>
                            <Link to="/dictionaries" className={styles.resumeButton}>
                                {t('home.createDict')}
                            </Link>
                        </div>
                    )}

                    {/* Sidebar section */}
                </div>

                {/* Sidebar area */}
                <div className={styles.sidebar}>
                    {/* Word of the Day Widget */}
                    <div className={`${styles.widget} ${styles.wordWidget}`}>
                        <div className={styles.userLabel} style={{ marginBottom: '1rem' }}>{t('home.gemOfDay')}</div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div className={styles.wordTitle}>Pristine</div>
                            <div className={styles.wordTranslation}>чистый, нетронутый</div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.5' }}>
                            "A sovereign's mind must remain pristine for the coming conquest."
                        </p>
                    </div>

                    {/* Progress Card */}
                    <div className={styles.widget}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div className={styles.userLabel}>{t('home.weeklyGoal')}</div>
                            <Trophy size={14} color="#fbbf24" />
                        </div>
                        <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <div style={{ width: '65%', height: '100%', background: 'linear-gradient(to right, #3b82f6, #6366f1)', borderRadius: '4px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700 }}>
                            <span style={{ color: '#475569' }}>{t('home.proProgress')}</span>
                            <span style={{ color: '#fff' }}>65%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
