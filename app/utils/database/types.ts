export interface BibleVerse {
    verse: number;
    text: string;
}

export interface BibleResult {
    formattedReference: string;
    verses: BibleVerse[];
}

export interface DatabaseInterface {
    initialize(): Promise<void>;
    getVerses(reference: string): Promise<BibleResult>;
}

export interface ParsedReference {
    book: string;
    chapter: number;
    startVerse?: number;
    endVerse?: number;
}

// Book name mappings for abbreviations
export const bookMappings: { [key: string]: string } = {
    'gen': 'Genesis',
    'exo': 'Exodus',
    // Add more mappings as needed
};

// Parse Bible reference
export const parseReference = (reference: string): ParsedReference | null => {
    // Clean and normalize the reference
    const cleanRef = reference.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Match patterns like "Gen 1", "Genesis 1:1", "Gen 1:1-5"
    const regex = /^((?:[1-3]\s*)?[a-z]+)\s*(\d+)(?::(\d+)(?:-(\d+))?)?$/;
    const match = cleanRef.match(regex);
    
    if (!match) return null;
    
    let [_, bookPart, chapter, startVerse, endVerse] = match;
    
    // Normalize book name
    let book = bookPart;
    if (bookMappings[book]) {
        book = bookMappings[book];
    }
    
    return {
        book: book.charAt(0).toUpperCase() + book.slice(1),
        chapter: parseInt(chapter),
        startVerse: startVerse ? parseInt(startVerse) : undefined,
        endVerse: endVerse ? parseInt(endVerse) : undefined
    };
};
