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
   * Inserts the fetched Bible verse content into the editor at the current cursor position.
   * Uses the editor bridge communication channel instead of direct JS injection.
   *
   * @param bibleResult - The BibleResult object containing reference and verse text.
   */
  const insertVerseAtCursor = useCallback((bibleResult: BibleResult) => {
    // Check if editor and injectJS method are available
    if (!editor || typeof editor.injectJS !== 'function') { 
      console.warn('[Hook] insertVerseAtCursor called but editor or injectJS method is not ready.');
      return;
    }
    
    if (!bibleResult || !bibleResult.formattedReference || !Array.isArray(bibleResult.verses) || bibleResult.verses.length === 0) { 
      console.warn('[Hook] insertVerseAtCursor called with invalid bibleResult:', bibleResult);
      return;
    }

    console.log(`[Hook] insertVerseAtCursor called with reference: ${bibleResult.formattedReference}`);

    const versesTextHtml = bibleResult.verses.map(verse => 
      // Ensure quotes within the text are escaped for the HTML attribute
      `<p><strong>${verse.verse}</strong> ${verse.text.replace(/"/g, '&quot;')}</p>`
    ).join('');

    // Prepare payload
    const payload = {
      reference: bibleResult.formattedReference,
      versesText: versesTextHtml,
    };
    
    // Convert payload to a JSON string. Escape only for JS string literal context.
    const payloadStringForInjection = JSON.stringify(payload)
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/'/g, "\\'");  // Escape single quotes (for the outer JS string)

    // Construct JS command to call the globally defined function in the WebView, WITH RETRY
    const jsCommand = `\n      function tryCallGlobalFunction(payload, retries = 10) { // Using 10 retries, 300ms interval\n        if (typeof window.myApp_insertBibleVerse === 'function') {\n          console.log(\'[WebView JS - Inject] Found window.myApp_insertBibleVerse, calling now...');\n          try {\n             window.myApp_insertBibleVerse(payload);\n          } catch (e) {\n             console.error(\'[WebView JS - Inject] Error executing window.myApp_insertBibleVerse:\', e);\n          } \n        } else if (retries > 0) {\n          console.log(\'[WebView JS - Inject] window.myApp_insertBibleVerse not found, retrying (\' + retries + \' left)...');\n          setTimeout(() => tryCallGlobalFunction(payload, retries - 1), 300); \n        } else {\n          console.error(\'[WebView JS - Inject] window.myApp_insertBibleVerse function not found after multiple retries!\');\n        }\n      }\n      // Initial call, passing the escaped payload string\n      tryCallGlobalFunction('${payloadStringForInjection}'); \n    `;

    try {
      console.log('[Hook] Injecting JS command to call global WebView function (with retry).');
      // console.log(jsCommand); // Uncomment for debugging
      editor.injectJS(jsCommand);
      console.log('[Hook] JS Injection command sent.');
      clearDetection(); 
    } catch (e) {
      console.error('[Hook] Error injecting JavaScript:', e);
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