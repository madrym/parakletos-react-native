import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text, TextInput, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmojiSelector from 'react-native-emoji-selector';
import { Id } from '@/convex/_generated/dataModel';

interface Folder {
    _id: Id<"folders">;
    name: string;
    emoji: string;
}

interface FolderModalProps {
    isVisible: boolean;
    onClose: () => void;
    folders: Folder[];
    selectedFolderId?: Id<"folders">;
    onSelectFolder: (folderId: Id<"folders">) => void;
    onCreateFolder: (name: string, emoji: string) => void;
    onUpdateFolder: (id: Id<"folders">, name: string, emoji: string) => void;
    onDeleteFolder: (id: Id<"folders">) => void;
}

export function FolderModal({
    isVisible,
    onClose,
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onUpdateFolder,
    onDeleteFolder,
}: FolderModalProps) {
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('📁');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [isEditingFolder, setIsEditingFolder] = useState<Id<"folders"> | null>(null);
    const [isSelectingEmoji, setIsSelectingEmoji] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [editingEmoji, setEditingEmoji] = useState('');

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim(), selectedEmoji);
            setNewFolderName('');
            setSelectedEmoji('📁');
            setIsCreatingFolder(false);
        }
    };

    const handleStartEdit = (folder: Folder) => {
        setIsEditingFolder(folder._id);
        setEditingName(folder.name);
        setEditingEmoji(folder.emoji);
    };

    const handleSaveEdit = () => {
        if (isEditingFolder && editingName.trim()) {
            onUpdateFolder(isEditingFolder, editingName.trim(), editingEmoji);
            setIsEditingFolder(null);
        }
    };

    const handleDelete = (folder: Folder) => {
        Alert.alert(
            "Delete Folder",
            `Are you sure you want to delete "${folder.name}"? Notes in this folder will be moved to the root level.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => onDeleteFolder(folder._id)
                }
            ]
        );
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Manage Folders</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#0B4619" />
                        </TouchableOpacity>
                    </View>

                    {isSelectingEmoji ? (
                        <View style={styles.emojiSelector}>
                            <View style={styles.emojiHeader}>
                                <TouchableOpacity 
                                    onPress={() => setIsSelectingEmoji(false)}
                                    style={styles.backButton}
                                >
                                    <Ionicons name="arrow-back" size={24} color="#0B4619" />
                                </TouchableOpacity>
                                <Text style={styles.emojiTitle}>Select an Emoji</Text>
                            </View>
                            <EmojiSelector
                                onEmojiSelected={(emoji: string) => {
                                    if (isEditingFolder) {
                                        setEditingEmoji(emoji);
                                    } else {
                                        setSelectedEmoji(emoji);
                                    }
                                    setIsSelectingEmoji(false);
                                }}
                                showSearchBar={false}
                                columns={8}
                            />
                        </View>
                    ) : (
                        <>
                            {isCreatingFolder ? (
                                <View style={styles.createFolderContainer}>
                                    <View style={styles.emojiNameContainer}>
                                        <TouchableOpacity 
                                            style={styles.emojiButton}
                                            onPress={() => setIsSelectingEmoji(true)}
                                        >
                                            <Text style={styles.emoji}>{selectedEmoji}</Text>
                                        </TouchableOpacity>
                                        <TextInput
                                            style={styles.input}
                                            value={newFolderName}
                                            onChangeText={setNewFolderName}
                                            placeholder="Enter folder name"
                                            placeholderTextColor="#666"
                                            autoFocus
                                        />
                                    </View>
                                    <View style={styles.createFolderButtons}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => {
                                                setIsCreatingFolder(false);
                                                setNewFolderName('');
                                                setSelectedEmoji('📁');
                                            }}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.createButton,
                                                !newFolderName.trim() && styles.disabledButton,
                                            ]}
                                            onPress={handleCreateFolder}
                                            disabled={!newFolderName.trim()}
                                        >
                                            <Text style={styles.createButtonText}>Create</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.newFolderButton}
                                    onPress={() => setIsCreatingFolder(true)}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="#0B4619" />
                                    <Text style={styles.newFolderText}>New Folder</Text>
                                </TouchableOpacity>
                            )}

                            <FlatList
                                data={folders}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item }) => (
                                    <View style={styles.folderItemContainer}>
                                        {isEditingFolder === item._id ? (
                                            <View style={styles.editContainer}>
                                                <TouchableOpacity 
                                                    style={styles.emojiButton}
                                                    onPress={() => setIsSelectingEmoji(true)}
                                                >
                                                    <Text style={styles.emoji}>{editingEmoji}</Text>
                                                </TouchableOpacity>
                                                <TextInput
                                                    style={styles.editInput}
                                                    value={editingName}
                                                    onChangeText={setEditingName}
                                                    autoFocus
                                                />
                                                <TouchableOpacity
                                                    style={styles.saveButton}
                                                    onPress={handleSaveEdit}
                                                >
                                                    <Ionicons name="checkmark" size={24} color="#4CAF50" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.cancelEditButton}
                                                    onPress={() => setIsEditingFolder(null)}
                                                >
                                                    <Ionicons name="close" size={24} color="#666" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={[
                                                    styles.folderItem,
                                                    item._id === selectedFolderId && styles.selectedFolder,
                                                ]}
                                                onPress={() => onSelectFolder(item._id)}
                                            >
                                                <Text style={styles.emoji}>{item.emoji}</Text>
                                                <Text style={styles.folderName}>{item.name}</Text>
                                                {item._id === selectedFolderId && (
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={20}
                                                        color="#4CAF50"
                                                        style={styles.checkmark}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        )}
                                        {!isEditingFolder && (
                                            <View style={styles.folderActions}>
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => handleStartEdit(item)}
                                                >
                                                    <Ionicons name="pencil" size={20} color="#0B4619" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => handleDelete(item)}
                                                >
                                                    <Ionicons name="trash" size={20} color="#FF6B6B" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                )}
                            />
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#F5F5DC',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0B4619',
    },
    closeButton: {
        padding: 5,
    },
    emojiSelector: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    emojiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 5,
    },
    emojiTitle: {
        fontSize: 16,
        color: '#0B4619',
        marginLeft: 10,
    },
    newFolderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginBottom: 10,
    },
    newFolderText: {
        marginLeft: 10,
        color: '#0B4619',
        fontSize: 16,
    },
    createFolderContainer: {
        marginBottom: 20,
    },
    emojiNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    emojiButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#0B4619',
    },
    emoji: {
        fontSize: 20,
    },
    input: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 5,
        color: '#0B4619',
    },
    editInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 5,
        color: '#0B4619',
        marginRight: 10,
    },
    createFolderButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    cancelButton: {
        padding: 10,
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#666',
    },
    createButton: {
        backgroundColor: '#0B4619',
        padding: 10,
        borderRadius: 5,
    },
    createButtonText: {
        color: '#F5F5DC',
    },
    disabledButton: {
        opacity: 0.5,
    },
    folderItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    folderItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 5,
    },
    selectedFolder: {
        backgroundColor: 'rgba(11, 70, 25, 0.1)',
    },
    folderName: {
        marginLeft: 10,
        color: '#0B4619',
        fontSize: 16,
        flex: 1,
    },
    checkmark: {
        marginLeft: 10,
    },
    folderActions: {
        flexDirection: 'row',
        paddingRight: 5,
    },
    actionButton: {
        padding: 8,
    },
    editContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    saveButton: {
        padding: 8,
    },
    cancelEditButton: {
        padding: 8,
    },
}); 