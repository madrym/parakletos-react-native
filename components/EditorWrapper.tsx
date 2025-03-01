import React, { useState, useCallback, useEffect } from 'react';
import LexicalEditor from '@/components/dom-components/LexicalEditor';

interface EditorWrapperProps {
  initialState?: string;
  onContentChange: (content: string) => void;
  onStateChange: (state: string | null) => void;
}

const EditorWrapper: React.FC<EditorWrapperProps> = ({ 
  initialState, 
  onContentChange, 
  onStateChange 
}) => {
  console.log('EditorWrapper rendering with initialState:', 
    initialState ? `${initialState.substring(0, 50)}...` : 'none');
  
  // Create internal state handlers that match the expected types
  const [plainText, setPlainText] = useState('');
  const [editorState, setEditorState] = useState<string | null>(null);
  
  // Track if this is the initial render
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // Set initial state on mount
  useEffect(() => {
    if (initialState && isInitialRender) {
      console.log('EditorWrapper: Setting initial state on mount');
      setEditorState(initialState);
      setIsInitialRender(false);
    }
  }, [initialState, isInitialRender]);
  
  // Use callbacks for state updates to avoid unnecessary re-renders
  const handlePlainTextChange = useCallback((value: React.SetStateAction<string>) => {
    // Update internal state
    if (typeof value === 'function') {
      setPlainText(prev => {
        const newValue = value(prev);
        onContentChange(newValue);
        return newValue;
      });
    } else {
      setPlainText(value);
      onContentChange(value);
    }
  }, [onContentChange]);
  
  const handleEditorStateChange = useCallback((value: React.SetStateAction<string | null>) => {
    // Update internal state
    if (typeof value === 'function') {
      setEditorState(prev => {
        const newValue = value(prev);
        if (newValue) onStateChange(newValue);
        return newValue;
      });
    } else {
      setEditorState(value);
      if (value) onStateChange(value);
    }
  }, [onStateChange]);
  
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      flex: 1
    }}>
      <LexicalEditor
        setPlainText={handlePlainTextChange}
        setEditorState={handleEditorStateChange}
        initialEditorState={initialState}
      />
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(EditorWrapper); 