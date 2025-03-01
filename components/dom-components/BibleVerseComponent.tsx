import React, { useState } from 'react';
import { NodeKey, $getNodeByKey, LexicalNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { database } from '@/app/utils/database/database';

// Define the interface for the node attributes here instead of importing from BibleVerseNode
interface BibleVerseAttributes {
  reference: string;
  verseText: string;
}

// Define a type for nodes that have updateAttributes method
interface NodeWithAttributes extends LexicalNode {
  updateAttributes: (attributes: BibleVerseAttributes) => void;
}

interface BibleVerseComponentProps {
  reference: string;
  verseText: string;
  nodeKey: NodeKey;
  translation: string;
}

export function BibleVerseComponent({
  reference,
  verseText,
  nodeKey,
  translation = 'NIV', // Default to NIV if not provided
}: BibleVerseComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editReference, setEditReference] = useState(reference);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReference, setCurrentReference] = useState(reference);
  const [currentVerseText, setCurrentVerseText] = useState(verseText);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editReference.trim()) {
      setError('Please enter a valid Bible reference');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await database.getVerses(editReference);
      
      if (!result || result.verses.length === 0) {
        throw new Error('Verse not found');
      }

      const newVerseText = result.verses.map(v => `${v.verse}. ${v.text}`).join(' ');

      editor.update(() => {
        // Use $getNodeByKey to get the node without direct dependency
        const node = $getNodeByKey(nodeKey);
        // Check if node exists and has updateAttributes method
        if (node && 'updateAttributes' in node) {
          // Use type assertion to tell TypeScript this node has updateAttributes
          (node as NodeWithAttributes).updateAttributes({
            reference: result.formattedReference,
            verseText: newVerseText
          });
        }
      });

      setCurrentReference(result.formattedReference);
      setCurrentVerseText(newVerseText);
      
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update verse: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditReference(currentReference);
    setError(null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bible-verse-editor">
        <div className="bible-verse-edit-form">
          {error && <div className="bible-verse-error">{error}</div>}
          
          <div className="bible-verse-edit-row">
            <label>Reference:</label>
            <input
              type="text"
              value={editReference}
              onChange={(e) => setEditReference(e.target.value)}
              placeholder="e.g., John 3:16 or Romans 8:28-30"
            />
            <small className="reference-help">
              Format: Book Chapter:Verse or Book Chapter:StartVerse-EndVerse
            </small>
          </div>
          <div className="bible-verse-edit-buttons">
            <button 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bible-verse-container">
      <div className="bible-verse-header">
        <div className="bible-verse-reference">
          {currentReference}
          <span className="bible-verse-translation">{translation}</span>
        </div>
        <button 
          className="bible-verse-edit-button" 
          onClick={handleEdit}
          aria-label="Edit verse reference"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            width="16" 
            height="16" 
            fill="currentColor"
          >
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
      </div>
      <div className="bible-verse-content">
        <p>{currentVerseText}</p>
      </div>
    </div>
  );
} 