declare module 'expo-dom' {
  export namespace DOM {
    export function isAvailable(): boolean;
    
    export interface ContentEditableProps {
      style?: string;
      'data-placeholder'?: string;
      [key: string]: any;
    }
    
    export interface TextProps {
      style?: any;
      pointerEvents?: 'none' | 'auto';
      [key: string]: any;
    }
    
    export const ContentEditable: React.FC<ContentEditableProps>;
    export const Text: React.FC<TextProps>;
  }
} 