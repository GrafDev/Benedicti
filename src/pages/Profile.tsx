import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Save, LogOut, ShieldCheck, CheckCircle, AlertCircle, Loader, Copy, UserPlus, Users, X, GraduationCap, BookOpen } from 'lucide-react';
import { useDictionaryStore } from '../stores/useDictionaryStore';
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
                if (currentUser.displayName) {
                    setName(currentUser.displayName);
                }
                await fetchProfile(currentUser.uid);
                
                if (!isMounted) return;

                // Auto-generate if missing but name exists
                const latestProfile = useDictionaryStore.getState().userProfile;
                if (latestProfile && !latestProfile.beneId && currentUser.displayName) {
                    await generateBeneId(currentUser.uid, currentUser.displayName);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        setStatus(null);

        try {
            await updateProfileName(name.trim());
            
            // Generate or update BeneID based on new name
            if (currentUser) {
                await generateBeneId(currentUser.uid, name.trim());
            }

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
        try {
            await addTeacher(currentUser.uid, teacherIdInput.trim());
            setTeacherIdInput('');
            setStatus({ type: 'success', message: t('common.success') });
            setTimeout(() => setStatus(null), 3000);
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || t('common.error') });
        } finally {
            setIsAddingTeacher(false);
        }
    };

    const handleToggleTeacher = async (checked: boolean) => {
        if (!currentUser) return;
        try {
            await toggleTeacherRole(currentUser.uid, checked);
        } catch (error) {
            setStatus({ type: 'error', message: t('profile.saveError') });
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

                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('profile.userIdLabel')}</label>
                        <div className={styles.idContainer} onClick={handleCopyId}>
                            <code className={styles.idValue}>
                                {userProfile?.beneId ? (
                                    userProfile.beneId
                                ) : (
                                    <span className={styles.generatingText}>
                                        <Loader size={12} className={styles.spin} /> 
                                        {currentUser.displayName ? 'Loading BeneID...' : 'Set name to create ID'}
                                    </span>
                                )}
                            </code>
                            <Copy size={16} className={styles.copyIcon} />
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
                            <>
                                <Save size={18} />
                                {t('profile.save')}
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.teacherSection}>
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
                                checked={userProfile?.isTeacher || false} 
                                onChange={(e) => handleToggleTeacher(e.target.checked)}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {userProfile?.isTeacher && (
                        <div className={styles.studentsListContainer}>
                            <h3 className={styles.sectionSubTitle}>
                                <Users size={18} />
                                {t('profile.studentsTitle')}
                            </h3>
                            
                            <form className={styles.addStudentForm} onSubmit={handleAddStudent}>
                                <input 
                                    type="text" 
                                    className={styles.smallInput}
                                    value={studentIdInput}
                                    onChange={(e) => setStudentIdInput(e.target.value)}
                                    placeholder={t('profile.studentIdPlaceholder')}
                                />
                                <button 
                                    type="submit" 
                                    className={styles.addBtn}
                                    disabled={isAddingStudent || !studentIdInput.trim()}
                                >
                                    <UserPlus size={16} />
                                    {t('profile.addStudent')}
                                </button>
                            </form>

                            <div className={styles.studentsList}>
                                {userProfile?.students && userProfile.students.length > 0 ? (
									userProfile.students.map(sid => (
                                        <div key={sid} className={styles.studentItem}>
                                            <span className={styles.studentId}>
                                                {beneIdMap[sid] || sid}
                                            </span>
                                            <button 
                                                onClick={() => removeStudent(currentUser.uid, sid)}
                                                className={styles.removeBtn}
                                                title={t('profile.studentRemoved')}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.emptyState}>{t('profile.noStudents')}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Teachers Section - Available to everyone */}
                    <div className={styles.studentsListContainer} style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 className={styles.sectionSubTitle}>
                            <BookOpen size={18} style={{ color: '#3b82f6' }} />
                            {t('profile.teachersTitle')}
                        </h3>
                        
                        <form className={styles.addStudentForm} onSubmit={handleAddTeacher}>
                            <input 
                                type="text" 
                                className={styles.smallInput}
                                value={teacherIdInput}
                                onChange={(e) => setTeacherIdInput(e.target.value)}
                                placeholder={t('profile.teacherIdPlaceholder')}
                            />
                            <button 
                                type="submit" 
                                className={styles.addBtn}
                                style={{ background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', color: 'white', border: 'none' }}
                                disabled={isAddingTeacher || !teacherIdInput.trim()}
                            >
                                <UserPlus size={16} />
                                {t('profile.addTeacher')}
                            </button>
                        </form>

                        <div className={styles.studentsList}>
                            {userProfile?.teachers && userProfile.teachers.length > 0 ? (
                                userProfile.teachers.map(tid => (
                                    <div key={tid} className={styles.studentItem}>
                                        <span className={styles.studentId}>
                                            {beneIdMap[tid] || tid}
                                        </span>
                                        <button 
                                            onClick={() => removeTeacher(currentUser.uid, tid)}
                                            className={styles.removeBtn}
                                            title={t('profile.teacherRemoved')}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyState}>{t('profile.noTeachers')}</p>
                            )}
                        </div>
                    </div>
                </div>

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
