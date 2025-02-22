import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet, Modal, TouchableOpacity, Text, ScrollView, SafeAreaView, Keyboard, Platform, NativeSyntheticEvent, TextInputKeyPressEventData, Alert, Image } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useUser } from '@clerk/clerk-expo';
import { getVersesFromDB } from '@/app/utils/bible';
import { NoteHeader } from '@/components/note/NoteHeader';
import { BibleSuggestionBox } from '@/components/note/BibleSuggestionBox';
import { MarkdownHelpPanel } from '@/components/note/MarkdownHelpPanel';
import { TagModal } from '@/components/note/TagModal';
import { BibleModal } from '@/components/note/BibleModal';
import { FolderModal } from '@/components/note/FolderModal';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { Card, IconButton, Surface } from 'react-native-paper';
import { BibleVerseCard } from '@/components/note/BibleVerseCard';

declare global {
    interface Window {
        ReactNativeWebView: {
            postMessage: (message: string) => void;
        };
    }
}

interface BibleVerse {
    verse: number;
    text: string;
}

interface Tag {
    id: string;
    name: string;
}

interface Folder {
    _id: string;
    name: string;
}

interface Note {
    _id: string;
    title: string;
    content: string;
    folderId?: Id<"folders">;
    updatedAt: number;
}

export default function NotePage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useUser();
    const createNote = useMutation(api.mutations.createNote);
    const updateNote = useMutation(api.mutations.updateNote);
    const createFolder = useMutation(api.mutations.createFolder);
    const getNote = useQuery(api.notes.getNotes, { userId: user?.id || '' });
    const getFolders = useQuery(api.notes.getFolders, { userId: user?.id || '' });
    const updateFolder = useMutation(api.mutations.updateFolder);
    const deleteFolder = useMutation(api.mutations.deleteFolder);

    // State declarations
    const [isDBInitialized, setIsDBInitialized] = useState(false);
    const [bibleVerses, setBibleVerses] = useState<{ reference: string; text: string; verses: any[] }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [noteId, setNoteId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<Id<"folders"> | undefined>();
    const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
    const [isTagModalVisible, setIsTagModalVisible] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [isBibleModalVisible, setIsBibleModalVisible] = useState(false);
    const [bibleReference, setBibleReference] = useState('');
    const [suggestionBox, setSuggestionBox] = useState({
        visible: false,
        reference: '',
        verses: [] as any[]
    });
    const [editingVerseRef, setEditingVerseRef] = useState<string | null>(null);

    // Refs
    const lastProcessedReference = React.useRef('');
    const richText = useRef<RichEditor>(null);

    // Load note data first
    useEffect(() => {
        if (user && id && getNote && !noteId) {
            const note = getNote.find(n => n._id === id);
            if (note) {
                setNoteId(note._id);
                setTitle(note.title);
                setContent(note.content);
                setTags(note.tags.map(tag => ({ id: tag, name: tag })));
                setSelectedFolderId(note.folderId as Id<"folders">);
            }
        }
    }, [user, id, getNote, noteId]);

    // Load content into editor after initialization
    useEffect(() => {
        if (richText.current && content && !isDBInitialized) {
            richText.current.setContentHTML(content);
            setIsDBInitialized(true);
        }
    }, [content, isDBInitialized]);

    // Manual save function
    const handleSave = React.useCallback(async () => {
        if (!user || !id || !richText.current) return;
        
        setIsSaving(true);
        setSaveError(null);
        try {
            const content = await richText.current.getContentHtml();
            await updateNote({
                id: id as Id<"notes">,
                title,
                content,
                folderId: selectedFolderId,
                tags: tags.map(tag => tag.name),
            });
            setSaveError(null);
        } catch (error) {
            console.error('Error saving:', error);
            setSaveError('Failed to save changes. Click to retry.');
            Alert.alert('Error', 'Failed to save note. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }, [user, id, title, selectedFolderId, tags, updateNote]);

    // Handlers
    const handleCreateFolder = async (name: string) => {
        if (!user) return;
        try {
            await createFolder({
                name,
                emoji: "📁",
                userId: user.id,
            });
        } catch (error) {
            console.error('Error creating folder:', error);
            Alert.alert('Error', 'Failed to create folder. Please try again.');
        }
    };

    const handleSelectFolder = async (folderId: Id<"folders">) => {
        setSelectedFolderId(folderId);
    };

    const handleAddTag = () => {
        if (newTag.trim()) {
            setTags([...tags, { id: Date.now().toString(), name: newTag.trim() }]);
            setNewTag('');
            setIsTagModalVisible(false);
        }
    };

    const handleRemoveTag = (tagId: string) => {
        setTags(tags.filter(tag => tag.id !== tagId));
    };

    const handleUpdateFolder = async (id: Id<"folders">, name: string, emoji: string) => {
        try {
            await updateFolder({ id, name, emoji });
        } catch (error) {
            console.error('Error updating folder:', error);
            Alert.alert('Error', 'Failed to update folder. Please try again.');
        }
    };

    const handleDeleteFolder = async (id: Id<"folders">) => {
        try {
            await deleteFolder({ id });
        } catch (error) {
            console.error('Error deleting folder:', error);
            Alert.alert('Error', 'Failed to delete folder. Please try again.');
        }
    };

    const handleBack = () => {
        console.log('Back pressed');
        try {
            router.back();
        } catch (error) {
            console.error('Navigation error:', error);
            try {
                router.back();
            } catch (e) {
                console.error('Second navigation error:', e);
                router.back();
            }
        }
    };

    const handleShare = () => {
        console.log('Share pressed');
    };

    const handleTagInputKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key === 'Enter' && newTag.trim()) {
            handleAddTag();
        } else if (e.nativeEvent.key === 'Escape') {
            setIsTagModalVisible(false);
        }
    };

    const toSuperscript = (num: number): string => {
        const superscriptMap = '⁰¹²³⁴⁵⁶⁷⁸⁹';
        return num.toString().split('').map(d => superscriptMap[parseInt(d)]).join('');
    };

    const createVerseBlock = (reference: string, verses: BibleVerse[]) => {
        const verseBlockId = `verse-${Date.now()}`;
        
        return `
            <div id="${verseBlockId}" class="bible-verse-block" contenteditable="false" data-reference="${reference.trim()}" data-expanded="true">
                <div class="verse-card">
                    <div class="verse-header">
                        <div class="verse-title" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'toggle-verse',
                            id: 'toggle-verse-${Date.now()}',
                            data: { reference: '${reference.trim()}' }
                        }))">${reference.trim()}</div>
                        <div class="verse-actions">
                            <button class="icon-button edit-button" onclick="(function(e) { 
                                e.stopPropagation(); 
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'edit-verse',
                                    id: 'edit-verse-${Date.now()}',
                                    data: { reference: '${reference.trim()}' }
                                }));
                            })(event)">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="icon-button delete-button" onclick="(function(e) { 
                                e.stopPropagation(); 
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'delete-verse',
                                    id: 'delete-verse-${Date.now()}',
                                    data: { reference: '${reference.trim()}' }
                                }));
                            })(event)">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="verse-content">
                        <p class="verse-paragraph">
                            ${verses.map(verse => `<span class="verse-text"><span class="verse-number">${verse.verse}</span>${verse.text}</span>`).join(' ')}
                        </p>
                    </div>
                </div>
            </div>
            <p><br></p>
        `.trim();
    };

    const cssText = `
        html {
            height: 100%;
            background-color: #F5F5DC;
        }
        
        body {
            min-height: 100%;
            margin: 0;
            padding: 8px;
            background-color: #F5F5DC;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        #editor {
            min-height: 100vh;
            padding-bottom: 100px;
        }

        p {
            min-height: 1em;
        }

        .bible-verse-block {
            margin: 8px 0;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            max-width: 100%;
            position: relative;
        }

        .verse-card {
            padding: 0;
            position: relative;
        }

        .verse-header {
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #ffffff;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 1;
        }

        .verse-title {
            font-size: 16px;
            font-weight: 500;
            color: #0B4619;
            cursor: pointer;
            flex: 1;
            padding: 4px 0;
            user-select: none;
            -webkit-user-select: none;
        }

        .verse-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            z-index: 2;
        }

        .icon-button {
            background: none;
            border: none;
            padding: 8px;
            margin: 0;
            cursor: pointer;
            opacity: 0.8;
            border-radius: 20px;
            color: #0B4619;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 32px;
            min-height: 32px;
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
        }

        .icon-button:active {
            opacity: 1;
            background-color: rgba(11, 70, 25, 0.08);
        }

        .delete-button:active {
            color: #dc3545;
            background-color: rgba(220, 53, 69, 0.08);
        }

        .verse-content {
            padding: 16px;
            background-color: #ffffff;
            overflow-x: hidden;
            overflow-y: auto;
            max-height: 300px;
            -webkit-overflow-scrolling: touch;
        }

        .verse-paragraph {
            font-size: 16px;
            line-height: 1.6;
            color: #0B4619;
            margin: 0;
            padding: 0;
            text-align: justify;
            overflow-wrap: break-word;
            word-wrap: break-word;
            hyphens: auto;
        }

        .verse-text {
            display: inline;
            margin-right: 4px;
        }

        .verse-number {
            font-size: 10px;
            line-height: 1;
            color: #0B4619;
            opacity: 0.7;
            margin-right: 2px;
            vertical-align: super;
            user-select: none;
            -webkit-user-select: none;
        }

        .bible-verse-block[data-expanded="false"] .verse-content {
            display: none;
        }

        /* Ensure proper scrolling behavior */
        * {
            -webkit-overflow-scrolling: touch;
        }

        /* Prevent text selection in non-editable areas */
        [contenteditable="false"] {
            user-select: none;
            -webkit-user-select: none;
        }
    `;

    const handleInsertVerse = async (reference?: string) => {
        const verseToFetch = reference || bibleReference;
        if (!verseToFetch.trim() || !richText.current) return;
        
        try {
            const result = await getVersesFromDB(verseToFetch);
            if (result.verses.length > 0) {
                const verseBlock = createVerseBlock(result.formattedReference, result.verses);
                richText.current.insertHTML(verseBlock);
                
                if (editingVerseRef) {
                    richText.current.getContentHtml().then(content => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = content;
                        const oldVerseBlock = tempDiv.querySelector(`[data-reference="${editingVerseRef}"]`);
                        if (oldVerseBlock) {
                            oldVerseBlock.remove();
                            richText.current?.setContentHTML(tempDiv.innerHTML);
                        }
                    });
                    setEditingVerseRef(null);
                }
                
                setSuggestionBox(prev => ({ ...prev, visible: false }));
                lastProcessedReference.current = '';
                setBibleReference('');
                setIsBibleModalVisible(false);

                setTimeout(() => {
                    const webview = richText.current as any;
                    webview?.focusContentEditor();
                }, 100);
            }
        } catch (error) {
            console.error('Error inserting verse:', error);
        }
    };

    const checkForBibleReference = async (content: string) => {
        // Match patterns like:
        // Gen 1, Genesis 1, Gen 1:1, Gen 1:1-5
        const bibleRefRegex = /\b([1-3]?\s*[A-Za-z]+)\s*(\d+)(?::(\d+)(?:-(\d+))?)?\b/g;
        const matches = content.match(bibleRefRegex);

        if (!matches) {
            setSuggestionBox(prev => ({ ...prev, visible: false }));
            lastProcessedReference.current = '';
            return;
        }

        const lastMatch = matches[matches.length - 1];
        const lastMatchIndex = content.lastIndexOf(lastMatch);
        
        // Hide suggestion if there's significant content after the reference
        const contentAfterMatch = content.slice(lastMatchIndex + lastMatch.length);
        const hasNewContent = contentAfterMatch.length > 20 || contentAfterMatch.includes('\n');

        if (hasNewContent) {
            setSuggestionBox(prev => ({ ...prev, visible: false }));
            lastProcessedReference.current = '';
            return;
        }

        // Don't re-fetch if we're already showing this reference
        if (lastMatch === lastProcessedReference.current) {
            return;
        }

        try {
            const result = await getVersesFromDB(lastMatch);
            if (result.verses.length > 0) {
                lastProcessedReference.current = lastMatch;
                setSuggestionBox({
                    visible: true,
                    reference: result.formattedReference,
                    verses: result.verses
                });
            } else {
                setSuggestionBox(prev => ({ ...prev, visible: false }));
                lastProcessedReference.current = lastMatch;
            }
        } catch (error) {
            console.error('Error fetching verse suggestion:', error);
            setSuggestionBox(prev => ({ ...prev, visible: false }));
            lastProcessedReference.current = lastMatch;
        }
    };

    // Remove the old click handler effect
    useEffect(() => {
        if (!richText.current) return;
        
        // Inject custom script to handle verse block interactions
        richText.current.injectJavascript(`
            document.addEventListener('click', function(event) {
                const target = event.target;
                const verseBlock = target.closest('.bible-verse-block');
                
                if (!verseBlock) return;

                // Handle verse header click for collapse/expand
                if (target.closest('.verse-header') && !target.closest('button')) {
                    event.preventDefault();
                    event.stopPropagation();
                    const isExpanded = verseBlock.getAttribute('data-expanded') === 'true';
                    verseBlock.setAttribute('data-expanded', !isExpanded);
                    verseBlock.classList.toggle('collapsed', !isExpanded);
                }
            });
            true;
        `);
    }, [richText.current]);

    const handleBibleSearch = async () => {
        if (!richText.current) return;
        
        try {
            const content = await richText.current.getContentHtml();
            checkForBibleReference(content);
        } catch (error) {
            console.error('Error checking for Bible references:', error);
        }
    };

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        // Trigger save when title changes
        handleSave();
    };

    const handleMessage = (message: { type: string; id: string; data?: any }) => {
        try {
            if (message.type === 'edit-verse' && message.data?.reference) {
                setEditingVerseRef(message.data.reference);
                setBibleReference(message.data.reference);
                setIsBibleModalVisible(true);
            } else if (message.type === 'delete-verse' && message.data?.reference) {
                richText.current?.getContentHtml()
                    .then((html: string) => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        const block = tempDiv.querySelector(`[data-reference="${message.data.reference}"]`);
                        if (block) {
                            block.remove();
                            richText.current?.setContentHTML(tempDiv.innerHTML);
                            handleSave(); // Save after deletion
                        }
                    });
            } else if (message.type === 'toggle-verse' && message.data?.reference) {
                richText.current?.getContentHtml()
                    .then((html: string) => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        const block = tempDiv.querySelector(`[data-reference="${message.data.reference}"]`);
                        if (block) {
                            const isExpanded = block.getAttribute('data-expanded') === 'true';
                            block.setAttribute('data-expanded', (!isExpanded).toString());
                            richText.current?.setContentHTML(tempDiv.innerHTML);
                            handleSave(); // Save after toggling
                        }
                    });
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerLeft: () => (
                        <TouchableOpacity 
                            onPress={handleBack}
                            style={{ marginLeft: 16, padding: 8 }} 
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="#F5F5DC" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                            <TouchableOpacity 
                                onPress={handleBibleSearch}
                                style={{ marginRight: 16 }}
                            >
                                <Ionicons name="search" size={24} color="#F5F5DC" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setIsHelpVisible(true)}
                                style={{ marginRight: 16 }}
                            >
                                <Ionicons name="help-circle-outline" size={24} color="#F5F5DC" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleShare}>
                                <Ionicons name="share-outline" size={24} color="#F5F5DC" />
                            </TouchableOpacity>
                        </View>
                    ),
                    headerTitle: '',
                    headerStyle: {
                        backgroundColor: '#0B4619',
                    },
                    headerShadowVisible: false,
                    contentStyle: {
                        backgroundColor: '#F5F5DC',
                    },
                }}
            />

            <NoteHeader
                title={title}
                setTitle={handleTitleChange}
                tags={tags}
                folder={getFolders?.find(f => f._id === selectedFolderId)?.name || 'Select Folder'}
                onAddTag={() => setIsTagModalVisible(true)}
                onRemoveTag={handleRemoveTag}
                isSaved={!isSaving}
                isAutoSaving={false}
                onSave={handleSave}
                saveError={saveError}
                onFolderPress={() => setIsFolderModalVisible(true)}
            />

            <SafeAreaView style={styles.fullScreen}>
                <View style={styles.editorContainer}>
                    <RichEditor
                        ref={richText}
                        style={styles.richText}
                        placeholder="Start writing..."
                        initialContentHTML={content}
                        editorInitializedCallback={() => {
                            setIsDBInitialized(true);
                        }}
                        onChange={handleSave}
                        onMessage={handleMessage}
                        scrollEnabled={true}
                        useContainer={true}
                        containerStyle={styles.editorScrollContainer}
                        editorStyle={{
                            backgroundColor: '#F5F5DC',
                            color: '#0B4619',
                            placeholderColor: '#999',
                            cssText: cssText,
                            contentCSSText: cssText,
                            initialCSSText: cssText,
                        }}
                    />
                    {suggestionBox.visible && (
                        <BibleSuggestionBox
                            reference={suggestionBox.reference}
                            verses={suggestionBox.verses}
                            onInsert={(ref) => {
                                handleInsertVerse(ref);
                                setSuggestionBox(prev => ({ ...prev, visible: false }));
                            }}
                        />
                    )}
                </View>
                <RichToolbar
                    editor={richText}
                    style={styles.toolbar}
                    iconTint="#0B4619"
                    selectedIconTint="#0B4619"
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.heading1,
                        actions.heading2,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.insertLink,
                        actions.keyboard,
                        actions.setStrikethrough,
                        'insertBible',
                    ]}
                    iconMap={{
                        insertBible: ({ tintColor }: { tintColor: string }) => (
                            <TouchableOpacity onPress={() => setIsBibleModalVisible(true)}>
                                <Image 
                                    source={require('../../assets/images/bible.png')} 
                                    style={{ width: 20, height: 20, tintColor }}
                                />
                            </TouchableOpacity>
                        ),
                    }}
                />
            </SafeAreaView>

            <TagModal
                isVisible={isTagModalVisible}
                onClose={() => setIsTagModalVisible(false)}
                onAdd={handleAddTag}
                value={newTag}
                onChangeText={setNewTag}
                onKeyPress={handleTagInputKeyPress}
            />

            <MarkdownHelpPanel 
                isVisible={isHelpVisible}
                onClose={() => setIsHelpVisible(false)}
            />

            <BibleModal
                isVisible={isBibleModalVisible}
                onClose={() => setIsBibleModalVisible(false)}
                onInsert={() => handleInsertVerse(bibleReference)}
                value={bibleReference}
                onChangeText={setBibleReference}
            />

            <FolderModal
                isVisible={isFolderModalVisible}
                onClose={() => setIsFolderModalVisible(false)}
                folders={getFolders || []}
                selectedFolderId={selectedFolderId}
                onSelectFolder={handleSelectFolder}
                onCreateFolder={handleCreateFolder}
                onUpdateFolder={handleUpdateFolder}
                onDeleteFolder={handleDeleteFolder}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5DC',
    },
    fullScreen: {
        flex: 1,
        borderTopWidth: 1,
        borderColor: '#0B4619',
        backgroundColor: '#F5F5DC',
        marginTop: 8,
        paddingLeft: 16,
        paddingRight: 16,
    },
    editorContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#F5F5DC',
    },
    editorScrollContainer: {
        flex: 1,
    },
    richText: {
        flex: 1,
        backgroundColor: '#F5F5DC',
    },
    toolbar: {
        minHeight: 50,
        backgroundColor: '#F5F5DC',
        borderTopWidth: 1,
        borderTopColor: '#0B4619',
    },
});
