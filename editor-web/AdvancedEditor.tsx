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
import { BibleVerseNode } from './extensions/BibleVerseNode';

// Extend the Window interface to declare our custom function
declare global {
  interface Window {
    myApp_insertBibleVerse?: (payloadString: string) => void;
    tipTapEditor?: Editor | null; // Keep existing declaration if needed
    dynamicHeight?: boolean; // Keep existing declaration
  }
}

/**
 * This component renders the Tiptap editor within the WebView.
 * It initializes the editor with necessary bridges and extensions.
 */
export const AdvancedEditor = () => {
  console.log('[Editor Web] AdvancedEditor component rendering...'); // Log component render

  // Memoize bridge and extension configurations to prevent unnecessary re-renders
  const bridges = useMemo(() => [CoreBridge, ...TenTapStartKit], []);
  const tiptapExtensions = useMemo(() => [
    BibleVerseNode,
  ], []);

  const editor = useTenTap({
    bridges: bridges,
    tiptapOptions: {
      extensions: tiptapExtensions,
      onBeforeCreate: () => console.log('[Editor Web] Tiptap onBeforeCreate'),
      onCreate: ({ editor }: { editor: Editor }) => {
        console.log('!!!!!!!!!!!!!!!!!!!!!! [Editor Web] onCreate START !!!!!!!!!!!!!!!!!!!!!!');

        // Define the global function INSIDE onCreate
        window.myApp_insertBibleVerse = (payloadString: string) => {
          console.log('[Editor Web] window.myApp_insertBibleVerse (defined in onCreate) called.');
          if (!editor) {
            console.error('[Editor Web] Editor instance missing within myApp_insertBibleVerse!');
            return;
          }
          try {
            const payload = JSON.parse(payloadString);
            const { reference, versesText } = payload;
            // Re-enable Tiptap command execution
            if (reference && versesText && editor.commands) {
              console.log('[Editor Web] Inserting bibleVerseBlock node...');
              editor.chain().focus()
                .insertContentAt(editor.state.selection.to, [
                  { type: 'paragraph', content: [] },
                  // Use bibleVerseBlock type again
                  { type: 'bibleVerseBlock', attrs: { reference, versesText } },
                  { type: 'paragraph', content: [] },
                ])
                .run();
              console.log('[Editor Web] Insertion command executed.');
            } else {
              console.error('[Editor Web] Invalid payload or editor commands missing.');
            }
          } catch (e) {
            console.error('[Editor Web] Error in window.myApp_insertBibleVerse:', e);
          }
        };
        // Log AFTER function definition
        console.log('!!!!!!!!!!!!!!!!!!!!!! [Editor Web] onCreate END - myApp_insertBibleVerse defined !!!!!!!!!!!!!!!!!!!!!!');
      },
      onUpdate: () => console.log('[Editor Web] Tiptap onUpdate'),
      onDestroy: () => {
        console.log('[Editor Web] Tiptap onDestroy');
        window.myApp_insertBibleVerse = undefined; // Clean up the function reference
      },
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