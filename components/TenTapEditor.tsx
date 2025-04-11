import React from 'react';
import {
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { DEFAULT_TOOLBAR_ITEMS, RichText, Toolbar, useEditorBridge} from '@10play/tentap-editor';
export const TenTapEditor = ({ initialContent = '<p>Start writing here...</p>' }) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  return (
    <SafeAreaView style={styles.fullScreen}>
      <RichText editor={editor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} items={[{
          onPress: () => () => {
            console.log('pressed');
          },
          active: () => false,
          disabled: () => false,
          image: () => require('../assets/images/bible.png'),
        },
        ...DEFAULT_TOOLBAR_ITEMS
        ]} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

export default TenTapEditor; 