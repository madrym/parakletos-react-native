// Legacy format (NIV.json) - keeping for backward compatibility
export interface NIVData {
    book: string;
    chapters: {
      chapter: number;
      verses: {
        verse: number;
        text: string;
      }[];
    }[];
  }

  export interface BibleVerse {
    id?: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }

// New format (NIV_bible.json)
export interface NIVBibleData {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
}