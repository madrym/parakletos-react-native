import React, { useState } from 'react';
import { DEFAULT_TOOLBAR_ITEMS, RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
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
    const [folder, setFolder] = useState('Folder');
    
    const editor = useEditorBridge({
        autofocus: true,
        avoidIosKeyboard: true,
        initialContent: '',
        theme: {
            toolbar: {
                toolbarBody: {
                    backgroundColor: '#F5F5DC',
                },
                toolbarButton: {
                    backgroundColor: 'transparent',
                },
                icon: {
                    tintColor: '#0B4619',
                },
                iconActive: {
                    tintColor: '#0B4619',
                    borderColor: '#0B4619',
                },
                iconWrapper: {
                    backgroundColor: 'transparent',
                },
                iconWrapperActive: {
                    backgroundColor: '#FFFFFF',
                    borderColor: '#0B4619',
                    borderWidth: 1,
                },
            },
            colorKeyboard: {},
            webview: {},
            webviewContainer: {}
        }
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
            {/* Header Section */}
            <View style={styles.header}> 
                <TextInput
                    style={styles.titleInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Untitled"
                    placeholderTextColor="#0B4619"
                />

                <View style={styles.tagsSection}>
                    <Text style={styles.tagsLabel}>Tags:</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.tagsScrollView}
                    >
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
                            style={styles.addTagSmall}
                            onPress={() => setIsTagModalVisible(true)}
                        >
                            <Text style={styles.addTagSmallText}>+</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <View style={styles.folderRow}>
                    <TouchableOpacity style={styles.folderSelector}>
                        <Text style={styles.folderText}>{folder}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                    <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
                </View>
            </View>

            {/* Content Editor */}
            <SafeAreaView style={[styles.fullScreen]}>
                <RichText 
                    editor={editor} 
                    style={styles.richText}
                />
                <SafeAreaView style={[styles.toolbar]}>
                    <Toolbar editor={editor}
                        items={[
                            {
                                onPress:({editor}) => () => {
                                    return setIsTagModalVisible(true);
                                },
                                active:() => false,
                                disabled:() => false,
                                image:() => require('../../assets/images/bible.png'),
                            },
                            ...DEFAULT_TOOLBAR_ITEMS,
                        ]}
                    />
                </SafeAreaView>
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
                            placeholderTextColor="#0B4619"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setIsTagModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: '#0B4619' }]}>Cancel</Text>
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
        backgroundColor: '#F5F5DC',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        backgroundColor: '#F5F5DC',
    },
    titleInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0B4619',
        marginBottom: 16,
        padding: 0,
    },
    tagsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    tagsLabel: {
        fontSize: 16,
        color: '#666',
        marginRight: 8,
    },
    addTagSmall: {
        width: 24,
        height: 24,
        borderWidth: 1,
        borderColor: '#666',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addTagSmallText: {
        fontSize: 16,
        color: '#666',
    },
    folderSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    folderText: {
        fontSize: 16,
        color: '#0B4619',
        marginRight: 4,
    },
    dropdownIcon: {
        fontSize: 12,
        color: '#0B4619',
    },
    dateText: {
        fontSize: 16,
        color: '#0B4619',
    },
    tagsScrollView: {
        flexGrow: 0,
        flexShrink: 1,
    },
    tag: {
        backgroundColor: '#0B4619',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
    },
    tagText: {
        fontSize: 14,
        color: '#F5F5DC',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#F5F5DC',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#0B4619',
    },
    tagInput: {
        borderWidth: 1,
        borderColor: '#0B4619',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#F5F5DC',
        color: '#0B4619',
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
        backgroundColor: '#0B4619',
        borderRadius: 8,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#F5F5DC',
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
    toolbar: {
        minHeight: 50,
        maxHeight: 100,
        backgroundColor: '#F5F5DC',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#0B4619',
    },
    folderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    richText: {
        flex: 1,
        padding: 20,
        fontSize: 16,
        color: '#0B4619',
        backgroundColor: '#F5F5DC',
    },
});
