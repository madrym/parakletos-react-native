import { useState, useEffect, useCallback, useRef } from 'react';
import { detectBibleReference, getVersesFromReference, BibleResult } from '../utils/bible';

export interface UseBibleReferenceHandlerProps {
  editorContent: string;
  onInsertVerse: (result: BibleResult) => void;
  detectionEnabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook to handle Bible reference detection and insertion
 * 
 * This hook monitors editor content for Bible references and provides
 * functionality to handle Bible verse insertion
 */
export function useBibleReferenceHandler({
  editorContent,
  onInsertVerse,
  detectionEnabled = true,
  debounceMs = 1000
}: UseBibleReferenceHandlerProps) {
  // State for reference detection
  const [detectedReference, setDetectedReference] = useState<string | null>(null);
  const [bibleResult, setBibleResult] = useState<BibleResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  
  // State for manual modal entry
  const [modalVisible, setModalVisible] = useState(false);
  
  // Refs for debouncing
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastReference = useRef<string | null>(null);
  
  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  
  // Detect Bible references in editor content
  useEffect(() => {
    if (!detectionEnabled || !editorContent) {
      setDetectedReference(null);
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
        
        // Clear previous result when reference changes
        setBibleResult(undefined);
        setError(undefined);
      }
    }, debounceMs);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [editorContent, detectionEnabled, debounceMs]);
  
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
  
  // Callbacks for handling actions
  const handleInsertVerse = useCallback((result: BibleResult) => {
    onInsertVerse(result);
    clearDetection();
  }, [onInsertVerse]);
  
  const clearDetection = useCallback(() => {
    setDetectedReference(null);
    setBibleResult(undefined);
    setError(undefined);
    lastReference.current = null;
  }, []);
  
  const openReferenceModal = useCallback(() => {
    setModalVisible(true);
  }, []);
  
  const closeReferenceModal = useCallback(() => {
    setModalVisible(false);
  }, []);
  
  return {
    // Detection state
    detectedReference,
    bibleResult,
    loading,
    error,
    
    // Modal state
    modalVisible,
    openReferenceModal,
    closeReferenceModal,
    
    // Actions
    handleInsertVerse,
    clearDetection
  };
}

export default useBibleReferenceHandler; 