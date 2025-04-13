import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BibleVerse } from '../utils/bible';

interface CollapsibleVerseProps {
  reference: string;
  verses: BibleVerse[];
  theme?: {
    background: string;
    text: string;
    header: string;
  };
  initiallyExpanded?: boolean;
  onRemove?: () => void;
}

/**
 * A collapsible component to display Bible verses in the editor
 * Supports both collapsed (reference only) and expanded (full verses) states
 */
const CollapsibleVerseComponent: React.FC<CollapsibleVerseProps> = ({
  reference,
  verses,
  theme = {
    background: '#F5F5DC', // Default beige
    text: '#0B4619', // Default green
    header: '#0B4619' // Default green
  },
  initiallyExpanded = false,
  onRemove
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.background + '30', // Light background with transparency
        borderColor: theme.header + '50', // Semi-transparent border color
      }
    ]}>
      <TouchableOpacity 
        style={[
          styles.header,
          expanded && { borderBottomWidth: 1, borderBottomColor: theme.header + '30' }
        ]}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons 
            name={expanded ? 'chevron-down' : 'chevron-forward'} 
            size={16} 
            color={theme.header} 
            style={styles.icon}
          />
          <Text style={[styles.referenceText, { color: theme.header }]}>
            {reference}
          </Text>
        </View>
        
        {onRemove && (
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={onRemove}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close-circle" size={16} color={theme.header + '90'} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      {expanded && (
        <ScrollView 
          style={styles.versesContainer}
          contentContainerStyle={styles.versesContent}
          nestedScrollEnabled={true}
        >
          {verses.map((verse) => (
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  referenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  versesContainer: {
    maxHeight: 300, // Limit max height to prevent overly large verse blocks
  },
  versesContent: {
    padding: 12,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 16,
    textAlign: 'right',
  },
  verseText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default CollapsibleVerseComponent; 