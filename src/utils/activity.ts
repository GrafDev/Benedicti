export interface RecentActivity {
    dictId: string;
    dictName: string;
    mode: string;
    timestamp: number;
}

const STORAGE_KEY = 'benedicti_last_activity';
const MAX_HISTORY = 5;

export const saveRecentActivity = (activity: Omit<RecentActivity, 'timestamp'>) => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        let history: RecentActivity[] = [];

        if (saved) {
            const parsed = JSON.parse(saved);
            // Handle migration from single object to array
            if (Array.isArray(parsed)) {
                history = parsed;
            } else if (typeof parsed === 'object') {
                history = [parsed];
            }
        }

        // Create new entry
        const newEntry: RecentActivity = {
            ...activity,
            timestamp: Date.now()
        };

        // Remove duplicates of same mode+dictionary
        history = history.filter(item => 
            !(item.dictId === activity.dictId && item.mode === activity.mode)
        );

        // Add to start and limit
        history = [newEntry, ...history].slice(0, MAX_HISTORY);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Failed to save recent activity', e);
    }
};

export const getRecentActivities = (): RecentActivity[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            return parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
            // Migration for getter
            return [parsed];
        }
        return [];
    } catch (e) {
        console.error('Failed to get recent activities', e);
        return [];
    }
};

export const clearRecentActivities = () => {
    localStorage.removeItem(STORAGE_KEY);
};
