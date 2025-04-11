import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  Platform, 
  Modal, 
  KeyboardAvoidingView,
  StatusBar
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useUser } from '@clerk/clerk-expo';
import LexicalEditor from '@/components/dom-components/LexicalEditor';

interface Tag {
  id: string;
  name: string;
}

export default function NewNotePage() {
  const { user } = useUser();
  const createNote = useMutation(api.mutations.createNote);
  const getFolders = useQuery(api.notes.getFolders, { userId: user?.id || '' });
  
  // State declarations
  const [title, setTitle] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [editorState, setEditorState] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<Id<"folders"> | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [contentChanged, setContentChanged] = useState(false);
  const [shouldAutoSave, setShouldAutoSave] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Refs to track changes
  const titleRef = useRef(title);
  const tagsRef = useRef(tags);
  const folderRef = useRef(selectedFolderId);
  const htmlContentRef = useRef(htmlContent);
  const editorStateRef = useRef(editorState);

  // Handle editor changes
  const handleEditorChange = (html: string) => {
    htmlContentRef.current = html;
    setContentChanged(true);
    if (html.trim()) {
      setHasContent(true);
    }
  };

  // Add effect to track htmlContent changes
  useEffect(() => {
    if (htmlContent) {
      htmlContentRef.current = htmlContent;
      setContentChanged(true);
      setHasContent(true);
    }
  }, [htmlContent]);

  // Update editor state ref when it changes
  useEffect(() => {
    if (editorState) {
      editorStateRef.current = editorState;
      // Check if the editor state contains actual content (not just an empty paragraph)
      try {
        const parsedState = JSON.parse(editorState);
        const hasTextContent = parsedState?.root?.children?.some((child: any) => 
          child.children?.some((textNode: any) => textNode.text && textNode.text.trim().length > 0)
        );
        if (hasTextContent) {
          setHasContent(true);
        }
      } catch (error) {
        console.error('Error parsing editor state:', error);
      }
    }
  }, [editorState]);

  const handleSave = async () => {
    if (!user) return;
    
    // Only save if there's a title or content
    if (!titleRef.current.trim() && !hasContent) {
      console.log('Not saving empty note');
      return;
    }
    
    setIsSaving(true);
    try {
      // If we have a serialized editor state, save that instead of HTML
      const contentToSave = editorStateRef.current || htmlContentRef.current;
      
      const newNoteId = await createNote({
        title: titleRef.current,
        content: contentToSave,
        folderId: folderRef.current,
        tags: tagsRef.current.map(tag => tag.name),
        userId: user.id
      });
      
      setContentChanged(false);
      setShouldAutoSave(false);
      router.replace(`/note/${newNoteId}`);
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
      setIsSaving(false);
    }
  };

  // Update title with ref to avoid re-renders
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;
    setContentChanged(true);
    if (newTitle.trim()) {
      setShouldAutoSave(true);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const updatedTags = [...tags, { id: Date.now().toString(), name: newTag.trim() }];
      setTags(updatedTags);
      tagsRef.current = updatedTags;
      setNewTag('');
      setIsTagModalVisible(false);
      setContentChanged(true);
      setShouldAutoSave(true);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    setTags(updatedTags);
    tagsRef.current = updatedTags;
    setContentChanged(true);
    setShouldAutoSave(true);
  };

  const handleFolderSelect = (folderId: Id<"folders">) => {
    setSelectedFolderId(folderId);
    folderRef.current = folderId;
    setIsFolderModalVisible(false);
    setContentChanged(true);
    setShouldAutoSave(true);
  };

  // Auto-save handler with debounce
  useEffect(() => {
    if (!contentChanged || !shouldAutoSave) return;
    
    // Only save if we have a title or content
    if (!titleRef.current.trim() && !hasContent) return;
    
    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000); // 2 seconds debounce to reduce save frequency

    return () => clearTimeout(timeoutId);
  }, [contentChanged, shouldAutoSave, hasContent]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton} 
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#F5F5DC" />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Note</Text>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.headerSection}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={handleTitleChange}
              placeholder="Note Title"
              placeholderTextColor="#999"
              selectionColor="#0B4619"
            />
            
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.folderButton}
                onPress={() => setIsFolderModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.folderIconContainer}>
                  <Ionicons name="folder-outline" size={20} color="#0B4619" />
                </View>
                <Text style={styles.folderButtonText}>
                  {getFolders?.find(f => f._id === selectedFolderId)?.name || 'Select Folder'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tagButton}
                onPress={() => setIsTagModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.tagIconContainer}>
                  <Ionicons name="pricetag-outline" size={20} color="#0B4619" />
                </View>
                <Text style={styles.tagButtonText}>
                  Add Tags
                </Text>
              </TouchableOpacity>
            </View>
            
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
                  {tags.map(tag => (
                    <TouchableOpacity
                      key={tag.id}
                      style={styles.tag}
                      onPress={() => handleRemoveTag(tag.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tagText}>{tag.name}</Text>
                      <View style={styles.removeTagButton}>
                        <Ionicons name="close" size={14} color="#0B4619" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.editorContainer}>
            <LexicalEditor
              setPlainText={setHtmlContent}
              setEditorState={setEditorState}
              initialEditorState={editorState || undefined}
            />
          </View>
        </View>

        {/* Tag Modal */}
        <Modal
          visible={isTagModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsTagModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Tag</Text>
              <View style={styles.modalInputContainer}>
                <Ionicons name="pricetag-outline" size={20} color="#999" style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Enter tag name"
                  placeholderTextColor="#999"
                  onSubmitEditing={handleAddTag}
                  autoFocus
                  selectionColor="#0B4619"
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsTagModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={handleAddTag}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Folder Modal */}
        <Modal
          visible={isFolderModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsFolderModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Folder</Text>
              <ScrollView style={styles.folderList}>
                {getFolders?.map(folder => (
                  <TouchableOpacity
                    key={folder._id}
                    style={styles.folderItem}
                    onPress={() => handleFolderSelect(folder._id as Id<"folders">)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.folderItemIconContainer}>
                      <Ionicons name="folder" size={20} color="#0B4619" />
                    </View>
                    <Text style={styles.folderItemText}>{folder.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setIsFolderModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B4619',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0B4619',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backText: {
    color: '#F5F5DC',
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5DC',
    letterSpacing: 0.3,
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  saveButtonText: {
    color: '#F5F5DC',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  headerSection: {
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B4619',
    marginBottom: 16,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11, 70, 25, 0.1)',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  folderIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 70, 25, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  folderButtonText: {
    color: '#0B4619',
    fontSize: 14,
    fontWeight: '500',
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 70, 25, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tagButtonText: {
    color: '#0B4619',
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagScroll: {
    flex: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 70, 25, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagText: {
    color: '#0B4619',
    fontSize: 14,
    marginRight: 6,
  },
  removeTagButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(11, 70, 25, 0.1)',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  editorContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F5F5DC',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B4619',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 20,
  },
  modalInputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#EEEEEE',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0B4619',
  },
  addButtonText: {
    color: '#F5F5DC',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#0B4619',
    marginTop: 16,
    alignSelf: 'center',
    width: '100%',
  },
  closeButtonText: {
    color: '#F5F5DC',
    fontSize: 16,
    fontWeight: '600',
  },
  folderList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  folderItemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11, 70, 25, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderItemText: {
    fontSize: 16,
    color: '#0B4619',
    fontWeight: '500',
  },
}); 