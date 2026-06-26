import { useState, useEffect, useRef } from 'react';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Layers, Play, Crown, Grid, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import styles from './Games.module.css';

export default function Games() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);

    const [selectedDictId] = useState<string>(() => {
        return localStorage.getItem('lastUsedDictId') || 'default';
    });

    const prevRef = useRef<HTMLDivElement>(null);
    const nextRef = useRef<HTMLDivElement>(null);
    const [, setSwiper] = useState<any>(null);

    useEffect(() => {
        fetchDictionaries(currentUser?.uid);
    }, [currentUser, fetchDictionaries]);

    const handlePlay = (gameMode: string) => {
        navigate(`/play/${gameMode}/${selectedDictId}`);
    };

    const games = [
        {
            id: 'flashcards',
            title: t('games.flashcards.title'),
            description: t('games.flashcards.description'),
            icon: <Layers size={40} />,
            iconClass: `${styles.iconContainer} ${styles.bgBlue}`,
            iconStyle: {},
            btnStyle: {}
        },
        {
            id: 'nback',
            title: t('games.nbackword.title'),
            description: t('games.nbackword.description'),
            icon: <Crown size={40} />,
            iconClass: styles.iconContainer,
            iconStyle: { background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e' },
            btnStyle: { background: 'linear-gradient(to right, #b45309, #d97706)' }
        },
        {
            id: 'match-pairs',
            title: t('games.pairwords.title'),
            description: t('games.pairwords.description'),
            icon: <Grid size={40} />,
            iconClass: styles.iconContainer,
            iconStyle: { background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)', color: '#5b21b6' },
            btnStyle: { background: 'linear-gradient(to right, #7c3aed, #6d28d9)' }
        },
        {
            id: 'dictsaber',
            title: t('games.dictsaber.title'),
            description: t('games.dictsaber.description'),
            icon: <Zap size={40} />,
            iconClass: styles.iconContainer,
            iconStyle: { background: 'linear-gradient(135deg, #f43f5e 0%, #d946ef 100%)', color: '#ffffff' },
            btnStyle: { background: 'linear-gradient(to right, #ec4899, #be185d)' }
        }
    ];

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>{t('nav.games')}</h1>

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
                            // Secondary initialization to ensure refs are caught
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
                        {games.map((game) => (
                            <SwiperSlide key={game.id} className={styles.swiperSlide}>
                                <div
                                    className={styles.gameCard}
                                    onClick={() => handlePlay(game.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePlay(game.id)}
                                >
                                    <div className={game.iconClass} style={game.iconStyle}>
                                        {game.icon}
                                    </div>
                                    <h2 className={styles.gameTitle}>{game.title}</h2>
                                    <p className={styles.gameDescription}>{game.description}</p>
                                    <button
                                        className={styles.playButton}
                                        style={game.btnStyle}
                                        tabIndex={-1}
                                    >
                                        <Play size={18} /> {t('common.playNow')}
                                    </button>
                                </div>
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
            </div>
        </div>
    );
}
