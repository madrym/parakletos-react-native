import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Modal, Text, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
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
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(initialHeight);
  const [toolbarHeightText, setToolbarHeightText] = useState(initialHeight.toString());
  const [bottomPadding, setBottomPadding] = useState(initialBottomPadding);
  const [bottomPaddingText, setBottomPaddingText] = useState(initialBottomPadding.toString());

  const applyToolbarHeight = (height: number) => {
    const validHeight = Math.min(Math.max(height, 40), 70); // Clamp between 40-70
    setToolbarHeight(validHeight);
    setToolbarHeightText(validHeight.toString());
    if (onChangeToolbarHeight) {
      onChangeToolbarHeight(validHeight);
    }
  };

  const applyBottomPadding = (padding: number) => {
    const validPadding = Math.min(Math.max(padding, 0), 100); // Clamp between 0-100
    setBottomPadding(validPadding);
    setBottomPaddingText(validPadding.toString());
    if (onChangeBottomPadding) {
      onChangeBottomPadding(validPadding);
    }
  };

  const handleToolbarHeightTextChange = (text: string) => {
    setToolbarHeightText(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= 40 && numValue <= 70) {
      applyToolbarHeight(numValue);
    }
  };

  const handleBottomPaddingTextChange = (text: string) => {
    setBottomPaddingText(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      applyBottomPadding(numValue);
    }
  };

  const finishToolbarHeightEditing = () => {
    const numValue = parseInt(toolbarHeightText, 10);
    if (isNaN(numValue) || numValue < 40 || numValue > 70) {
      // Reset to current valid value if invalid input
      setToolbarHeightText(toolbarHeight.toString());
    } else {
      applyToolbarHeight(numValue);
    }
  };

  const finishBottomPaddingEditing = () => {
    const numValue = parseInt(bottomPaddingText, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      // Reset to current valid value if invalid input
      setBottomPaddingText(bottomPadding.toString());
    } else {
      applyBottomPadding(numValue);
    }
  };

  return (
    <>
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
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Toolbar Settings</Text>
              <TouchableOpacity 
                onPress={() => setSettingsVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            {/* Toolbar Height */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Toolbar Height</Text>
              <Text style={styles.settingHint}>
                Adjust if the toolbar is hidden by your keyboard
              </Text>
              
              <View style={styles.inputContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={40}
                  maximumValue={70}
                  step={1}
                  value={toolbarHeight}
                  onValueChange={applyToolbarHeight}
                  minimumTrackTintColor="#0B4619"
                  maximumTrackTintColor="#ccc"
                />
                <TextInput
                  style={styles.numberInput}
                  value={toolbarHeightText}
                  onChangeText={handleToolbarHeightTextChange}
                  onEndEditing={finishToolbarHeightEditing}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Smaller (40)</Text>
                <Text style={styles.sliderLabel}>Larger (70)</Text>
              </View>
            </View>
            
            {/* Bottom Padding */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Bottom Padding</Text>
              <Text style={styles.settingHint}>
                Adjust space between content and toolbar
              </Text>
              
              <View style={styles.inputContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={bottomPadding}
                  onValueChange={applyBottomPadding}
                  minimumTrackTintColor="#0B4619"
                  maximumTrackTintColor="#ccc"
                />
                <TextInput
                  style={styles.numberInput}
                  value={bottomPaddingText}
                  onChangeText={handleBottomPaddingTextChange}
                  onEndEditing={finishBottomPaddingEditing}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={3}
                />
              </View>
              
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Less (0)</Text>
                <Text style={styles.sliderLabel}>More (100)</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => setSettingsVisible(false)}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  settingsButton: {
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