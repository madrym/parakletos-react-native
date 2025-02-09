import React, { useState, useEffect } from 'react';
import { DEFAULT_TOOLBAR_ITEMS, RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import { View, TextInput, StyleSheet, Modal, TouchableOpacity, Text, ScrollView, SafeAreaView } from 'react-native';
import { initialiseDB, getVersesFromDB } from '@/utils/initDB';
import nivData from '@/data/NIV.json';
import { NIVData } from '@/data/types';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Tag {
    id: string;
    name: string;
}

export default function NotePage() {
    const [isDBInitialized, setIsDBInitialized] = useState(false);
    const [bibleVerses, setBibleVerses] = useState<{ reference: string; text: string; verses: any[] }[]>([]);

    useEffect(() => {
        async function initDB() {
            try {
                if (!nivData || !Array.isArray(nivData)) {
                    console.error('Invalid NIV data format:', nivData);
                    return;
                }
                console.log('Starting DB initialization with NIV data...'); // Debug log
                await initialiseDB(nivData as NIVData[]);
                setIsDBInitialized(true);
                console.log('Database initialized successfully');
                
                // Verify initialization worked
                const testVerse = await getVersesFromDB("John 3:16");
                console.log('Test verse after initialization:', testVerse);
            } catch (error) {
                console.error('Error initializing database:', error);
            }
        }
        initDB();
    }, []);

    // Wait for DB initialization before allowing verse fetching
    const fetchBibleVerse = async (reference: string) => {
        if (!isDBInitialized) {
            console.log('Database not yet initialized');
            return;
        }
        try {
            console.log('Fetching verse:', reference);
            const result = await getVersesFromDB(reference);
            console.log('Fetch result:', result);
            
            if (result.verses.length > 0) {
                setBibleVerses(prev => [...prev, {
                    reference: result.formattedReference,
                    text: result.verses.map(v => `${v.text} `).join(''),
                    verses: result.verses // Store the complete verses array
                }]);
            } else {
                console.log('No verses found for reference:', reference);
            }
        } catch (error) {
            console.error('Error fetching verse:', error);
        }
    };

    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [isTagModalVisible, setIsTagModalVisible] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [folder, setFolder] = useState('Folder');
    
    const [suggestionBox, setSuggestionBox] = useState({
        visible: false,
        reference: '',
        position: { x: 0, y: 0 },
        verses: [] as any[]
    });

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
        },
    });

    // Inject custom CSS for verse numbers
    useEffect(() => {
        if (editor) {
            const verseNumberCSS = `
                sup.verse-number {
                    color: rgb(0, 0, 0) !important;
                    font-size: 0.8em !important;
                    padding-right: 3px !important;
                }
                /* If using span instead of sup */
                span.verse-number {
                    color: rgb(0, 0, 0) !important;
                    font-size: 0.8em !important;
                    vertical-align: super !important;
                    padding-right: 3px !important;
                }
            `;
            editor.injectCSS(verseNumberCSS, 'verse-number-styles');
        }
    }, [editor]);

    const [editorContent, setEditorContent] = useState('');
    useEffect(() => {
        const checkContent = async () => {
            if (editor) {
                const content = await editor.getHTML();
                setEditorContent(content);
                checkForBibleReference(content);
            }
        };

        // Set up an interval to check content
        const interval = setInterval(checkContent, 1000);

        return () => clearInterval(interval);
    }, [editor]);

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

    const [isBibleModalVisible, setIsBibleModalVisible] = useState(false);
    const [bibleReference, setBibleReference] = useState('');

    const handleInsertVerse = async (reference?: string) => {
        const verseToFetch = reference || bibleReference;
        if (!verseToFetch.trim()) return;
        
        try {
            const result = await getVersesFromDB(verseToFetch);
            if (result.verses.length > 0) {
                // Map regular numbers to Unicode superscripts
                const supMap: { [key: string]: string } = {
                    '0': '⁰',
                    '1': '¹',
                    '2': '²',
                    '3': '³',
                    '4': '⁴',
                    '5': '⁵',
                    '6': '⁶',
                    '7': '⁷',
                    '8': '⁸',
                    '9': '⁹',
                };
                
                const toSuperscript = (num: string) => {
                    return num.split('').map(digit => supMap[digit] || digit).join('');
                };
                
                const verseText = result.verses.map(v => 
                    `${toSuperscript(v.verse.toString())} ${v.text}`
                ).join(' ');
                
                const verseBlock = `
                    <blockquote style="margin: 10px 0; padding: 10px; background-color: #F5F5DC; border: 1px solid #0B4619; border-radius: 5px; border-left: 4px solid #0B4619;">
                        <div style="font-weight: bold; margin-bottom: 5px; color: #0B4619;">
                            ${result.formattedReference.trim()}
                        </div>
                        <div style="color: #0B4619; line-height: 1.5;">
                            ${verseText}
                        </div>
                    </blockquote>
                    <p></p>
                `.trim();

                const currentContent = await editor.getHTML();
                await editor.setContent(`${currentContent.trim()}${verseBlock}`);
                
                // Reset suggestion box and last processed reference
                setSuggestionBox(prev => ({ ...prev, visible: false }));
                lastProcessedReference.current = '';
                setBibleReference('');
                setIsBibleModalVisible(false);
            } else {
                console.log('No verses found for reference:', verseToFetch);
                // Reset suggestion box and last processed reference
                setSuggestionBox(prev => ({ ...prev, visible: false }));
                lastProcessedReference.current = '';
            }
        } catch (error) {
            console.error('Error inserting verse:', error);
            // Reset suggestion box and last processed reference on error
            setSuggestionBox(prev => ({ ...prev, visible: false }));
            lastProcessedReference.current = '';
        }
    };

    const lastProcessedReference = React.useRef('');

    const checkForBibleReference = async (content: string) => {
        const bibleRefRegex = /([1-3]?\s*[A-Za-z]+)\s*(\d+):(\d+)(?:-(\d+))?/g;
        const matches = content.match(bibleRefRegex);

        if (!matches) {
            setSuggestionBox(prev => ({ ...prev, visible: false }));
            lastProcessedReference.current = '';
            return;
        }

        const lastMatch = matches[matches.length - 1];
        const lastMatchIndex = content.lastIndexOf(lastMatch);
        
        // Check if there's significant content after the last match
        const contentAfterMatch = content.slice(lastMatchIndex + lastMatch.length);
        const hasNewContent = contentAfterMatch.length > 20 || contentAfterMatch.includes('\n');

        // Hide suggestion box if there's new content after the match
        if (hasNewContent) {
            setSuggestionBox(prev => ({ ...prev, visible: false }));
            lastProcessedReference.current = '';
            return;
        }

        // Don't process if it's the same reference we just handled
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
                    position: {
                        x: (window.innerWidth - 250) / 2,
                        y: 20,
                    },
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

    const handleShare = () => {
        // Implement share functionality
        console.log('Share pressed');
    };

    const handleBack = () => {
        console.log('Back pressed');
        // Try different navigation methods
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

    return (
        <View style={styles.container}>
            {/* Header */}
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
                        <TouchableOpacity 
                            onPress={handleShare}
                            style={{ marginRight: 16 }}
                        >
                            <Ionicons name="share-outline" size={24} color="#F5F5DC" />
                        </TouchableOpacity>
                    ),
                    headerTitle: '',
                    headerStyle: {
                        backgroundColor: '#0B4619',  // Slightly darker shade of cream
                    },
                    headerShadowVisible: false,
                    contentStyle: {
                        backgroundColor: '#F5F5DC',  // Keep main content background lighter
                    },
                }}
            />

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
                                onPress: ({editor}) => () => {
                                    setIsBibleModalVisible(true);
                                },
                                active: () => false,
                                disabled: () => false,
                                image: () => require('../../assets/images/bible.png'),
                            },
                            ...DEFAULT_TOOLBAR_ITEMS,
                        ]}
                    />
                </SafeAreaView>
            </SafeAreaView>

            {/* Bible Verse Suggestion Box */}
            {suggestionBox.visible && (
                <View style={[
                    styles.suggestionBox,
                    {
                        position: 'absolute',
                        left: suggestionBox.position.x,
                        top: suggestionBox.position.y,
                    }
                ]}>
                    <Text style={styles.suggestionReference}>{suggestionBox.reference}</Text>
                    <ScrollView style={styles.suggestionContent}>
                        {suggestionBox.verses.map((verse, index) => (
                            <Text key={index} style={styles.suggestionText}>
                                <Text style={styles.suggestionVerseNum}>{verse.verse}</Text>
                                {" " + verse.text}
                            </Text>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.insertButton}
                        onPress={() => {
                            handleInsertVerse(suggestionBox.reference);
                            setSuggestionBox(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <Text style={styles.insertButtonText}>Insert Verse</Text>
                    </TouchableOpacity>
                </View>
            )}

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

            {/* Bible Modal */}
            <Modal
                visible={isBibleModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsBibleModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Insert Bible Verse</Text>
                        <TextInput
                            style={styles.tagInput}
                            value={bibleReference}
                            onChangeText={setBibleReference}
                            placeholder="Enter reference (e.g., John 3:16)"
                            placeholderTextColor="#0B4619"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setIsBibleModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: '#0B4619' }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.addButton]}
                                onPress={() => handleInsertVerse(bibleReference)}
                            >
                                <Text style={styles.modalButtonText}>Insert</Text>
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
    verseButton: {
        backgroundColor: '#0B4619',
        padding: 10,
        borderRadius: 5,
        margin: 10,
    },
    verseButtonText: {
        color: '#F5F5DC',
        textAlign: 'center',
    },
    versesContainer: {
        maxHeight: 200,
        margin: 10,
    },
    verseItem: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#F5F5DC',
        borderRadius: 5,
        borderColor: '#0B4619',
        borderWidth: 1,
    },
    verseReference: {
        fontWeight: 'bold',
        color: '#0B4619',
        marginBottom: 5,
    },
    verseTextContainer: {
        color: '#0B4619',
        lineHeight: 24,
        fontSize: 16,
    },
    verseNumber: {
        fontSize: 10,
        color: '#0B4619',
        lineHeight: 10,
        top: -5,
        marginRight: 1,
    },
    verseText: {
        color: '#0B4619',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0B4619',
        marginBottom: 16,
        textAlign: 'center',
    },
    suggestionBox: {
        backgroundColor: '#F5F5DC',
        borderRadius: 8,
        padding: 12,
        width: 250, // Fixed width
        maxHeight: 200, // Fixed max height
        borderWidth: 1,
        borderColor: '#0B4619',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
    },
    suggestionReference: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0B4619',
        marginBottom: 8,
    },
    suggestionText: {
        fontSize: 14,
        color: '#0B4619',
        marginBottom: 4,
    },
    suggestionVerseNum: {
        fontSize: 10,
        color: '#0B4619',
        verticalAlign: 'top',
    },
    insertButton: {
        backgroundColor: '#0B4619',
        padding: 8,
        borderRadius: 4,
        marginTop: 8,
        alignItems: 'center',
    },
    insertButtonText: {
        color: '#F5F5DC',
        fontSize: 14,
        fontWeight: 'bold',
    },
    suggestionContent: {
        maxHeight: 150, // Leave space for reference and button
    },
});
