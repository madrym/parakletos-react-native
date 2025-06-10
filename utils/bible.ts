/**
 * Bible utility functions for reference parsing and verse retrieval
 */

// Import Bible data directly - this works better with both React Native and Jest
import bibleDataRaw from '../data/NIV_bible.json';

// Types for Bible data - maintaining compatibility with existing code
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

// New type for the NIV_bible.json format
interface NIVBibleData {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
}

export interface BibleResult {
  formattedReference: string;
  verses: BibleVerse[];
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

// Type the imported data properly
const bibleData = bibleDataRaw as NIVBibleData;

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

/**
 * Convert NIV Bible data format to the old format for a specific book and chapter
 * This maintains compatibility with existing code
 * 
 * @param bookData - Chapter data from NIV_bible.json format
 * @returns Array of verses in the old format
 */
function convertToOldFormat(bookData: { [verseNumber: string]: string }): BibleVerse[] {
  const verses: BibleVerse[] = [];
  
  for (const [verseNumber, text] of Object.entries(bookData)) {
    verses.push({
      verse: parseInt(verseNumber, 10),
      text: text
    });
  }
  
  // Sort by verse number to ensure proper order
  verses.sort((a, b) => a.verse - b.verse);
  
  return verses;
}

/**
 * Get the maximum verse number for a given book and chapter
 * 
 * @param book - Book name
 * @param chapter - Chapter number
 * @returns Maximum verse number in that chapter
 */
function getMaxVerseInChapter(book: string, chapter: number): number {
  try {
    const bookData = bibleData[book];
    if (!bookData) {
      return 999; // Fallback if book not found
    }
    
    const chapterData = bookData[chapter.toString()];
    if (!chapterData) {
      return 999; // Fallback if chapter not found
    }
    
    // Get all verse numbers and find the maximum
    const verseNumbers = Object.keys(chapterData).map(v => parseInt(v, 10));
    return Math.max(...verseNumbers);
  } catch (error) {
    console.log(`Error getting max verse for ${book} ${chapter}:`, error);
    return 999; // Fallback
  }
}

/**
 * Parse a Bible reference string into its components
 * 
 * @param reference - Reference string (e.g., "Gen 1:1-10")
 * @returns Parsed reference components
 */
export function parseReference(reference: string): {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
} {
  // Clean up the reference string
  const cleanReference = reference.trim().replace(/\s+/g, '');
  
  // Regex patterns for different reference formats
  const patterns = [
    // Pattern 1: Book + Chapter + ":" + StartVerse + "-" + EndVerse (e.g., "John1:1-12")
    /^([123]?[A-Za-z]+)(\d+):(\d+)-(\d+)$/,
    // Pattern 2: Book + Chapter + ":" + StartVerse + "-" (e.g., "John1:4-")
    /^([123]?[A-Za-z]+)(\d+):(\d+)-$/,
    // Pattern 3: Book + Chapter + ":" + Verse (e.g., "John1:1")
    /^([123]?[A-Za-z]+)(\d+):(\d+)$/,
    // Pattern 4: Book + Chapter only (e.g., "John1")
    /^([123]?[A-Za-z]+)(\d+)$/
  ];

  let match = null;
  let patternIndex = -1;
  
  for (let i = 0; i < patterns.length; i++) {
    match = cleanReference.match(patterns[i]);
    if (match) {
      patternIndex = i;
      break;
    }
  }

  if (!match) {
    throw new Error(`Invalid reference format: ${reference}`);
  }

  const [, bookText, chapterText, startVerseText, endVerseText] = match;
  
  // Normalize book name
  const bookName = normalizeBookName(bookText.toLowerCase().trim());
  const chapter = parseInt(chapterText, 10);
  
  // Parse verse numbers if present
  const startVerse = startVerseText ? parseInt(startVerseText, 10) : undefined;
  
  // Handle different end verse scenarios
  let endVerse: number | undefined = undefined;
  
  if (startVerse !== undefined) {
    if (patternIndex === 1) {
      // Pattern like "John1:4-" means from verse 4 to end of chapter
      // Get the actual maximum verse number for this chapter
      endVerse = getMaxVerseInChapter(bookName, chapter);
      console.log(`[Bible Utils] Found range pattern "${reference}", setting endVerse to actual max: ${endVerse}`);
    } else if (endVerseText) {
      // Pattern like "John1:1-12" with explicit end verse
      endVerse = parseInt(endVerseText, 10);
    } else {
      // Pattern like "John1:4" - single verse
      endVerse = startVerse;
    }
  }
  
  return {
    book: bookName,
    chapter,
    startVerse,
    endVerse
  };
}

/**
 * Normalize book name using abbreviations
 * 
 * @param bookText - Raw book text from user input
 * @returns Normalized book name
 */
function normalizeBookName(bookText: string): string {
  const cleanText = bookText.toLowerCase().trim();
  
  // Check abbreviations first
  if (BOOK_ABBREVIATIONS[cleanText]) {
    return BOOK_ABBREVIATIONS[cleanText];
  }
  
  // If not found in abbreviations, try to match partial names
  const possibleMatches = Object.values(BOOK_ABBREVIATIONS).filter(
    bookName => bookName.toLowerCase().startsWith(cleanText)
  );
  
  if (possibleMatches.length === 1) {
    return possibleMatches[0];
  }
  
  // If still not found, capitalize first letter and return as-is
  return bookText.charAt(0).toUpperCase() + bookText.slice(1).toLowerCase();
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
    
    // Find the requested book
    const bookData = bibleData[book];
    if (!bookData) {
      throw new Error(`Book not found: ${book}`);
    }
    
    // Find the requested chapter
    const chapterData = bookData[chapter.toString()];
    if (!chapterData) {
      throw new Error(`Chapter not found: ${book} ${chapter}`);
    }
    
    // Convert to old format for compatibility
    const allVerses = convertToOldFormat(chapterData);
    
    let verses: BibleVerse[];
    
    // If no verse is specified, return the entire chapter
    if (!startVerse) {
      verses = [...allVerses];
    } else {
      // Filter verses based on range
      verses = allVerses.filter(
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
        // Show the actual end verse number instead of 999
        const actualEndVerse = Math.min(endVerse, Math.max(...allVerses.map(v => v.verse)));
        formattedReference += `-${actualEndVerse}`;
      }
    }
    
    return {
      formattedReference,
      verses,
      book,
      chapter,
      startVerse,
      endVerse: endVerse && endVerse !== 999 ? endVerse : Math.max(...allVerses.map(v => v.verse))
    };
  } catch (error) {
    console.error('Error getting verses:', error);
    throw error;
  }
}

/**
 * Detect potential Bible references in text
 * 
 * @param text - Text to search for Bible references
 * @returns First detected reference or null if none found
 */
export function detectBibleReference(text: string): string | null {
  console.log('[Bible Utils] Detecting references in text:', text);
  
  // Updated regex to support multiple patterns:
  // 1. "John1" (book + chapter only) - shows full chapter
  // 2. "John1:1-12" (book + chapter:startVerse-endVerse) - shows verse range
  // 3. "John1:4-" (book + chapter:startVerse-) - shows verse to end of chapter
  // 4. "John1:1" (book + chapter:verse) - shows single verse
  const referencePatterns = [
    // Pattern 1: Book + Chapter + ":" + StartVerse + "-" + EndVerse (e.g., "John1:1-12")
    /\b([123]?[A-Za-z]+)\s*(\d+):(\d+)-(\d+)\b/g,
    // Pattern 2: Book + Chapter + ":" + StartVerse + "-" (e.g., "John1:4-")
    /\b([123]?[A-Za-z]+)\s*(\d+):(\d+)-\s*$/g,
    // Pattern 3: Book + Chapter + ":" + Verse (e.g., "John1:1")
    /\b([123]?[A-Za-z]+)\s*(\d+):(\d+)\b/g,
    // Pattern 4: Book + Chapter only (e.g., "John1") - must be at word boundary and followed by space/end
    /\b([123]?[A-Za-z]+)(\d+)(?=\s|$|[^\w:])/g
  ];
  
  // Try each pattern in order of specificity (most specific first)
  for (const regex of referencePatterns) {
    regex.lastIndex = 0; // Reset regex state
    let match;
    while ((match = regex.exec(text)) !== null) {
      const potentialReference = match[0].trim();
      console.log('[Bible Utils] Found potential reference:', potentialReference);
      
      try {
        // For chapter-only references (Pattern 4), we need to validate the book name
        if (!potentialReference.includes(':')) {
          // This is a chapter-only reference like "John1"
          const bookPart = match[1];
          const chapterPart = match[2];
          
          // Try to parse it to see if it's a valid book
          parseReference(potentialReference);
          console.log('[Bible Utils] Chapter-only reference is valid:', potentialReference);
          return potentialReference;
        } else {
          // This is a verse reference, validate normally
          parseReference(potentialReference);
          console.log('[Bible Utils] Reference is valid:', potentialReference);
          return potentialReference;
        }
      } catch (error) {
        console.log('[Bible Utils] Reference is invalid:', potentialReference, error);
        // Continue searching if this isn't a valid reference
      }
    }
  }
  
  console.log('[Bible Utils] No valid references found in text');
  return null;
}

/**
 * Check if a reference string is valid
 * 
 * @param reference - Reference string to validate
 * @returns Promise resolving to true if valid
 */
export async function isValidReference(reference: string): Promise<boolean> {
  try {
    await getVersesFromReference(reference);
    return true;
  } catch {
    return false;
  }
} 