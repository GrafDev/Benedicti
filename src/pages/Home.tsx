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
    BrainCircuit 
} from 'lucide-react';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import styles from './Home.module.css';

export default function Home() {
    const { currentUser } = useAuth();
    const { dictionaries, fetchDictionaries } = useDictionaryStore();
    const [lastActivity, setLastActivity] = useState<{ dictId: string, dictName: string, mode: string } | null>(null);

    useEffect(() => {
        if (currentUser) {
            fetchDictionaries(currentUser.uid);
        }
    }, [currentUser, fetchDictionaries]);

    useEffect(() => {
        const saved = localStorage.getItem('benedicti_last_activity');
        if (saved) {
            try {
                setLastActivity(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse last activity', e);
            }
        }
    }, []);

    // Derived statistics
    const totalDictionaries = dictionaries.length;
    const totalWords = dictionaries.reduce((acc, dict) => acc + (dict.wordCount || 0), 0);
    
    // Fallback dictionary if no active game
    const recentDictionary = dictionaries.length > 0 
        ? [...dictionaries].sort((a, b) => b.createdAt - a.createdAt)[0] 
        : null;

    const activeDictId = lastActivity?.dictId || recentDictionary?.id;
    const activeDictName = lastActivity?.dictName || recentDictionary?.name;
    const activeWordCount = dictionaries.find(d => d.id === activeDictId)?.wordCount || 0;
    
    const resumePath = lastActivity 
        ? `/play/${lastActivity.mode}/${lastActivity.dictId}`
        : activeDictId ? `/dict/${activeDictId}` : '/dictionaries';

    const resumeLabel = lastActivity 
        ? `Resume ${lastActivity.mode === 'nback' ? 'N-Back' : 'Flashcards'}`
        : 'Resume Session';

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
                    <h1 className={styles.mainTitle}>
                        BRIGHT DAY, <span className={styles.sovereign}>SOVEREIGN</span>
                    </h1>
                    <p className={styles.subtitle}>
                        The realm of knowledge is yours to conquer
                    </p>
                </div>
                {currentUser && (
                    <div className={styles.userCard}>
                        <div className={styles.userAvatar}>
                            {currentUser.email?.[0].toUpperCase()}
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userLabel}>Active Servant</span>
                            <span className={styles.userName}>{currentUser.email}</span>
                        </div>
                    </div>
                )}
            </header>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard 
                    icon={Layers} 
                    label="Dictionaries" 
                    value={totalDictionaries} 
                    colorClass={styles.bgBlue} 
                />
                <StatCard 
                    icon={Book} 
                    label="Total Words" 
                    value={totalWords} 
                    colorClass={styles.bgYellow} 
                />
                <StatCard 
                    icon={Zap} 
                    label="Elite Quest" 
                    value="English 2500" 
                    colorClass={styles.bgGreen} 
                />
            </div>

            <div className={styles.contentGrid}>
                {/* Main Dashboard Area */}
                <div className={styles.mainArea}>
                    {/* Resume Training Card */}
                    {activeDictId ? (
                        <div className={styles.resumeCard}>
                            <div className={styles.sparkleDecor}>
                                <Sparkles size={160} />
                            </div>
                            
                            <div className={styles.resumeBadge}>
                                <TrendingUp size={14} /> Continue Your Conquest
                            </div>
                            <h2 className={styles.resumeTitle}>
                                {activeDictName}
                            </h2>
                            <p className={styles.resumeText}>
                                Mastery over <strong>{activeWordCount} words</strong> is just one session away.
                            </p>
                            
                            <Link 
                                to={resumePath}
                                className={styles.resumeButton}
                            >
                                {resumeLabel} <ChevronRight size={18} />
                            </Link>
                        </div>
                    ) : (
                        <div className={styles.resumeCard} style={{ textAlign: 'center', background: 'rgba(30,30,50,0.2)' }}>
                            <h2 className={styles.resumeTitle} style={{ fontSize: '2rem' }}>Throne Awaits</h2>
                            <p className={styles.resumeText} style={{ margin: '0 auto 2rem' }}>
                                Create your first dictionary to begin your reign.
                            </p>
                            <Link to="/dictionaries" className={styles.resumeButton}>
                                Create Dictionary
                            </Link>
                        </div>
                    )}

                    {/* Quick Access Games */}
                    <div className={styles.quickApps}>
                        <Link to="/play/nback/default" className={styles.appLink}>
                            <div className={styles.appInfo}>
                                <div className={`${styles.appIcon} ${styles.bgPurple}`}>
                                    <BrainCircuit size={28} />
                                </div>
                                <div className="text-left">
                                    <div className={styles.appName}>N-Back</div>
                                    <div className={styles.appDesc}>Memory training</div>
                                </div>
                            </div>
                            <ChevronRight size={20} color="#475569" />
                        </Link>

                        <Link to="/play/flashcards/default" className={styles.appLink}>
                            <div className={styles.appInfo}>
                                <div className={`${styles.appIcon} ${styles.bgEmerald}`}>
                                    <Gamepad2 size={28} />
                                </div>
                                <div className="text-left">
                                    <div className={styles.appName}>Cards</div>
                                    <div className={styles.appDesc}>Vocabulary repetition</div>
                                </div>
                            </div>
                            <ChevronRight size={20} color="#475569" />
                        </Link>
                    </div>
                </div>

                {/* Sidebar area */}
                <div className={styles.sidebar}>
                    {/* Word of the Day Widget */}
                    <div className={`${styles.widget} ${styles.wordWidget}`}>
                        <div className={styles.userLabel} style={{ marginBottom: '1rem' }}>Gem of the Day</div>
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
                            <div className={styles.userLabel}>Weekly Goal</div>
                            <Trophy size={14} color="#fbbf24" />
                        </div>
                        <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <div style={{ width: '65%', height: '100%', background: 'linear-gradient(to right, #3b82f6, #6366f1)', borderRadius: '4px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700 }}>
                            <span style={{ color: '#475569' }}>PRO PROGRESS</span>
                            <span style={{ color: '#fff' }}>65%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
