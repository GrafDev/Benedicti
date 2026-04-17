import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Save, LogOut, ShieldCheck, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import styles from './Profile.module.css';

export default function Profile() {
    const { currentUser, updateProfileName, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [name, setName] = useState(currentUser?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (currentUser?.displayName) {
            setName(currentUser.displayName);
        }
    }, [currentUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        setStatus(null);

        try {
            await updateProfileName(name.trim());
            setStatus({ type: 'success', message: t('profile.saveSuccess') });
            // Clear success message after 3 seconds
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: t('profile.saveError') });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    if (!currentUser) {
        navigate('/');
        return null;
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('profile.title')}</h1>
                <p className={styles.subtitle}>{t('profile.subtitle')}</p>
            </header>

            <main className={styles.profileCard}>
                <div className={styles.sectionTitle}>
                    <ShieldCheck size={18} />
                    {t('profile.accountInfo')}
                </div>

                <form onSubmit={handleSave}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('profile.nameLabel')}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className={styles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('profile.namePlaceholder')}
                                maxLength={30}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <div className={styles.emailDisplay}>
                            {currentUser.email}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={styles.saveButton}
                        disabled={isSaving || name === (currentUser.displayName || '')}
                    >
                        {isSaving ? (
                            <Loader size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {t('common.save')}
                    </button>
                </form>

                {status && (
                    <div className={`${styles.statusMessage} ${styles[status.type]}`}>
                        {status.type === 'success' ? (
                            <CheckCircle size={16} />
                        ) : (
                            <AlertCircle size={16} />
                        )}
                        {status.message}
                    </div>
                )}

                <div className={styles.signOutSection}>
                    <button onClick={handleSignOut} className={styles.signOutButton}>
                        <LogOut size={18} />
                        {t('profile.signOutOfRealm')}
                    </button>
                </div>
            </main>
        </div>
    );
}
