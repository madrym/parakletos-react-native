import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Keyboard, Platform } from 'react-native';
import BibleVersePreview from './BibleVersePreview';
import BibleReferenceModal from './BibleReferenceModal';
import useBibleVerseEditorIntegration from '../hooks/useBibleVerseEditorIntegration';
import { BibleResult } from '../utils/bible';

interface BibleVerseEditorIntegrationProps {
  editor: any; // EditorBridge from TenTapEditor
  enabled?: boolean;
  debounceMs?: number;
  theme?: {
    background: string;
    text: string;
    header: string;
  };
  children?: React.ReactNode;
}

/**
 * Component that integrates Bible verse detection and insertion with the TenTapEditor
 * Renders preview and modal components when needed
 */
const BibleVerseEditorIntegration: React.FC<BibleVerseEditorIntegrationProps> = ({
  editor,
  enabled = true,
  debounceMs = 800,
  theme = {
    background: '#F5F5DC', // Default beige
    text: '#0B4619', // Default green
    header: '#0B4619' // Default green
  },
  children
}) => {
  // Use the custom hook for Bible verse detection and insertion
  const {
    detectedReference,
    bibleResult,
    loading,
    error,
    modalVisible,
    openReferenceModal,
    closeReferenceModal,
    insertVerseAtCursor,
    clearDetection
  } = useBibleVerseEditorIntegration({
    editor,
    enabled,
    debounceMs
  });
  
  // Track cursor position for positioning the preview
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Reference to editor container for position calculations
  const editorContainerRef = useRef<View>(null);
  
  // Determine if preview should be shown
  const showPreview = !!(detectedReference && (bibleResult || loading || error));

  // Listen for keyboard events to adjust preview position
  useEffect(() => {
    // Function to get cursor position from editor
    const getCursorPosition = async () => {
      if (editor && editor.getSelectionBoundingRect) {
        try {
          const rect = await editor.getSelectionBoundingRect();
          if (rect) {
            // Measure editor container position in the window
            editorContainerRef.current?.measure((x, y, width, height, pageX, pageY) => {
              // Calculate cursor position relative to editor container
              const editorX = pageX;
              const editorY = pageY;
              
              // Position preview below cursor
              setCursorPosition({
                x: editorX,
                y: rect.bottom + editorY + 10, // 10px padding below cursor
              });
            });
          }
        } catch (error) {
          console.log('Error getting cursor position:', error);
        }
      }
    };

    // Get cursor position when reference is detected
    if (showPreview) {
      getCursorPosition();
    }

    // Set up keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        // Update cursor position when keyboard appears
        getCursorPosition();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    // Set up editor selection change listener
    const onSelectionChange = () => {
      if (showPreview) {
        getCursorPosition();
      }
    };

    // Add listener for cursor position if available
    if (editor && editor.on) {
      editor.on('selectionUpdate', onSelectionChange);
    }

    return () => {
      // Clean up listeners
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (editor && editor.off) {
        editor.off('selectionUpdate', onSelectionChange);
      }
    };
  }, [editor, showPreview]);
  
  // Calculate preview position based on cursor position and screen constraints
  const getPreviewPosition = () => {
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    
    // Calculate preview max width
    const previewMaxWidth = Math.min(400, windowWidth - 40); // 20px padding on each side
    
    // Adjust for keyboard
    const bottomAdjustment = isKeyboardVisible ? keyboardHeight + 20 : 20;
    
    // Calculate Y position to ensure preview is visible
    let yPos = cursorPosition.y;
    const maxY = windowHeight - bottomAdjustment - 200; // Ensure minimum height for preview
    
    if (yPos > maxY) {
      yPos = maxY;
    }
    
    return {
      position: 'absolute' as 'absolute',
      left: 20,
      right: 20,
      maxWidth: previewMaxWidth,
      top: yPos,
      zIndex: 1000,
    };
  };
  
  // Handle verse insertion from preview
  const handleInsertVerse = (result: BibleResult) => {
    insertVerseAtCursor(result);
  };
  
  return (
    <View style={styles.container} ref={editorContainerRef}>
      {/* Render children (typically the editor) */}
      {children}
      
      {/* Bible verse preview (shows when a reference is detected) */}
      {showPreview && (
        <View style={getPreviewPosition()}>
          <BibleVersePreview
            reference={detectedReference || ''}
            bibleResult={bibleResult}
            loading={loading}
            error={error}
            onInsert={handleInsertVerse}
            onClose={clearDetection}
            theme={theme}
          />
        </View>
      )}
      
      {/* Bible reference modal (shown when toolbar button is clicked) */}
      <BibleReferenceModal
        visible={modalVisible}
        onClose={closeReferenceModal}
        onInsert={handleInsertVerse}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  }
});

/**
 * Create a toolbar button that opens the Bible reference modal
 * This function can be used to add a Bible reference button to the editor toolbar
 */
export const createBibleToolbarButton = (
  openModal: () => void,
  bibleIconUri: string = require('../assets/images/bible.png')
) => {
  return {
    name: 'bible',
    type: 'button',
    icon: bibleIconUri,
    action: () => {
      openModal();
    }
  };
};

export default BibleVerseEditorIntegration; 