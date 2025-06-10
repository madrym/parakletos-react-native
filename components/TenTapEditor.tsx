import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  Keyboard,
  UIManager,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  DEFAULT_TOOLBAR_ITEMS, 
  RichText, 
  Toolbar, 
  useEditorBridge,
  TenTapStartKit,
  BridgeExtension,
  CoreBridge,
  darkEditorTheme,
  darkEditorCss,
  ToolbarItem,
  EditorTheme,
  RecursivePartial
} from '@10play/tentap-editor';
import { editorHtml } from '../editor-web/build/editorHtml'; // Import the custom HTML source
import useBibleVerseEditorIntegration from '../hooks/useBibleVerseEditorIntegration'; // Import the hook
import BibleVersePreview from './BibleVersePreview'; // Import Preview component
import BibleReferenceModal from './BibleReferenceModal'; // Import Modal component
import { BibleResult } from '../utils/bible'; // Import BibleResult type
// import EditorToolbar from './EditorToolbar'; // Import EditorToolbar component
// import { saveToolbarHeight, getToolbarHeight, saveBottomPadding, getBottomPadding } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Get screen dimensions
const { height: initialHeight, width: initialWidth } = Dimensions.get('window');
const isLandscape = initialWidth > initialHeight;

// Theme types
interface AppTheme {
  id: string;
  name: string;
  background: string;
  header: string;
  text: string;
  editorBackground: string;
}

// Theme constants
const THEMES = {
  LIGHT: {
    id: 'light',
    name: 'Light',
    background: '#F5F5DC',
    header: '#0B4619',
    text: '#333333',
    editorBackground: '#FFFFFF'
  } as AppTheme,
  DARK: {
    id: 'dark',
    name: 'Dark',
    background: '#1E1E1E',
    header: '#0B4619',
    text: '#F5F5DC',
    editorBackground: '#1E1E1E'
  } as AppTheme,
  OBSIDIAN: {
    id: 'obsidian',
    name: 'Obsidian',
    background: '#272727',
    header: '#0B4619',
    text: '#F5F5DC',
    editorBackground: '#272727'
  } as AppTheme,
  NATURE: {
    id: 'nature',
    name: 'Nature',
    background: '#F5F5DC',
    header: '#0B4619',
    text: '#0B4619',
    editorBackground: '#F5F5DC'
  } as AppTheme
};

// Define editor themes that match TenTap's required type
const lightEditorTheme: RecursivePartial<EditorTheme> = {
  toolbar: {
    toolbarBody: {
      borderTopColor: '#E0E0E0',
      borderBottomColor: '#E0E0E0',
      backgroundColor: '#FFFFFF',
    },
  },
  colorKeyboard: {
    keyboardRootColor: 'white',
    colorSelection: [
      {
        name: 'Green',
        value: '#0B4619',
        displayColor: '#0B4619',
      },
      {
        name: 'Beige',
        value: '#F5F5DC',
        displayColor: '#F5F5DC',
      },
      {
        name: 'Light Green',
        value: '#87A96B',
        displayColor: '#87A96B',
      },
    ],
  },
  webview: {
    backgroundColor: '#FFFFFF',
  },
  webviewContainer: {
    backgroundColor: '#FFFFFF',
  },
};

const natureEditorTheme: RecursivePartial<EditorTheme> = {
  toolbar: {
    toolbarBody: {
      borderTopColor: '#0B4619',
      borderBottomColor: '#0B4619',
      backgroundColor: '#0B4619',
    },
  },
  colorKeyboard: {
    keyboardRootColor: '#F5F5DC',
    colorSelection: [
      {
        name: 'Dark Green',
        value: '#0B4619',
        displayColor: '#0B4619',
      },
      {
        name: 'Beige',
        value: '#F5F5DC',
        displayColor: '#F5F5DC',
      },
      {
        name: 'Light Green',
        value: '#87A96B',
        displayColor: '#87A96B',
      },
    ],
  },
  webview: {
    backgroundColor: '#F5F5DC',
  },
  webviewContainer: {
    backgroundColor: '#F5F5DC',
  },
};

const obsidianEditorTheme: RecursivePartial<EditorTheme> = {
  toolbar: {
    toolbarBody: {
      borderTopColor: '#303030',
      borderBottomColor: '#303030',
      backgroundColor: '#272727',
    },
  },
  colorKeyboard: {
    keyboardRootColor: '#272727',
    colorSelection: [
      {
        name: 'Green',
        value: '#0B4619',
        displayColor: '#0B4619',
      },
      {
        name: 'Beige',
        value: '#F5F5DC',
        displayColor: '#F5F5DC',
      },
      {
        name: 'Light Green',
        value: '#87A96B',
        displayColor: '#87A96B',
      },
    ],
  },
  webview: {
    backgroundColor: '#272727',
  },
  webviewContainer: {
    backgroundColor: '#272727',
  },
};

// Define CSS for each theme
const lightCSS = `
  * {
    color: #333333;
  }
  p, h1, h2, h3, h4, h5, h6, span, div {
    color: #333333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  body {
    background-color: #FFFFFF;
    padding: 10px;
    font-size: 16px;
    line-height: 1.6;
  }
  a {
    color: #0B4619;
  }
  code {
    background-color: #F0F0F0;
    border-radius: 3px;
    padding: 2px 4px;
    font-family: monospace;
  }
  blockquote {
    border-left: 3px solid #87A96B;
    padding-left: 10px;
    margin-left: 20px;
    color: #666666;
  }
  
  /* Bible verse styling removed - moved to editor-web/index.html */
`;

// Added Nature theme CSS
const natureCSS = `
  * {
    color: #0B4619;
  }
  p, h1, h2, h3, h4, h5, h6, span, div {
    color: #0B4619;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  body {
    background-color: #F5F5DC;
    padding: 10px;
    font-size: 16px;
    line-height: 1.6;
  }
  a {
    color: #0B4619;
    font-weight: bold;
  }
  code {
    background-color: #87A96B;
    border-radius: 3px;
    padding: 2px 4px;
    font-family: monospace;
    color: #F5F5DC;
  }
  blockquote {
    border-left: 3px solid #0B4619;
    padding-left: 10px;
    margin-left: 20px;
    color: #2e682d;
    background-color: rgba(135, 169, 107, 0.2);
    padding: 8px 8px 8px 15px;
    border-radius: 0 4px 4px 0;
  }
  h1, h2, h3, h4, h5, h6 {
    border-bottom: 1px solid #87A96B;
    padding-bottom: 4px;
  }
  
  /* Bible verse styling removed - moved to editor-web/index.html */
`;

const obsidianCSS = `
  * {
    color: #F5F5DC;
  }
  p, h1, h2, h3, h4, h5, h6, span, div {
    color: #F5F5DC;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  body {
    background-color: #272727;
    padding: 10px;
    font-size: 16px;
    line-height: 1.6;
  }
  a {
    color: #87A96B;
  }
  code {
    background-color: #303030;
    border-radius: 3px;
    padding: 2px 4px;
    font-family: monospace;
  }
  blockquote {
    border-left: 3px solid #87A96B;
    padding-left: 10px;
    margin-left: 20px;
    color: #cccccc;
  }
  
  /* Bible verse styling removed - moved to editor-web/index.html */
`;

// Dark theme CSS with Bible verse styling
const darkCSSWithBibleVerses = `
  ${darkEditorCss}
  
  /* Bible verse styling removed - moved to editor-web/index.html */
`;

// Theme IDs
const THEME_IDS = {
  LIGHT: 'light',
  DARK: 'dark',
  OBSIDIAN: 'obsidian',
  NATURE: 'nature'
} as const;

// Types
type ThemeId = typeof THEME_IDS[keyof typeof THEME_IDS];

interface TenTapEditorProps {
  initialContent?: string;
  themeId?: ThemeId;
  onContentChange?: (html: string) => void;
  toolbarHeight?: number;
  toolbarBottomPadding?: number;
}

export interface TenTapEditorRef {
  updateTheme: (newThemeId: ThemeId) => void;
  getEditor: () => any;
  focus: () => void;
}

// JavaScript to handle Bible verse toggling
const bibleVerseToggleScript = `
  document.addEventListener('click', function(event) {
    let target = event.target;
    // Traverse up to find the header if clicked on a child
    while (target && !target.classList.contains('bible-verse-header') && target.parentElement) {
      target = target.parentElement;
    }
    
    // Handle click on verse header
    if (target && target.classList.contains('bible-verse-header')) {
      const block = target.closest('.bible-verse-block');
      if (block) {
        const content = block.querySelector('.bible-verse-content');
        if (content) {
          content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
      }
    }
  });
  
  // Initialize all Bible verse blocks to be collapsed by default
  function initializeBibleVerses() {
    const verses = document.querySelectorAll('.bible-verse-block');
    verses.forEach(verse => {
      const content = verse.querySelector('.bible-verse-content');
      if (content) {
        content.style.display = 'none';
      }
    });
  }
  
  // Run initialization when content is ready
  if (document.readyState === 'complete') {
    initializeBibleVerses();
  } else {
    document.addEventListener('DOMContentLoaded', initializeBibleVerses);
  }
`;

const TenTapEditor = forwardRef<TenTapEditorRef, TenTapEditorProps>(function TenTapEditor(props, ref) {
  const {
    initialContent = '', // Add default initial content
    themeId = THEME_IDS.NATURE,
    onContentChange,
    toolbarHeight = 50,
    toolbarBottomPadding = 25,
  } = props;

  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(themeId);
  const { top } = useSafeAreaInsets();
  const { bottom } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const headerHeight = isLandscape ? 32 : 44;
  const keyboardVerticalOffset = headerHeight + top;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const editorContainerRef = useRef<View>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showVersePreview, setShowVersePreview] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [customToolbarHeight, setCustomToolbarHeight] = useState(toolbarHeight);
  const [customBottomPadding, setCustomBottomPadding] = useState(toolbarBottomPadding);
  
  // Update local state when props change
  useEffect(() => {
    setCustomToolbarHeight(toolbarHeight);
    setCustomBottomPadding(toolbarBottomPadding);
  }, [toolbarHeight, toolbarBottomPadding]);

  // Enhanced keyboard listeners with platform-specific handling
  useEffect(() => {
    // Platform-specific keyboard event names
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    // Keyboard show handler
    const handleKeyboardShow = (event: any) => {
      const keyboardFrame = event.endCoordinates;
      const keyboardHeight = keyboardFrame.height;
      
      setKeyboardVisible(true);
      setKeyboardHeight(keyboardHeight);
      
      // For Android, ensure content is visible
      if (Platform.OS === 'android') {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    };
    
    // Keyboard hide handler
    const handleKeyboardHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };
    
    // Add listeners
    const keyboardDidShowListener = Keyboard.addListener(showEvent, handleKeyboardShow);
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Editor bridge setup
  const bridge = useEditorBridge({
    customSource: editorHtml, // Use the custom built HTML
    theme: getThemeConfig(currentThemeId),
    autofocus: true, // Enable autofocus to ensure proper mobile keyboard behavior
    avoidIosKeyboard: false, // Turn this off as we're handling it with KeyboardAvoidingView
    initialContent: initialContent, // Pass initial content
    bridgeExtensions: [
      ...TenTapStartKit,
      {
        name: 'content-change-listener',
        onMessage: (message: any) => {
          if (message.type === 'content-changed' && message.content && onContentChange) {
            onContentChange(message.content as string);
          }
        },
        // Add missing required methods for BridgeExtension
        clone: () => null,
        configureExtension: () => null,
        configureCSS: () => null,
        extendExtension: () => null,
        configureTiptapExtensionsOnRunTime: () => null
      } as unknown as BridgeExtension<any, any, any>,
      // Add custom bridge extension for mobile popup fixes
      {
        name: 'mobile-popup-fix',
        configureCSS: () => {
          return `
            .ProseMirror-menu, .ProseMirror-menuseparator, 
            .ProseMirror-menuitem, .ProseMirror-selectedcell,
            .popup-content, .menu-dropdown, .color-picker {
              z-index: 9999 !important;
              position: fixed !important;
              bottom: ${Platform.OS === 'android' ? '180px' : 'auto'} !important;
              touch-action: auto !important;
              pointer-events: auto !important;
            }

            .toolbar-dropdown-content {
              position: absolute !important;
              bottom: 60px !important;
              left: 0 !important;
              z-index: 9999 !important;
            }
          `;
        },
        // Add missing required methods
        clone: () => null,
        configureExtension: () => null,
        onMessage: () => null,
        extendExtension: () => null,
        configureTiptapExtensionsOnRunTime: () => null
      } as unknown as BridgeExtension<any, any, any>,
      // Add custom bridge extension for enhanced mobile input handling
      {
        name: 'mobile-input-enhancement',
        configureCSS: () => {
          return `
            .ProseMirror {
              -webkit-user-select: text !important;
              user-select: text !important;
              -webkit-touch-callout: default !important;
              -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
              touch-action: manipulation !important;
              cursor: text !important;
            }
            
            .ProseMirror:focus {
              outline: none !important;
              border: none !important;
            }
            
            /* Ensure text inputs are properly styled for mobile */
            input[type="text"], textarea, .ProseMirror {
              font-size: 16px !important; /* Prevents zoom on iOS */
              line-height: 1.4 !important;
            }
          `;
        },
        // Add missing required methods
        clone: () => null,
        configureExtension: () => null,
        onMessage: () => null,
        extendExtension: () => null,
        configureTiptapExtensionsOnRunTime: () => null
      } as unknown as BridgeExtension<any, any, any>,
      // Add custom bridge extension for Bible verse interaction (if needed)
      // Note: The NodeView now handles clicks, so this might be redundant unless
      // you need other JS interactions from the web side.
      // {
      //   name: 'bible-verse-handler',
      //   configureExtension: () => bibleVerseToggleScript, 
      //   ...
      // }
    ]
  });

  // *** Add Log ***
  console.log('[TenTapEditor] Rendering. Bridge value is:', bridge ? 'Object' : String(bridge));

  // Call the Bible Verse Integration Hook
  const {
    detectedReference: hookDetectedReference,
    bibleResult: hookBibleResult,
    loading: hookLoading,
    error: hookError,
    detectionEnabled: hookDetectionEnabled,
    setDetectionEnabled: hookSetDetectionEnabled,
    modalVisible: hookModalVisible,
    openReferenceModal,
    closeReferenceModal,
    insertVerseAtCursor,
    insertVerseFromReference,
    clearDetection,
    fetchVerses
  } = useBibleVerseEditorIntegration({
    editor: bridge,
    enabled: true,
  });

  // Fetch verses when reference is detected
  useEffect(() => {
    if (hookDetectedReference) {
      console.log('Detected reference, fetching verses:', hookDetectedReference);
      // Only fetch verses, don't auto-insert
      fetchVerses(hookDetectedReference);
    }
  }, [hookDetectedReference, fetchVerses]);

  // *** Add debugging logs for the hook data ***
  useEffect(() => {
    console.log('[TenTapEditor] Hook state update:', {
      detectedReference: hookDetectedReference,
      bibleResult: hookBibleResult,
      loading: hookLoading,
      error: hookError,
      hasVerses: hookBibleResult?.verses?.length || 0
    });
  }, [hookDetectedReference, hookBibleResult, hookLoading, hookError]);

  // *** Position Calculation ***
  // Get cursor position for detecting reference
  const getCursorPos = useCallback(async () => {
    if (!bridge || !hookDetectedReference) return;
    
    try {
      // Enable basic positioning - we'll position the toolbar without precise cursor coordinates
      // This allows the Bible verse detection to work properly
      console.log('Bible reference detected, calculating basic position');
      
      // Only set cursor position if it hasn't been set or if it's different
      // This prevents infinite loops from setCursorPosition triggering re-renders
      setCursorPosition(prev => {
        const newPosition = {
          x: 20, // Default left margin
          y: 100 // Default top position
        };
        
        // Only update if position actually changed
        if (prev.x !== newPosition.x || prev.y !== newPosition.y) {
          return newPosition;
        }
        return prev;
      });
      
      // TODO: Future enhancement - implement precise cursor position detection
      // when TenTap editor provides the necessary bridge methods
      // const rect = await (bridge as any).getSelectionBoundingRect();
      // 
      // // Only continue if we have a valid rect and the ref to the container
      // if (rect && editorContainerRef.current) {
      //   editorContainerRef.current.measure((_x, _y, _w, _h, pageX, pageY) => {
      //     setCursorPosition({
      //       x: pageX + rect.left,
      //       y: pageY + rect.bottom + 10 // 10px padding below cursor
      //     });
      //   });
      // }
    } catch (e) {
      console.log("Error getting cursor pos:", e);
    }
  }, [bridge, hookDetectedReference]);

  // Update cursor position when reference is detected or keyboard changes
  // Use a ref to track if we've already calculated position for this reference
  const lastCalculatedRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    // Only calculate position if we haven't already done it for this reference
    if (hookDetectedReference && hookDetectedReference !== lastCalculatedRef.current) {
      lastCalculatedRef.current = hookDetectedReference;
      getCursorPos();
    } else if (!hookDetectedReference) {
      lastCalculatedRef.current = undefined;
    }
  }, [hookDetectedReference, getCursorPos]);

  // Determine if preview should be shown - show whenever we have a detected reference
  const showPreview = !!(hookDetectedReference);

  console.log('[TenTapEditor] Render state:', {
    showPreview,
    hookDetectedReference,
    hasBibleResult: !!hookBibleResult,
    bibleResultContent: hookBibleResult ? {
      formattedReference: hookBibleResult.formattedReference,
      versesCount: hookBibleResult.verses?.length || 0
    } : null,
    hookLoading,
    hookError
  });

  // Get the combined height of the toolbar and keyboard
  const getBottomOffset = useCallback(() => {
    return keyboardVisible ? keyboardHeight : 0;
  }, [keyboardVisible, keyboardHeight]);

  // Calculate toolbar height with safe area
  const finalToolbarHeight = customToolbarHeight + (Platform.OS === 'ios' ? bottom : 0);

  // Handler for toolbar height changes
  const handleToolbarHeightChange = (height: number) => {
    setCustomToolbarHeight(height);
  };

  // Handler for bottom padding changes
  const handleBottomPaddingChange = (padding: number) => {
    setCustomBottomPadding(padding);
  };

  // Simple fixed preview positioning - always visible
  const getFixedPreviewStyle = () => {
    return {
      position: 'absolute' as 'absolute',
      left: 10,
      right: 10,
      bottom: 120, // Increased from 100 to ensure full preview is visible
      zIndex: 9999,
      height: 320, // Fixed height to match component
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    };
  };

  // Add a handler for dismissing the preview when tapping outside
  const handleOutsideTap = useCallback(() => {
    if (showPreview) {
      clearDetection();
    }
  }, [showPreview, clearDetection]);

  // Add focus method to help with mobile keyboard
  const focusEditor = useCallback(async () => {
    if (bridge) {
      try {
        await bridge.focus();
      } catch (error) {
        console.log('Error focusing editor:', error);
      }
    }
  }, [bridge]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    updateTheme: (newThemeId: ThemeId) => {
      setCurrentThemeId(newThemeId);
      
      if (bridge) {
        bridge.injectCSS(getThemeCSS(newThemeId));
      }
    },
    getEditor: () => bridge,
    focus: focusEditor, // Add focus method to ref
  }));

  function getThemeConfig(id: ThemeId): RecursivePartial<EditorTheme> {
    switch (id) {
      case THEME_IDS.LIGHT:
        return lightEditorTheme;
      case THEME_IDS.DARK:
        return darkEditorTheme;
      case THEME_IDS.OBSIDIAN:
        return obsidianEditorTheme;
      case THEME_IDS.NATURE:
        return natureEditorTheme;
      default:
        return natureEditorTheme;
    }
  }

  function getThemeCSS(id: ThemeId) {
    switch (id) {
      case THEME_IDS.LIGHT:
        return lightCSS;
      case THEME_IDS.DARK:
        return darkCSSWithBibleVerses;
      case THEME_IDS.OBSIDIAN:
        return obsidianCSS;
      case THEME_IDS.NATURE:
        return natureCSS;
      default:
        return lightCSS;
    }
  }

  const getBackgroundColor = () => {
    switch (currentThemeId) {
      case THEME_IDS.LIGHT:
        return '#FFFFFF';
      case THEME_IDS.DARK:
        return '#1E1E1E';
      case THEME_IDS.OBSIDIAN:
        return '#272727';
      case THEME_IDS.NATURE:
        return '#F5F5DC';
      default:
        return '#FFFFFF';
    }
  };

  // Get text color based on theme
  const getTextColor = () => {
    switch (currentThemeId) {
      case THEME_IDS.LIGHT:
        return '#333333';
      case THEME_IDS.DARK:
      case THEME_IDS.OBSIDIAN:
        return '#F5F5DC';
      case THEME_IDS.NATURE:
        return '#0B4619';
      default:
        return '#333333';
    }
  };

  const getCurrentTheme = () => {
    switch (currentThemeId) {
      case THEME_IDS.LIGHT:
        return THEMES.LIGHT;
      case THEME_IDS.DARK:
        return THEMES.DARK;
      case THEME_IDS.OBSIDIAN:
        return THEMES.OBSIDIAN;
      case THEME_IDS.NATURE:
        return THEMES.NATURE;
      default:
        return THEMES.NATURE;
    }
  };
  
  const isEditorReady = bridge !== null;
  const currentAppTheme = getCurrentTheme(); // Get current theme object
  
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Scroll handling logic
  }, []);

  return (
    <View style={styles.mainContainer} ref={editorContainerRef}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <TouchableWithoutFeedback onPress={handleOutsideTap}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            contentContainerStyle={[
              styles.scrollViewContent,
              { paddingBottom: finalToolbarHeight + customBottomPadding }
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={focusEditor}>
              <View style={[styles.editorContainer, { 
                backgroundColor: getBackgroundColor(),
                flex: 1,
                borderBottomWidth: 0
              }]}>
                {hookLoading && !keyboardVisible && (
                  <View style={styles.loadingOverlay}>
                    <Text style={[styles.loadingText, { color: getTextColor() }]}>Loading...</Text>
                  </View>
                )}
                <RichText
                  editor={bridge}
                  style={[styles.editor, { 
                    backgroundColor: getBackgroundColor(),
                    borderWidth: 0,
                    flex: 1,
                    paddingBottom: 50
                  }]}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel="Note editor"
                  accessibilityHint="Tap to start writing your note"
                />
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </TouchableWithoutFeedback>
        
        {/* Keyboard avoiding toolbar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingToolbar}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <View style={styles.simpleToolbarContainer}>
            <View style={styles.toolbarWrapper}>
              <Toolbar editor={bridge} />
            </View>
            <View style={styles.toolbarActions}>
              <TouchableOpacity 
                style={styles.bibleToolbarButton}
                onPress={openReferenceModal}
                disabled={!bridge}
                activeOpacity={0.7}
              >
                <Ionicons name="book-outline" size={22} color="#0B4619" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        
        {/* Reference modal */}
        <BibleReferenceModal
          visible={hookModalVisible}
          onClose={closeReferenceModal}
          onInsert={(result) => {
            if (typeof insertVerseAtCursor === 'function') {
              insertVerseAtCursor(result);
            }
          }}
        />

        {/* Bible Verse Preview */}
        {showPreview && (
          <View style={getFixedPreviewStyle()}>
            <BibleVersePreview
              reference={hookDetectedReference}
              bibleResult={hookBibleResult}
              loading={hookLoading}
              error={hookError}
              onInsert={(result) => {
                insertVerseAtCursor(result);
                clearDetection();
              }}
              onClose={clearDetection}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
});

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative'
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 50, // Add padding to ensure content is visible above toolbar
  },
  editorContainer: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    borderWidth: 0, // Ensure no border
    minHeight: 200, // Ensure minimum height for easier tapping
  },
  editor: {
    flex: 1,
    borderWidth: 0, // Ensure no border
    minHeight: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  keyboardAvoidingToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
    ...Platform.select({
      android: {
        paddingBottom: 20, // Add padding for Android to ensure visibility above keyboard
      }
    }),
  },
  modalPlaceholder: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  simpleToolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarWrapper: {
    flex: 1,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bibleToolbarButton: {
    padding: 10,
  },
  detectionToolbarButton: {
    padding: 10,
  },
  detectionDisabled: {
    opacity: 0.5,
  },
  previewContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default TenTapEditor; 