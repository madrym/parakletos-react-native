import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { FolderModal } from '@/components/note/FolderModal';
import { Id } from '@/convex/_generated/dataModel';

interface Folder {
    _id: Id<"folders">;
    name: string;
    emoji: string;
}

interface Note {
    _id: Id<"notes">;
    title: string;
    content: string;
    folderId?: string;
    updatedAt: number;
}

export default function HomePage() {
    const { user } = useUser();
    const folders = useQuery(api.notes.getFolders, { userId: user?.id || '' });
    const notes = useQuery(api.notes.getNotes, { userId: user?.id || '' });
    const createFolder = useMutation(api.mutations.createFolder);
    const updateFolder = useMutation(api.mutations.updateFolder);
    const deleteFolder = useMutation(api.mutations.deleteFolder);

    const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<Id<"folders"> | undefined>();

    const handleCreateFolder = async (name: string, emoji: string) => {
        if (!user) return;
        try {
            await createFolder({
                name,
                emoji,
                userId: user.id,
            });
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleUpdateFolder = async (id: Id<"folders">, name: string, emoji: string) => {
        try {
            await updateFolder({
                id,
                name,
                emoji,
            });
        } catch (error) {
            console.error('Error updating folder:', error);
        }
    };

    const handleDeleteFolder = async (id: Id<"folders">) => {
        try {
            await deleteFolder({ id });
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    const handleSelectFolder = (id: Id<"folders">) => {
        setSelectedFolderId(id);
        // TODO: Navigate to folder view
    };

    const renderFolder = ({ item }: { item: Folder }) => {
        const folderNotes = notes?.filter(note => note.folderId === item._id) || [];
        
        return (
            <View style={styles.folderContainer}>
                <TouchableOpacity 
                    style={styles.folderHeader}
                    onPress={() => {
                        // TODO: Navigate to folder view
                    }}
                >
                    <View style={styles.folderTitleContainer}>
                        <Text style={styles.folderEmoji}>{item.emoji}</Text>
                        <Text style={styles.folderName}>{item.name}</Text>
                    </View>
                    <Text style={styles.noteCount}>{folderNotes.length} notes</Text>
                </TouchableOpacity>
                
                {folderNotes.length > 0 && (
                    <View style={styles.notesList}>
                        {folderNotes.slice(0, 3).map(note => (
                            <TouchableOpacity
                                key={note._id}
                                style={styles.noteItem}
                                onPress={() => router.push(`/note/${note._id}`)}
                            >
                                <Text style={styles.noteTitle} numberOfLines={1}>
                                    {note.title || 'Untitled Note'}
                                </Text>
                                <Text style={styles.noteDate}>
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {folderNotes.length > 3 && (
                            <TouchableOpacity style={styles.viewMoreButton}>
                                <Text style={styles.viewMoreText}>
                                    View {folderNotes.length - 3} more notes
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderUnorganizedNotes = () => {
        const unorganizedNotes = notes?.filter(note => !note.folderId) || [];
        
        if (unorganizedNotes.length === 0) return null;

        return (
            <View style={styles.folderContainer}>
                <View style={styles.folderHeader}>
                    <View style={styles.folderTitleContainer}>
                        <Text style={styles.folderEmoji}>📝</Text>
                        <Text style={styles.folderName}>Unorganized Notes</Text>
                    </View>
                    <Text style={styles.noteCount}>{unorganizedNotes.length} notes</Text>
                </View>
                
                <View style={styles.notesList}>
                    {unorganizedNotes.slice(0, 3).map(note => (
                        <TouchableOpacity
                            key={note._id}
                            style={styles.noteItem}
                            onPress={() => router.push(`/note/${note._id}`)}
                        >
                            <Text style={styles.noteTitle} numberOfLines={1}>
                                {note.title || 'Untitled Note'}
                            </Text>
                            <Text style={styles.noteDate}>
                                {new Date(note.updatedAt).toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {unorganizedNotes.length > 3 && (
                        <TouchableOpacity style={styles.viewMoreButton}>
                            <Text style={styles.viewMoreText}>
                                View {unorganizedNotes.length - 3} more notes
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#666"
                />
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={styles.newNoteButton}
                    onPress={() => router.push('/note/new')}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#F5F5DC" />
                    <Text style={styles.buttonText}>New Note</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.newFolderButton}
                    onPress={() => setIsFolderModalVisible(true)}
                >
                    <Ionicons name="folder-outline" size={24} color="#0B4619" />
                    <Text style={styles.folderButtonText}>New Folder</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.allNotesButton}
                    onPress={() => router.push('/my-notes')}
                >
                    <Ionicons name="list-outline" size={24} color="#0B4619" />
                    <Text style={styles.folderButtonText}>All Notes</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={folders}
                renderItem={renderFolder}
                keyExtractor={item => item._id}
                ListHeaderComponent={renderUnorganizedNotes}
                contentContainerStyle={styles.contentContainer}
            />

            <FolderModal
                isVisible={isFolderModalVisible}
                onClose={() => setIsFolderModalVisible(false)}
                folders={folders || []}
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
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#0B4619',
    },
    searchInput: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0B4619',
        color: '#0B4619',
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    newNoteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B4619',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    newFolderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0B4619',
        gap: 8,
    },
    allNotesButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0B4619',
        gap: 8,
    },
    buttonText: {
        color: '#F5F5DC',
        fontSize: 16,
        fontWeight: '600',
    },
    folderButtonText: {
        color: '#0B4619',
        fontSize: 16,
        fontWeight: '600',
    },
    contentContainer: {
        padding: 16,
    },
    folderContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#0B4619',
        overflow: 'hidden',
    },
    folderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    folderTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    folderEmoji: {
        fontSize: 24,
        marginRight: 8,
    },
    folderName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0B4619',
    },
    noteCount: {
        fontSize: 14,
        color: '#666',
    },
    notesList: {
        padding: 12,
    },
    noteItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    noteTitle: {
        flex: 1,
        fontSize: 14,
        color: '#0B4619',
        marginRight: 8,
    },
    noteDate: {
        fontSize: 12,
        color: '#666',
    },
    viewMoreButton: {
        paddingTop: 8,
    },
    viewMoreText: {
        color: '#0B4619',
        fontSize: 14,
        textAlign: 'center',
    },
});
