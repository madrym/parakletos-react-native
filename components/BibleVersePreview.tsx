import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BibleResult } from '../utils/bible';

interface BibleVersePreviewProps {
  reference: string;
  onInsert: (result: BibleResult) => void;
  onClose: () => void;
  bibleResult?: BibleResult;
  loading?: boolean;
  error?: string;
  theme?: {
    background: string;
    text: string;
    header: string;
  };
}

// Set a fixed maximum height for the verse content
const MAX_CONTENT_HEIGHT = 200; // Default height for verse content
const MAX_PREVIEW_HEIGHT = Dimensions.get('window').height * 0.3; // 30% of screen height

/**
 * Component to display a preview of Bible verses with options to insert or cancel
 */
const BibleVersePreview: React.FC<BibleVersePreviewProps> = ({
  reference,
  onInsert,
  onClose,
  bibleResult,
  loading = false,
  error,
  theme = {
    background: '#F5F5DC', // Default beige
    text: '#0B4619', // Default green
    header: '#0B4619' // Default green
  }
}) => {
  // Check if we have valid verse content to display - always show button when bibleResult exists
  const hasResult = bibleResult !== undefined;

  // *** Add Log ***
  console.log('[BibleVersePreview] Rendering:',
    {
      reference,
      hasResult,
      loading,
      error,
      bibleResultExists: !!bibleResult,
    }
  );

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: `${theme.background}F5`, // Semi-transparent background
        borderColor: theme.header,
      }
    ]}>
      {/* Header - Fixed at top */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">
          {loading ? `Loading ${reference}...` : bibleResult ? bibleResult.formattedReference : reference}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close preview" accessibilityRole="button">
          <Ionicons name="close" size={20} color="#F5F5DC" />
        </TouchableOpacity>
      </View>
      
      {/* Scrollable content area - Takes remaining space */}
      <View style={styles.scrollableWrapper}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.header} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading verses...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={24} color="#FF6347" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : hasResult && bibleResult.verses && bibleResult.verses.length > 0 ? (
          <ScrollView 
            style={styles.versesScrollView}
            contentContainerStyle={styles.versesContainer}
            showsVerticalScrollIndicator={true}
            indicatorStyle="black"
          >
            {bibleResult.verses.map((verse) => (
              <View key={verse.verse} style={styles.verseRow}>
                <Text style={[styles.verseNumber, { color: theme.header }]}>
                  {verse.verse}
                </Text>
                <Text style={[styles.verseText, { color: theme.text }]}>
                  {verse.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.placeholderText, { color: theme.text }]}>
            Enter a Bible reference
          </Text>
        )}
      </View>
      
      {/* Footer with insert button - Always visible */}
      <View style={[styles.actionsContainer, { 
        borderTopColor: `${theme.header}40`,
        backgroundColor: `${theme.background}F0` 
      }]}>
        <TouchableOpacity 
          style={[styles.insertButton, { 
            backgroundColor: theme.header,
            opacity: !hasResult || loading || error ? 0.6 : 1 
          }]} 
          onPress={() => {
            // *** Add Log ***
            console.log('[BibleVersePreview] Insert button pressed. Has result:', hasResult);
            if (hasResult && bibleResult) { // Check bibleResult again just in case
              onInsert(bibleResult);
            }
          }}
          disabled={!!((!hasResult) || loading || error)}
          accessibilityLabel="Insert verse"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={18} color="#F5F5DC" />
          <Text style={styles.insertButtonText}>
            {loading ? "Loading..." : "Insert Verse"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    height: 240, // Reduced from 400px to 240px (60 + 120 + 60)
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60, // Fixed height
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5F5DC',
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollableWrapper: {
    flex: 1, // Takes remaining space
    height: 120, // Reduced from 280px to 120px (2x header height)
  },
  versesScrollView: {
    width: '100%',
  },
  versesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
    minWidth: 20,
  },
  verseText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#FF6347',
    textAlign: 'center',
  },
  placeholderText: {
    padding: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    height: 60, // Fixed height
  },
  insertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 140,
    justifyContent: 'center',
  },
  insertButtonText: {
    color: '#F5F5DC',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 15,
  },
});

export default BibleVersePreview; 