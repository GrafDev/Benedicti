import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { Plus, Book, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dictionaries() {
    const { currentUser } = useAuth();
    const { dictionaries, loading, fetchDictionaries, addDictionary } = useDictionaryStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDictName, setNewDictName] = useState('');
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');

    useEffect(() => {
        if (currentUser) {
            fetchDictionaries(currentUser.uid);
        }
    }, [currentUser, fetchDictionaries]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        await addDictionary(currentUser.uid, newDictName, sourceLang, targetLang);
        setIsModalOpen(false);
        setNewDictName('');
    };

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
                <p className="text-gray-600">You need to be logged in to manage dictionaries.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Dictionaries</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} /> New Dictionary
                </button>
            </div>

            {loading && <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dictionaries.map((dict) => (
                    <Link key={dict.id} to={`/dict/${dict.id}`} className="block">
                        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-400 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Book size={24} />
                                </div>
                                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    {dict.sourceLang.toUpperCase()} → {dict.targetLang.toUpperCase()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">{dict.name}</h3>
                            <p className="text-gray-500 text-sm">{dict.wordCount} words</p>
                        </div>
                    </Link>
                ))}

                {dictionaries.length === 0 && !loading && (
                    <div
                        onClick={() => setIsModalOpen(true)}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors min-h-[200px]"
                    >
                        <Plus size={48} className="mb-2" />
                        <span className="font-medium">Create your first dictionary</span>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Create New Dictionary</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dictionary Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newDictName}
                                    onChange={(e) => setNewDictName(e.target.value)}
                                    placeholder="e.g. My Spanish Words"
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                                    <select
                                        value={sourceLang}
                                        onChange={(e) => setSourceLang(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                        <option value="ru">Russian</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                    <select
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                        <option value="ru">Russian</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
