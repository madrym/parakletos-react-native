/**
 * Bible utility functions tests
 */

import { 
  parseReference, 
  getVersesFromReference, 
  detectBibleReference, 
  isValidReference 
} from '../bible';

describe('Bible Utility Functions', () => {
  describe('parseReference', () => {
    it('should parse a simple book and chapter reference', () => {
      const result = parseReference('Genesis 1');
      expect(result).toEqual({
        book: 'Genesis',
        chapter: 1,
        startVerse: undefined,
        endVerse: undefined
      });
    });

    it('should parse a book, chapter, and verse reference', () => {
      const result = parseReference('Genesis 1:1');
      expect(result).toEqual({
        book: 'Genesis',
        chapter: 1,
        startVerse: 1,
        endVerse: 1
      });
    });

    it('should parse a verse range reference', () => {
      const result = parseReference('Genesis 1:1-3');
      expect(result).toEqual({
        book: 'Genesis',
        chapter: 1,
        startVerse: 1,
        endVerse: 3
      });
    });

    it('should parse abbreviated book names', () => {
      const result = parseReference('Gen 1:1');
      expect(result).toEqual({
        book: 'Genesis',
        chapter: 1,
        startVerse: 1,
        endVerse: 1
      });
    });

    it('should handle references without spaces', () => {
      const result = parseReference('Gen1:1');
      expect(result).toEqual({
        book: 'Genesis',
        chapter: 1,
        startVerse: 1,
        endVerse: 1
      });
    });

    it('should throw error for invalid references', () => {
      expect(() => parseReference('invalid reference format')).toThrow('Invalid Bible reference format');
    });
  });

  describe('getVersesFromReference', () => {
    it('should return a single verse', async () => {
      const result = await getVersesFromReference('Genesis 1:1');
      expect(result.formattedReference).toBe('Genesis 1:1');
      expect(result.verses).toHaveLength(1);
      expect(result.verses[0].verse).toBe(1);
      expect(result.verses[0].text).toContain('In the beginning');
      expect(result.book).toBe('Genesis');
      expect(result.chapter).toBe(1);
      expect(result.startVerse).toBe(1);
      expect(result.endVerse).toBe(1);
    });

    it('should return multiple verses in a range', async () => {
      const result = await getVersesFromReference('Genesis 1:1-3');
      expect(result.formattedReference).toBe('Genesis 1:1-3');
      expect(result.verses).toHaveLength(3);
      expect(result.verses[0].verse).toBe(1);
      expect(result.verses[1].verse).toBe(2);
      expect(result.verses[2].verse).toBe(3);
    });

    it('should return entire chapter when no verse specified', async () => {
      const result = await getVersesFromReference('Jude 1');
      expect(result.formattedReference).toBe('Jude 1');
      expect(result.verses.length).toBeGreaterThan(1);
      expect(result.startVerse).toBeUndefined();
      expect(result.endVerse).toBeUndefined();
    });

    it('should throw error for non-existent book', async () => {
      await expect(getVersesFromReference('NonExistent 1:1')).rejects.toThrow('Book not found: NonExistent');
    });

    it('should throw error for non-existent chapter', async () => {
      await expect(getVersesFromReference('Genesis 999:1')).rejects.toThrow('Chapter not found: Genesis 999');
    });

    it('should throw error for non-existent verse range', async () => {
      await expect(getVersesFromReference('Genesis 1:999')).rejects.toThrow('No verses found for reference: Genesis 1:999');
    });
  });

  describe('detectBibleReference', () => {
    it('should detect valid Bible reference in text', () => {
      const text = 'Please read Genesis 1:1 for more information.';
      const result = detectBibleReference(text);
      expect(result).toBe('Genesis 1:1');
    });

    it('should detect abbreviated references', () => {
      const text = 'As it says in Gen 1:1, God created the heavens.';
      const result = detectBibleReference(text);
      expect(result).toBe('Gen 1:1');
    });

    it('should return null for text without references', () => {
      const text = 'This text has no Bible references in it.';
      const result = detectBibleReference(text);
      expect(result).toBeNull();
    });

    it('should detect the first valid reference when multiple exist', () => {
      const text = 'Read Genesis 1:1 and also John 3:16 for context.';
      const result = detectBibleReference(text);
      expect(result).toBe('Genesis 1:1');
    });
  });

  describe('isValidReference', () => {
    it('should return true for valid references', async () => {
      const result = await isValidReference('Genesis 1:1');
      expect(result).toBe(true);
    });

    it('should return false for invalid references', async () => {
      const result = await isValidReference('NonExistent 1:1');
      expect(result).toBe(false);
    });

    it('should return false for malformed references', async () => {
      const result = await isValidReference('invalid reference format');
      expect(result).toBe(false);
    });
  });
}); 