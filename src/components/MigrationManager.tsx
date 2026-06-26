import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDictionaryStore } from '../stores/useDictionaryStore';

export default function MigrationManager() {
    const { currentUser } = useAuth();
    const importDefaultDictionary = useDictionaryStore(state => state.importDefaultDictionary);

    useEffect(() => {
        const runImport = async () => {
            if (!currentUser) return;

            // 1. Standard import logic for default dictionary (placeholder if needed)
            const alreadyImported = localStorage.getItem('dict2500_imported');
            if (alreadyImported !== 'true') {
                try {
                    console.log('🚀 MigrationManager: Checking dictionary status...');
                    const response = await fetch('/dict2500.json');
                    if (response.ok) {
                        const data = await response.json();
                        await importDefaultDictionary(data);
                        localStorage.setItem('dict2500_imported', 'true');
                        console.log('✅ MigrationManager: Dictionary 2500 checked successfully!');
                    }
                } catch (error: any) {
                    console.error('❌ MigrationManager: Import check failed:', error.message);
                }
            }
        };

        runImport();
    }, [currentUser, importDefaultDictionary]);

    return null;
}
