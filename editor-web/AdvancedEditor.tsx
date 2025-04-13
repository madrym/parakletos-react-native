import React, { useMemo, useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import {
  useTenTap,
  TenTapStartKit, // Provides common bridges like Bold, Italic, etc.
  CoreBridge, // Essential bridge for core editor functionality
} from '@10play/tentap-editor';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import History from '@tiptap/extension-history'; // Important for undo/redo
import HardBreak from '@tiptap/extension-hard-break'; // For line breaks
import Blockquote from '@tiptap/extension-blockquote'; // Used for verse insertion
import Bold from '@tiptap/extension-bold'; // Used for verse insertion
import { Editor } from '@tiptap/core'; // Import Editor type
import { BibleVerseNode } from './extensions/BibleVerseNode'; // Use alias

/**
 * This component renders the Tiptap editor within the WebView.
 * It initializes the editor with necessary bridges and extensions.
 */
export const AdvancedEditor = () => {
  console.log('[Editor Web] AdvancedEditor component rendering...'); // Log component render

  // Memoize bridge and extension configurations to prevent unnecessary re-renders
  const bridges = useMemo(() => [CoreBridge, ...TenTapStartKit], []);
  const tiptapExtensions = useMemo(() => [BibleVerseNode], []);

  // Callback to handle messages from React Native
  const handleBridgeMessage = useCallback((message: { type: string; payload?: any }, editorInstance: Editor | null) => {
    console.log('[Editor Web] Received message from RN:', message);
    if (message.type === 'insertBibleVerse' && editorInstance && message.payload) {
      const { reference, versesText } = message.payload;
      if (reference && versesText) {
        console.log('[Editor Web] Inserting bibleVerseBlock node via command...');
        editorInstance.chain().focus()
          .insertContentAt(editorInstance.state.selection.to, [
            { type: 'paragraph', content: [] },
            { type: 'bibleVerseBlock', attrs: { reference, versesText } },
            { type: 'paragraph', content: [] },
          ])
          .run();
        console.log('[Editor Web] Insertion command executed.');
      } else {
         console.error('[Editor Web] Invalid payload for insertBibleVerse:', message.payload);
      }
    }
    // Handle other potential message types here
  }, []); // Empty dependency array as it relies on editorInstance passed by useTenTap

  const editor = useTenTap({
    // Use memoized configurations
    bridges: bridges,
    tiptapOptions: {
      extensions: tiptapExtensions,
    },
    // Add the message handler
    onBridgeMessage: handleBridgeMessage,
    // Add logging callbacks
    onBeforeCreate: () => console.log('[Editor Web] Tiptap onBeforeCreate'),
    onCreate: ({ editor }: { editor: Editor }) => {
      console.log('[Editor Web] Tiptap onCreate starting. Editor object valid:', !!editor);
      console.log('[Editor Web] Assigning editor to window.tipTapEditor...');
      window.tipTapEditor = editor;
      console.log('[Editor Web] Assignment complete. window.tipTapEditor is now type:', typeof window.tipTapEditor);
      if (window.tipTapEditor && typeof window.tipTapEditor.isEditable !== 'undefined') {
           console.log('[Editor Web] Confirmed: window.tipTapEditor.isEditable:', window.tipTapEditor.isEditable);
      } else {
           console.error('[Editor Web] CRITICAL: window.tipTapEditor is invalid or lacks properties immediately after assignment!');
      }
    },
    onUpdate: () => console.log('[Editor Web] Tiptap onUpdate'),
    onSelectionUpdate: () => console.log('[Editor Web] Tiptap onSelectionUpdate'),
    onTransaction: () => console.log('[Editor Web] Tiptap onTransaction'),
    onFocus: () => console.log('[Editor Web] Tiptap onFocus'),
    onBlur: () => console.log('[Editor Web] Tiptap onBlur'),
    onDestroy: () => {
       console.log('[Editor Web] Tiptap onDestroy');
       // *** Clean up global reference ***
       window.tipTapEditor = null;
    },
  });

  console.log('[Editor Web] useTenTap hook finished, editor instance:', !!editor);

  // Render the editor content area
  return (
    <EditorContent
      editor={editor}
      // Apply dynamic height class if the window flag is set
      className={window.dynamicHeight ? 'dynamic-height' : undefined}
    />
  );
}; 