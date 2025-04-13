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
  
  // Detect Bible references in editor content
  useEffect(() => {
    if (!enabled || !editorContent) {
      return;
    }
    
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Debounce the detection to avoid excessive processing
    debounceTimer.current = setTimeout(() => {
      const reference = detectBibleReference(editorContent);
      
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
    
  }, [editorContent, enabled, debounceMs, onDetection]);
  
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
   * Uses a simpler, non-collapsible HTML structure for better compatibility
   */
  const insertVerseAtCursor = useCallback(async (result: BibleResult) => {
    if (!editor) return;
    
    try {
      // Create HTML for styled verse block with simple formatting
      const verseHTML = `
        <div style="margin: 10px 0; border: 1px solid #0B4619; border-radius: 8px; background-color: #F5F5DC20; padding: 0; overflow: hidden;">
          <div style="background-color: #0B461920; padding: 8px 12px; font-weight: bold; color: #0B4619; border-bottom: 1px solid #0B4619;">
            ${result.formattedReference}
          </div>
          <div style="padding: 8px 12px;">
            ${result.verses.map(verse => `
              <div style="display: flex; margin-bottom: 4px;">
                <span style="font-weight: bold; min-width: 20px; margin-right: 8px; color: #0B4619;">${verse.verse}</span>
                <span style="flex: 1;">${verse.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      // Get current selection
      await editor.setSelection(editor.getEditorState().selection.from, editor.getEditorState().selection.to);
      
      // Insert the HTML at the current position
      await editor.setContent(verseHTML);
      
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