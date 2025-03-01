import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ScrollView, SafeAreaView, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useUser } from '@clerk/clerk-expo';
import EditorWrapper from '@/components/EditorWrapper';

interface Tag {
  id: string;
  name: string;
}

export default function NotePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const updateNote = useMutation(api.mutations.updateNote);
  const getNote = useQuery(api.notes.getNotes, { userId: user?.id || '' });
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
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [contentChanged, setContentChanged] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Refs to track changes
  const titleRef = useRef(title);
  const tagsRef = useRef(tags);
  const folderRef = useRef(selectedFolderId);
  const htmlContentRef = useRef(htmlContent);

  // Load note data
  useEffect(() => {
    if (user && id && getNote) {
      const note = getNote.find(n => n._id === id);
      if (note) {
        setTitle(note.title);
        titleRef.current = note.title;
        
        console.log('Loading note content:', note.content.substring(0, 100) + '...');
        
        // Check if content is a serialized Lexical editor state (JSON)
        try {
          // Try to parse as JSON first (Lexical state)
          const parsedContent = JSON.parse(note.content);
          // If it parses successfully and has the expected structure, it's a Lexical state
          if (parsedContent && typeof parsedContent === 'object' && parsedContent.root) {
            console.log('Content is a valid Lexical editor state with root node');
            
            // Set the editor state directly
            setEditorState(note.content);
            editorStateRef.current = note.content;
            
            // We still need to set htmlContent for backward compatibility
            setHtmlContent('');
            htmlContentRef.current = '';
          } else {
            console.log('Content is JSON but not a valid Lexical state, treating as HTML');
            setHtmlContent(JSON.stringify(parsedContent));
            htmlContentRef.current = JSON.stringify(parsedContent);
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          console.log('Content is not JSON:', errorMessage);
          // Not JSON, handle as before
          if (note.content.startsWith('<')) {
            // Content is HTML
            console.log('Content is HTML');
            setHtmlContent(note.content);
            htmlContentRef.current = note.content;
          } else {
            // Plain text content, convert to HTML
            console.log('Content is plain text');
            const htmlContent = `<p>${note.content.replace(/\n/g, '<br>')}</p>`;
            setHtmlContent(htmlContent);
            htmlContentRef.current = htmlContent;
          }
        }
        
        const noteTags = note.tags.map(tag => ({ id: tag, name: tag }));
        setTags(noteTags);
        tagsRef.current = noteTags;
        
        setSelectedFolderId(note.folderId as Id<"folders">);
        folderRef.current = note.folderId as Id<"folders">;
        
        // Mark as loaded after all state is set
        setInitialLoadComplete(true);
      }
    }
  }, [user, id, getNote]);

  // Create a ref for the editor state to avoid re-renders
  const editorStateRef = useRef(editorState);
  
  // Update the ref when editorState changes
  useEffect(() => {
    if (editorState) {
      console.log('NotePage: editorState updated in state, length:', editorState.length);
      editorStateRef.current = editorState;
    }
  }, [editorState]);
  
  // Add a state to force re-renders of the editor only when the note ID changes
  // We don't need to include Date.now() as that causes unnecessary remounts
  const [editorKey, setEditorKey] = useState(() => `editor-${id || 'new'}`);
  
  // Force a re-render of the editor only when the note ID changes
  useEffect(() => {
    if (id) {
      console.log('Note ID changed, updating editorKey');
      // Use a short timeout to ensure all state is set before re-rendering the editor
      setTimeout(() => {
        setEditorKey(`editor-${id}`);
      }, 50);
    }
  }, [id]);

  // Handle editor state changes without causing re-renders
  const handleEditorStateChange = React.useCallback((newEditorState: string | null) => {
    if (!newEditorState) return;
    
    // Update the ref first
    editorStateRef.current = newEditorState;
    
    // Only mark as changed if not during initial load
    if (initialLoadComplete) {
      console.log('NotePage: Editor state changed by user');
      setContentChanged(true);
    } else {
      console.log('NotePage: Editor state initialized during load');
    }
  }, [initialLoadComplete]);

  // Handle plain text changes
  const handlePlainTextChange = React.useCallback((text: string) => {
    htmlContentRef.current = text;
    setContentChanged(true);
  }, []);

  const handleSave = async () => {
    if (!user || !id || !contentChanged) return;
    
    setIsSaving(true);
    try {
      // If we have a serialized editor state, save that instead of HTML
      const contentToSave = editorStateRef.current || htmlContentRef.current;
      
      console.log('Saving content type:', editorStateRef.current ? 'Editor State' : 'HTML');
      if (editorStateRef.current) {
        console.log('Editor state preview:', editorStateRef.current.substring(0, 100) + '...');
      }
      
      await updateNote({
        id: id as Id<"notes">,
        title: titleRef.current,
        content: contentToSave,
        folderId: folderRef.current,
        tags: tagsRef.current.map(tag => tag.name),
      });
      
      setContentChanged(false);
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update title with ref to avoid re-renders
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;
    setContentChanged(true);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const updatedTags = [...tags, { id: Date.now().toString(), name: newTag.trim() }];
      setTags(updatedTags);
      tagsRef.current = updatedTags;
      setNewTag('');
      setIsTagModalVisible(false);
      setContentChanged(true);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    setTags(updatedTags);
    tagsRef.current = updatedTags;
    setContentChanged(true);
  };

  const handleFolderSelect = (folderId: Id<"folders">) => {
    setSelectedFolderId(folderId);
    folderRef.current = folderId;
    setIsFolderModalVisible(false);
    setContentChanged(true);
  };

  const handleInsertLink = () => {
    // The Lexical editor will need to handle link insertion differently
    setLinkUrl('');
    setLinkText('');
    setIsLinkModalVisible(false);
  };

  // Auto-save on content change - with debounce to prevent frequent saves
  useEffect(() => {
    if (!contentChanged) return;
    
    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000); // Increased to 2 seconds to reduce save frequency

    return () => clearTimeout(timeoutId);
  }, [contentChanged]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 16, padding: 8 }} 
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#F5F5DC" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <TouchableOpacity style={{ marginRight: 16 }}>
                <Ionicons name="share-outline" size={24} color="#F5F5DC" />
              </TouchableOpacity>
              {isSaving && (
                <Text style={styles.savingIndicator}>Saving...</Text>
              )}
            </View>
          ),
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#0B4619',
          },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.content}>
        <View style={styles.headerSection}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Note Title"
            placeholderTextColor="#666"
          />
          
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionLabel}>Tags:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
              {tags.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.tag}
                  onPress={() => handleRemoveTag(tag.id)}
                >
                  <Text style={styles.tagText}>{tag.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={() => setIsTagModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#0B4619" />
              </TouchableOpacity>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.folderButton}
            onPress={() => setIsFolderModalVisible(true)}
          >
            <Ionicons name="folder-outline" size={20} color="#0B4619" />
            <Text style={styles.folderButtonText}>
              {getFolders?.find(f => f._id === selectedFolderId)?.name || 'Select Folder'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.editorContainer}>
          <EditorWrapper
            key={editorKey}
            initialState={editorState || undefined}
            onContentChange={handlePlainTextChange}
            onStateChange={handleEditorStateChange}
          />
        </View>
      </SafeAreaView>

      {/* Tag Modal */}
      <Modal
        visible={isTagModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTagModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Tag</Text>
            <TextInput
              style={styles.modalInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Enter tag name"
              onSubmitEditing={handleAddTag}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsTagModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddTag}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Folder Modal */}
      <Modal
        visible={isFolderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFolderModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Folder</Text>
            <ScrollView>
              {getFolders?.map(folder => (
                <TouchableOpacity
                  key={folder._id}
                  style={styles.folderItem}
                  onPress={() => handleFolderSelect(folder._id as Id<"folders">)}
                >
                  <Text style={styles.folderItemText}>{folder.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsFolderModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Link Modal */}
      <Modal
        visible={isLinkModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLinkModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Insert Link</Text>
            <TextInput
              style={styles.modalInput}
              value={linkText}
              onChangeText={setLinkText}
              placeholder="Link text"
            />
            <TextInput
              style={styles.modalInput}
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="URL (https://...)"
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsLinkModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleInsertLink}
              >
                <Text style={styles.modalButtonText}>Insert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  content: {
    flex: 1,
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
  },
  sectionLabel: {
    fontSize: 16,
    color: '#0B4619',
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagScroll: {
    flex: 1,
  },
  tag: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#0B4619',
  },
  tagText: {
    color: '#0B4619',
    fontSize: 14,
  },
  addTagButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0B4619',
  },
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#0B4619',
  },
  folderButtonText: {
    color: '#0B4619',
    marginLeft: 8,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#0B4619',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  editorContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F5F5DC',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B4619',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0B4619',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#cccccc',
  },
  addButton: {
    backgroundColor: '#0B4619',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  folderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  folderItemText: {
    fontSize: 16,
    color: '#0B4619',
  },
  savingIndicator: {
    color: '#F5F5DC',
    fontSize: 14,
  }
});
