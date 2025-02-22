import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import debounce from 'lodash/debounce';

const ITEMS_PER_PAGE = 20;

export default function MyNotesPage() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    
    const searchResults = useQuery(api.notes.searchNotes, { 
        searchText: searchQuery,
        userId: user?.id || '',
    });
    
    const allNotes = useQuery(api.notes.getNotes, { 
        userId: user?.id || '',
    });

    const notes = searchQuery ? searchResults : allNotes;
    const paginatedNotes = notes?.slice(0, (page + 1) * ITEMS_PER_PAGE) || [];
    const hasMore = notes ? paginatedNotes.length < notes.length : false;

    const debouncedSearch = useCallback(
        debounce((text: string) => {
            setSearchQuery(text);
            setPage(0);
        }, 300),
        []
    );

    const handleLoadMore = () => {
        if (hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const renderNote = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.noteItem}
            onPress={() => router.push(`/note/${item._id}`)}
        >
            <View style={styles.noteHeader}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                    {item.title || 'Untitled Note'}
                </Text>
                <Text style={styles.noteDate}>
                    {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
            </View>
            <Text style={styles.notePreview} numberOfLines={2}>
                {item.content.replace(/<[^>]*>/g, '')}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: 'My Notes',
                    headerLeft: () => (
                        <TouchableOpacity 
                            onPress={() => router.back()}
                            style={{ marginLeft: 16 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#F5F5DC" />
                        </TouchableOpacity>
                    ),
                    headerStyle: {
                        backgroundColor: '#0B4619',
                    },
                    headerTitleStyle: {
                        color: '#F5F5DC',
                    },
                    headerShadowVisible: false,
                }}
            />

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search notes..."
                    placeholderTextColor="#666"
                    onChangeText={debouncedSearch}
                    returnKeyType="search"
                />
            </View>

            <FlatList
                data={paginatedNotes}
                renderItem={renderNote}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No notes found' : 'No notes yet'}
                        </Text>
                    </View>
                )}
                ListFooterComponent={() => (
                    hasMore ? (
                        <ActivityIndicator 
                            size="large" 
                            color="#0B4619" 
                            style={styles.loader}
                        />
                    ) : null
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5DC',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#0B4619',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: '#0B4619',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
    },
    noteItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#0B4619',
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0B4619',
        flex: 1,
        marginRight: 8,
    },
    noteDate: {
        fontSize: 12,
        color: '#666',
    },
    notePreview: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    loader: {
        padding: 16,
    },
}); 