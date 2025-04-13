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
  // *** Add Log ***
  console.log('[Hook] Running. Editor prop is:', editor ? 'Object' : String(editor));
  
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
      const editorState = editor.getEditorState();
      // Add check: Ensure editorState and selection are defined before accessing 'to'
      if (!editorState || !editorState.selection) {
        console.warn('getTextNearCursor: Editor state or selection is not available yet.');
        return editorContent || ''; // Fallback to editorContent if available
      }
      const selection = editorState.selection;
      const cursorPos = selection.to;
      
      // Try to get the current paragraph or surrounding text
      // This is a simple approach - get 50 chars before and after cursor
      const start = Math.max(0, cursorPos - 50);
      const end = cursorPos + 50;
      
      // Use editorContent as the fallback since it's more reliable if text extraction fails
      // Note: This might not perfectly reflect text around the *actual* cursor
      if (editorContent) {
        // Consider slicing editorContent around an estimated position if needed,
        // but for reference detection, the full content might be okay.
        return editorContent.slice(start, end); // Attempt to get relevant slice
      } else {
        // If editorContent is also unavailable, try direct node text (might fail)
        const node = editorState.doc.nodeAt(cursorPos);
        if (node && node.textContent) {
          return node.textContent; // Get text from the current node
        } else {
          return ''; // Return empty if no text found
        }
      }

    } catch (error) {
      console.error('Error getting text near cursor:', error);
      return '';
    }
  }, [editor, editorContent]); // Keep dependencies, but logic depends more on editor state
  
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
    console.log('[Hook] insertVerseAtCursor called. Current editor value:', editor ? 'Object' : String(editor));
    console.log('[Hook] insertVerseAtCursor called with reference:', result.formattedReference);
    // Use the EditorBridge object - Check for injectJS
    if (!editor || typeof editor.injectJS !== 'function') { 
      console.error('[Hook] Editor bridge or injectJS method not available.');
      if (editor) {
        console.log('[Hook] Available keys on editor bridge object:', Object.keys(editor));
      } else {
        console.log('[Hook] Editor bridge object is null/undefined.');
      }
      return false;
    } 
    
    try {
      const versesText = result.verses.map(verse => 
        // Keep verse text formatting simple
        `<p><strong>${verse.verse}</strong> ${verse.text.replace(/\"/g, '&quot;')}</p>` // Ensure quotes in verse text are HTML entities
      ).join('');

      // Construct the JSON payload for insertContentAt
      const contentToInsert = [
        { type: 'paragraph', content: [] }, // Spacer
        {
          type: 'bibleVerseBlock',
          attrs: {
            reference: result.formattedReference,
            // Ensure versesText is correctly handled as HTML string within the JSON
            versesText: versesText, 
          },
        },
        { type: 'paragraph', content: [] }, // Spacer
      ];

      // Convert payload to a JSON string - ensure proper escaping for JS template literal
      const jsonPayload = JSON.stringify(contentToInsert);
      
      // Construct the JavaScript command string with retry logic
      // Use a function wrapper and setTimeout for retries
      const command = `
        function tryInsertVerse(retries = 5) {
          if (window.tipTapEditor && window.tipTapEditor.commands && window.tipTapEditor.state) {
            try {
              // Parse the JSON *inside* the webview context
              const content = JSON.parse(\`${jsonPayload.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); 
              const currentPos = window.tipTapEditor.state.selection.to;
              console.log('[WebView JS] Attempting insertContentAt command at pos ', currentPos, ' with content:', content);
              window.tipTapEditor.chain().focus().insertContentAt(currentPos, content).run();
              console.log('[WebView JS] Command executed successfully.');
            } catch (e) {
              console.error('[WebView JS] Error executing Tiptap command:', e);
            }
          } else if (retries > 0) {
            console.log('[WebView JS] window.tipTapEditor not ready, retrying (' + retries + ' left)...');
            setTimeout(() => tryInsertVerse(retries - 1), 150); // Wait 150ms before retrying
          } else {
            console.error('[WebView JS] window.tipTapEditor not found or not ready after multiple retries.');
            // Optional: Log available window properties for debugging
            console.log('[WebView JS] Available window keys:', Object.keys(window)); 
          }
        }
        tryInsertVerse(); // Initial call to start the process
      `;

      console.log('[Hook] Injecting JavaScript command via injectJS (with retry logic):', command);
      // Execute the command in the WebView using injectJS
      editor.injectJS(command);
      
      // injectJS doesn't return success/failure, assume initiated
      const success = true; 
      
      if(success) {
         clearDetection(); // Clear detection optimistically
      }
      
      return success;
    } catch (error) {
      console.error('[Hook] Error preparing or injecting JavaScript:', error);
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
      // Directly call insertVerseAtCursor which now handles node insertion
      return await insertVerseAtCursor(result);
    } catch (err) {
      console.error('Error inserting verse from reference:', err);
      setError(err instanceof Error ? err.message : 'Failed to insert verse');
      return false;
    } finally {
      setLoading(false);
    }
  }, [editor, insertVerseAtCursor]); // Ensure insertVerseAtCursor is dependency
  
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