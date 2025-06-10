import { openDB, IDBPDatabase } from 'idb';
import bibleDataRaw from '../../../data/NIV_bible.json';
import { BibleResult, DatabaseInterface } from './types';
import { parseReference } from '../../../utils/bible';

// Type the imported data properly
const bibleData = bibleDataRaw as Record<string, Record<string, Record<string, string>>>;

class WebDatabase implements DatabaseInterface {
    private dbName = 'BibleDB';
    private dbVersion = 1;
    private db: IDBPDatabase | null = null;

    private async getDB(): Promise<IDBPDatabase> {
        if (!this.db) {
            this.db = await openDB(this.dbName, this.dbVersion, {
                upgrade(db) {
                    // Create verses store if it doesn't exist
                    if (!db.objectStoreNames.contains('verses')) {
                        const store = db.createObjectStore('verses', { 
                            keyPath: ['book', 'chapter', 'verse'] 
                        });
                        store.createIndex('book', 'book');
                        store.createIndex('chapter', ['book', 'chapter']);
                    }
                },
            });
        }
        return this.db;
    }

    async initialize(): Promise<void> {
        try {
            console.log('Initializing web database...');
            const db = await this.getDB();

            // Check if we need to import data
            const tx = db.transaction('verses', 'readonly');
            const count = await tx.store.count();
            
            if (count === 0) {
                console.log('Bible database is empty. Importing data...');
                await this.importBibleData();
                console.log('Bible data import completed.');
            } else {
                console.log(`Bible database already has ${count} verses.`);
            }
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    private async importBibleData(): Promise<void> {
        const db = await this.getDB();
        
        try {
            let totalImported = 0;
            const totalBooks = Object.keys(bibleData).length;

            console.log(`Starting import of ${totalBooks} books...`);

            const tx = db.transaction('verses', 'readwrite');
            const store = tx.store;

            for (const [bookName, chapters] of Object.entries(bibleData)) {
                for (const [chapterNum, verses] of Object.entries(chapters)) {
                    for (const [verseNum, verseText] of Object.entries(verses)) {
                        try {
                            await store.put({
                                book: bookName,
                                chapter: parseInt(chapterNum),
                                verse: parseInt(verseNum),
                                text: verseText
                            });
                            totalImported++;
                        } catch (error) {
                            console.error(`Error importing verse ${bookName} ${chapterNum}:${verseNum}:`, error);
                        }
                    }
                }
            }

            await tx.done;
            console.log(`Bible data import completed. Total verses imported: ${totalImported}`);
        } catch (error) {
            console.error('Error during Bible data import:', error);
            throw error;
        }
    }

    async getVerses(reference: string): Promise<BibleResult> {
        const db = await this.getDB();
        const { book, chapter, startVerse, endVerse } = parseReference(reference);

        try {
            const tx = db.transaction('verses', 'readonly');
            const store = tx.store;

            let verses: { verse: number; text: string }[] = [];

            if (startVerse !== undefined) {
                if (endVerse !== undefined && endVerse !== startVerse) {
                    // Get a range of verses
                    for (let v = startVerse; v <= endVerse; v++) {
                        const verse = await store.get([book, chapter, v]);
                        if (verse) {
                            verses.push({ verse: verse.verse, text: verse.text });
                        }
                    }
                } else {
                    // Get a single verse
                    const verse = await store.get([book, chapter, startVerse]);
                    if (verse) {
                        verses.push({ verse: verse.verse, text: verse.text });
                    }
                }
            } else {
                // Get entire chapter
                const range = IDBKeyRange.bound([book, chapter, 1], [book, chapter, 999]);
                const allVerses = await store.getAll(range);
                verses = allVerses.map((v: any) => ({ verse: v.verse, text: v.text }));
            }

            // Sort verses by verse number
            verses.sort((a, b) => a.verse - b.verse);

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
            console.error('Database query error:', error);
            throw error;
        }
    }
}

export const webDatabase = new WebDatabase();

// Export as database for platform-specific resolution
export const database = webDatabase;
