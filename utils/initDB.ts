import AsyncStorage from '@react-native-async-storage/async-storage';
import { NIVData, BibleVerse } from '@/data/types';
import { Platform } from 'react-native';
import Dexie from 'dexie';

// Create a Dexie database for web platform
class BibleDatabase extends Dexie {
  verses!: Dexie.Table<BibleVerse, number>;

  constructor() {
    super('BibleDatabase');
    this.version(1).stores({
      verses: '++id, book, chapter, verse'
    });
  }
}

const webDb = Platform.OS === 'web' ? new BibleDatabase() : null;
const DB_KEY_PREFIX = '@BibleVerses';
const CHUNK_SIZE = 1000; // Number of verses per chunk

export async function initialiseDB(nivData: NIVData[]) {
  try {
    if (Platform.OS === 'web') {
      // Web platform: Use IndexedDB through Dexie
      const count = await webDb!.verses.count();
      if (count > 0) {
        console.log('Database already initialized');
        return;
      }

      const verses: BibleVerse[] = [];
      for (const book of nivData) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            verses.push({
              book: book.book,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text.trim()
            });
          }
        }
      }

      await webDb!.verses.bulkAdd(verses);
      console.log('Database initialization complete');
    } else {
      // Native platform: Use AsyncStorage with chunks
      // Check if database is already initialized
      const metaData = await AsyncStorage.getItem(`${DB_KEY_PREFIX}_meta`);
      if (metaData) {
        console.log('Database already initialized');
        return;
      }

      console.log('Database is empty. Initializing with NIV data...');
      
      // Convert NIV data to verses array
      const verses: BibleVerse[] = [];
      for (const book of nivData) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            verses.push({
              book: book.book,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text.trim()
            });
          }
        }
      }

      // Store verses in chunks
      const chunks = Math.ceil(verses.length / CHUNK_SIZE);
      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = verses.slice(start, end);
        await AsyncStorage.setItem(
          `${DB_KEY_PREFIX}_${i}`,
          JSON.stringify(chunk)
        );
        console.log(`Stored chunk ${i + 1}/${chunks}`);
      }

      // Store metadata
      await AsyncStorage.setItem(
        `${DB_KEY_PREFIX}_meta`,
        JSON.stringify({
          totalVerses: verses.length,
          chunks: chunks,
          lastUpdated: new Date().toISOString()
        })
      );

      console.log('Database initialization complete');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function getVersesFromDB(reference: string): Promise<VerseResult> {
  const { book, chapter, verse, endVerse } = parseReference(reference);
  
  try {
    if (Platform.OS === 'web') {
      // Web platform: Query IndexedDB
      let query = webDb!.verses
        .where('book')
        .equals(book)
        .and(v => v.chapter === chapter);

      if (verse) {
        query = query.and(v => v.verse >= verse && v.verse <= (endVerse || verse));
      }

      const results = await query.toArray();
      
      if (results.length === 0) {
        return { formattedReference: `${book} ${chapter}`, verses: [] };
      }

      const maxVerse = Math.max(...results.map(v => v.verse));
      const formattedReference = verse 
        ? `${book} ${chapter}:${verse}${endVerse ? `-${endVerse}` : ''}`
        : `${book} ${chapter}:1-${maxVerse}`;

      return {
        formattedReference: formattedReference.replace(/(\d)([A-Z])/g, '$1 $2'),
        verses: results.sort((a, b) => a.verse - b.verse)
      };
    } else {
      // Native platform: Use existing AsyncStorage code
      // Get metadata
      const metaData = await AsyncStorage.getItem(`${DB_KEY_PREFIX}_meta`);
      if (!metaData) {
        return { formattedReference: `${book} ${chapter}`, verses: [] };
      }

      const { chunks } = JSON.parse(metaData);
      let results: BibleVerse[] = [];

      // Search through chunks for matching verses
      for (let i = 0; i < chunks; i++) {
        const chunkData = await AsyncStorage.getItem(`${DB_KEY_PREFIX}_${i}`);
        if (chunkData) {
          const chunkVerses: BibleVerse[] = JSON.parse(chunkData);
          const matchingVerses = chunkVerses.filter(v => 
            v.book === book && v.chapter === chapter &&
            (!verse || (v.verse >= verse && v.verse <= (endVerse || verse)))
          );
          results = results.concat(matchingVerses);
        }
      }

      if (results.length === 0) {
        return { formattedReference: `${book} ${chapter}`, verses: [] };
      }

      const maxVerse = Math.max(...results.map(v => v.verse));
      const formattedReference = verse 
        ? `${book} ${chapter}:${verse}${endVerse ? `-${endVerse}` : ''}`
        : `${book} ${chapter}:1-${maxVerse}`;

      return {
        formattedReference: formattedReference.replace(/(\d)([A-Z])/g, '$1 $2'),
        verses: results.sort((a, b) => a.verse - b.verse)
      };
    }
  } catch (error) {
    console.error('Error fetching verses:', error);
    return { formattedReference: `${book} ${chapter}`, verses: [] };
  }
}

// Update clearDatabase to handle both platforms
export async function clearDatabase() {
  try {
    if (Platform.OS === 'web') {
      await webDb!.verses.clear();
    } else {
      const metaData = await AsyncStorage.getItem(`${DB_KEY_PREFIX}_meta`);
      if (metaData) {
        const { chunks } = JSON.parse(metaData);
        for (let i = 0; i < chunks; i++) {
          await AsyncStorage.removeItem(`${DB_KEY_PREFIX}_${i}`);
        }
      }
      await AsyncStorage.removeItem(`${DB_KEY_PREFIX}_meta`);
    }
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

const bookAbbreviationsList: { [key: string]: string[] } = {
  "Genesis": ["Gen", "Ge", "Gn"],
  "Exodus": ["Exod", "Ex", "Exo"],
  "Leviticus": ["Lev", "Le", "Lv"],
  "Numbers": ["Num", "Nu", "Nm", "Nb"],
  "Deuteronomy": ["Deut", "De", "Dt"],
  "Joshua": ["Josh", "Jos", "Jsh"],
  "Judges": ["Judg", "Jdg", "Jg", "Jdgs"],
  "Ruth": ["Rth", "Ru"],
  "1 Samuel": ["1 Sam", "1Sam", "1Sa", "1 Sa"],
  "2 Samuel": ["2 Sam", "2Sam", "2Sa", "2 Sa"],
  "1 Kings": ["1 Kgs", "1King", "1Ki", "1 Ki"],
  "2 Kings": ["2 Kgs", "2King", "2Ki", "2 Ki"],
  "1 Chronicles": ["1 Chr", "1Chr", "1Ch", "1 Ch", "1Chron", "1 Chron"],
  "2 Chronicles": ["2 Chr", "2Chr", "2Ch", "2 Ch", "2Chron", "2 Chron"],
  "Ezra": ["Ezr", "Ez"],
  "Nehemiah": ["Neh", "Ne"],
  "Esther": ["Esth", "Es"],
  "Job": ["Job", "Jb"],
  "Psalms": ["Ps", "Psalm", "Psa", "Psm"],
  "Proverbs": ["Prov", "Pr", "Prv"],
  "Ecclesiastes": ["Eccles", "Ecc", "Ec"],
  "Song of Solomon": ["Song", "SS", "So", "Song of Songs", "Songs", "Sos"],
  "Isaiah": ["Isa", "Is"],
  "Jeremiah": ["Jer", "Je"],
  "Lamentations": ["Lam", "La"],
  "Ezekiel": ["Ezek", "Eze", "Ezk"],
  "Daniel": ["Dan", "Da", "Dn"],
  "Hosea": ["Hos", "Ho"],
  "Joel": ["Joel", "Jl"],
  "Amos": ["Am"],
  "Obadiah": ["Obad", "Ob"],
  "Jonah": ["Jonah", "Jon"],
  "Micah": ["Mic", "Mc"],
  "Nahum": ["Nah", "Na"],
  "Habakkuk": ["Hab", "Hb"],
  "Zephaniah": ["Zeph", "Zep", "Zp"],
  "Haggai": ["Hag", "Hg"],
  "Zechariah": ["Zech", "Zec", "Zc"],
  "Malachi": ["Mal", "Ml"],
  "Matthew": ["Matt", "Mt"],
  "Mark": ["Mark", "Mrk", "Mk", "Mr"],
  "Luke": ["Luke", "Luk", "Lk"],
  "John": ["John", "Jn", "Jhn"],
  "Acts": ["Acts", "Ac"],
  "Romans": ["Rom", "Ro", "Rm"],
  "1 Corinthians": ["1 Cor", "1Cor", "1Co",  "1 Co", "1Corinthians"],
  "2 Corinthians": ["2 Cor", "2Cor", "2Co", "2 Co", "2Corinthians"],
  "Galatians": ["Gal", "Ga"],
  "Ephesians": ["Eph", "Ephes", "Ephesians"],
  "Philippians": ["Phil", "Php", "Pp"],
  "Colossians": ["Col", "Co"],
  "1 Thessalonians": ["1 Thess", "1Thess", "1Th", "1 Th", "1Ts", "1 Ts"],
  "2 Thessalonians": ["2 Thess", "2Thess", "2Th", "2 Th", "2Ts", "2 Ts"],
  "1 Timothy": ["1 Tim", "1Tim", "1 Ti", "1Ti"],
  "2 Timothy": ["2 Tim", "2Tim", "2 Ti", "2Ti"],
  "Titus": ["Tit", "Ti"],
  "Philemon": ["Phil", "Phm"],
  "Hebrews": ["Heb"],
  "James": ["Jam", "Jm"],
  "1 Peter": ["1 Pet", "1Pet", "1Pe", "1Pt", "1P"],
  "2 Peter": ["2 Pet", "2Pet", "2Pe", "2Pt", "2P"],
  "1 John": ["1 John", "1Jn", "1J"],
  "2 John": ["2 John", "2Jn", "2J"],
  "3 John": ["3 John", "3Jn", "3J"],
  "Jude": ["Jude"],
  "Revelation": ["Rev", "Re", "Revel"]
};

function parseReference(reference: string): { book: string, chapter: number, verse?: number, endVerse?: number } {
  // Normalize spaces: ensure single space between words, trim ends
  const normalizedReference = reference.replace(/\s+/g, ' ').trim();
  
  // Updated regex patterns to handle various formats
  const chapterOnlyMatch = normalizedReference.match(/^(\d?\s?[a-z]+(?:\s[a-z]+)?)\s?(\d+)$/i);
  const verseMatch = normalizedReference.match(/^(\d?\s?[a-z]+(?:\s[a-z]+)?)\s?(\d+):(\d+)(-(\d+))?$/i);
  
  let book: string, chapter: string, verse: string | undefined, endVerse: string | undefined;

  if (!chapterOnlyMatch && !verseMatch) {
    // Try to match references without spaces like "1John1"
    const noSpaceMatch = normalizedReference.match(/^(\d?[a-z]+)(\d+)$/i);
    if (noSpaceMatch) {
      [, book, chapter] = noSpaceMatch;
    } else {
      throw new Error('Invalid reference format');
    }
  } else if (chapterOnlyMatch) {
    [, book, chapter] = chapterOnlyMatch;
  } else {
    [, book, chapter, verse, , endVerse] = verseMatch!;
  }

  // Normalize the book name
  book = book.toLowerCase().replace(/\s+/g, '');
  
  // Handle book abbreviations using bookAbbreviationsList
  const fullBookName = Object.entries(bookAbbreviationsList).find(([fullName, abbreviations]) => {
    const normalizedFullName = fullName.toLowerCase().replace(/\s+/g, '');
    
    // Check if the input matches the full name
    if (normalizedFullName === book) {
      return true;
    }
    
    // Check if the input matches any of the abbreviations
    return abbreviations.some(abbr => {
      const normalizedAbbr = abbr.toLowerCase().replace(/\s+/g, '');
      // Handle cases where the book starts with a number (e.g., "1john", "1jn")
      if (normalizedFullName[0] === '1' || normalizedFullName[0] === '2' || normalizedFullName[0] === '3') {
        return book === normalizedAbbr || book === normalizedFullName;
      }
      return book === normalizedAbbr || book.startsWith(normalizedAbbr);
    });
  })?.[0];

  if (fullBookName) {
    book = fullBookName;
  } else {
    // Capitalize first letter of each word
    book = book.replace(/\b\w/g, l => l.toUpperCase());
  }

  return {
    book,
    chapter: parseInt(chapter),
    verse: verse ? parseInt(verse) : undefined,
    endVerse: endVerse ? parseInt(endVerse) : undefined
  };
}

interface VerseResult {
  formattedReference: string;
  verses: BibleVerse[];
}

export async function getVerseFromDB(reference: string): Promise<VerseResult> {
  const { book, chapter, verse } = parseReference(reference);
  
  try {
    const storedData = await AsyncStorage.getItem(DB_KEY_PREFIX);
    if (!storedData) {
      return {
        formattedReference: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`,
        verses: []
      };
    }

    const allVerses: BibleVerse[] = JSON.parse(storedData);
    let result;

    if (verse === undefined) {
      // Get first verse of the chapter
      result = allVerses.find(v => 
        v.book === book && v.chapter === chapter && v.verse === 1
      );
    } else {
      // Get specific verse
      result = allVerses.find(v => 
        v.book === book && v.chapter === chapter && v.verse === verse
      );
    }

    if (result) {
      return {
        formattedReference: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}:1`,
        verses: [{ ...result, text: result.text.trim() }]
      };
    }

    return {
      formattedReference: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`,
      verses: []
    };
  } catch (error) {
    console.error('Error fetching verse from AsyncStorage:', error);
    return {
      formattedReference: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`,
      verses: []
    };
  }
}