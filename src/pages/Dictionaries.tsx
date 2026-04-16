import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { Plus, Book, Loader, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Dictionaries.module.css';

export default function Dictionaries() {
    const { currentUser } = useAuth();
    
    // Using individual selectors for better stability in Zustand 5
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const loading = useDictionaryStore(state => state.loading);
    const error = useDictionaryStore(state => state.error);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    const addDictionary = useDictionaryStore(state => state.addDictionary);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDictName, setNewDictName] = useState('');
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');

    useEffect(() => {
        console.log('Dictionaries count:', dictionaries?.length);
        console.log('fetchDictionaries type:', typeof fetchDictionaries);
        
        if (currentUser && typeof fetchDictionaries === 'function') {
            fetchDictionaries(currentUser.uid);
        } else if (currentUser) {
            console.error('fetchDictionaries is missing from store!');
        }
    }, [currentUser, fetchDictionaries, dictionaries?.length]);

    const handleCreateDictionary = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        await addDictionary(currentUser.uid, newDictName, sourceLang, targetLang);
        setIsModalOpen(false);
        setNewDictName('');
    };

    if (!currentUser) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.emptyState}>
                    <p className={styles.emptyStateText}>Please sign in to view your dictionaries.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '16rem', gap: '1rem' }}>
                    <Loader className="animate-spin" size={48} color="#2563eb" />
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading dictionaries…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.pageContainer}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '16rem', gap: '1rem', textAlign: 'center' }}>
                    <p style={{ color: '#dc2626', fontWeight: 600 }}>Error loading dictionaries</p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '400px' }}>{error}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                        Make sure Realtime Database Rules are published in{' '}
                        <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Firebase Console</a>.
                    </p>
                    <button
                        onClick={() => currentUser && fetchDictionaries(currentUser.uid)}
                        style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Dictionaries</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={styles.createButton}
                >
                    <Plus size={20} /> New Dictionary
                </button>
            </div>

            <div className={styles.grid}>
                {(dictionaries || []).map((dict) => (
                    <Link key={dict.id} to={`/dict/${dict.id}`} className={styles.cardLink}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper}>
                                    <Book size={24} />
                                </div>
                                <span className={styles.langBadge}>
                                    {dict.sourceLang.toUpperCase()} → {dict.targetLang.toUpperCase()}
                                </span>
                            </div>
                            <h3 className={styles.cardTitle}>{dict.name}</h3>
                            <p className={styles.cardSubtitle}>{dict.wordCount} words</p>
                        </div>
                    </Link>
                ))}

                {(!dictionaries || dictionaries.length === 0) && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={styles.emptyState}
                    >
                        <Plus size={48} className={styles.emptyStateIcon} />
                        <p className={styles.emptyStateText}>Create your first dictionary</p>
                    </button>
                )}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.header} style={{ marginBottom: '1rem' }}>
                            <h2 className={styles.modalTitle}>Create New Dictionary</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDictionary}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Dictionary Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newDictName}
                                    onChange={(e) => setNewDictName(e.target.value)}
                                    className={styles.input}
                                    placeholder="e.g., My Spanish Words"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>From</label>
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
                                    <label className={styles.label}>To</label>
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
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.createButton}
                                >
                                    Create Dictionary
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
