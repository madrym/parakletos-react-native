import React, { useState } from 'react';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import { View, TextInput, StyleSheet, Modal, TouchableOpacity, Text, ScrollView, SafeAreaView } from 'react-native';

interface Tag {
    id: string;
    name: string;
}

export default function NotePage() {
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [isTagModalVisible, setIsTagModalVisible] = useState(false);
    const [newTag, setNewTag] = useState('');
    
    const editor = useEditorBridge({
        autofocus: true,
        avoidIosKeyboard: true,
        initialContent: 'Start editing!',
    });

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

    return (
        <View style={styles.container}>
            {/* Title Input */}
            <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Note Title"
                placeholderTextColor="#666"
            />

            {/* Tags Section */}
            <View style={styles.tagsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tags.map(tag => (
                        <TouchableOpacity
                            key={tag.id}
                            style={styles.tag}
                            onPress={() => handleRemoveTag(tag.id)}
                        >
                            <Text style={styles.tagText}>{tag.name} ×</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={() => setIsTagModalVisible(true)}
                >
                    <Text style={styles.addTagButtonText}>+ Add Tag</Text>
                </TouchableOpacity>
            </View>

            {/* Content Editor */}
            <SafeAreaView style={styles.fullScreen}>
                <RichText editor={editor} />
                <Toolbar editor={editor} />
            </SafeAreaView>

            {/* Tag Modal */}
            <Modal
                visible={isTagModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsTagModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.tagInput}
                            value={newTag}
                            onChangeText={setNewTag}
                            placeholder="Enter tag name"
                            placeholderTextColor="#666"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    titleInput: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    tag: {
        backgroundColor: '#e0e0e0',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
    },
    tagText: {
        fontSize: 14,
        color: '#333',
    },
    addTagButton: {
        padding: 8,
    },
    addTagButtonText: {
        color: '#007AFF',
        fontSize: 14,
    },
    contentInput: {
        flex: 1,
        fontSize: 16,
        textAlignVertical: 'top',
        padding: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 400,
    },
    tagInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginLeft: 8,
    },
    addButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    fullScreen: {
        flex: 1,
    },
    keyboardAvoidingView: {
        position: 'absolute',
        width: '100%',
        bottom: 0,
    },
});
