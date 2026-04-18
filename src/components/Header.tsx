import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User as UserIcon, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import AuthModal from './AuthModal';
import InstallInstructions from './InstallInstructions';
import styles from './Header.module.css';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isSafari, setIsSafari] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Detect Safari (including Desktop)
        const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        setIsSafari(isSafariBrowser);

        // Detect if already installed/standalone
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (isSafari || isIOS) {
            setIsInstructionsOpen(true);
            return;
        }

        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const showInstallButton = (deferredPrompt !== null) || ((isIOS || isSafari) && !isStandalone);

    const isActive = (path: string) => location.pathname === path;

    const navLinks = [
        { name: t('nav.home'), path: '/' },
        { name: t('nav.dictionaries'), path: '/dictionaries' },
        { name: t('nav.games'), path: '/games' },
    ];

    return (
        <>
            <header className={styles.header}>
                <div className={styles.container}>
                    <div className={styles.navContainer}>
                        <Link to="/" className={styles.logo}>
                            <img src="/favicon.png" alt="BeneDict" className={styles.logoIcon} />
                            <span>BeneDict</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className={styles.desktopNav}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`${styles.navLink} ${isActive(link.path) ? styles.activeLink : ''}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>

                        {/* Interaction Corner */}
                        <div className={styles.authButtons}>
                            <LanguageSwitcher />

                            {showInstallButton && (
                                <button
                                    onClick={handleInstallClick}
                                    className={styles.installButton}
                                    title="Install App"
                                >
                                    <Download size={18} />
                                    <span className={styles.btnText}>Install</span>
                                </button>
                            )}

                            {currentUser ? (
                                <Link to="/profile" className={styles.userNameLink}>
                                    <span className={styles.userEmail}>
                                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                                    </span>
                                    <UserIcon size={20} className={styles.userIcon} />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className={styles.signInButton}
                                >
                                    <UserIcon size={18} />
                                    Sign In
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className={styles.mobileMenuButton}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className={styles.mobileMenu}>
                        <div>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`${styles.mobileNavLink} ${isActive(link.path) ? styles.mobileNavActive : ''}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className={styles.mobileAuth}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <LanguageSwitcher />
                                </div>

                                {showInstallButton && (
                                    <button
                                        onClick={() => { handleInstallClick(); setIsMenuOpen(false); }}
                                        className={styles.mobileInstallButton}
                                        style={{ marginBottom: '0.75rem' }}
                                    >
                                        <Download size={18} /> Install App
                                    </button>
                                )}

                                {currentUser ? (
                                    <Link 
                                        to="/profile" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className={styles.mobileUserLink}
                                    >
                                        <span className={styles.userEmail}>
                                            {currentUser.displayName || currentUser.email?.split('@')[0]}
                                        </span>
                                        <UserIcon size={20} />
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                                        className={styles.mobileSignInButton}
                                    >
                                        Sign In
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <InstallInstructions 
                isOpen={isInstructionsOpen} 
                onClose={() => setIsInstructionsOpen(false)} 
                isMac={isSafari && !isIOS}
            />
        </>
    );
}
