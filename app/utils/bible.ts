import { database } from './database/database';
import { BibleResult } from './database/types';

export const initializeDatabase = async () => {
    try {
        console.log('Initializing Bible database...');
        await database.initialize();
        console.log('Bible database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Bible database:', error);
        throw error;
    }
};

export const getVersesFromDB = async (reference: string): Promise<BibleResult> => {
    try {
        return await database.getVerses(reference);
    } catch (error) {
        console.error('Failed to get verses:', error);
        throw error;
    }
};

// Re-export types
export * from './database/types';
