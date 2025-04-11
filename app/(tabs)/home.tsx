import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    FlatList, 
    TextInput, 
    Image, 
    Platform,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
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
        // For now, just show all notes since we don't have a dedicated folder view
        router.push('/my-notes');
    };

    // Navigate back to home (can be used from other screens)
    const navigateToHome = () => {
        router.push('/');
    };

    // Navigate to profile
    const navigateToProfile = () => {
        router.push('/(tabs)/profile');
    };

    const renderFolderItem = ({ item }: { item: Folder }) => {
        let iconName = "book";
        let iconComponent = FontAwesome5;
        
        if (item.name.toLowerCase().includes('sermon')) {
            iconName = "home";
            iconComponent = Ionicons;
        } else if (item.name.toLowerCase().includes('devotion')) {
            iconName = "book-open";
            iconComponent = FontAwesome5;
        } else if (item.name.toLowerCase().includes('bible')) {
            iconName = "glasses";
            iconComponent = Ionicons;
        }
        
        const Icon = iconComponent;
        
        return (
            <TouchableOpacity 
                style={styles.folderCard}
                onPress={() => handleSelectFolder(item._id)}
            >
                <View style={styles.folderIconContainer}>
                    <Icon name={iconName} size={24} color="#0B4619" />
                </View>
                <Text style={styles.folderTitle}>{item.name}</Text>
                <Text style={styles.folderSubtitle}>Folder</Text>
            </TouchableOpacity>
        );
    };

    // Add predefined folders if they don't exist yet
    const ensurePredefinedFolders = async () => {
        if (!folders || folders.length === 0) {
            if (!user) return;
            
            const predefinedFolders = [
                { name: "Sermons", emoji: "🏠" },
                { name: "Devotions", emoji: "📖" },
                { name: "Bible study", emoji: "👓" }
            ];
            
            for (const folder of predefinedFolders) {
                await createFolder({
                    name: folder.name,
                    emoji: folder.emoji,
                    userId: user.id
                });
            }
        }
    };

    // Ensure predefined folders exist
    React.useEffect(() => {
        if (folders !== undefined && user) {
            ensurePredefinedFolders();
        }
    }, [folders, user]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={navigateToHome} style={styles.logoContainer}>
                        <Text style={styles.appTitle}>parakletos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={navigateToProfile} style={styles.profileButton}>
                        {user?.imageUrl ? (
                            <Image source={{ uri: user.imageUrl }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <Ionicons name="person" size={20} color="#FFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Greeting */}
                <View style={styles.greetingContainer}>
                    <Text style={styles.greeting}>Hi {user?.firstName || 'there'}</Text>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notes"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Add New Note Button */}
                <TouchableOpacity 
                    style={styles.addNoteButton}
                    onPress={() => router.push('/note/new')}
                    activeOpacity={0.8}
                >
                    <View style={styles.addNoteContent}>
                        <View style={styles.addNoteTextContainer}>
                            <Text style={styles.addNoteText}>Add new</Text>
                            <Text style={styles.addNoteText}>note</Text>
                        </View>
                        <View style={styles.bibleImageContainer}>
                            <FontAwesome5 name="bible" size={42} color="#F5F5DC" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Mobile Friendly Editor Button */}
                <TouchableOpacity 
                    style={[styles.addNoteButton, { marginTop: 16, backgroundColor: '#272727' }]}
                    onPress={() => {
                        console.log('Navigating to mobile friendly editor (DEBUG VERSION)');
                        // Force clear any caches by using a timestamp
                        router.push('/mobile-friendly-editor');
                    }}
                    activeOpacity={0.8}
                >
                    <View style={styles.addNoteContent}>
                        <View style={styles.addNoteTextContainer}>
                            <Text style={[styles.addNoteTitle, { color: '#F5F5DC' }]}>Try NEW Mobile Friendly Editor (Debug)</Text>
                            <Text style={[styles.addNoteSubtitle, { color: '#F5F5DC' }]}>
                                Simplified version with custom toolbar
                            </Text>
                        </View>
                        <View style={[styles.addNoteIconContainer, { backgroundColor: '#444' }]}>
                            <Ionicons name="bug" size={24} color="#F5F5DC" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Section Title */}
                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>My Folders</Text>
                </View>

                {/* Folders */}
                <View style={styles.foldersContainer}>
                    <FlatList
                        data={folders || []}
                        renderItem={renderFolderItem}
                        keyExtractor={item => item._id}
                        numColumns={2}
                        contentContainerStyle={styles.folderList}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={
                            <TouchableOpacity 
                                style={styles.addFolderCard}
                                onPress={() => setIsFolderModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.addIconContainer}>
                                    <Ionicons name="add" size={24} color="#0B4619" />
                                </View>
                                <Text style={styles.addFolderText}>Add new</Text>
                                <Text style={styles.addFolderText}>folder</Text>
                            </TouchableOpacity>
                        }
                    />
                </View>

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5DC',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5F5DC',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(11, 70, 25, 0.1)',
        backgroundColor: '#F5F5DC',
    },
    logoContainer: {
        paddingVertical: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 15,
    },
    appTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0B4619',
        letterSpacing: 0.5,
    },
    profileButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#0B4619',
    },
    profilePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0B4619',
        justifyContent: 'center',
        alignItems: 'center',
    },
    greetingContainer: {
        marginTop: 20,
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0B4619',
        letterSpacing: 0.3,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 24,
        marginHorizontal: 20,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        color: '#333',
        fontSize: 16,
    },
    addNoteButton: {
        backgroundColor: '#0B4619',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    addNoteContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addNoteTextContainer: {
        flex: 1,
    },
    addNoteText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F5F5DC',
        lineHeight: 34,
        letterSpacing: 0.3,
    },
    bibleImageContainer: {
        marginLeft: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitleContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0B4619',
        letterSpacing: 0.3,
    },
    foldersContainer: {
        flex: 1,
        paddingHorizontal: 12,
    },
    folderList: {
        paddingBottom: 20,
    },
    folderCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        margin: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 140,
        maxWidth: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    folderIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(11, 70, 25, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    folderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0B4619',
        textAlign: 'center',
        marginBottom: 4,
    },
    folderSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        opacity: 0.7,
    },
    addFolderCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(11, 70, 25, 0.3)',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 16,
        margin: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 140,
        maxWidth: 160,
        backgroundColor: 'rgba(11, 70, 25, 0.02)',
    },
    addIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(11, 70, 25, 0.3)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    addFolderText: {
        fontSize: 16,
        color: '#0B4619',
        marginTop: 2,
        textAlign: 'center',
        opacity: 0.7,
    },
    addNoteTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0B4619',
        lineHeight: 34,
        letterSpacing: 0.3,
    },
    addNoteSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        opacity: 0.7,
    },
    addNoteIconContainer: {
        marginLeft: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
