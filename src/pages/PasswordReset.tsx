import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './PasswordReset.module.css';

export default function PasswordReset() {
    const [searchParams] = useSearchParams();
    const { verifyResetCode, confirmReset } = useAuth();
    const { t } = useLanguage();

    const [oobCode, setOobCode] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const code = searchParams.get('oobCode');
        const mode = searchParams.get('mode');

        if (!code || mode !== 'resetPassword') {
            setStatus('error');
            setError(t('passwordReset.invalidCode'));
            return;
        }

        setOobCode(code);
        
        // Verify the code and get the email
        verifyResetCode(code)
            .then((email) => {
                setEmail(email);
                setStatus('form');
            })
            .catch((err) => {
                console.error('Verify reset code error:', err);
                setStatus('error');
                setError(t('passwordReset.invalidCode'));
            });
    }, [searchParams, verifyResetCode, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError(t('passwordReset.passwordsMatch'));
            return;
        }

        if (!oobCode) return;

        setIsSubmitting(true);
        setError('');

        try {
            await confirmReset(oobCode, newPassword);
            setStatus('success');
        } catch (err: any) {
            console.error('Confirm reset error:', err);
            setError(err.message || t('passwordReset.invalidCode'));
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>{t('passwordReset.loading')}</span>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={`${styles.iconWrapper} ${styles.errorIcon}`}>
                            <AlertCircle size={32} />
                        </div>
                        <h1 className={styles.title}>{t('common.error')}</h1>
                        <p className={styles.subtitle}>{error}</p>
                    </div>
                    <Link to="/" className={styles.homeButton} style={{ display: 'block', textAlign: 'center' }}>
                        {t('nav.home')}
                    </Link>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.success}>
                        <div className={styles.successIcon}>
                            <CheckCircle2 size={48} />
                        </div>
                        <h1 className={styles.successTitle}>{t('common.success')}</h1>
                        <p className={styles.successText}>{t('passwordReset.success')}</p>
                        <Link to="/" className={styles.homeButton}>
                            {t('auth.signIn')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className={styles.title}>{t('passwordReset.title')}</h1>
                    <p className={styles.subtitle}>
                        {t('passwordReset.subtitle')}
                        {email && <><br /><strong>{email}</strong></>}
                    </p>
                </div>

                {error && (
                    <div className={styles.error} style={{ marginBottom: '2rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>{t('passwordReset.newPassword')}</label>
                        <div className={styles.inputWrapper}>
                            <Lock className={styles.inputIcon} size={20} />
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={styles.input}
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>{t('passwordReset.confirmPassword')}</label>
                        <div className={styles.inputWrapper}>
                            <Lock className={styles.inputIcon} size={20} />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={styles.input}
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={styles.submitButton}
                    >
                        {isSubmitting ? t('common.loading') : t('passwordReset.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
}
