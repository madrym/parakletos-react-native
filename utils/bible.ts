/**
 * Bible utility functions for reference parsing and verse retrieval
 */

// Types for Bible data
export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  book: string;
  chapters: BibleChapter[];
}

export interface BibleResult {
  formattedReference: string;
  verses: BibleVerse[];
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

// Bible book name abbreviations mapping
const BOOK_ABBREVIATIONS: Record<string, string> = {
  'gen': 'Genesis',
  'exo': 'Exodus',
  'lev': 'Leviticus',
  'num': 'Numbers',
  'deu': 'Deuteronomy',
  'deut': 'Deuteronomy',
  'josh': 'Joshua',
  'jos': 'Joshua',
  'judg': 'Judges',
  'jdg': 'Judges',
  'ruth': 'Ruth',
  '1sam': '1 Samuel',
  '1sa': '1 Samuel',
  '1 sam': '1 Samuel',
  '1 sa': '1 Samuel',
  '2sam': '2 Samuel',
  '2sa': '2 Samuel',
  '2 sam': '2 Samuel',
  '2 sa': '2 Samuel',
  '1kin': '1 Kings',
  '1ki': '1 Kings',
  '1 kin': '1 Kings',
  '1 ki': '1 Kings',
  '2kin': '2 Kings',
  '2ki': '2 Kings',
  '2 kin': '2 Kings',
  '2 ki': '2 Kings',
  '1chr': '1 Chronicles',
  '1ch': '1 Chronicles',
  '1 chr': '1 Chronicles',
  '1 ch': '1 Chronicles',
  '2chr': '2 Chronicles',
  '2ch': '2 Chronicles',
  '2 chr': '2 Chronicles',
  '2 ch': '2 Chronicles',
  'ezra': 'Ezra',
  'neh': 'Nehemiah',
  'est': 'Esther',
  'job': 'Job',
  'ps': 'Psalms',
  'psalm': 'Psalms',
  'psa': 'Psalms',
  'prov': 'Proverbs',
  'pro': 'Proverbs',
  'eccl': 'Ecclesiastes',
  'ecc': 'Ecclesiastes',
  'song': 'Song of Solomon',
  'sos': 'Song of Solomon',
  'isa': 'Isaiah',
  'jer': 'Jeremiah',
  'lam': 'Lamentations',
  'ezek': 'Ezekiel',
  'eze': 'Ezekiel',
  'dan': 'Daniel',
  'hos': 'Hosea',
  'joel': 'Joel',
  'amos': 'Amos',
  'obad': 'Obadiah',
  'oba': 'Obadiah',
  'jonah': 'Jonah',
  'jon': 'Jonah',
  'mic': 'Micah',
  'nah': 'Nahum',
  'hab': 'Habakkuk',
  'zeph': 'Zephaniah',
  'zep': 'Zephaniah',
  'hag': 'Haggai',
  'zech': 'Zechariah',
  'zec': 'Zechariah',
  'mal': 'Malachi',
  'matt': 'Matthew',
  'mat': 'Matthew',
  'mt': 'Matthew',
  'mark': 'Mark',
  'mrk': 'Mark',
  'mk': 'Mark',
  'luke': 'Luke',
  'luk': 'Luke',
  'lk': 'Luke',
  'john': 'John',
  'jhn': 'John',
  'jn': 'John',
  'acts': 'Acts',
  'act': 'Acts',
  'rom': 'Romans',
  'ro': 'Romans',
  '1cor': '1 Corinthians',
  '1co': '1 Corinthians',
  '1 cor': '1 Corinthians',
  '1 co': '1 Corinthians',
  '2cor': '2 Corinthians',
  '2co': '2 Corinthians',
  '2 cor': '2 Corinthians',
  '2 co': '2 Corinthians',
  'gal': 'Galatians',
  'ga': 'Galatians',
  'eph': 'Ephesians',
  'phil': 'Philippians',
  'php': 'Philippians',
  'col': 'Colossians',
  '1thess': '1 Thessalonians',
  '1th': '1 Thessalonians',
  '1 thess': '1 Thessalonians',
  '1 th': '1 Thessalonians',
  '2thess': '2 Thessalonians',
  '2th': '2 Thessalonians',
  '2 thess': '2 Thessalonians',
  '2 th': '2 Thessalonians',
  '1tim': '1 Timothy',
  '1ti': '1 Timothy',
  '1 tim': '1 Timothy',
  '1 ti': '1 Timothy',
  '2tim': '2 Timothy',
  '2ti': '2 Timothy',
  '2 tim': '2 Timothy',
  '2 ti': '2 Timothy',
  'titus': 'Titus',
  'tit': 'Titus',
  'phlm': 'Philemon',
  'phm': 'Philemon',
  'heb': 'Hebrews',
  'james': 'James',
  'jas': 'James',
  '1pet': '1 Peter',
  '1pe': '1 Peter',
  '1 pet': '1 Peter',
  '1 pe': '1 Peter',
  '2pet': '2 Peter',
  '2pe': '2 Peter',
  '2 pet': '2 Peter',
  '2 pe': '2 Peter',
  '1john': '1 John',
  '1jn': '1 John',
  '1 john': '1 John',
  '1 jn': '1 John',
  '2john': '2 John',
  '2jn': '2 John',
  '2 john': '2 John',
  '2 jn': '2 John',
  '3john': '3 John',
  '3jn': '3 John',
  '3 john': '3 John',
  '3 jn': '3 John',
  'jude': 'Jude',
  'rev': 'Revelation',
  're': 'Revelation'
};

// Cache for loaded Bible data
let bibleData: BibleBook[] | null = null;

/**
 * Load Bible data from JSON file
 * 
 * @returns Promise resolving to Bible data
 */
export async function loadBibleData(): Promise<BibleBook[]> {
  if (bibleData !== null) {
    return bibleData;
  }
  
  try {
    // Import the NIV.json file
    const data = await import('../data/NIV.json');
    bibleData = data.default;
    return bibleData;
  } catch (error) {
    console.error('Failed to load Bible data:', error);
    throw new Error('Failed to load Bible data');
  }
}

/**
 * Parse a Bible reference string and return normalized components
 * 
 * @param reference - Bible reference string (e.g., "Gen 1:1-10")
 * @returns Parsed reference components
 */
export function parseReference(reference: string): {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
} {
  // Remove all whitespace to handle variations like "Gen 1:1", "Gen1:1"
  const cleanReference = reference.trim();
  
  // Regular expression to match Bible references
  // Format: [Book name][Chapter]:[Verse]-[EndVerse]
  // Or: [Book name][Chapter]
  const regex = /^([\d\s]?[A-Za-z]+)[\s]*(\d+)(?::(\d+)(?:-(\d+))?)?$/;
  const match = cleanReference.match(regex);
  
  if (!match) {
    throw new Error(`Invalid Bible reference format: ${reference}`);
  }
  
  const [_, bookText, chapterText, startVerseText, endVerseText] = match;
  
  // Normalize book name
  const bookName = normalizeBookName(bookText.toLowerCase().trim());
  const chapter = parseInt(chapterText, 10);
  
  // Parse verse numbers if present
  const startVerse = startVerseText ? parseInt(startVerseText, 10) : undefined;
  const endVerse = endVerseText ? parseInt(endVerseText, 10) : startVerse;
  
  return {
    book: bookName,
    chapter,
    startVerse,
    endVerse
  };
}

/**
 * Normalize book name using abbreviations map
 * 
 * @param bookText - Raw book name text
 * @returns Normalized book name
 */
function normalizeBookName(bookText: string): string {
  // First, check if it's already a proper book name
  const lowerBookText = bookText.toLowerCase();
  
  // Check in abbreviations
  if (BOOK_ABBREVIATIONS[lowerBookText]) {
    return BOOK_ABBREVIATIONS[lowerBookText];
  }
  
  // Check if it's a full book name that might have been lowercased
  const allBooks = Object.values(BOOK_ABBREVIATIONS);
  const matchedBook = allBooks.find(book => book.toLowerCase() === lowerBookText);
  if (matchedBook) {
    return matchedBook;
  }
  
  // If no match is found but it starts with a number, try to format it properly
  if (/^[123]/.test(lowerBookText)) {
    // Extract the number and the rest of the book name
    const match = lowerBookText.match(/^([123])[\s]?(.+)/);
    if (match) {
      const [_, num, restOfBook] = match;
      const formattedBookName = `${num} ${restOfBook}`;
      
      // Check formatted name in abbreviations
      if (BOOK_ABBREVIATIONS[formattedBookName]) {
        return BOOK_ABBREVIATIONS[formattedBookName];
      }
    }
  }
  
  // If all else fails, just capitalize the first letter of each word
  return bookText
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get verses from Bible data based on a reference string
 * 
 * @param reference - Bible reference string (e.g., "Gen 1:1-10")
 * @returns Promise resolving to formatted reference and verses
 */
export async function getVersesFromReference(reference: string): Promise<BibleResult> {
  try {
    // Parse the reference
    const { book, chapter, startVerse, endVerse } = parseReference(reference);
    
    // Load Bible data
    const data = await loadBibleData();
    
    // Find the requested book
    const bookData = data.find(b => b.book === book);
    if (!bookData) {
      throw new Error(`Book not found: ${book}`);
    }
    
    // Find the requested chapter
    const chapterData = bookData.chapters.find(c => c.chapter === chapter);
    if (!chapterData) {
      throw new Error(`Chapter not found: ${book} ${chapter}`);
    }
    
    let verses: BibleVerse[];
    
    // If no verse is specified, return the entire chapter
    if (!startVerse) {
      verses = [...chapterData.verses];
    } else {
      // Filter verses based on range
      verses = chapterData.verses.filter(
        v => v.verse >= (startVerse || 1) && v.verse <= (endVerse || 999)
      );
    }
    
    if (verses.length === 0) {
      throw new Error(`No verses found for reference: ${reference}`);
    }
    
    // Format the reference string nicely
    let formattedReference = `${book} ${chapter}`;
    if (startVerse) {
      formattedReference += `:${startVerse}`;
      if (endVerse && endVerse !== startVerse) {
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
    console.error('Error getting verses:', error);
    throw error;
  }
}

/**
 * Detect potential Bible references in text
 * 
 * @param text - Text to analyze for Bible references
 * @returns Detected reference or null if none found
 */
export function detectBibleReference(text: string): string | null {
  // Pattern for detecting Bible references
  const referencePattern = /\b([123]?\s?[A-Za-z]+)[\s]*(\d+)(?::(\d+)(?:-(\d+))?)?\b/g;
  
  // Find all matches
  const matches = [...text.matchAll(referencePattern)];
  
  // Return the last match as it's likely the most recent/relevant
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    return lastMatch[0];
  }
  
  return null;
}

/**
 * Check if a reference is valid by attempting to parse and retrieve verses
 * 
 * @param reference - Bible reference to validate
 * @returns Promise resolving to boolean indicating validity
 */
export async function isValidReference(reference: string): Promise<boolean> {
  try {
    await getVersesFromReference(reference);
    return true;
  } catch (error) {
    return false;
  }
} 