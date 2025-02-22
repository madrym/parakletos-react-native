import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Tag {
    id: string;
    name: string;
}

interface NoteHeaderProps {
    title: string;
    setTitle: (title: string) => void;
    tags: Tag[];
    folder: string;
    onAddTag: () => void;
    onRemoveTag: (tagId: string) => void;
    isSaved: boolean;
    isAutoSaving: boolean;
    onSave: () => void;
    saveError: string | null;
    onFolderPress: () => void;
}

export function NoteHeader({ 
    title, 
    setTitle, 
    tags, 
    folder, 
    onAddTag, 
    onRemoveTag,
    isSaved,
    isAutoSaving,
    onSave,
    saveError,
    onFolderPress
}: NoteHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <TextInput
                    style={styles.titleInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Untitled Note"
                    placeholderTextColor="#0B4619"
                />
                <TouchableOpacity 
                    onPress={onSave}
                    style={styles.saveButton}
                >
                    <Ionicons 
                        name={saveError ? "alert-circle" : (isSaved ? "checkmark-circle" : "save-outline")} 
                        size={24} 
                        color={saveError ? "#FF6B6B" : (isSaved ? "#4CAF50" : "#0B4619")} 
                    />
                    {isAutoSaving && (
                        <Text style={styles.savingText}>Saving...</Text>
                    )}
                    {saveError && (
                        <Text style={styles.errorText}>{saveError}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.metaContainer}>
                <TouchableOpacity 
                    style={styles.folderButton}
                    onPress={onFolderPress}
                >
                    <Ionicons name="folder-outline" size={20} color="#0B4619" />
                    <Text style={styles.folderText}>{folder}</Text>
                    <Ionicons name="chevron-down" size={16} color="#0B4619" style={styles.folderIcon} />
                </TouchableOpacity>

                <View style={styles.tagsContainer}>
                    {tags.map((tag) => (
                        <View key={tag.id} style={styles.tag}>
                            <Text style={styles.tagText}>{tag.name}</Text>
                            <TouchableOpacity
                                onPress={() => onRemoveTag(tag.id)}
                                style={styles.removeTag}
                            >
                                <Ionicons name="close-circle" size={16} color="#0B4619" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity onPress={onAddTag} style={styles.addTagButton}>
                        <Ionicons name="add-circle-outline" size={20} color="#0B4619" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#F5F5DC',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0B4619',
        padding: 0,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        padding: 4,
    },
    savingText: {
        marginLeft: 4,
        color: '#0B4619',
        fontSize: 12,
    },
    errorText: {
        marginLeft: 4,
        color: '#FF6B6B',
        fontSize: 12,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    folderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#0B4619',
    },
    folderText: {
        marginLeft: 4,
        color: '#0B4619',
        fontSize: 14,
        flex: 1,
        marginRight: 4,
    },
    folderIcon: {
        marginLeft: 2,
    },
    tagsContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#0B4619',
    },
    tagText: {
        color: '#0B4619',
        fontSize: 12,
        marginRight: 4,
    },
    removeTag: {
        padding: 2,
    },
    addTagButton: {
        padding: 4,
    },
}); 