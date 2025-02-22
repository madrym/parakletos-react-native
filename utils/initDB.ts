import { initializeDatabase } from '../app/utils/bible';

export const initializeDB = async () => {
    try {
        console.log('Initializing Bible database...');
        await initializeDatabase();
        console.log('Bible database initialized successfully');
    } catch (error) {
        console.error('Error initializing Bible database:', error);
        throw error;
    }
};
