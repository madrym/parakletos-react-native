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
  debounceMs = 300,
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
    // Use refs to avoid triggering effects
    setDetectedReference(undefined);
    setBibleResult(undefined);
    setError(undefined);
    lastReference.current = undefined;
  }, []); // No dependencies to prevent loops
  
  // Detect Bible references in editor content
  useEffect(() => {
    // Skip detection if disabled by user or insertion cooldown
    if (!enabled || !detectionEnabled) {
      return;
    }
    
    // Skip if editorContent is not available yet
    if (editorContent === null || editorContent === undefined || editorContent.trim() === '') {
      console.log('[Hook] Editor content not available yet, skipping detection');
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
    
    // Use a consistent debounce time - no more aggressive multiplying
    // This allows for more responsive detection during typing
    const effectiveDebounce = debounceMs;
    
    // Debounce the detection to avoid excessive processing
    debounceTimer.current = setTimeout(() => {
      console.log('[Hook] Detection timer triggered, analyzing content...');
      
      // Get text directly instead of using callback to avoid dependency issues
      const textNearCursor = editorContent || '';
      
      console.log('[Hook] Text for analysis (length: ' + textNearCursor.length + '):', textNearCursor);
      
      if (!textNearCursor || textNearCursor.trim().length === 0) {
        console.log('[Hook] No text to analyze, clearing detection');
        // Clear detection if no text near cursor
        if (lastReference.current) {
          setDetectedReference(undefined);
          lastReference.current = undefined;
          if (onDetection) onDetection(undefined);
        }
        return;
      }
      
      // Reduced minimum length requirement for faster detection of short references like "John1"
      if (textNearCursor.length < 3) {
        console.log('[Hook] Text too short for detection (< 3 chars)');
        return;
      }
      
      // Only detect references in text near cursor
      const reference = detectBibleReference(textNearCursor);
      
      console.log('[Hook] Detection result for "' + textNearCursor.substring(0, 50) + '":', reference);
      
      // Check if this reference was dismissed (read from current state, don't depend on it)
      if (reference && dismissedReferences.includes(reference)) {
        console.log('[Hook] Reference was previously dismissed:', reference);
        return;
      }
      
      // Only update if the reference has changed and is non-null
      if (reference !== lastReference.current) {
        if (reference) {
          // More lenient proximity check for faster detection
          const referenceNearby = textNearCursor.length <= 200; // Increased from 100 to 200
          
          if (referenceNearby) {
            console.log('[Hook] Detected Bible reference:', reference);
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
  }, [editorContent, enabled, debounceMs, onDetection, detectionEnabled]); // Removed dismissedReferences dependency
  
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
      
      console.log(`[Hook] Fetching verses for ${reference}`);
      const result = await getVersesFromReference(reference);
      
      console.log(`[Hook] getVersesFromReference result:`, {
        result,
        hasResult: !!result,
        formattedReference: result?.formattedReference,
        versesCount: result?.verses?.length || 0,
        verses: result?.verses
      });
      
      if (result) {
        setBibleResult(result);
        console.log(`[Hook] setBibleResult called with:`, result);
      } else {
        console.log(`[Hook] No result, setting error`);
        setError('No verses found');
        setBibleResult(undefined);
      }
    } catch (err) {
      console.error('[Hook] Error fetching verses:', err);
      setError('Failed to fetch verses');
      setBibleResult(undefined);
    } finally {
      setLoading(false);
      console.log(`[Hook] fetchVerses completed for ${reference}`);
    }
  }, [dismissedReferences]);
  
  /**
   * Temporarily disable detection (used after insertion)
   */
  const temporarilyDisableDetection = useCallback((durationMs = 3000) => {
    // Clear any existing detection first - inline to avoid dependency issues
    setDetectedReference(undefined);
    setBibleResult(undefined);
    setError(undefined);
    lastReference.current = undefined;
    
    // Disable detection
    setDetectionEnabled(false);
    
    // Mark as programmatic change to prevent immediate re-detection
    programmaticChange.current = true;
    
    // Re-enable after specified duration
    setTimeout(() => {
      setDetectionEnabled(true);
    }, durationMs);
  }, []); // Remove clearDetection dependency
  
  /**
   * Dismiss a reference to prevent it from being detected again
   */
  const dismissReference = useCallback((reference: string) => {
    setDismissedReferences(prev => {
      if (!prev.includes(reference)) {
        return [...prev, reference];
      }
      return prev;
    });
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
      return false;
    }
    
    if (!bibleResult || !bibleResult.formattedReference || !Array.isArray(bibleResult.verses) || bibleResult.verses.length === 0) { 
      console.warn('[Hook] insertVerseAtCursor called with invalid bibleResult:', bibleResult);
      return false;
    }

    // Add the reference to dismissed references
    if (bibleResult.formattedReference) {
      dismissReference(bibleResult.formattedReference);
    }
    
    // Mark this change as programmatic to avoid re-detection
    programmaticChange.current = true;
    
    // Clear current detection and disable future detection temporarily
    setDetectedReference(undefined);
    setBibleResult(undefined);
    setError(undefined);
    lastReference.current = undefined;
    
    // Disable detection temporarily
    setDetectionEnabled(false);
    
    setTimeout(() => {
      setDetectionEnabled(true);
    }, 3000);
    
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
      
      return true;
    } catch (e) {
      console.error('[Hook] Error injecting JavaScript:', e);
      return false;
    }

  }, [editor, dismissReference]); // Simplified dependencies
  
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
    // Dismiss current reference if any (use ref instead of state to avoid dependency)
    if (lastReference.current) {
      dismissReference(lastReference.current);
    }
    
    // Clear any existing detection when opening modal
    setDetectedReference(undefined);
    setBibleResult(undefined);
    setError(undefined);
    lastReference.current = undefined;
    
    setModalVisible(true);
  }, [dismissReference]);
  
  /**
   * Close the Bible reference modal
   */
  const closeReferenceModal = useCallback(() => {
    setModalVisible(false);
    // Clean up state when modal is closed
    setDetectedReference(undefined);
    setBibleResult(undefined);
    setError(undefined);
    lastReference.current = undefined;
  }, []);
  
  return {
    // Current state
    detectedReference,
    bibleResult,
    loading,
    error,
    
    // Detection control
    detectionEnabled,
    setDetectionEnabled,
    dismissReference,
    
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