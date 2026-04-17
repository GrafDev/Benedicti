import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, BookOpen, Loader, Volume2 } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import styles from './DictionaryDetail.module.css';

export default function DictionaryDetail() {
    const { id: dictionaryId } = useParams<{ id: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Using selectors for better stability
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const words = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);
    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const addWord = useDictionaryStore(state => state.addWord);
    const updateWord = useDictionaryStore(state => state.updateWord);
    const deleteWord = useDictionaryStore(state => state.deleteWord);
    const deleteDictionary = useDictionaryStore(state => state.deleteDictionary);

    // Local UI state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newOriginal, setNewOriginal] = useState('');
    const [newTranslation, setNewTranslation] = useState('');

    // Inline edit state
    const [editingWordId, setEditingWordId] = useState<string | null>(null);
    const [editOriginal, setEditOriginal] = useState('');
    const [editTranslation, setEditTranslation] = useState('');

    // Mobile expand state
    const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

    const dictionary = (dictionaries || []).find(d => d.id === dictionaryId);

    useEffect(() => {
        if (currentUser && dictionaryId) {
            fetchWords(currentUser.uid, dictionaryId);
        }
    }, [currentUser, dictionaryId, fetchWords]);

    // ─── Handlers ──────────────────────────────────────────────────────────────

    const toggleExpand = (id: string) => {
        if (editingWordId) return; // Don't expand while editing
        setExpandedWordId(prev => prev === id ? null : id);
    };

    const handleAddWord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !dictionaryId) return;
        await addWord(currentUser.uid, dictionaryId, newOriginal.trim(), newTranslation.trim());
        setNewOriginal('');
        setNewTranslation('');
        setIsAddModalOpen(false);
    };

    const startEdit = (wordId: string, original: string, translation: string) => {
        setEditingWordId(wordId);
        setEditOriginal(original);
        setEditTranslation(translation);
        setExpandedWordId(null); // Collapse when starting to edit
    };

    const cancelEdit = () => {
        setEditingWordId(null);
        setEditOriginal('');
        setEditTranslation('');
    };

    const handleSaveEdit = async (wordId: string) => {
        if (!currentUser || !dictionaryId) return;
        await updateWord(currentUser.uid, dictionaryId, wordId, {
            original: editOriginal.trim(),
            translation: editTranslation.trim(),
        });
        cancelEdit();
    };

    const handleDeleteWord = async (wordId: string) => {
        if (!currentUser || !dictionaryId) return;
        await deleteWord(currentUser.uid, dictionaryId, wordId);
    };

    const handleDeleteDictionary = async () => {
        if (!currentUser || !dictionaryId) return;
        if (!confirm('Delete this dictionary and all its words?')) return;
        await deleteDictionary(currentUser.uid, dictionaryId);
        navigate('/dictionaries');
    };

    // ─── Render ─────────────────────────────────────────────────────────────────

    if (!currentUser) {
        return (
            <div className={styles.pageContainer}>
                <p>Please sign in to view this dictionary.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.loadingContainer}>
                    <Loader className="animate-spin" size={48} color="#2563eb" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleWrapper}>
                    <Link to="/dictionaries" className={styles.backArrow} title="Back to Dictionaries">
                        <ArrowLeft size={28} />
                    </Link>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.title}>
                            {dictionary?.name ?? 'Dictionary'}
                        </h1>
                        <div className={styles.meta}>
                            {dictionary && (
                                <span className={styles.langBadge}>
                                    {dictionary.sourceLang.toUpperCase()} → {dictionary.targetLang.toUpperCase()}
                                </span>
                            )}
                            <span className={styles.wordCount}>
                                {(words || []).length} word{(words || []).length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        onClick={handleDeleteDictionary}
                        className={`${styles.iconButton} ${styles.danger}`}
                        title="Delete dictionary"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className={styles.addButton}
                    >
                        <Plus size={18} /> Add Word
                    </button>
                </div>
            </div>

            {/* Word list */}
            {(!words || words.length === 0) ? (
                <div className={styles.emptyState}>
                    <BookOpen size={48} />
                    <h3>No words yet</h3>
                    <p>Add your first word to get started.</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className={styles.addButton}
                    >
                        <Plus size={16} /> Add Word
                    </button>
                </div>
            ) : (
                <div className={styles.wordList}>
                    {(words || []).map(word => (
                        <div
                            key={word.id}
                            onClick={() => toggleExpand(word.id)}
                            className={`${styles.wordCard} ${editingWordId === word.id ? styles.editing : ''} ${expandedWordId === word.id ? styles.expanded : ''}`}
                        >
                            {editingWordId === word.id ? (
                                // ── Inline edit mode ──────────────────────────────────────────
                                <>
                                    <div className={styles.editInputs} onClick={e => e.stopPropagation()}>
                                        <input
                                            className={styles.editInput}
                                            value={editOriginal}
                                            onChange={e => setEditOriginal(e.target.value)}
                                            placeholder="Original"
                                            autoFocus
                                        />
                                        <input
                                            className={styles.editInput}
                                            value={editTranslation}
                                            onChange={e => setEditTranslation(e.target.value)}
                                            placeholder="Translation"
                                        />
                                    </div>
                                    <div className={styles.wordActions} onClick={e => e.stopPropagation()}>
                                        <button
                                            className={styles.saveButton}
                                            onClick={() => handleSaveEdit(word.id)}
                                            title="Save"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            className={styles.iconButton}
                                            onClick={cancelEdit}
                                            title="Cancel"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // ── Read mode ─────────────────────────────────────────────────
                                <>
                                    <div className={styles.wordTexts}>
                                        <div className={styles.originalWrapper}>
                                            <button 
                                                className={styles.speakButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    speechService.speak(word.original, dictionary?.sourceLang || 'en');
                                                }}
                                                title="Listen"
                                            >
                                                <Volume2 size={16} />
                                            </button>
                                            <span className={styles.original}>{word.original}</span>
                                        </div>
                                        <span className={styles.arrow}>-</span>
                                        <span className={styles.translation}>{word.translation}</span>
                                    </div>
                                    <div className={styles.wordActions} onClick={e => e.stopPropagation()}>
                                        <button
                                            className={styles.iconButton}
                                            onClick={() => startEdit(word.id, word.original, word.translation)}
                                            title="Edit"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            className={`${styles.iconButton} ${styles.danger}`}
                                            onClick={() => handleDeleteWord(word.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Word Modal */}
            {isAddModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Add New Word</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setIsAddModalOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddWord}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Original ({dictionary?.sourceLang.toUpperCase() ?? 'Source'})
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newOriginal}
                                    onChange={e => setNewOriginal(e.target.value)}
                                    className={styles.input}
                                    placeholder="e.g., Hello"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Translation ({dictionary?.targetLang.toUpperCase() ?? 'Target'})
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newTranslation}
                                    onChange={e => setNewTranslation(e.target.value)}
                                    className={styles.input}
                                    placeholder="e.g., Привет"
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitButton}>
                                    Add Word
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
