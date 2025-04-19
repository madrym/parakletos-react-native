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
import EditorToolbar from './EditorToolbar'; // Import EditorToolbar component
import { saveToolbarHeight, getToolbarHeight, saveBottomPadding, getBottomPadding } from '../utils/storage';

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
}

export interface TenTapEditorRef {
  updateTheme: (newThemeId: ThemeId) => void;
  getEditor: () => any;
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
  const [customToolbarHeight, setCustomToolbarHeight] = useState(50); // Default will be updated from storage
  const [customBottomPadding, setCustomBottomPadding] = useState(25); // Default for bottom padding
  
  // Load saved settings on component mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      const savedHeight = await getToolbarHeight();
      const savedPadding = await getBottomPadding();
      setCustomToolbarHeight(savedHeight);
      setCustomBottomPadding(savedPadding);
    };
    
    loadSavedSettings();
  }, []);

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
    autofocus: false,
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
    debounceMs: 800,
  });

  // Fetch verses when reference is detected
  useEffect(() => {
    if (hookDetectedReference) {
      console.log('Detected reference, fetching verses:', hookDetectedReference);
      // Only fetch verses, don't auto-insert
      fetchVerses(hookDetectedReference);
    }
  }, [hookDetectedReference, fetchVerses]);

  // *** Position Calculation ***
  // Get cursor position for detecting reference
  const getCursorPos = async () => {
    if (!bridge || !hookDetectedReference) return;
    
    try {
      const rect = await (bridge as any).getSelectionBoundingRect();
      
      // Only continue if we have a valid rect and the ref to the container
      if (rect && editorContainerRef.current) {
        editorContainerRef.current.measure((_x, _y, _w, _h, pageX, pageY) => {
          setCursorPosition({
            x: pageX + rect.left,
            y: pageY + rect.bottom + 10 // 10px padding below cursor
          });
        });
      }
    } catch (e) {
      console.log("Error getting cursor pos:", e);
    }
  };

  // Update cursor position when reference is detected or keyboard changes
  useEffect(() => {
    getCursorPos();
  }, [hookDetectedReference, bridge, keyboardVisible]); // Re-check on keyboard visibility

  // Determine if preview should be shown
  const showPreview = !!(hookDetectedReference && (hookBibleResult || hookLoading || hookError));

  // Get the combined height of the toolbar and keyboard
  const getBottomOffset = useCallback(() => {
    return keyboardVisible ? keyboardHeight : 0;
  }, [keyboardVisible, keyboardHeight]);

  // Calculate toolbar height with safe area
  const toolbarHeight = customToolbarHeight + (Platform.OS === 'ios' ? bottom : 0);

  // Handler for toolbar height changes
  const handleToolbarHeightChange = (height: number) => {
    setCustomToolbarHeight(height);
    saveToolbarHeight(height); // Save to persistent storage
  };

  // Handler for bottom padding changes
  const handleBottomPaddingChange = (padding: number) => {
    setCustomBottomPadding(padding);
    saveBottomPadding(padding); // Save to persistent storage
  };

  // Improved preview positioning with keyboard awareness
  const getPreviewStyle = () => {
    // Get base dimensions
    const windowHeight = Dimensions.get('window').height;
    const keyboardOffset = keyboardVisible ? keyboardHeight : 0;
    const availableHeight = windowHeight - toolbarHeight - keyboardOffset - 20; // 20px additional spacing
    
    // Calculate optimal position relative to visible area
    return {
      position: 'absolute' as 'absolute',
      left: 20,
      right: 20,
      maxHeight: Math.min(280, availableHeight * 0.4), // 40% of available height, max 280px
      bottom: keyboardVisible ? keyboardHeight + toolbarHeight + 5 : toolbarHeight + 5, // Position above toolbar with 5px margin
      zIndex: 2000, // Ensure it's above everything else
    };
  };
  // *** End Preview Position Calculation ***

  // Add Bible button to toolbar
  const toolbarItemsWithBible: ToolbarItem[] = [
    ...DEFAULT_TOOLBAR_ITEMS,
    {
      name: 'bible',
      type: 'button',
      image: () => require('../assets/images/bible.png'),
      onPress: () => () => {
        if (bridge && openReferenceModal) {
          console.log('Toolbar: Opening Bible reference modal...');
          openReferenceModal(); // Call the function from the hook
        }
      },
      active: () => false,
      disabled: () => !bridge, // Disable if bridge isn't ready
    } as unknown as ToolbarItem
  ];

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    updateTheme: (newThemeId: ThemeId) => {
      setCurrentThemeId(newThemeId);
      
      if (bridge) {
        bridge.injectCSS(getThemeCSS(newThemeId));
      }
    },
    getEditor: () => bridge
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
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: toolbarHeight + customBottomPadding } // Use custom bottom padding
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.editorContainer, { 
            backgroundColor: getBackgroundColor(),
            flex: 1,
            borderBottomWidth: 0 // Ensure no bottom border
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
                borderWidth: 0, // Ensure no borders
                flex: 1,
                paddingBottom: 50 // Add padding to ensure content doesn't go under toolbar
              }]}
            />
          </View>
          
          {/* Bible verse preview */}
          {showVersePreview && !hookModalVisible && hookDetectedReference && (
            <BibleVersePreview
              reference={hookDetectedReference}
              bibleResult={hookBibleResult}
              loading={hookLoading}
              error={hookError}
              onInsert={insertVerseAtCursor}
              onClose={() => setShowVersePreview(false)}
              theme={{
                background: getCurrentTheme().editorBackground,
                text: getCurrentTheme().text,
                header: getCurrentTheme().header
              }}
            />
          )}
        </ScrollView>
        
        {/* Keyboard avoiding toolbar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingToolbar}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <EditorToolbar
            editor={bridge}
            detectionEnabled={hookDetectionEnabled}
            setDetectionEnabled={hookSetDetectionEnabled}
            onInsertVerse={openReferenceModal}
            onChangeToolbarHeight={handleToolbarHeightChange}
            onChangeBottomPadding={handleBottomPaddingChange}
            initialHeight={customToolbarHeight}
            initialBottomPadding={customBottomPadding}
          />
        </KeyboardAvoidingView>
        
        {/* Reference modal */}
        <BibleReferenceModal
          visible={hookModalVisible}
          onClose={closeReferenceModal}
          onInsert={(result) => {
            // Convert from BibleResult to string if needed
            if (typeof insertVerseFromReference === 'function') {
              insertVerseFromReference(result.formattedReference);
            }
          }}
        />
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
    borderWidth: 0 // Ensure no border
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
  }
});

export default TenTapEditor; 