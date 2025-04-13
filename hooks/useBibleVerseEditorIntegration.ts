import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorContent } from '@10play/tentap-editor';
import { BibleResult, detectBibleReference, getVersesFromReference } from '../utils/bible';

interface UseBibleVerseEditorIntegrationProps {
  editor: any; // EditorBridge from TenTapEditor
  enabled?: boolean;
  debounceMs?: number;
  onDetection?: (reference: string | null) => void;
}

/**
 * Hook to integrate Bible verse detection with TenTapEditor
 * 
 * This hook monitors editor content for Bible references and provides
 * functionality to handle Bible verse insertion into the editor
 */
const useBibleVerseEditorIntegration = ({
  editor,
  enabled = true,
  debounceMs = 800,
  onDetection
}: UseBibleVerseEditorIntegrationProps) => {
  // Get editor content using the TenTapEditor hook (automatically debounced)
  const editorContent = useEditorContent(editor, { type: 'text', debounceInterval: 10 });
  
  // State for detected references and verse data
  const [detectedReference, setDetectedReference] = useState<string | null>(null);
  const [bibleResult, setBibleResult] = useState<BibleResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  
  // State for the modal
  const [modalVisible, setModalVisible] = useState(false);
  
  // Reference for debounce timer and tracking the last detected reference
  const debounceTimer = useRef<any>(null);
  const lastReference = useRef<string | null>(null);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  
  // Get text near cursor to detect Bible references
  const getTextNearCursor = useCallback(() => {
    if (!editor || !editor.getEditorState) return '';
    
    try {
      // Get current selection
      const selection = editor.getEditorState().selection;
      const cursorPos = selection.to;
      
      // Try to get the current paragraph or surrounding text
      // This is a simple approach - get 50 chars before and after cursor
      const start = Math.max(0, cursorPos - 50);
      const end = cursorPos + 50;
      
      // Use editorContent as the fallback since it's more reliable
      if (editorContent) {
        return editorContent;
      }
      
      return '';
    } catch (error) {
      console.error('Error getting text near cursor:', error);
      return '';
    }
  }, [editor, editorContent]);
  
  // Detect Bible references in editor content
  useEffect(() => {
    if (!enabled || !editor) {
      return;
    }
    
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Debounce the detection to avoid excessive processing
    debounceTimer.current = setTimeout(() => {
      // Get text near cursor
      const textNearCursor = getTextNearCursor();
      
      if (!textNearCursor) {
        // Clear detection if no text near cursor
        if (detectedReference) {
          setDetectedReference(null);
          lastReference.current = null;
          if (onDetection) onDetection(null);
        }
        return;
      }
      
      // Only detect references in text near cursor
      const reference = detectBibleReference(textNearCursor);
      
      // Only update if the reference has changed
      if (reference !== lastReference.current) {
        setDetectedReference(reference);
        lastReference.current = reference;
        
        // Call the onDetection callback if provided
        if (onDetection) {
          onDetection(reference);
        }
        
        // Clear previous result when reference changes
        setBibleResult(undefined);
        setError(undefined);
      }
    }, debounceMs);
    
  }, [editorContent, enabled, debounceMs, onDetection, getTextNearCursor, editor, detectedReference]);
  
  // Fetch verses when a reference is detected
  useEffect(() => {
    if (!detectedReference) {
      setBibleResult(undefined);
      setError(undefined);
      return;
    }
    
    const fetchVerses = async () => {
      try {
        setLoading(true);
        setError(undefined);
        
        const result = await getVersesFromReference(detectedReference);
        setBibleResult(result);
      } catch (err) {
        console.log('Error fetching verses:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch verses');
        setBibleResult(undefined);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVerses();
  }, [detectedReference]);
  
  /**
   * Clear the current detection state
   */
  const clearDetection = useCallback(() => {
    setDetectedReference(null);
    setBibleResult(undefined);
    setError(undefined);
    lastReference.current = null;
  }, []);
  
  /**
   * Insert verse(s) into the editor at the current cursor position
   * Inserts as a bold reference followed by indented quote block with bold verse numbers
   */
  const insertVerseAtCursor = useCallback(async (result: BibleResult) => {
    if (!editor) return;
    
    try {
      // Format verses as quote block with bold verse numbers and proper HTML line breaks
      const versesText = result.verses.map(verse => 
        `<p><strong>${verse.verse}</strong> ${verse.text}</p>`
      ).join('');
      
      // Create HTML with bold reference and blockquote for verses
      const verseHTML = `
        <p><br></p> <!-- Add new line -->
        <p><strong>${result.formattedReference}:</strong></p>
        <blockquote>
          ${versesText}
        </blockquote>
        <br> <!-- Just one line break after quote -->
      `;
      
      // Get current selection and move cursor to end of selection
      const currentPos = editor.getEditorState().selection.to;
      await editor.setSelection(currentPos, currentPos);
      
      // Insert HTML at current cursor position using insertContentAtSelection
      // This appends content rather than replacing it
      if (editor.insertContentAtSelection) {
        await editor.insertContentAtSelection(verseHTML); 
      } else if (editor.insertHTML) {
        await editor.insertHTML(verseHTML);
      } else if (editor.insertText) {
        // Fallback to insertText if insertHTML is not available
        // This is less ideal as it loses formatting
        const plainText = `\n\n${result.formattedReference}:\n\n` + 
          result.verses.map(verse => `  ${verse.verse} ${verse.text}`).join('\n');
        await editor.insertText(plainText);
      } else {
        // Get current content and append new content
        const currentContent = await editor.getHTML();
        const newContent = currentContent + verseHTML;
        await editor.setContent(newContent, { 
          addToHistory: true, 
          parseOptions: { preserveWhitespace: true } 
        });
      }
      
      // Clear detection state
      clearDetection();
      
      return true;
    } catch (error) {
      console.error('Error inserting verse:', error);
      return false;
    }
  }, [editor, clearDetection]);
  
  /**
   * Insert a Bible reference from the modal or any external source
   */
  const insertVerseFromReference = useCallback(async (reference: string) => {
    if (!editor || !reference.trim()) return false;
    
    try {
      setLoading(true);
      setError(undefined);
      
      const result = await getVersesFromReference(reference);
      return await insertVerseAtCursor(result);
    } catch (err) {
      console.error('Error inserting verse from reference:', err);
      setError(err instanceof Error ? err.message : 'Failed to insert verse');
      return false;
    } finally {
      setLoading(false);
    }
  }, [editor, insertVerseAtCursor]);
  
  /**
   * Open the Bible reference modal
   */
  const openReferenceModal = useCallback(() => {
    setModalVisible(true);
  }, []);
  
  /**
   * Close the Bible reference modal
   */
  const closeReferenceModal = useCallback(() => {
    setModalVisible(false);
  }, []);
  
  return {
    // Current state
    detectedReference,
    bibleResult,
    loading,
    error,
    
    // Modal state
    modalVisible,
    openReferenceModal,
    closeReferenceModal,
    
    // Actions
    insertVerseAtCursor,
    insertVerseFromReference,
    clearDetection
  };
};

export default useBibleVerseEditorIntegration; 