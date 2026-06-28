import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, BookOpen, Loader, Volume2, Globe } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import styles from './DictionaryDetail.module.css';

export default function DictionaryDetail() {
    const { id: dictionaryId } = useParams<{ id: string }>();
    const { currentUser, isAdmin } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Using selectors for better stability
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const words = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);
    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
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
    
    const canEdit = !dictionary?.isShared || isAdmin;

    useEffect(() => {
        if (currentUser && dictionaryId) {
            // Hard reload safeguard: if dictionaries aren't locally hydrated yet,
            // we MUST fetch them first so we know if this dict isShared (changes Firebase path).
            if (!dictionaries || dictionaries.length === 0) {
                fetchDictionaries(currentUser.uid).then(() => {
                    fetchWords(currentUser.uid, dictionaryId);
                });
            } else {
                fetchWords(currentUser.uid, dictionaryId);
            }
        }
    }, [currentUser, dictionaryId, fetchWords, fetchDictionaries]);

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
        if (!confirm(t('dictionaryDetail.deleteDict'))) return;
        await deleteDictionary(currentUser.uid, dictionaryId);
        navigate('/dictionaries');
    };

    // ─── Render ─────────────────────────────────────────────────────────────────

    if (!currentUser) {
        return (
            <div className={styles.pageContainer}>
                <p>{t('common.signInToView')}</p>
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
            <div className={styles.headerContainer}>
                <Link to="/dictionaries" className={styles.backArrow} title={t('common.back')}>
                    <ArrowLeft size={28} />
                </Link>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>
                        {dictionary?.name ?? t('common.dictionary')}
                    </h1>
                    <div className={styles.meta}>
                        {dictionary && (
                            <span className={styles.langBadge}>
                                {dictionary.sourceLang.toUpperCase()} → {dictionary.targetLang.toUpperCase()}
                            </span>
                        )}
                        <span className={styles.wordCount}>
                            {t('common.wordsCount', { count: (words || []).length })}
                        </span>
                        {dictionary?.isShared && (
                            <span className={styles.sharedBadge}>
                                <Globe size={12} /> {t('common.common')}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className={styles.deleteAction}>
                    {canEdit && (
                        <button
                            onClick={handleDeleteDictionary}
                            className={`${styles.iconButton} ${styles.danger}`}
                            title={t('common.delete')}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                <div className={styles.addAction}>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className={styles.addButton}
                    >
                        <Plus size={18} /> {t('dictionaryDetail.addWord')}
                    </button>
                </div>
            </div>

            {/* Word list */}
            {(!words || words.length === 0) ? (
                <div className={styles.emptyState}>
                    <BookOpen size={48} />
                    <h3>{t('dictionaryDetail.noWords')}</h3>
                    <p>{canEdit ? t('dictionaryDetail.addFirstWord') : t('dictionaryDetail.emptyCommon')}</p>
                    {canEdit && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className={styles.addButton}
                        >
                            <Plus size={16} /> {t('dictionaryDetail.addWord')}
                        </button>
                    )}
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
                                            placeholder={t('dictionaryDetail.placeholderOriginal')}
                                            autoFocus
                                        />
                                        <input
                                            className={styles.editInput}
                                            value={editTranslation}
                                            onChange={e => setEditTranslation(e.target.value)}
                                            placeholder={t('dictionaryDetail.placeholderTranslation')}
                                        />
                                    </div>
                                    <div className={styles.wordActions} onClick={e => e.stopPropagation()}>
                                        <button
                                            className={styles.saveButton}
                                            onClick={() => handleSaveEdit(word.id)}
                                            title={t('common.save')}
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            className={styles.iconButton}
                                            onClick={cancelEdit}
                                            title={t('common.cancel')}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // ── Read mode ─────────────────────────────────────────────────
                                <>
                                    {/* Read mode */}
                                    <div className={styles.wordCardMain}>
                                        <button 
                                            className={styles.speakButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                speechService.speak(word.original, dictionary?.sourceLang || 'en');
                                            }}
                                            title={t('dictionaryDetail.listen')}
                                        >
                                            <Volume2 size={16} />
                                        </button>
                                        <div className={styles.wordTexts}>
                                            <span className={styles.original}>{word.original}</span>
                                            <span className={styles.arrow}>-</span>
                                            <span className={styles.translation}>{word.translation}</span>
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div className={styles.wordActions} onClick={e => e.stopPropagation()}>
                                            <button
                                                className={styles.iconButton}
                                                onClick={() => startEdit(word.id, word.original, word.translation)}
                                                title={t('dictionaryDetail.edit')}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                className={`${styles.iconButton} ${styles.danger}`}
                                                onClick={() => handleDeleteWord(word.id)}
                                                title={t('common.delete')}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
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
                            <h2 className={styles.modalTitle}>{t('dictionaryDetail.addNewWord')}</h2>
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
                                    {t('dictionaryDetail.source')} ({dictionary?.sourceLang.toUpperCase() ?? 'Source'})
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newOriginal}
                                    onChange={e => setNewOriginal(e.target.value)}
                                    className={styles.input}
                                    placeholder={t('dictionaryDetail.placeholderOriginal')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    {t('dictionaryDetail.target')} ({dictionary?.targetLang.toUpperCase() ?? 'Target'})
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newTranslation}
                                    onChange={e => setNewTranslation(e.target.value)}
                                    className={styles.input}
                                    placeholder={t('dictionaryDetail.placeholderTranslation')}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" className={styles.submitButton}>
                                    {t('dictionaryDetail.addWord')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
