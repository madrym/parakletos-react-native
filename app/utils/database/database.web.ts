import { openDB, IDBPDatabase } from 'idb';
import bibleData from '../../../data/NIV.json';
import { BibleResult, DatabaseInterface, parseReference } from './types';

class WebDatabase implements DatabaseInterface {
    private dbName = 'BibleDB';
    private dbVersion = 1;
    private db: IDBPDatabase | null = null;

    private async getDB() {
        if (!this.db) {
            console.log('Opening IndexedDB database...');
            this.db = await openDB(this.dbName, this.dbVersion, {
                upgrade(db) {
                    console.log('Upgrading IndexedDB database...');
                    // Create verses store
                    if (!db.objectStoreNames.contains('verses')) {
                        const versesStore = db.createObjectStore('verses', { keyPath: 'id', autoIncrement: true });
                        versesStore.createIndex('book_chapter_verse', ['book', 'chapter', 'verse']);
                    }

                    // Create cache store
                    if (!db.objectStoreNames.contains('verse_cache')) {
                        const cacheStore = db.createObjectStore('verse_cache', { keyPath: 'reference' });
                        cacheStore.createIndex('timestamp', 'timestamp');
                    }
                },
            });
            console.log('IndexedDB database opened successfully');
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
            await tx.done;

            if (count === 0) {
                console.log('Importing Bible data into IndexedDB...');
                // Import data
                const verseTx = db.transaction('verses', 'readwrite');
                const versesStore = verseTx.objectStore('verses');

                for (const book of bibleData) {
                    for (const chapter of book.chapters) {
                        for (const verse of chapter.verses) {
                            await versesStore.add({
                                book: book.book,
                                chapter: chapter.chapter,
                                verse: verse.verse,
                                text: verse.text,
                            });
                        }
                    }
                }

                await verseTx.done;
                console.log('Bible data imported successfully');
            } else {
                console.log('Bible data already imported');
            }
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    async getVerses(reference: string): Promise<BibleResult> {
        console.log('Getting verses from web database:', reference);
        const db = await this.getDB();
        const parsed = parseReference(reference);
        if (!parsed) {
            throw new Error('Invalid reference format');
        }

        try {
            // Check cache first
            const cacheTx = db.transaction('verse_cache', 'readonly');
            const cacheStore = cacheTx.objectStore('verse_cache');
            const cached = await cacheStore.get(reference);
            await cacheTx.done;

            if (cached && cached.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
                console.log('Found verses in cache');
                return JSON.parse(cached.result);
            }

            console.log('Fetching verses from database');
            // Query verses
            const tx = db.transaction('verses', 'readonly');
            const versesStore = tx.objectStore('verses');
            const index = versesStore.index('book_chapter_verse');

            let verses;
            if (parsed.startVerse) {
                if (parsed.endVerse) {
                    verses = await index.getAll(IDBKeyRange.bound(
                        [parsed.book, parsed.chapter, parsed.startVerse],
                        [parsed.book, parsed.chapter, parsed.endVerse]
                    ));
                } else {
                    verses = await index.getAll(IDBKeyRange.only(
                        [parsed.book, parsed.chapter, parsed.startVerse]
                    ));
                }
            } else {
                verses = await index.getAll(IDBKeyRange.bound(
                    [parsed.book, parsed.chapter, 0],
                    [parsed.book, parsed.chapter, Infinity]
                ));
            }

            await tx.done;

            const result: BibleResult = {
                formattedReference: `${parsed.book} ${parsed.chapter}${
                    parsed.startVerse ? `:${parsed.startVerse}${
                        parsed.endVerse ? `-${parsed.endVerse}` : ''
                    }` : ''
                }`,
                verses: verses.map(v => ({ verse: v.verse, text: v.text })),
            };

            // Cache the result
            const cacheTx2 = db.transaction('verse_cache', 'readwrite');
            await cacheTx2.objectStore('verse_cache').put({
                reference,
                result: JSON.stringify(result),
                timestamp: Date.now(),
            });
            await cacheTx2.done;

            console.log('Verses fetched successfully');
            return result;
        } catch (error) {
            console.error('Error getting verses:', error);
            throw error;
        }
    }
}

console.log('Initializing web database implementation');
export const database = new WebDatabase();
