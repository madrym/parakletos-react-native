import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  TextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  KEY_SPACE_COMMAND
} from 'lexical';
import { BibleSuggestionBox } from '@/components/note/BibleSuggestionBox';
import { getVersesFromDB } from '@/app/utils/bible';
import { INSERT_BIBLE_VERSE_COMMAND } from './BibleVersePlugin';
import { $createBibleVerseNode } from '../nodes/BibleVerseNode';
import { $isTextNode, $getNodeByKey } from 'lexical';
import { useLexicalTextEntity } from '@lexical/react/useLexicalTextEntity';
import { Portal } from '../Portal';

// The regex pattern to detect potential Bible references
// Supports formats like:
// - Gen 1:1
// - Genesis 1:1
// - Genesis 1:1-10
// - 1 Cor 13:4-7
const BIBLE_REFERENCE_REGEX = 
  /((?:[1-3]\s*)?[A-Za-z]+)\s*(\d+)(?::(\d+)(?:-(\d+))?)?/;

// Persistence settings
const HIDE_DELAY_MS = 1500; // Delay before hiding suggestions
const CACHE_TIMEOUT_MS = 3600000; // 1 hour cache timeout

export function BibleReferenceSuggestionPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [matches, setMatches] = useState<RegExpMatchArray | null>(null);
  const [reference, setReference] = useState<string>('');
  const [verses, setVerses] = useState<Array<{ verse: number; text: string }>>([]);
  const [showSuggestion, setShowSuggestion] = useState<boolean>(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [matchingTextNode, setMatchingTextNode] = useState<{ nodeKey: string, start: number, end: number } | null>(null);
  
  // Use a ref to track the last valid reference
  const lastValidReference = useRef<string>('');

  // Cache for already loaded verses
  const versesCache = useRef<Map<string, { verses: Array<{ verse: number; text: string }>, timestamp: number }>>(
    new Map()
  );

  // Function to detect references in text
  const checkForReferences = useCallback(
    (text: string, nodeKey: string): void => {
      // Clear any existing hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        setHideTimeout(null);
      }
      
      // Scan for potential references in the text
      const match = text.match(BIBLE_REFERENCE_REGEX);
      
      if (match && match.index !== undefined) {
        const matchText = match[0];
        const start = match.index;
        const end = start + matchText.length;
        
        // We'll now be more flexible about when to show suggestions
        // If the match is at least 6 characters long and includes a chapter number
        const isLikelyReference = matchText.length >= 6 && /\d+/.test(matchText);
        
        if (isLikelyReference) {
          setMatches(match);
          setReference(matchText);
          setMatchingTextNode({ nodeKey, start, end });
          
          // Update position whenever we have a match
          updatePosition();
          
          // Check if we have this reference cached
          if (versesCache.current.has(matchText)) {
            const cached = versesCache.current.get(matchText);
            if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT_MS) {
              setVerses(cached.verses);
              setShowSuggestion(true);
              lastValidReference.current = matchText;
              return;
            }
          }

          // Debounce the API call to avoid excessive requests
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }
          
          const timeout = setTimeout(async () => {
            try {
              const result = await getVersesFromDB(matchText);
              if (result.verses.length > 0) {
                setVerses(result.verses);
                setReference(result.formattedReference);
                setShowSuggestion(true);
                lastValidReference.current = matchText;
                
                // Cache the result
                versesCache.current.set(matchText, {
                  verses: result.verses,
                  timestamp: Date.now()
                });
              } else {
                // Don't hide right away if no verses found
                // Instead, set a timeout to hide if no new valid refs are found
                const timeout = setTimeout(() => {
                  if (lastValidReference.current !== matchText) {
                    setShowSuggestion(false);
                  }
                }, HIDE_DELAY_MS);
                
                setHideTimeout(timeout);
              }
            } catch (err) {
              console.error('Error fetching Bible verses:', err);
              // Same as above, don't hide immediately on error
              const timeout = setTimeout(() => {
                if (lastValidReference.current !== matchText) {
                  setShowSuggestion(false);
                }
              }, HIDE_DELAY_MS);
              
              setHideTimeout(timeout);
            }
          }, 300);
          
          setDebounceTimeout(timeout);
        } else {
          // If it doesn't look like a valid reference, start a hide timer
          // But don't hide immediately to avoid flicker
          const timeout = setTimeout(() => {
            setShowSuggestion(false);
          }, HIDE_DELAY_MS);
          
          setHideTimeout(timeout);
        }
      } else {
        // No match, but don't hide immediately
        // Start a timer to hide if no new matches are found
        const timeout = setTimeout(() => {
          setShowSuggestion(false);
        }, HIDE_DELAY_MS);
        
        setHideTimeout(timeout);
      }
    },
    [debounceTimeout, hideTimeout]
  );

  // Update suggestion box position based on selection
  const updatePosition = useCallback(() => {
    // Get selection and calculate position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Calculate position - place box below and to the right of cursor
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
    }
  }, []);

  // Register command listeners
  useEffect(() => {
    return mergeRegister(
      // Listen for selection changes
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            if ($isTextNode(node)) {
              checkForReferences(node.getTextContent(), node.getKey());
            }
          }
        });
      }),
      
      // Update position when selection changes
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          if (showSuggestion) {
            updatePosition();
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      
      // Hide suggestion box on escape key
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (showSuggestion) {
            setShowSuggestion(false);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      
      // Handle Enter key to insert verse
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (showSuggestion && event?.preventDefault) {
            event.preventDefault();
            handleInsertVerse();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      
      // Tab to insert verse
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          if (showSuggestion && event?.preventDefault) {
            event.preventDefault();
            handleInsertVerse();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      
      // Space after complete reference to show suggestions
      editor.registerCommand(
        KEY_SPACE_COMMAND,
        () => {
          return false; // Let the space be handled normally
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, checkForReferences, showSuggestion, updatePosition]);
  
  // Clear any timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [debounceTimeout, hideTimeout]);

  // Function to insert the Bible verse
  const handleInsertVerse = async () => {
    if (!matchingTextNode) return;
    
    try {
      // Fetch fresh verses if not already loaded
      let versesToInsert = verses;
      if (versesToInsert.length === 0) {
        const result = await getVersesFromDB(reference);
        versesToInsert = result.verses;
        setVerses(result.verses);
      }
      
      // Format verse text for insertion
      const verseText = versesToInsert.map(v => `${v.verse}. ${v.text}`).join(' ');
      
      editor.update(() => {
        // Get the node that contains the reference text
        const node = $getNodeByKey(matchingTextNode.nodeKey);
        if (!$isTextNode(node)) return;
        
        // Remove the reference text
        const textContent = node.getTextContent();
        const beforeReference = textContent.substring(0, matchingTextNode.start);
        const afterReference = textContent.substring(matchingTextNode.end);
        
        // Create a new text node with text before the reference
        if (beforeReference) {
          node.setTextContent(beforeReference);
        } else {
          // If no text before reference, delete the node
          node.remove();
        }
        
        // Create Bible verse node
        const bibleVerseNode = $createBibleVerseNode(reference, verseText);
        
        // Insert the Bible verse node
        if (beforeReference) {
          node.insertAfter(bibleVerseNode);
        } else {
          // If node was deleted, find a suitable place to insert
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([bibleVerseNode]);
          }
        }
        
        // Create a text node for any text after the reference
        if (afterReference) {
          const afterTextNode = new TextNode(afterReference);
          bibleVerseNode.insertAfter(afterTextNode);
        }
      });
      
      // Hide suggestion box
      setShowSuggestion(false);
    } catch (error) {
      console.error('Error inserting Bible verse:', error);
    }
  };

  // Function to close the suggestion box
  const handleCloseSuggestion = () => {
    setShowSuggestion(false);
    // Clear the last valid reference when closing manually
    lastValidReference.current = '';
  };

  // Only render suggestion box if we have matches and verses
  return (
    <>
      {showSuggestion && verses.length > 0 && (
        <Portal>
          <BibleSuggestionBox
            reference={reference}
            verses={verses}
            onInsert={handleInsertVerse}
            onClose={handleCloseSuggestion}
            position={position}
          />
        </Portal>
      )}
    </>
  );
} 