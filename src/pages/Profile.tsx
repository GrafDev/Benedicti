import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Save, LogOut, ShieldCheck, CheckCircle, AlertCircle, Copy, UserPlus, Users, X, GraduationCap, BookOpen } from 'lucide-react';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import ConfirmationModal from '../components/ConfirmationModal';
import styles from './Profile.module.css';

export default function Profile() {
    const { currentUser, updateProfileName, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [name, setName] = useState(currentUser?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [studentIdInput, setStudentIdInput] = useState('');
    const [teacherIdInput, setTeacherIdInput] = useState('');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
    const [teacherError, setTeacherError] = useState<string | null>(null);
    const [isTeacherLocal, setIsTeacherLocal] = useState(false);
    
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText?: string;
        isDestructive?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const { 
        userProfile, 
        beneIdMap,
        fetchProfile, 
        toggleTeacherRole, 
        generateBeneId, 
        resolveBeneIds,
        addStudent, 
        removeStudent,
        addTeacher,
        removeTeacher
    } = useDictionaryStore();

    useEffect(() => {
        let isMounted = true;
        const loadProfile = async () => {
            if (currentUser) {
                const defaultName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User');
                setName(defaultName);
                await fetchProfile(currentUser.uid);
                
                if (!isMounted) return;

                const latestProfile = useDictionaryStore.getState().userProfile;
                if (latestProfile) {
                    setIsTeacherLocal(latestProfile.isTeacher || false);
                }
                if (latestProfile && !latestProfile.beneId) {
                    await generateBeneId(currentUser.uid, defaultName);
                }

                // Resolve student names if any
                if (latestProfile && latestProfile.students.length > 0) {
                    await resolveBeneIds(latestProfile.students);
                }
            }
        };
        loadProfile();
        return () => { isMounted = false; };
    }, [currentUser, fetchProfile, generateBeneId]);

    // Separate reactive effect for resolving student and teacher names
    useEffect(() => {
        const uidsToResolve: string[] = [];
        if (userProfile?.students && userProfile.students.length > 0) {
            uidsToResolve.push(...userProfile.students);
        }
        if (userProfile?.teachers && userProfile.teachers.length > 0) {
            uidsToResolve.push(...userProfile.teachers);
        }
        
        if (uidsToResolve.length > 0) {
            resolveBeneIds(uidsToResolve);
        }
    }, [userProfile?.students, userProfile?.teachers, resolveBeneIds]);

    const hasChanges = (name !== (currentUser?.displayName || '')) || 
                       (isTeacherLocal !== (userProfile?.isTeacher || false));

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!name.trim() || !currentUser) return;

        setIsSaving(true);
        setStatus(null);

        try {
            // 1. Update name if changed
            if (name.trim() !== (currentUser.displayName || '')) {
                await updateProfileName(name.trim());
                await generateBeneId(currentUser.uid, name.trim());
            }
            
            // 2. Update teacher role if changed
            if (isTeacherLocal !== (userProfile?.isTeacher || false)) {
                await toggleTeacherRole(currentUser.uid, isTeacherLocal);
            }

            setStatus({ type: 'success', message: t('profile.saveSuccess') });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: t('profile.saveError') });
        } finally {
            setIsSaving(false);
        }
    };
    
    const requestSignOut = () => {
        setConfirmModal({
            isOpen: true,
            title: t('profile.signOutOfRealm'),
            message: t('profile.signOutConfirm'),
            onConfirm: handleSignOut,
            confirmText: t('common.logout'),
            isDestructive: true
        });
    };
    
    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    const requestRemoveStudent = (uid: string, studentUid: string) => {
        const studentName = beneIdMap[studentUid] || studentUid;
        setConfirmModal({
            isOpen: true,
            title: studentName,
            message: t('profile.removeStudentConfirm'),
            onConfirm: () => removeStudent(uid, studentUid),
            confirmText: t('common.delete'),
            isDestructive: true
        });
    };

    const requestRemoveTeacher = (uid: string, teacherUid: string) => {
        const teacherName = beneIdMap[teacherUid] || teacherUid;
        setConfirmModal({
            isOpen: true,
            title: teacherName,
            message: t('profile.removeTeacherConfirm'),
            onConfirm: () => removeTeacher(uid, teacherUid),
            confirmText: t('common.delete'),
            isDestructive: true
        });
    };

    const handleCopyId = () => {
        const idToCopy = userProfile?.beneId || currentUser?.uid;
        if (idToCopy) {
            navigator.clipboard.writeText(idToCopy);
            setStatus({ type: 'success', message: t('profile.idCopied') });
            setTimeout(() => setStatus(null), 2000);
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentIdInput.trim() || !currentUser) return;

        setIsAddingStudent(true);
        try {
            await addStudent(currentUser.uid, studentIdInput.trim());
            setStudentIdInput('');
            setStatus({ type: 'success', message: t('profile.studentAdded') });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: t('profile.saveError') });
        } finally {
            setIsAddingStudent(false);
        }
    };

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherIdInput.trim() || !currentUser) return;

        setIsAddingTeacher(true);
        setStatus(null);
        setTeacherError(null);
        try {
            await addTeacher(currentUser.uid, teacherIdInput.trim());
            setTeacherIdInput('');
            setStatus({ type: 'success', message: t('common.success') });
            setTimeout(() => setStatus(null), 3000);
        } catch (error: any) {
            // Check if it's a "not found" error for localized display
            if (error.message?.includes('not found') || error.message?.includes('найден')) {
                setTeacherError(t('common.error')); // Or a specific "not found" key if available
                setTimeout(() => setTeacherError(null), 4000);
            } else {
                setStatus({ type: 'error', message: error.message || t('common.error') });
            }
        } finally {
            setIsAddingTeacher(false);
        }
    };


    useEffect(() => {
        if (!currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    if (!currentUser) {
        return null; // Return null while redirecting
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('profile.title')}</h1>
                <p className={styles.subtitle}>{t('profile.subtitle')}</p>
            </header>

            <main className={styles.profileCard}>
                <div className={styles.dashboardGrid}>
                    {/* Left Column: Account & Profile */}
                    <div className={styles.dashboardSection}>
                        <div className={styles.sectionTitle}>
                            <ShieldCheck size={18} />
                            {t('profile.accountInfo')}
                        </div>

                        <form onSubmit={handleSave} className={styles.compactForm}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>{t('profile.nameLabel')}</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t('profile.namePlaceholder')}
                                        maxLength={30}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Email</label>
                                    <div className={styles.emailDisplay}>{currentUser.email}</div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('profile.userIdLabel')}</label>
                                <div className={styles.idContainer} onClick={handleCopyId}>
                                    <code className={styles.idValue}>
                                        {userProfile?.beneId || '---'}
                                    </code>
                                    <Copy size={16} className={styles.copyIcon} />
                                </div>
                            </div>

                        </form>

                    </div>

                    {/* Right Column: Community & Lists */}
                    <div className={styles.dashboardSection}>
                        <div className={styles.teacherToggleSection} style={{ marginBottom: '1rem' }}>
                            <div className={styles.teacherToggle}>
                                <div className={styles.teacherInfo}>
                                    <div className={styles.teacherLabel}>
                                        <GraduationCap size={18} />
                                        {t('profile.teacherRole')}
                                    </div>
                                    <p className={styles.teacherDesc}>{t('profile.teacherDesc')}</p>
                                </div>
                                <label className={styles.switch}>
                                    <input 
                                        type="checkbox" 
                                        checked={isTeacherLocal} 
                                        onChange={(e) => setIsTeacherLocal(e.target.checked)}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.communityContainer}>
                            {isTeacherLocal && (
                                <div className={styles.listBlock}>
                                    <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={18} />
                                        {t('profile.studentsTitle')}
                                    </label>
                                    
                                    <form className={styles.miniForm} onSubmit={handleAddStudent}>
                                        <input 
                                            type="text" 
                                            className={styles.miniInput}
                                            value={studentIdInput}
                                            onChange={(e) => setStudentIdInput(e.target.value)}
                                            placeholder="BeneID..."
                                        />
                                        <button type="submit" className={styles.miniAddBtn} disabled={isAddingStudent || !studentIdInput.trim()}>
                                            <UserPlus size={16} />
                                        </button>
                                    </form>

                                    <div className={styles.compactList}>
                                        {userProfile?.students?.map(sid => (
                                            <div key={sid} className={styles.compactItem}>
                                                <span>{beneIdMap[sid] || sid}</span>
                                                <button onClick={() => requestRemoveStudent(currentUser.uid, sid)} className={styles.miniRemoveBtn}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.listBlock}>
                                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <BookOpen size={18} style={{ color: '#3b82f6' }} />
                                    {t('profile.teachersTitle')}
                                </label>
                                
                                {teacherError && (
                                    <div className={styles.inlineError}>
                                        <AlertCircle size={14} />
                                        Учитель с таким BeneID не найден
                                    </div>
                                )}

                                <form className={styles.miniForm} onSubmit={handleAddTeacher}>
                                    <input 
                                        type="text" 
                                        className={styles.miniInput}
                                        value={teacherIdInput}
                                        onChange={(e) => setTeacherIdInput(e.target.value)}
                                        placeholder="BeneID..."
                                    />
                                    <button type="submit" className={styles.miniAddBtn} style={{ background: '#3b82f6' }} disabled={isAddingTeacher || !teacherIdInput.trim()}>
                                        <UserPlus size={16} />
                                    </button>
                                </form>

                                <div className={styles.compactList}>
                                    {userProfile?.teachers?.map(tid => (
                                        <div key={tid} className={styles.compactItem}>
                                            <span>{beneIdMap[tid] || tid}</span>
                                            <button onClick={() => requestRemoveTeacher(currentUser.uid, tid)} className={styles.miniRemoveBtn}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {status && (
                    <div className={`${styles.statusMessage} ${styles[status.type]}`}>
                        {status.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {status.message}
                    </div>
                )}

                <div className={styles.bottomActions}>
                    {hasChanges ? (
                        <button 
                            onClick={() => handleSave()} 
                            className={styles.finalSaveButton}
                            disabled={isSaving}
                        >
                            <Save size={18} />
                            {isSaving ? t('common.saving') : t('profile.saveChanges')}
                        </button>
                    ) : (
                        <button onClick={requestSignOut} className={styles.finalSignOutButton}>
                            <LogOut size={18} />
                            {t('profile.signOutOfRealm')}
                        </button>
                    )}
                </div>

                <ConfirmationModal 
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={confirmModal.confirmText || t('common.confirm')}
                    cancelText={t('common.cancel')}
                    isDestructive={confirmModal.isDestructive}
                />
            </main>
        </div>
    );
}
