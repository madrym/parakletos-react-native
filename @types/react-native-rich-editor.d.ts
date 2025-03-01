declare module 'react-native-rich-editor' {
  import { Component } from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface RichEditorProps {
    initialContentHTML?: string;
    initialHeight?: number;
    editorInitializedCallback?: () => void;
    onChange?: (html: string) => void;
    placeholder?: string;
    disabled?: boolean;
    useContainer?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    editorStyle?: any;
    style?: StyleProp<ViewStyle>;
  }

  export interface RichToolbarProps {
    editor?: {
      current: RichEditor | null;
    };
    actions?: string[];
    iconTint?: string;
    selectedIconTint?: string;
    unselectedButtonStyle?: StyleProp<ViewStyle>;
    selectedButtonStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    iconMap?: Record<string, React.ReactNode>;
  }

  export class RichEditor extends Component<RichEditorProps> {
    setContentHTML: (html: string) => void;
    getContentHtml: () => Promise<string>;
    insertHTML: (html: string) => void;
    insertLink: (url: string, title: string) => void;
    blurContentEditor: () => void;
    focusContentEditor: () => void;
  }

  export class RichToolbar extends Component<RichToolbarProps> {}

  export const actions: {
    setBold: string;
    setItalic: string;
    setUnderline: string;
    heading1: string;
    heading2: string;
    heading3: string;
    heading4: string;
    heading5: string;
    heading6: string;
    setParagraph: string;
    removeFormat: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    alignFull: string;
    insertBulletsList: string;
    insertOrderedList: string;
    insertLink: string;
    insertImage: string;
    setStrikethrough: string;
    checkboxList: string;
    keyboard: string;
    blockquote: string;
    undo: string;
    redo: string;
    [key: string]: string;
  };
} 