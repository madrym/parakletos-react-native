import * as SQLite from 'expo-sqlite';
import bibleData from '../../../data/NIV.json';
import { BibleResult, DatabaseInterface, parseReference } from './types';

interface SQLiteRows {
    length: number;
    item: (index: number) => any;
}

interface SQLiteResultSet {
    rows: SQLiteRows;
    insertId?: number;
    rowsAffected: number;
}

interface SQLiteTransaction {
    executeSql: (
        sqlStatement: string,
        args?: any[],
        callback?: (transaction: SQLiteTransaction, resultSet: SQLiteResultSet) => void,
        errorCallback?: (transaction: SQLiteTransaction, error: Error) => boolean
    ) => void;
}

interface SQLiteDatabase {
    transaction: (
        callback: (transaction: SQLiteTransaction) => void,
        errorCallback?: (error: Error) => void,
        successCallback?: () => void
    ) => void;
}

class NativeDatabase implements DatabaseInterface {
    private db: SQLiteDatabase | null = null;

    private getDB(): SQLiteDatabase {
        if (!this.db) {
            try {
                this.db = SQLite.openDatabaseSync('bible.db') as unknown as SQLiteDatabase;
            } catch (error) {
                console.error('Error opening database:', error);
                throw error;
            }
        }
        return this.db;
    }

    async initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const db = this.getDB();
                if (!db) {
                    throw new Error('Failed to open database');
                }

                db.transaction((tx: SQLiteTransaction) => {
                    // Create verses table
                    tx.executeSql(
                        `CREATE TABLE IF NOT EXISTS verses (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            book TEXT NOT NULL,
                            chapter INTEGER NOT NULL,
                            verse INTEGER NOT NULL,
                            text TEXT NOT NULL
                        );`,
                        [],
                        () => {},
                        (tx: SQLiteTransaction, error: Error) => {
                            console.error('Error creating verses table:', error);
                            return false;
                        }
                    );

                    // Create cache table
                    tx.executeSql(
                        `CREATE TABLE IF NOT EXISTS verse_cache (
                            reference TEXT PRIMARY KEY,
                            result TEXT NOT NULL,
                            timestamp INTEGER NOT NULL
                        );`,
                        [],
                        () => {},
                        (tx: SQLiteTransaction, error: Error) => {
                            console.error('Error creating cache table:', error);
                            return false;
                        }
                    );

                    // Check if verses table is empty
                    tx.executeSql(
                        'SELECT COUNT(*) as count FROM verses;',
                        [],
                        (tx: SQLiteTransaction, result: SQLiteResultSet) => {
                            const count = result.rows.item(0).count as number;
                            if (count === 0) {
                                // Import data from NIV.json
                                bibleData.forEach(book => {
                                    book.chapters.forEach(chapter => {
                                        chapter.verses.forEach(verse => {
                                            tx.executeSql(
                                                'INSERT INTO verses (book, chapter, verse, text) VALUES (?, ?, ?, ?);',
                                                [book.book, chapter.chapter, verse.verse, verse.text],
                                                () => {},
                                                (tx: SQLiteTransaction, error: Error) => {
                                                    console.error('Error inserting verse:', error);
                                                    return false;
                                                }
                                            );
                                        });
                                    });
                                });
                            }
                        },
                        (tx: SQLiteTransaction, error: Error) => {
                            console.error('Error checking verses table:', error);
                            return false;
                        }
                    );
                },
                (error: Error) => {
                    console.error('Transaction error:', error);
                    reject(error);
                },
                () => {
                    resolve();
                });
            } catch (error) {
                console.error('Database initialization error:', error);
                reject(error);
            }
        });
    }

    async getVerses(reference: string): Promise<BibleResult> {
        return new Promise((resolve, reject) => {
            try {
                const db = this.getDB();
                if (!db) {
                    throw new Error('Database not initialized');
                }

                const parsed = parseReference(reference);
                if (!parsed) {
                    throw new Error('Invalid reference format');
                }

                db.transaction((tx: SQLiteTransaction) => {
                    // Check cache first
                    tx.executeSql(
                        'SELECT result FROM verse_cache WHERE reference = ? AND timestamp > ?',
                        [reference, Date.now() - 24 * 60 * 60 * 1000], // 24 hour cache
                        (tx: SQLiteTransaction, result: SQLiteResultSet) => {
                            if (result.rows.length > 0) {
                                resolve(JSON.parse(result.rows.item(0).result));
                                return;
                            }

                            // If not in cache, query the verses
                            let query = 'SELECT verse, text FROM verses WHERE book = ? AND chapter = ?';
                            let params: (string | number)[] = [parsed.book, parsed.chapter];

                            if (parsed.startVerse) {
                                if (parsed.endVerse) {
                                    query += ' AND verse BETWEEN ? AND ?';
                                    params.push(parsed.startVerse, parsed.endVerse);
                                } else {
                                    query += ' AND verse = ?';
                                    params.push(parsed.startVerse);
                                }
                            }

                            query += ' ORDER BY verse';

                            tx.executeSql(
                                query,
                                params,
                                (tx: SQLiteTransaction, versesResult: SQLiteResultSet) => {
                                    const verses = [];
                                    for (let i = 0; i < versesResult.rows.length; i++) {
                                        verses.push(versesResult.rows.item(i));
                                    }

                                    const result: BibleResult = {
                                        formattedReference: `${parsed.book} ${parsed.chapter}${
                                            parsed.startVerse ? `:${parsed.startVerse}${
                                                parsed.endVerse ? `-${parsed.endVerse}` : ''
                                            }` : ''
                                        }`,
                                        verses
                                    };

                                    // Cache the result
                                    tx.executeSql(
                                        'INSERT OR REPLACE INTO verse_cache (reference, result, timestamp) VALUES (?, ?, ?)',
                                        [reference, JSON.stringify(result), Date.now()],
                                        () => {},
                                        (tx: SQLiteTransaction, error: Error) => {
                                            console.error('Error caching result:', error);
                                            return false;
                                        }
                                    );

                                    resolve(result);
                                },
                                (tx: SQLiteTransaction, error: Error) => {
                                    console.error('Error querying verses:', error);
                                    reject(error);
                                    return false;
                                }
                            );
                        },
                        (tx: SQLiteTransaction, error: Error) => {
                            console.error('Error checking cache:', error);
                            reject(error);
                            return false;
                        }
                    );
                });
            } catch (error) {
                console.error('Error in getVerses:', error);
                reject(error);
            }
        });
    }
}

export const database = new NativeDatabase();
