import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDictionaryStore } from '../stores/useDictionaryStore';

export default function MigrationManager() {
    const { currentUser } = useAuth();
    const importDefaultDictionary = useDictionaryStore(state => state.importDefaultDictionary);

    useEffect(() => {
        const runImport = async () => {
            // Only run when user is logged in to ensure write permissions
            if (!currentUser) return;

            const alreadyImported = localStorage.getItem('dict2500_imported');
            if (alreadyImported === 'true') return;

            try {
                console.log('🚀 MigrationManager: Checking dictionary status...');
                const response = await fetch('/dict2500.json');
                if (!response.ok) {
                    console.warn('⚠️ dict2500.json not found in public folder.');
                    return;
                }
                
                const data = await response.json();
                await importDefaultDictionary(data);
                
                localStorage.setItem('dict2500_imported', 'true');
                console.log('✅ MigrationManager: Dictionary 2500 imported successfully!');
            } catch (error: any) {
                console.error('❌ MigrationManager: Import failed:', error.message);
            }
        };

        runImport();
    }, [currentUser, importDefaultDictionary]);

    return null; // This component doesn't render anything
}
