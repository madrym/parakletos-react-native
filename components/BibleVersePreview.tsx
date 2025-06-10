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
  reference: string | undefined;
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
const MAX_CONTENT_HEIGHT = 180; // Reduced height for verse content (was 200)
const MAX_PREVIEW_HEIGHT = Dimensions.get('window').height * 0.28; // Reduced from 0.3 to 0.28 of screen height

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
      bibleResultData: bibleResult ? {
        formattedReference: bibleResult.formattedReference,
        versesCount: bibleResult.verses?.length || 0,
        verses: bibleResult.verses || []
      } : null
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
      
      {/* Scrollable content area - Takes remaining space with fixed height */}
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
        ) : bibleResult && bibleResult.verses && bibleResult.verses.length > 0 ? (
          <ScrollView 
            style={styles.versesScrollView}
            contentContainerStyle={styles.versesContainer}
            showsVerticalScrollIndicator={true}
            alwaysBounceVertical={false}
          >
            {bibleResult.verses.map((verse, index) => (
              <View key={`${verse.verse}-${index}`} style={styles.verseRow}>
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
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.text }]}>
              {reference ? `Loading ${reference}...` : 'Enter a Bible reference'}
            </Text>
          </View>
        )}
      </View>
      
      {/* Footer with insert button - Always visible at bottom */}
      <View style={[styles.actionsContainer, { 
        borderTopColor: `${theme.header}40`,
        backgroundColor: theme.background 
      }]}>
        <TouchableOpacity 
          style={[styles.insertButton, { 
            backgroundColor: theme.header,
            opacity: (!bibleResult || loading || error) ? 0.6 : 1 
          }]} 
          onPress={() => {
            console.log('[BibleVersePreview] Insert button pressed. Has result:', !!bibleResult);
            if (bibleResult && !loading && !error) {
              onInsert(bibleResult);
            }
          }}
          disabled={!bibleResult || loading || !!error}
          accessibilityLabel="Insert verse"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={20} color="#F5F5DC" />
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
    margin: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'visible', // Changed from 'hidden' to 'visible' to prevent clipping
    height: 320, // Fixed height instead of max height
    minHeight: 180,
    flexDirection: 'column',
    backgroundColor: '#F5F5DC',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 48,
    backgroundColor: '#0B4619', // Ensure header has background
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5F5DC',
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollableWrapper: {
    flex: 1,
    height: 200, // Fixed height for scrollable area
  },
  versesScrollView: {
    flex: 1,
    width: '100%',
  },
  versesContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: 15,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 10,
    minWidth: 24,
  },
  verseText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
    height: 72, // Increased height to ensure visibility
    backgroundColor: '#F5F5DC',
    borderTopColor: '#0B4619',
  },
  insertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14, // Increased padding
    borderRadius: 8,
    minWidth: 160,
    minHeight: 48, // Increased minimum height
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  insertButtonText: {
    color: '#F5F5DC',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 16,
  },
  debugContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  debugText: {
    marginTop: 10,
    fontSize: 14,
    color: '#0B4619',
    textAlign: 'center',
  },
});

export default BibleVersePreview; 