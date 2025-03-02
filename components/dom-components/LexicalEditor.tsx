"use dom";
import "./styles.css";
import React, { useEffect, useState, useRef } from "react";

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import ExampleTheme from "./ExampleTheme";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import BibleVersePlugin from "./plugins/BibleVersePlugin";
import { BibleReferenceSuggestionPlugin } from "./plugins/BibleReferenceSuggestionPlugin";
import { BibleVerseNode } from "./nodes/BibleVerseNode";
import { $getRoot, EditorState, LexicalEditor as LexicalEditorType, LexicalNode, $createParagraphNode, $createTextNode } from "lexical";

const placeholder = "Enter some rich text...";

const nodes = [
  ListNode, 
  ListItemNode, 
  LinkNode,
  HeadingNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  BibleVerseNode
];

// Create a custom focus plugin that maintains focus when initializing the editor
function CustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();
  // Extend the editor type to include our custom property
  interface ExtendedEditor extends LexicalEditorType {
    _wasEditorFocused?: boolean;
  }
  const editorRef = useRef<ExtendedEditor | null>(null);
  
  // Only set the ref once when the editor is initially mounted
  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = editor as ExtendedEditor;
    }
  }, [editor]);
  
  // Handle focus management
  useEffect(() => {
    // Focus the editor on initial load
    setTimeout(() => {
      // Use our persisted reference to the editor
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 100);
    
    // Store current active element before editor updates
    const handleBeforeInput = () => {
      // This tracks if we were focused before an update
      if (editorRef.current) {
        editorRef.current._wasEditorFocused = document.activeElement === 
          document.querySelector('[data-testid="editor-input"]');
      }
    };
    
    // Restore focus after editor updates
    const handleUpdate = () => {
      setTimeout(() => {
        // If editor was focused before the update, refocus it
        if (editorRef.current && editorRef.current._wasEditorFocused) {
          editorRef.current.focus();
          // Clear the flag
          editorRef.current._wasEditorFocused = false;
        }
      }, 0);
    };
    
    // Listen for beforeinput events
    document.addEventListener('beforeinput', handleBeforeInput);
    
    // Register update listener
    const removeUpdateListener = editor.registerUpdateListener(handleUpdate);
    
    return () => {
      document.removeEventListener('beforeinput', handleBeforeInput);
      removeUpdateListener();
    };
  }, [editor]);
  
  return null;
}

// This plugin handles initializing the editor with saved state
function InitialStatePlugin({ initialEditorState }: { initialEditorState?: string }) {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);
  
  // Initialize the editor with the saved state only once when the component mounts
  useEffect(() => {
    if (!editor || !initialEditorState || initialized) return;
    
    try {
      console.log('InitialStatePlugin: Attempting to load saved state');
      const parsedState = JSON.parse(initialEditorState);
      
      // Only proceed if we have a valid state with a root node
      if (parsedState && parsedState.root) {
        // Track focus state before update
        const hasFocus = document.activeElement === 
          document.querySelector('[data-testid="editor-input"]');
        
        // First, clear the editor in a separate update
        editor.update(() => {
          // Clear the editor first to avoid merging with default content
          const root = $getRoot();
          root.clear();
          
          // Log the state we're about to load
          console.log('Loading editor state with children count:', 
            parsedState.root.children?.length || 0);
        });
        
        // Use setTimeout to ensure we're not in a React rendering cycle
        // This avoids the flushSync warning
        setTimeout(() => {
          try {
            // Use the proper method to set editor state
            const editorState = editor.parseEditorState(initialEditorState);
            editor.setEditorState(editorState);
            console.log('InitialStatePlugin: Successfully loaded saved state');
            
            // Restore focus if it was active before
            if (hasFocus) {
              setTimeout(() => editor.focus(), 0);
            }
          } catch (error) {
            console.error('Error setting editor state:', error);
          }
        }, 0);
      } else {
        console.warn('InitialStatePlugin: Invalid editor state format');
      }
    } catch (error) {
      console.error('InitialStatePlugin: Error loading saved state:', error);
    }
    
    setInitialized(true);
  }, [editor, initialEditorState]);
  
  return null;
}

function Editor({
  setPlainText,
  setEditorState,
  initialEditorState,
}: {
  setPlainText: React.Dispatch<React.SetStateAction<string>>;
  setEditorState: React.Dispatch<React.SetStateAction<string | null>>;
  initialEditorState?: string;
}) {
  // Debug the initialEditorState only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && initialEditorState) {
      console.log('LexicalEditor: initialEditorState received', 
        initialEditorState.substring(0, 50) + '...');
    }
  }, [initialEditorState]);
  
  // Parse the initial state once when the component mounts or when initialEditorState changes
  const parsedState = React.useMemo(() => {
    if (!initialEditorState) return null;
    
    try {
      const parsed = JSON.parse(initialEditorState);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Successfully parsed initialEditorState', 
          parsed && parsed.root ? 'with root node' : 'without root node',
          'children:', parsed?.root?.children?.length || 0);
        
        // Log the first paragraph text if available
        if (parsed?.root?.children?.[0]?.children?.[0]?.text) {
          console.log('First text content:', parsed.root.children[0].children[0].text);
        }
      }
      
      return parsed;
    } catch (error) {
      console.error('Error parsing initial editor state:', error);
      return null;
    }
  }, [initialEditorState]);
  
  // Initialize the editor config with the parsed state
  const initialConfig = React.useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating initialConfig, parsedState exists:', !!parsedState);
    }
    
    return {
      namespace: "React.js Demo",
      nodes,
      onError(error: Error) {
        console.error('Lexical editor error:', error);
      },
      theme: ExampleTheme,
      // We'll handle initialization through the InitialStatePlugin instead
      // This prevents issues with the editorState function not being called properly
      editable: true,
    };
  }, [parsedState]);

  // This plugin handles the editor state updates
  const EditorStatePlugin = () => {
    const [editor] = useLexicalComposerContext();
    
    // Set up the editor once when it's mounted
    useEffect(() => {
      if (!editor) return;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Editor instance captured in EditorStatePlugin');
      }
      
      // Register an update listener to handle state changes
      const removeUpdateListener = editor.registerUpdateListener(
        ({editorState, dirtyElements, dirtyLeaves, prevEditorState}) => {
          // Only update when there are actual changes to the document
          if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
            try {
              // Get plain text content
              editorState.read(() => {
                const root = $getRoot();
                const textContent = root.getTextContent();
                setPlainText(textContent);
              });
              
              // Serialize the editor state to JSON
              const serializedState = JSON.stringify(editorState.toJSON());
              setEditorState(serializedState);
            } catch (error) {
              console.error('Error in update listener:', error);
            }
          }
        }
      );
      
      // Clean up the listener when the component unmounts
      return () => {
        removeUpdateListener();
      };
    }, [editor]);
    
    return null;
  };
  
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container" style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden' 
      }}>
        <ToolbarPlugin />
        <div className="editor-inner" style={{ 
          flex: 1, 
          overflowY: 'auto',
          position: 'relative'
        }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                aria-placeholder={placeholder}
                data-testid="editor-input"
                placeholder={<div className="editor-placeholder">{placeholder}</div>}
                style={{ minHeight: '100%' }}
              />
            }
            placeholder={<div className="editor-placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <ListPlugin />
          <BibleVersePlugin />
          <BibleReferenceSuggestionPlugin />
          <HistoryPlugin />
          <CustomAutoFocusPlugin />
          <EditorStatePlugin />
          {initialEditorState && <InitialStatePlugin initialEditorState={initialEditorState} />}
        </div>
      </div>
    </LexicalComposer>
  );
}

// Export a memoized version of the component to prevent unnecessary re-renders
export default React.memo(Editor);
