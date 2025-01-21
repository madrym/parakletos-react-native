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