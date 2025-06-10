import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Toolbar } from '@10play/tentap-editor';
import { Ionicons } from '@expo/vector-icons';

interface EditorToolbarProps {
  editor: any;
  detectionEnabled: boolean;
  setDetectionEnabled: (enabled: boolean) => void;
  onInsertVerse: () => void;
  onChangeToolbarHeight?: (height: number) => void;
  onChangeBottomPadding?: (padding: number) => void;
  initialHeight?: number;
  initialBottomPadding?: number;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  detectionEnabled,
  setDetectionEnabled,
  onInsertVerse,
  onChangeToolbarHeight,
  onChangeBottomPadding,
  initialHeight = 50,
  initialBottomPadding = 25
}) => {
  const [toolbarHeight, setToolbarHeight] = useState(initialHeight);

  return (
    <View style={[styles.container, { height: toolbarHeight }]}>
      <View style={styles.toolbarContainer}>
        <Toolbar editor={editor} />
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.bibleButton}
          onPress={onInsertVerse}
          disabled={!editor}
          activeOpacity={0.7}
        >
          <Ionicons name="book-outline" size={22} color="#0B4619" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.detectionButton, !detectionEnabled && styles.detectionDisabled]}
          onPress={() => setDetectionEnabled(!detectionEnabled)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={detectionEnabled ? "scan-outline" : "scan-circle-outline"} 
            size={26} 
            color={detectionEnabled ? "#0B4619" : "#999"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toolbarContainer: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  bibleButton: {
    padding: 10,
    marginLeft: 4,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  detectionButton: {
    padding: 10,
    marginLeft: 4,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  detectionDisabled: {
    opacity: 0.7
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B4619'
  },
  settingItem: {
    width: '100%',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333'
  },
  settingHint: {
    fontSize: 14,
    marginBottom: 12,
    color: '#666'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  slider: {
    flex: 1,
    height: 40,
    marginRight: 10,
  },
  numberInput: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
    fontSize: 16,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666'
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#0B4619',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default EditorToolbar; 