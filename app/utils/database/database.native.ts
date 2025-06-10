import * as SQLite from 'expo-sqlite';
import bibleDataRaw from '../../../data/NIV_bible.json';
import { BibleResult, DatabaseInterface } from './types';
import { parseReference } from '../../../utils/bible';

// Type the imported data properly
const bibleData = bibleDataRaw as Record<string, Record<string, Record<string, string>>>;

class NativeDatabase implements DatabaseInterface {
    private db: SQLite.SQLiteDatabase | null = null;

    async initialize(): Promise<void> {
        console.log('Initializing native database...');
        return new Promise<void>((resolve, reject) => {
            try {
                const db = SQLite.openDatabaseSync('bible.db');
                this.db = db;

                // Create verses table
                db.execSync(`
                    CREATE TABLE IF NOT EXISTS verses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        book TEXT NOT NULL,
                        chapter INTEGER NOT NULL,
                        verse INTEGER NOT NULL,
                        text TEXT NOT NULL,
                        UNIQUE(book, chapter, verse)
                    )
                `);

                // Check if verses table is empty
                const result = db.getFirstSync('SELECT COUNT(*) as count FROM verses') as { count: number } | null;
                const count = result?.count || 0;
                
                if (count === 0) {
                    console.log('Bible database is empty. Importing data...');
                    this.importBibleData();
                    console.log('Bible data import completed.');
                } else {
                    console.log(`Bible database already has ${count} verses.`);
                }
                
                resolve();
            } catch (error) {
                console.error('Database initialization error:', error);
                reject(error);
            }
        });
    }

    private importBibleData(): void {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            let totalImported = 0;
            const totalBooks = Object.keys(bibleData).length;

            console.log(`Starting import of ${totalBooks} books...`);

            for (const [bookName, chapters] of Object.entries(bibleData)) {
                for (const [chapterNum, verses] of Object.entries(chapters)) {
                    for (const [verseNum, verseText] of Object.entries(verses)) {
                        try {
                            this.db.runSync(
                                'INSERT OR REPLACE INTO verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)',
                                [bookName, parseInt(chapterNum), parseInt(verseNum), verseText]
                            );
                            totalImported++;
                        } catch (error) {
                            console.error(`Error importing verse ${bookName} ${chapterNum}:${verseNum}:`, error);
                        }
                    }
                }
            }
            
            console.log(`Bible data import completed. Total verses imported: ${totalImported}`);
        } catch (error) {
            console.error('Error during Bible data import:', error);
            throw error;
        }
    }

    async getVerses(reference: string): Promise<BibleResult> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const { book, chapter, startVerse, endVerse } = parseReference(reference);

        let sql = 'SELECT verse, text FROM verses WHERE book = ? AND chapter = ?';
        let params: any[] = [book, chapter];

        if (startVerse !== undefined) {
            if (endVerse !== undefined && endVerse !== startVerse) {
                sql += ' AND verse BETWEEN ? AND ?';
                params.push(startVerse, endVerse);
            } else {
                sql += ' AND verse = ?';
                params.push(startVerse);
            }
        }

        sql += ' ORDER BY verse';

        try {
            const rows = this.db.getAllSync(sql, params);
            const verses = rows.map((row: any) => ({
                verse: row.verse,
                text: row.text
            }));

            if (verses.length === 0) {
                throw new Error(`No verses found for reference: ${reference}`);
            }

            // Format the reference string nicely
            let formattedReference = `${book} ${chapter}`;
            if (startVerse !== undefined) {
                formattedReference += `:${startVerse}`;
                if (endVerse !== undefined && endVerse !== startVerse) {
                    formattedReference += `-${endVerse}`;
                }
            }

            return {
                formattedReference,
                verses,
                book,
                chapter,
                startVerse,
                endVerse
            };
        } catch (error) {
            console.error('SQL error:', error);
            throw error;
        }
    }
}

export const nativeDatabase = new NativeDatabase();

// Export as database for platform-specific resolution
export const database = nativeDatabase;
