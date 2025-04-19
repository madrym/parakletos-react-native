import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorContent } from '@10play/tentap-editor';
import { BibleResult, detectBibleReference, getVersesFromReference } from '../utils/bible';

interface UseBibleVerseEditorIntegrationProps {
  editor: any; // EditorBridge from TenTapEditor
  enabled?: boolean;
  debounceMs?: number;
  onDetection?: (reference: string | undefined) => void;
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
  const [detectedReference, setDetectedReference] = useState<string | undefined>(undefined);
  const [bibleResult, setBibleResult] = useState<BibleResult | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  
  // State for the modal
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  
  // State to temporarily disable detection after insertion
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  
  // Reference for debounce timer and tracking the last detected reference
  const debounceTimer = useRef<any>(null);
  const lastReference = useRef<string | undefined>(undefined);
  const lastContentChange = useRef<number>(0);
  const programmaticChange = useRef<boolean>(false);
  
  // Add a state to track dismissed references
  const [dismissedReferences, setDismissedReferences] = useState<string[]>([]);
  
  // Add reference for tracking content length changes
  const lastContentLength = useRef(0);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  
  /**
   * Clear the current detection state
   */
  const clearDetection = useCallback(() => {
    // If there's a reference, add it to dismissed references
    if (detectedReference) {
      setDismissedReferences(prev => {
        const newSet = [...prev, detectedReference];
        return newSet;
      });
    }
    
    setDetectedReference(undefined);
    setBibleResult(undefined);
    setError(undefined);
    lastReference.current = undefined;
  }, [detectedReference]);
  
  // Get text near cursor to detect Bible references
  const getTextNearCursor = useCallback(() => {
    if (!editor || !editor.getEditorState) return '';
    
    try {
      // Get current selection
      const editorState = editor.getEditorState();
      // Add check: Ensure editorState and selection are defined before accessing 'to'
      if (!editorState || !editorState.selection) {
        console.warn('getTextNearCursor: Editor state or selection is not available yet.');
        return ''; // Return empty string instead of falling back to entire content
      }
      const selection = editorState.selection;
      const cursorPos = selection.to;
      
      // Try to get the current paragraph or surrounding text
      // This is a simple approach - get 50 chars before and after cursor
      const start = Math.max(0, cursorPos - 50);
      const end = cursorPos + 50;
      
      // Try to get the current paragraph text specifically
      try {
        const currentNode = editorState.doc.nodeAt(cursorPos);
        // If we can get the node at cursor and it has text content, use that
        if (currentNode && currentNode.textContent) {
          return currentNode.textContent; // Only analyze the current node's text
        }
      } catch (nodeError) {
        console.log('Error getting current node:', nodeError);
        // Fall through to other approaches if this fails
      }
      
      // Slice editorContent around cursor position as fallback
      if (editorContent) {
        // Get a limited slice around the cursor position
        return editorContent.slice(start, end);
      }
      
      return ''; // Return empty if no text found
    } catch (error) {
      console.error('Error getting text near cursor:', error);
      return '';
    }
  }, [editor, editorContent]);
  
  // Detect Bible references in editor content
  useEffect(() => {
    // Skip detection if disabled by user or insertion cooldown
    if (!enabled || !editor || !detectionEnabled) {
      return;
    }
    
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Skip if change was programmatic
    if (programmaticChange.current) {
      programmaticChange.current = false;
      return;
    }
    
    // Calculate time since last content change
    const timeSinceLastChange = Date.now() - lastContentChange.current;
    
    // Update last content change time
    lastContentChange.current = Date.now();
    
    // Use a longer debounce when typing quickly (multiple changes within debounce period)
    const effectiveDebounce = timeSinceLastChange < debounceMs ? debounceMs * 1.5 : debounceMs;
    
    // Debounce the detection to avoid excessive processing
    debounceTimer.current = setTimeout(() => {
      // Get text near cursor
      const textNearCursor = getTextNearCursor();
      
      if (!textNearCursor || textNearCursor.trim().length === 0) {
        // Clear detection if no text near cursor
        if (detectedReference) {
          setDetectedReference(undefined);
          lastReference.current = undefined;
          if (onDetection) onDetection(undefined);
        }
        return;
      }
      
      // Only detect references in text near cursor
      const reference = detectBibleReference(textNearCursor);
      
      // Skip if this reference was dismissed previously and text hasn't changed significantly
      if (reference && dismissedReferences.includes(reference)) {
        return;
      }
      
      // Only update if the reference has changed and is non-null
      if (reference !== lastReference.current) {
        if (reference) {
          // Verify reference is in the immediate vicinity (within 20 chars of cursor)
          const referenceNearby = textNearCursor.length <= 100; // We're already using a node-specific approach
          
          if (referenceNearby) {
            setDetectedReference(reference);
            lastReference.current = reference;
            
            // Call the onDetection callback if provided
            if (onDetection) {
              onDetection(reference);
            }
            
            // Clear previous result when reference changes
            setBibleResult(undefined);
            setError(undefined);
          } else {
            // Reference was found but not near cursor position
            clearDetection();
          }
        } else {
          // No reference found
          clearDetection();
        }
      }
    }, effectiveDebounce);
  }, [editorContent, enabled, debounceMs, onDetection, getTextNearCursor, editor, detectedReference, detectionEnabled, dismissedReferences, clearDetection]);
  
  /**
   * Reset dismissed references when content changes significantly
   */
  useEffect(() => {
    if (editorContent && lastContentLength.current && Math.abs(editorContent.length - lastContentLength.current) > 10) {
      setDismissedReferences([]);
    }
    lastContentLength.current = editorContent?.length || 0;
  }, [editorContent]);
  
  /**
   * Fetch verses for a detected reference
   */
  const fetchVerses = useCallback(async (reference: string) => {
    // Don't fetch if reference is empty or already dismissed
    if (!reference || dismissedReferences.includes(reference)) {
      setLoading(false); // Ensure loading is false if we're not actually fetching
      return;
    }

    try {
      setError(undefined);
      setLoading(true);
      
      console.log(`Fetching verses for ${reference}`);
      const result = await getVersesFromReference(reference);
      
      if (result) {
        setBibleResult(result);
      } else {
        setError('No verses found');
        setBibleResult(undefined);
      }
    } catch (err) {
      console.error('Error fetching verses:', err);
      setError('Failed to fetch verses');
      setBibleResult(undefined);
    } finally {
      setLoading(false);
    }
  }, [dismissedReferences]);
  
  /**
   * Temporarily disable detection (used after insertion)
   */
  const temporarilyDisableDetection = useCallback((durationMs = 3000) => {
    // Clear any existing detection first
    clearDetection();
    
    // Disable detection
    setDetectionEnabled(false);
    
    // Mark as programmatic change to prevent immediate re-detection
    programmaticChange.current = true;
    
    // Re-enable after specified duration
    setTimeout(() => {
      setDetectionEnabled(true);
    }, durationMs);
  }, [clearDetection]);
  
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
      return false;
    }
    
    if (!bibleResult || !bibleResult.formattedReference || !Array.isArray(bibleResult.verses) || bibleResult.verses.length === 0) { 
      console.warn('[Hook] insertVerseAtCursor called with invalid bibleResult:', bibleResult);
      return false;
    }

    // Add the reference to dismissed references
    if (bibleResult.formattedReference) {
      setDismissedReferences(prev => {
        const newSet = [...prev, bibleResult.formattedReference];
        return newSet;
      });
    }
    
    // Mark this change as programmatic to avoid re-detection
    programmaticChange.current = true;
    
    // Clear current detection and disable future detection temporarily
    temporarilyDisableDetection(3000);
    
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
      
      // Additional cleanup - check again after a short delay
      setTimeout(() => {
        if (detectedReference === bibleResult.formattedReference) {
          clearDetection();
        }
      }, 300);
      
      return true;
    } catch (e) {
      console.error('[Hook] Error injecting JavaScript:', e);
      return false;
    }

  }, [editor, clearDetection, temporarilyDisableDetection, detectedReference, setDismissedReferences]);
  
  /**
   * Insert a verse from an external reference (not from detection)
   */
  const insertVerseFromReference = useCallback(async (reference: string) => {
    if (!reference) return;
    
    try {
      setLoading(true);
      setError(undefined);
      
      const result = await getVersesFromReference(reference);
      
      if (result) {
        insertVerseAtCursor(result);
      } else {
        setError('No verses found');
      }
    } catch (err) {
      console.error('Error inserting verse:', err);
      setError('Failed to fetch verses');
    } finally {
      setLoading(false);
    }
  }, [insertVerseAtCursor]);
  
  /**
   * Open the Bible reference modal
   */
  const openReferenceModal = useCallback(() => {
    // Clear any existing detection when opening modal
    clearDetection();
    setModalVisible(true);
  }, [clearDetection]);
  
  /**
   * Close the Bible reference modal
   */
  const closeReferenceModal = useCallback(() => {
    setModalVisible(false);
    // Clean up state when modal is closed
    clearDetection();
  }, [clearDetection]);
  
  return {
    // Current state
    detectedReference,
    bibleResult,
    loading,
    error,
    
    // Detection control
    detectionEnabled,
    setDetectionEnabled,
    temporarilyDisableDetection,
    
    // Modal state
    modalVisible,
    openReferenceModal,
    closeReferenceModal,
    
    // Actions
    insertVerseAtCursor,
    insertVerseFromReference,
    clearDetection,
    fetchVerses
  };
};

export default useBibleVerseEditorIntegration; 