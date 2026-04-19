import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useLanguage } from '../i18n/LanguageContext';
import { Plus, Book, Loader, X, Globe, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Navigation } from 'swiper/modules';
import { ADMIN_EMAILS } from '../constants/admin';
import 'swiper/css';
import 'swiper/css/navigation';
import styles from './Dictionaries.module.css';

export default function Dictionaries() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    
    // Using individual selectors for better stability in Zustand 5
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const loading = useDictionaryStore(state => state.loading);
    const error = useDictionaryStore(state => state.error);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    const addDictionary = useDictionaryStore(state => state.addDictionary);
    const publishDictionary = useDictionaryStore(state => state.publishDictionary);
    const unpublishDictionary = useDictionaryStore(state => state.unpublishDictionary);
    const beneIdMap = useDictionaryStore(state => state.beneIdMap);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDictName, setNewDictName] = useState('');
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('ru');

    const prevRef = useRef<HTMLDivElement>(null);
    const nextRef = useRef<HTMLDivElement>(null);
    const [swiper, setSwiper] = useState<any>(null);

    useEffect(() => {
        if (currentUser && typeof fetchDictionaries === 'function') {
            fetchDictionaries(currentUser.uid);
        }
    }, [currentUser, fetchDictionaries, dictionaries?.length]);

    const handleCreateDictionary = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        await addDictionary(currentUser.uid, newDictName, sourceLang, targetLang);
        setIsModalOpen(false);
        setNewDictName('');
    };

    const handlePublish = async (e: React.MouseEvent, dictId: string, dictName: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) return;

        const confirmPublish = window.confirm(t('common.publishConfirm', { name: dictName }));
        if (confirmPublish) {
            try {
                await publishDictionary(currentUser.uid, dictId);
                alert(t('common.publishSuccess', { name: dictName }));
            } catch (err: any) {
                alert(t('common.publishError', { message: err.message }));
            }
        }
    };

    const handleUnpublish = async (e: React.MouseEvent, dictId: string, dictName: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) return;

        const confirmUnpublish = window.confirm(t('common.unpublishConfirm', { name: dictName }));
        if (confirmUnpublish) {
            try {
                await unpublishDictionary(currentUser.uid, dictId);
                alert(t('common.unpublishSuccess', { name: dictName }));
            } catch (err: any) {
                alert(t('common.unpublishError', { message: err.message }));
            }
        }
    };

    if (!currentUser) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.emptyState}>
                    <p className={styles.emptyStateText}>{t('common.signInToView')}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '16rem', gap: '1rem' }}>
                    <Loader className="animate-spin" size={48} color="#2563eb" />
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('common.loadingDicts')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.pageContainer}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '16rem', gap: '1rem', textAlign: 'center' }}>
                    <p style={{ color: '#dc2626', fontWeight: 600 }}>{t('common.errorLoading')}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '400px' }}>{error}</p>
                    <button
                        onClick={() => currentUser && fetchDictionaries(currentUser.uid)}
                        style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('common.myDictionaries')}</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={styles.createButton}
                >
                    <Plus size={20} /> {t('common.newDictionary')}
                </button>
            </div>

            <div className={styles.grid}>
                <div className="swiper-container-wrapper">
                    <Swiper
                        className={styles.swiper}
                        modules={[Mousewheel, Navigation]}
                        mousewheel={{ forceToAxis: true }}
                        onSwiper={setSwiper}
                        navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                        }}
                        onInit={(swiper) => {
                            // @ts-ignore
                            swiper.params.navigation.prevEl = prevRef.current;
                            // @ts-ignore
                            swiper.params.navigation.nextEl = nextRef.current;
                            swiper.navigation.init();
                            swiper.navigation.update();
                        }}
                        spaceBetween={20}
                        slidesPerView={1.2}
                        centeredSlides={true}
                        centeredSlidesBounds={true}
                        watchSlidesProgress={true}
                        breakpoints={{
                            640: {
                                slidesPerView: 1.5,
                                spaceBetween: 20
                            },
                            800: {
                                slidesPerView: 2.2,
                                spaceBetween: 25
                            },
                            1100: {
                                slidesPerView: 3.2,
                                spaceBetween: 30
                            }
                        }}
                    >
                    {(dictionaries || []).map((dict) => (
                        <SwiperSlide key={dict.id} className={styles.swiperSlide}>
                            <Link to={`/dict/${dict.id}`} className={styles.cardLink} style={{ display: 'block', textDecoration: 'none', height: '100%', width: '100%' }}>
                                <div className={styles.card} style={{ background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '1.5rem', padding: '2rem', height: '100%', minHeight: '220px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.iconWrapper}>
                                            <Book size={24} />
                                        </div>
                                        <span className={`
                                            ${styles.langBadge} 
                                            ${dict.isShared ? styles.sharedBadge : ''} 
                                            ${dict.isTeacherDict ? styles.teacherBadge : ''}
                                        `}>
                                            {dict.isTeacherDict 
                                                ? t('common.fromTeacher', { name: beneIdMap[dict.userId] || dict.userId }) 
                                                : (dict.isShared 
                                                    ? t('common.common') 
                                                    : (dict.sourceLang.toUpperCase() + ' → ' + dict.targetLang.toUpperCase()))}
                                        </span>
                                    </div>
                                    <h3 className={styles.cardTitle}>{dict.name}</h3>
                                    <p className={styles.cardSubtitle}>{t('common.wordsCount', { count: dict.wordCount })}</p>
                                    
                                    {currentUser?.email && ADMIN_EMAILS.includes(currentUser.email) && !dict.isShared && (
                                        <button 
                                            className={styles.publishButton}
                                            onClick={(e) => handlePublish(e, dict.id, dict.name)}
                                            title={t('common.publish')}
                                        >
                                            <Globe size={18} /> {t('common.publish')}
                                        </button>
                                    )}

                                    {currentUser?.email && ADMIN_EMAILS.includes(currentUser.email) && dict.isShared && (
                                        <button 
                                            className={`${styles.publishButton} ${styles.unpublishButton}`}
                                            onClick={(e) => handleUnpublish(e, dict.id, dict.name)}
                                            title={t('common.unpublish')}
                                        >
                                            <RotateCcw size={18} /> {t('common.unpublish')}
                                        </button>
                                    )}
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
                
                {/* Custom Navigation Buttons */}
                <div ref={prevRef} className={`${styles.navBtn} ${styles.prevBtn}`}>
                    <ChevronLeft size={30} />
                </div>
                <div ref={nextRef} className={`${styles.navBtn} ${styles.nextBtn}`}>
                    <ChevronRight size={30} />
                </div>
                </div>

                {(!dictionaries || dictionaries.length === 0) && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={styles.emptyState}
                    >
                        <Plus size={48} className={styles.emptyStateIcon} />
                        <p className={styles.emptyStateText}>{t('home.createFirstDict')}</p>
                    </button>
                )}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.header}>
                            <h2 className={styles.modalTitle}>{t('common.createNewDictionary')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className={styles.closeButton}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDictionary}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <Book size={14} style={{ marginRight: '0.5rem' }} />
                                    {t('common.dictionaryName')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newDictName}
                                    onChange={(e) => setNewDictName(e.target.value)}
                                    className={styles.input}
                                    placeholder={t('common.dictionaryName')}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <Globe size={14} style={{ marginRight: '0.5rem' }} />
                                        {t('common.from')}
                                    </label>
                                    <select
                                        value={sourceLang}
                                        onChange={(e) => setSourceLang(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                        <option value="it">Italian</option>
                                        <option value="ru">Russian</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <Globe size={14} style={{ marginRight: '0.5rem' }} />
                                        {t('common.to')}
                                    </label>
                                    <select
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                        <option value="it">Italian</option>
                                        <option value="ru">Russian</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.cancelButton}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className={styles.createButton}
                                >
                                    {t('common.createDictionary')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
