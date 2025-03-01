import React, { useState, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { $createBibleVerseNode } from '../nodes/BibleVerseNode';
import { database } from '@/app/utils/database/database';
import { BibleResult } from '@/app/utils/database/types';
import { LexicalNode } from 'lexical';

// Create a custom command for inserting Bible verses
export const INSERT_BIBLE_VERSE_COMMAND = createCommand<undefined>();

export default function BibleVersePlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [showBibleVerseModal, setShowBibleVerseModal] = useState(false);
  const [reference, setReference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  // Initialize the database
  useEffect(() => {
    const initDb = async () => {
      try {
        await database.initialize();
        setIsDbInitialized(true);
        console.log('Bible database initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Bible database:', err);
        setError('Failed to initialize Bible database. Please refresh the page.');
      }
    };
    
    initDb();
  }, []);

  // Register the command to insert a Bible verse
  useEffect(() => {
    return editor.registerCommand(
      INSERT_BIBLE_VERSE_COMMAND,
      () => {
        // Show the modal to select a Bible verse
        setShowBibleVerseModal(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  // Function to fetch Bible verse text from the local database
  const fetchBibleVerse = async (reference: string): Promise<BibleResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isDbInitialized) {
        throw new Error('Bible database is not initialized');
      }
      
      // Use the database to get verses
      const result = await database.getVerses(reference);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch Bible verse: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to insert the Bible verse into the editor
  const insertBibleVerse = async () => {
    if (!reference) {
      setError('Please enter a Bible verse reference');
      return;
    }
    
    const bibleResult = await fetchBibleVerse(reference);
    
    if (!bibleResult) return;

    // Format the verse text
    const verseText = bibleResult.verses.map(v => `${v.verse}. ${v.text}`).join(' ');
    
    editor.update(() => {
      const selection = $getSelection();
      
      if ($isRangeSelection(selection)) {
        const bibleVerseNode = $createBibleVerseNode(
          bibleResult.formattedReference,
          verseText
        );
        
        selection.insertNodes([bibleVerseNode as unknown as LexicalNode]);
      }
    });
    
    // Close the modal after inserting
    setShowBibleVerseModal(false);
    setReference('');
  };

  return (
    <>
      {showBibleVerseModal && (
        <div className="bible-verse-modal-overlay">
          <div className="bible-verse-modal">
            <h2>Insert Bible Verse</h2>
            
            {error && <div className="bible-verse-error">{error}</div>}
            
            <div className="bible-verse-form">
              <div className="bible-verse-form-row">
                <label htmlFor="bible-reference">Reference:</label>
                <input
                  id="bible-reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g., John 3:16 or Romans 8:28-30"
                />
                <small className="reference-help">
                  Format: Book Chapter:Verse or Book Chapter:StartVerse-EndVerse
                </small>
              </div>
              
              <div className="bible-verse-form-buttons">
                <button 
                  onClick={() => setShowBibleVerseModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={insertBibleVerse}
                  disabled={isLoading || !isDbInitialized}
                  className="bible-verse-insert-button"
                >
                  {isLoading ? 'Loading...' : 'Insert Verse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 