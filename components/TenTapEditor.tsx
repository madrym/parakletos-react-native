import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  Keyboard,
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
  ToolbarItem
} from '@10play/tentap-editor';

// Define theme configurations
const lightTheme = {
  toolbar: {
    toolbarBody: {
      borderTopColor: '#E0E0E0',
      borderBottomColor: '#E0E0E0',
      backgroundColor: '#FFFFFF',
    },
    separatorColor: '#CCCCCC',
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

// Added Nature theme that uses app's standard green color palette
const natureTheme = {
  toolbar: {
    toolbarBody: {
      borderTopColor: '#0B4619',
      borderBottomColor: '#0B4619',
      backgroundColor: '#0B4619',
    },
    separatorColor: '#87A96B',
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

const obsidianTheme = {
  toolbar: {
    toolbarBody: {
      borderTopColor: '#303030',
      borderBottomColor: '#303030',
      backgroundColor: '#272727',
    },
    separatorColor: '#404040',
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

const TenTapEditor = forwardRef<TenTapEditorRef, TenTapEditorProps>(function TenTapEditor(props, ref) {
  const {
    themeId = THEME_IDS.NATURE,
    onContentChange,
  } = props;

  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(themeId);
  const { bottom } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Editor bridge setup
  const bridge = useEditorBridge({
    theme: getThemeConfig(currentThemeId),
    autofocus: false,
    avoidIosKeyboard: false, // Turn this off as we're handling it with KeyboardAvoidingView
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
      } as unknown as BridgeExtension<any, any, any>
    ]
  });

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

  function getThemeConfig(id: ThemeId) {
    switch (id) {
      case THEME_IDS.LIGHT:
        return lightTheme;
      case THEME_IDS.DARK:
        return darkEditorTheme;
      case THEME_IDS.OBSIDIAN:
        return obsidianTheme;
      case THEME_IDS.NATURE:
        return natureTheme;
      default:
        return lightTheme;
    }
  }

  function getThemeCSS(id: ThemeId) {
    switch (id) {
      case THEME_IDS.LIGHT:
        return lightCSS;
      case THEME_IDS.DARK:
        return darkEditorCss;
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

  const isEditorReady = bridge !== null;

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 60}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
          <View style={[styles.editorContainer, { backgroundColor: getBackgroundColor() }]}>
            <RichText
              editor={bridge}
              style={[styles.editor, { backgroundColor: getBackgroundColor() }]}
            />
          </View>
          
          <View style={[
            styles.toolbarWrapper, 
            { 
              borderTopColor: '#DDD',
              backgroundColor: getBackgroundColor(),
              paddingBottom: Platform.OS === 'android' ? (keyboardVisible ? 35 : 0) : 0,
              bottom: Platform.OS === 'android' ? 0 : undefined,
              zIndex: 1000,
              elevation: 5, // Add Android elevation for better stacking
            }
          ]}>
            <Toolbar
              editor={bridge}
              items={DEFAULT_TOOLBAR_ITEMS}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
});

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  editorContainer: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
  },
  editor: {
    flex: 1,
  },
  toolbarWrapper: {
    width: '100%',
    borderTopWidth: 1,
    minHeight: 50,
  },
});

export default TenTapEditor; 