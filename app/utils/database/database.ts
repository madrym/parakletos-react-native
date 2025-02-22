// This file is a placeholder and will be replaced by either database.web.ts or database.native.ts
// at build time based on the platform.

import { DatabaseInterface, BibleResult } from './types';

export const database: DatabaseInterface = {
    initialize: async () => {
        throw new Error('Database implementation not loaded');
    },
    getVerses: async (_reference: string): Promise<BibleResult> => {
        throw new Error('Database implementation not loaded');
    }
};
