import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ScrollView, SafeAreaView, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
              <TouchableOpacity 
                style={{ marginRight: 16 }} 
                onPress={handleSave}
                disabled={isSaving}
              >
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
              {isSaving && (
                <Text style={styles.savingIndicator}>Saving...</Text>
              )}
            </View>
          ),
          headerTitle: 'New Note',
          headerTitleStyle: {
            color: '#F5F5DC',
          },
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
          <LexicalEditor
            setPlainText={setHtmlContent}
            setEditorState={setEditorState}
            initialEditorState={editorState || undefined}
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
  },
  lexicalEditor: {
    flex: 1,
    minHeight: 400,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5F5DC',
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