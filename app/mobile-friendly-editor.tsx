import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  SafeAreaView, 
  StatusBar,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  EmitterSubscription,
  LayoutAnimation,
  UIManager,
  NativeModules
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TenTapEditor, { TenTapEditorRef } from '../components/TenTapEditor';

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
interface Theme {
  id: string;
  name: string;
  background: string;
  header: string;
  text: string;
  editorBackground: string;
}

// Folder type
interface Folder {
  id: string;
  name: string;
  emoji: string;
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
  } as Theme,
  DARK: {
    id: 'dark',
    name: 'Dark',
    background: '#1E1E1E',
    header: '#0B4619',
    text: '#F5F5DC',
    editorBackground: '#1E1E1E'
  } as Theme,
  OBSIDIAN: {
    id: 'obsidian',
    name: 'Obsidian',
    background: '#272727',
    header: '#0B4619',
    text: '#F5F5DC',
    editorBackground: '#272727'
  } as Theme,
  NATURE: {
    id: 'nature',
    name: 'Nature',
    background: '#F5F5DC',
    header: '#0B4619',
    text: '#0B4619',
    editorBackground: '#F5F5DC'
  } as Theme
};

// Bottom sheet for theme selection
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectTheme: (theme: Theme) => void;
  currentThemeId: string;
}

const ThemeBottomSheet: React.FC<BottomSheetProps> = ({ 
  visible, 
  onClose, 
  onSelectTheme, 
  currentThemeId 
}) => {
  const translateY = useRef(new Animated.Value(initialHeight)).current;
  const themeList = Object.values(THEMES);
  
  useEffect(() => {
    if (visible) {
      // Get current screen height at the moment the sheet becomes visible
      const { height: currentHeight } = Dimensions.get('window');
      
      // Reset value if not visible (to prevent weird animation when height changes)
      translateY.setValue(currentHeight);
      
      // Slide up
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
    } else {
      // Get current height for closing animation
      const { height: currentHeight } = Dimensions.get('window');
      
      // Slide down
      Animated.spring(translateY, {
        toValue: currentHeight,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.bottomSheetContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.bottomSheet,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>Select Theme</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={themeList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.themeOption,
                currentThemeId === item.id && styles.selectedThemeOption
              ]}
              onPress={() => {
                onSelectTheme(item);
                onClose();
              }}
            >
              <View 
                style={[
                  styles.themeColorPreview, 
                  { backgroundColor: item.editorBackground },
                  { borderColor: item.id === 'light' ? '#DDD' : 'transparent' }
                ]} 
              />
              <Text style={styles.themeOptionText}>{item.name}</Text>
              {currentThemeId === item.id && (
                <Ionicons name="checkmark" size={20} color="#0B4619" />
              )}
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </View>
  );
};

// Label bottom sheet for label creation
interface LabelBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddLabel: (label: string) => void;
  previousLabels: string[];
  theme: Theme;
}

const LabelBottomSheet: React.FC<LabelBottomSheetProps> = ({
  visible,
  onClose,
  onAddLabel,
  previousLabels,
  theme
}) => {
  const translateY = useRef(new Animated.Value(initialHeight)).current;
  const [labelText, setLabelText] = useState('');
  const inputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    if (visible) {
      // Get current screen height at the moment the sheet becomes visible
      const { height: currentHeight } = Dimensions.get('window');
      
      // Reset value if not visible (to prevent weird animation when height changes)
      translateY.setValue(currentHeight);
      
      // Slide up
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
      
      // Focus input after animation
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    } else {
      // Get current height for closing animation
      const { height: currentHeight } = Dimensions.get('window');
      
      // Slide down
      Animated.spring(translateY, {
        toValue: currentHeight,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
      
      // Clear input when closed
      setLabelText('');
    }
  }, [visible]);

  const handleAddLabel = () => {
    const trimmedLabel = labelText.trim();
    if (trimmedLabel !== '') {
      onAddLabel(trimmedLabel);
      setLabelText('');
    }
  };

  const handleSelectPreviousLabel = (label: string) => {
    onAddLabel(label);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.bottomSheetContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.bottomSheet,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>Add Label</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.labelInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.labelInput}
            value={labelText}
            onChangeText={setLabelText}
            placeholder="Enter label name"
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={handleAddLabel}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={[
              styles.addLabelButton, 
              { 
                backgroundColor: labelText.trim() ? theme.header : '#ccc',
                opacity: labelText.trim() ? 1 : 0.7 
              }
            ]}
            onPress={handleAddLabel}
            disabled={!labelText.trim()}
          >
            <Text style={styles.addLabelButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {previousLabels.length > 0 && (
          <>
            <Text style={styles.previousLabelsTitle}>Previously Used Labels</Text>
            <FlatList
              data={previousLabels}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.previousLabelItem}
                  onPress={() => handleSelectPreviousLabel(item)}
                >
                  <Text style={styles.previousLabelText}>{item}</Text>
                  <Ionicons name="add-circle-outline" size={20} color="#0B4619" />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.labelSeparator} />}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
};

// Folder bottom sheet for folder selection and creation
interface FolderBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectFolder: (folder: Folder | null) => void;
  onCreateFolder: (name: string, emoji: string) => void;
  folders: Folder[];
  currentFolder: Folder | null;
  theme: Theme;
}

const EMOJI_OPTIONS = ['📁', '📔', '📒', '📕', '📗', '📘', '📙', '🗂️', '💼', '🏛️', '🏢', '🏠', '🌳', '🌿', '🔖'];

const FolderBottomSheet: React.FC<FolderBottomSheetProps> = ({
  visible,
  onClose,
  onSelectFolder,
  onCreateFolder,
  folders,
  currentFolder,
  theme
}) => {
  const translateY = useRef(new Animated.Value(initialHeight)).current;
  const [folderName, setFolderName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📁');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    if (visible) {
      // Get current screen height at the moment the sheet becomes visible
      const { height: currentHeight } = Dimensions.get('window');
      
      // Reset value if not visible (to prevent weird animation when height changes)
      translateY.setValue(currentHeight);
      
      // Slide up
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
      
      // Reset creation state when opening
      setIsCreatingNew(false);
    } else {
      // Get current height for closing animation
      const { height: currentHeight } = Dimensions.get('window');
      
      // Slide down
      Animated.spring(translateY, {
        toValue: currentHeight,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
      
      // Clear input when closed
      setFolderName('');
      setSelectedEmoji('📁');
    }
  }, [visible]);

  // Handle folder creation
  const handleCreateFolder = () => {
    const trimmedName = folderName.trim();
    if (trimmedName !== '') {
      onCreateFolder(trimmedName, selectedEmoji);
      setFolderName('');
      setSelectedEmoji('📁');
      setIsCreatingNew(false);
    }
  };

  // Focus input when switching to create mode
  useEffect(() => {
    if (isCreatingNew && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isCreatingNew]);

  if (!visible) return null;

  return (
    <View style={styles.bottomSheetContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.bottomSheet,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>
            {isCreatingNew ? 'Create New Folder' : 'Select Folder'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {isCreatingNew ? (
          // Create new folder view
          <View>
            <View style={styles.folderInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.folderInput}
                value={folderName}
                onChangeText={setFolderName}
                placeholder="Enter folder name"
                placeholderTextColor="#999"
                returnKeyType="done"
                onSubmitEditing={handleCreateFolder}
                autoCapitalize="words"
              />
            </View>
            
            <Text style={styles.emojiSelectorTitle}>Select an emoji</Text>
            <View style={styles.emojiSelector}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.selectedEmojiOption
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.folderActionButtons}>
              <TouchableOpacity 
                style={[styles.folderActionButton, styles.cancelButton]}
                onPress={() => setIsCreatingNew(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.folderActionButton, 
                  styles.createButton,
                  {
                    backgroundColor: folderName.trim() ? theme.header : '#ccc',
                    opacity: folderName.trim() ? 1 : 0.7
                  }
                ]}
                onPress={handleCreateFolder}
                disabled={!folderName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Folder selection view
          <>
            <TouchableOpacity 
              style={[
                styles.folderOption, 
                currentFolder === null && styles.selectedFolderOption
              ]}
              onPress={() => {
                onSelectFolder(null);
                onClose();
              }}
            >
              <Text style={styles.folderEmojiText}>🏠</Text>
              <Text style={styles.folderNameText}>No Folder (Root)</Text>
              {currentFolder === null && (
                <Ionicons name="checkmark" size={20} color="#0B4619" />
              )}
            </TouchableOpacity>
            
            <FlatList
              data={folders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.folderOption,
                    currentFolder?.id === item.id && styles.selectedFolderOption
                  ]}
                  onPress={() => {
                    onSelectFolder(item);
                    onClose();
                  }}
                >
                  <Text style={styles.folderEmojiText}>{item.emoji}</Text>
                  <Text style={styles.folderNameText}>{item.name}</Text>
                  {currentFolder?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color="#0B4619" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.folderSeparator} />}
            />
            
            <TouchableOpacity 
              style={styles.createFolderButton}
              onPress={() => setIsCreatingNew(true)}
            >
              <Ionicons name="add-circle-outline" size={22} color="#0B4619" />
              <Text style={styles.createFolderText}>Create New Folder</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
};

// Mobile friendly editor using 10tap
export default function MobileFriendlyEditorPage() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.NATURE);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [labelSheetVisible, setLabelSheetVisible] = useState(false);
  const [folderSheetVisible, setFolderSheetVisible] = useState(false);
  const [title, setTitle] = useState<string>('Untitled Note');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'folder1', name: 'Work', emoji: '💼' },
    { id: 'folder2', name: 'Personal', emoji: '🏠' },
    { id: 'folder3', name: 'Projects', emoji: '📁' },
    { id: 'folder4', name: 'Journal', emoji: '📔' },
    { id: 'folder5', name: 'Ideas', emoji: '💡' }
  ]);
  const [previouslyUsedLabels, setPreviouslyUsedLabels] = useState<string[]>([
    'Personal', 'Work', 'Ideas', 'Journal', 'To-do', 'Project', 'Research'
  ]);
  
  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [orientation, setOrientation] = useState(isLandscape ? 'landscape' : 'portrait');
  
  // Refs
  const editorRef = useRef<TenTapEditorRef>(null);
  const titleInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardShowListener = useRef<EmitterSubscription | null>(null);
  const keyboardHideListener = useRef<EmitterSubscription | null>(null);
  const dimensionsListener = useRef<any>(null);

  // Set up keyboard event listeners
  useEffect(() => {
    // Keyboard show/hide events
    keyboardShowListener.current = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    keyboardHideListener.current = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );
    
    // Detect orientation changes
    dimensionsListener.current = Dimensions.addEventListener('change', ({ window }) => {
      const isLandscape = window.width > window.height;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    });
    
    // Clean up listeners
    return () => {
      keyboardShowListener.current?.remove();
      keyboardHideListener.current?.remove();
      dimensionsListener.current?.remove();
    };
  }, []);
  
  // Adjust scroll position when keyboard appears
  useEffect(() => {
    if (keyboardVisible && scrollViewRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [keyboardVisible]);

  // Save theme to editor reference
  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    if (editorRef.current) {
      editorRef.current.updateTheme(theme.id as any);
    }
  };

  // Handle title change
  const handleTitleChange = (text: string) => {
    setTitle(text);
  };

  // Handle title focus
  const handleTitleFocus = () => {
    setIsEditing(true);
  };

  // Handle title blur
  const handleTitleBlur = () => {
    setIsEditing(false);
    // Trim title and set default if empty
    const trimmedTitle = title.trim();
    if (trimmedTitle === '') {
      setTitle('Untitled Note');
    } else {
      setTitle(trimmedTitle);
    }
  };

  // Dismiss keyboard when tapping outside of input fields
  const handleOutsidePress = () => {
    Keyboard.dismiss();
  };

  // Add a label
  const handleAddLabel = (label: string) => {
    // Don't add duplicate labels
    if (!labels.includes(label)) {
      setLabels([...labels, label]);
      
      // Add to previously used labels if not already there
      if (!previouslyUsedLabels.includes(label)) {
        setPreviouslyUsedLabels([...previouslyUsedLabels, label]);
      }
    }
  };

  // Remove a label
  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  // Select a folder
  const handleSelectFolder = (folder: Folder | null) => {
    setCurrentFolder(folder);
  };

  // Create a folder
  const handleCreateFolder = (name: string, emoji: string) => {
    // In real app, this would make a call to the Convex backend
    const newFolder: Folder = {
      id: `folder_${Date.now()}`, // In real app, this would be created by the backend
      name,
      emoji
    };
    
    setFolders([...folders, newFolder]);
    setCurrentFolder(newFolder);
  };

  // Add content change handler
  const handleContentChange = (html: string) => {
    // Store content in state or directly save
    console.log('Content changed, length:', html.length);
  };

  // Simple save function with title, labels, and folder
  const saveNote = async () => {
    try {
      setIsSaving(true);
      
      // Dismiss keyboard when saving
      Keyboard.dismiss();
      
      // Here you would call your Convex mutation
      // For now we'll just simulate a save with a timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get content from editor
      let content = '';
      if (editorRef.current) {
        // This would be replaced with actual editor content retrieval
        // content = editorRef.current.getEditor().getHTML();
        content = '<p>Example content for demo</p>';
      }
      
      // Example of how you would call the Convex mutation (to be implemented)
      // await mutation.updateNote({
      //   id: noteId, // You would need noteId from props or state
      //   title,
      //   content,
      //   tags: labels,
      //   folderId: currentFolder?.id,
      // });
      
      setIsSaving(false);
      Alert.alert(
        'Save Note', 
        `Note "${title}" saved with ${labels.length} labels in folder "${currentFolder?.name || 'Root'}"`,
      );
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save note');
      console.error('Error saving note:', error);
    }
  };

  // Calculate appropriate keyboard vertical offset - reduce offset as toolbar is now attached to keyboard
  const getKeyboardVerticalOffset = () => {
    if (Platform.OS === 'ios') {
      return orientation === 'portrait' ? 60 : 40;
    }
    return 0;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle="light-content" />
      
      {/* Custom header implementation */}
      <View style={[styles.customHeader, { backgroundColor: currentTheme.header }]}>
        <TouchableOpacity
          style={styles.customHeaderBackButton}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#F5F5DC" />
        </TouchableOpacity>
        
        <View style={styles.customHeaderButtons}>
          <TouchableOpacity
            style={styles.customHeaderButton}
            onPress={() => {
              setFolderSheetVisible(true);
            }}
          >
            <Ionicons name="folder-outline" size={24} color="#F5F5DC" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.customHeaderButton}
            onPress={() => {
              setLabelSheetVisible(true);
            }}
          >
            <Ionicons name="pricetag-outline" size={24} color="#F5F5DC" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.customHeaderButton}
            onPress={() => {
              setThemeSheetVisible(true);
            }}
          >
            <Ionicons name="color-palette-outline" size={24} color="#F5F5DC" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.customHeaderButton}
            onPress={saveNote}
            disabled={isSaving}
          >
            {isSaving ? (
              <Ionicons name="hourglass-outline" size={24} color="#F5F5DC" />
            ) : (
              <Ionicons name="save-outline" size={24} color="#F5F5DC" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={getKeyboardVerticalOffset()}
        enabled
      >
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <ScrollView 
            ref={scrollViewRef}
            style={[styles.scrollView, { backgroundColor: currentTheme.background }]}
            contentContainerStyle={[
              styles.scrollViewContent,
              // Reduce extra padding as toolbar is now tied to keyboard
              {
                paddingBottom: Platform.OS === 'android' && keyboardVisible ? 10 : 24
              }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {/* Folder indicator */}
            {currentFolder && (
              <View style={[styles.folderIndicator, { backgroundColor: currentTheme.header + '10' }]}>
                <Text style={[styles.folderIndicatorEmoji]}>{currentFolder.emoji}</Text>
                <Text style={[styles.folderIndicatorText, { color: currentTheme.text }]}>
                  {currentFolder.name}
                </Text>
              </View>
            )}
            
            <View style={[styles.titleContainer, { backgroundColor: currentTheme.editorBackground }]}>
              <TextInput
                ref={titleInputRef}
                style={[
                  styles.titleInput, 
                  { color: currentTheme.text },
                  isEditing && styles.titleInputFocused
                ]}
                value={title}
                onChangeText={handleTitleChange}
                onFocus={handleTitleFocus}
                onBlur={handleTitleBlur}
                placeholder="Note Title"
                placeholderTextColor={`${currentTheme.text}80`}
                selectionColor={currentTheme.header}
                returnKeyType="next"
              />
            </View>
            
            {/* Labels container */}
            {labels.length > 0 && (
              <View style={styles.labelsContainer}>
                <FlatList
                  data={labels}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  renderItem={({ item }) => (
                    <View style={[styles.labelChip, { backgroundColor: currentTheme.header + '20' }]}>
                      <Text style={[styles.labelText, { color: currentTheme.text }]}>{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveLabel(item)}
                        style={styles.removeLabelButton}
                      >
                        <Ionicons name="close-circle" size={16} color={currentTheme.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.labelList}
                />
              </View>
            )}
            
            <View style={[
              styles.editorContainer, 
              { backgroundColor: currentTheme.editorBackground },
              orientation === 'landscape' && styles.editorContainerLandscape
            ]}>
              <TenTapEditor 
                themeId={currentTheme.id as any}
                ref={editorRef}
                onContentChange={handleContentChange}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
      {/* Theme Selection Bottom Sheet */}
      <ThemeBottomSheet 
        visible={themeSheetVisible}
        onClose={() => setThemeSheetVisible(false)}
        onSelectTheme={handleThemeChange}
        currentThemeId={currentTheme.id}
      />
      
      {/* Label Management Bottom Sheet */}
      <LabelBottomSheet
        visible={labelSheetVisible}
        onClose={() => setLabelSheetVisible(false)}
        onAddLabel={handleAddLabel}
        previousLabels={previouslyUsedLabels}
        theme={currentTheme}
      />
      
      {/* Folder Selection Bottom Sheet */}
      <FolderBottomSheet
        visible={folderSheetVisible}
        onClose={() => setFolderSheetVisible(false)}
        onSelectFolder={handleSelectFolder}
        onCreateFolder={handleCreateFolder}
        folders={folders}
        currentFolder={currentFolder}
        theme={currentTheme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    marginLeft: 16,
    padding: 8,
  },
  saveButton: {
    marginRight: 16,
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  enhancedTouchArea: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  editorContainer: {
    flex: 1,
    padding: 0,
    margin: 0,
    borderRadius: 8,
    minHeight: 300,
  },
  editorContainerLandscape: {
    minHeight: 150, // Reduced height for landscape orientation
  },
  // Bottom sheet styles
  bottomSheetContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedThemeOption: {
    backgroundColor: '#F9F9F9',
  },
  themeColorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  titleContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    paddingTop: 20,
    paddingBottom: 18,
  },
  titleInputFocused: {
    borderBottomWidth: 2,
    borderBottomColor: '#0B4619',
  },
  // Floating action button for quick save
  floatingActionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B4619',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },
  // Label styles
  labelsContainer: {
    marginBottom: 12,
  },
  labelList: {
    paddingHorizontal: 8,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    marginRight: 4,
  },
  removeLabelButton: {
    padding: 2,
  },
  labelInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  labelInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    marginRight: 8,
  },
  addLabelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#0B4619',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLabelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  previousLabelsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    color: '#333',
  },
  previousLabelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  previousLabelText: {
    fontSize: 16,
    color: '#333',
  },
  labelSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  // Folder styles
  folderIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 8,
    marginBottom: 12,
  },
  folderIndicatorEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  folderIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedFolderOption: {
    backgroundColor: '#F9F9F9',
  },
  folderEmojiText: {
    fontSize: 20,
    marginRight: 12,
  },
  folderNameText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  folderSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  createFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
  },
  createFolderText: {
    fontSize: 16,
    color: '#0B4619',
    fontWeight: '500',
    marginLeft: 8,
  },
  folderInputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  folderInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
  },
  emojiSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    color: '#333',
  },
  emojiSelector: {
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emojiOption: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    margin: 4,
  },
  selectedEmojiOption: {
    backgroundColor: '#F0F0F0',
  },
  emojiText: {
    fontSize: 22,
  },
  folderActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  folderActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#0B4619',
    marginLeft: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  customHeaderBackButton: {
    padding: 8,
  },
  customHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customHeaderButton: {
    padding: 12,
    marginLeft: 10,
  },
}); 