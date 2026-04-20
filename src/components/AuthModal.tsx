import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { X, Mail, ArrowLeft } from 'lucide-react';
import styles from './AuthModal.module.css';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signInWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();
    const { t } = useLanguage();

    if (!isOpen) return null;

    const getErrorMessage = (error: any) => {
        switch (error.code) {
            case 'auth/invalid-credential':
                return 'Incorrect email or password.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/email-already-in-use':
                return 'This email is already registered.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Check your connection.';
            case 'auth/popup-closed-by-user':
                return 'Sign in cancelled.';
            default:
                return error.message;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isResetPassword) {
                await resetPassword(email);
                setResetSent(true);
            } else if (isLogin) {
                await loginWithEmail(email, password);
                onClose();
            } else {
                await signupWithEmail(email, password);
                onClose();
            }
        } catch (err: any) {
            setError(getErrorMessage(err));
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            onClose();
        } catch (err: any) {
            setError(getErrorMessage(err));
        }
    };

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button
                    onClick={onClose}
                    className={styles.closeButton}
                >
                    <X size={24} />
                </button>

                <h2 className={styles.title}>
                    {isResetPassword ? t('auth.resetPasswordTitle') : (isLogin ? t('auth.welcomeBack') : t('auth.createAccount'))}
                </h2>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {resetSent ? (
                    <div className={styles.successMessage}>
                        <p>{t('auth.resetEmailSent')}</p>
                        <button
                            onClick={() => {
                                setIsResetPassword(false);
                                setResetSent(false);
                            }}
                            className={styles.submitButton}
                            style={{ marginTop: '1.5rem' }}
                        >
                            {t('auth.backToLogin')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={styles.socialButtons}>
                            <button
                                onClick={handleGoogleSignIn}
                                className={styles.socialButton}
                            >
                                <img src="/google.svg" className={styles.googleIcon} alt="Google" />
                                {t('auth.continueWithGoogle')}
                            </button>
                        </div>

                        <div className={styles.divider}>
                            <div className={styles.dividerLineContainer}>
                                <div className={styles.dividerLine}></div>
                            </div>
                            <div className={styles.dividerTextContainer}>
                                <span className={styles.dividerText}>{t('auth.orContinueWithEmail')}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>{t('auth.emailLabel')}</label>
                                <div className={styles.inputWrapper}>
                                    <Mail className={styles.inputIcon} size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={styles.input}
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {!isResetPassword && (
                                <div className={styles.inputGroup}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label className={styles.label}>{t('auth.passwordLabel')}</label>
                                        {isLogin && (
                                            <button
                                                type="button"
                                                onClick={() => setIsResetPassword(true)}
                                                className={styles.forgotPasswordLink}
                                            >
                                                {t('auth.forgotPassword')}
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`${styles.input} ${styles.passwordInput} `}
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className={styles.submitButton}
                            >
                                {isResetPassword ? t('auth.sendResetLink') : (isLogin ? t('auth.signIn') : t('auth.signUp'))}
                            </button>
                            
                            {isResetPassword && (
                                <button
                                    type="button"
                                    onClick={() => setIsResetPassword(false)}
                                    className={styles.backLink}
                                >
                                    <ArrowLeft size={16} />
                                    {t('auth.backToLogin')}
                                </button>
                            )}
                        </form>

                        <p className={styles.footer}>
                            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className={styles.toggleButton}
                            >
                                {isLogin ? t('auth.toggleSignUp') : t('auth.toggleLogIn')}
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>,
        document.getElementById('portal-root')!
    );
}
