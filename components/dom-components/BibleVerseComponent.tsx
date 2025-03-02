import React, { useState, useRef, useEffect } from 'react';
import { NodeKey, $getNodeByKey, LexicalNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { database } from '@/app/utils/database/database';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define the interface for the node attributes here instead of importing from BibleVerseNode
interface BibleVerseAttributes {
  reference: string;
  verseText: string;
}

// Define a type for nodes that have updateAttributes method
interface NodeWithAttributes extends LexicalNode {
  updateAttributes: (attributes: BibleVerseAttributes) => void;
}

interface BibleVerseComponentProps {
  reference: string;
  verseText: string;
  nodeKey: NodeKey;
  translation: string;
}

// Format enum for verse display
enum VerseFormat {
  PARAGRAPH = 'paragraph',
  LINE_BY_LINE = 'lineby'
}

export function BibleVerseComponent({
  reference,
  verseText,
  nodeKey,
  translation = 'NIV', // Default to NIV if not provided
}: BibleVerseComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editReference, setEditReference] = useState(reference);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReference, setCurrentReference] = useState(reference);
  const [currentVerseText, setCurrentVerseText] = useState(verseText);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [format, setFormat] = useState<VerseFormat>(VerseFormat.PARAGRAPH);
  
  // Animation value for content height
  const contentHeight = useRef(new Animated.Value(1)).current;

  // Update animation when collapsed state changes
  useEffect(() => {
    Animated.timing(contentHeight, {
      toValue: isCollapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isCollapsed, contentHeight]);

  // Parse verses for better formatting
  const parseVerses = () => {
    // Match verse patterns like "1. Text" or "1 Text"
    const verseRegex = /(\d+)\.\s(.*?)(?=\s\d+\.\s|$)/g;
    const matches = [...currentVerseText.matchAll(verseRegex)];
    
    // If no matches found, fallback to the original text
    if (matches.length === 0) {
      return [{ number: '', text: currentVerseText }];
    }
    
    return matches.map(match => ({
      number: match[1],
      text: match[2].trim()
    }));
  };

  // Superscript conversion for verse numbers
  const toSuperscript = (num: string) => {
    const supMap: { [key: string]: string } = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    };
    
    return num.split('').map(digit => supMap[digit] || digit).join('');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editReference.trim()) {
      setError('Please enter a valid Bible reference');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await database.getVerses(editReference);
      
      if (!result || result.verses.length === 0) {
        throw new Error('Verse not found');
      }

      const newVerseText = result.verses.map(v => `${v.verse}. ${v.text}`).join(' ');

      editor.update(() => {
        // Use $getNodeByKey to get the node without direct dependency
        const node = $getNodeByKey(nodeKey);
        // Check if node exists and has updateAttributes method
        if (node && 'updateAttributes' in node) {
          // Use type assertion to tell TypeScript this node has updateAttributes
          (node as NodeWithAttributes).updateAttributes({
            reference: result.formattedReference,
            verseText: newVerseText
          });
        }
      });

      setCurrentReference(result.formattedReference);
      setCurrentVerseText(newVerseText);
      
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update verse: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditReference(currentReference);
    setError(null);
    setIsEditing(false);
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const toggleFormat = () => {
    setFormat(format === VerseFormat.PARAGRAPH 
      ? VerseFormat.LINE_BY_LINE 
      : VerseFormat.PARAGRAPH);
  };

  if (isEditing) {
    return (
      <View style={[styles.bibleVerseContainer, styles.editContainer]}>
        <View style={styles.bibleVerseHeader}>
          <View style={styles.bibleVerseReferenceContainer}>
            <Text style={styles.bibleVerseReference}>
              Edit Bible Reference
            </Text>
          </View>
        </View>
        
        <View style={styles.bibleVerseContent}>
          {error && <Text style={styles.bibleVerseError}>{error}</Text>}
          
          <View style={styles.bibleVerseEditRow}>
            <Text style={styles.label}>Reference:</Text>
            <input
              type="text"
              value={editReference}
              onChange={(e) => setEditReference(e.target.value)}
              placeholder="e.g., John 3:16 or Romans 8:28-30"
              style={styles.input}
            />
            <Text style={styles.referenceHelp}>
              Format: Book Chapter:Verse or Book Chapter:StartVerse-EndVerse
            </Text>
          </View>
          
          <View style={styles.bibleVerseEditButtons}>
            <TouchableOpacity 
              onPress={handleCancel}
              disabled={isLoading}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave}
              disabled={isLoading}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>{isLoading ? 'Loading...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const verses = parseVerses();

  return (
    <View style={[styles.bibleVerseContainer, isCollapsed ? styles.collapsed : styles.expanded]}>
      <TouchableOpacity 
        style={styles.bibleVerseHeader}
        onPress={toggleCollapse}
      >
        <View style={styles.bibleVerseReferenceContainer}>
          <View style={styles.bibleVerseToggleIcon}>
            <Text>{isCollapsed ? '▼' : '▲'}</Text>
          </View>
          <View>
            <Text style={styles.bibleVerseReference}>
              {currentReference}
              <Text style={styles.bibleVerseTranslation}> {translation}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity 
            style={styles.formatButton} 
            onPress={toggleFormat}
          >
            <View style={styles.formatButtonContent}>
              {format === VerseFormat.PARAGRAPH ? (
                <>
                  <Ionicons name="text-outline" size={14} color="#0B4619" />
                  <Text style={styles.formatButtonText}>Wrap</Text>
                </>
              ) : (
                <>
                  <Ionicons name="list-outline" size={14} color="#0B4619" />
                  <Text style={styles.formatButtonText}>Lines</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bibleVerseEditButton} 
            onPress={(e) => {
              e.stopPropagation(); // Prevent the toggle from firing
              handleEdit();
            }}
          >
            <Ionicons name="pencil-outline" size={16} color="#0B4619" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      
      <Animated.View 
        style={[
          styles.bibleVerseContent,
          {
            maxHeight: contentHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500]
            }),
            opacity: contentHeight
          }
        ]}
      >
        <ScrollView>
          {format === VerseFormat.PARAGRAPH ? (
            // Paragraph format - all verses in one paragraph
            <Text style={styles.verseText}>
              {verses.map((verse, index) => (
                <React.Fragment key={index}>
                  {verse.number && (
                    <Text style={styles.verseNumber}>
                      {toSuperscript(verse.number)}
                      <Text>{"\u00A0"}</Text>
                    </Text>
                  )}
                  <Text>{verse.text} </Text>
                </React.Fragment>
              ))}
            </Text>
          ) : (
            // Line by line format - each verse on its own line
            <View style={styles.verseLineContainer}>
              {verses.map((verse, index) => (
                <View key={index} style={styles.verseLine}>
                  {verse.number && (
                    <Text style={[styles.verseNumber, styles.verseLineNumber]}>
                      {toSuperscript(verse.number)}
                    </Text>
                  )}
                  <Text style={styles.verseLineText}>{verse.text}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bibleVerseContainer: {
    borderWidth: 1,
    borderColor: 'rgba(11, 70, 25, 0.2)',
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: 'rgba(245, 245, 220, 0.5)',
    overflow: 'hidden',
  },
  collapsed: {},
  expanded: {},
  bibleVerseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(11, 70, 25, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11, 70, 25, 0.2)',
  },
  bibleVerseReferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bibleVerseToggleIcon: {
    marginRight: 8,
    opacity: 0.7,
  },
  bibleVerseReference: {
    fontWeight: 'bold',
    color: '#0B4619',
  },
  bibleVerseTranslation: {
    marginLeft: 6,
    fontSize: 12,
    opacity: 0.7,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatButton: {
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(11, 70, 25, 0.1)',
    width: 60,
    height: 28,
  },
  formatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatButtonText: {
    fontSize: 12,
    color: '#0B4619',
    marginLeft: 4,
    fontWeight: '500',
  },
  bibleVerseContent: {
    padding: 12,
    overflow: 'hidden',
  },
  verseText: {
    marginVertical: 8,
    lineHeight: 24,
    color: '#333',
  },
  verseNumber: {
    fontSize: 16,
    lineHeight: 16,
    color: '#0B4619',
    fontWeight: 'bold',
  },
  verseLineContainer: {
    marginVertical: 8,
  },
  verseLine: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11, 70, 25, 0.05)',
  },
  verseLineNumber: {
    marginRight: 12,
    alignSelf: 'flex-start',
  },
  verseLineText: {
    flex: 1,
    lineHeight: 22,
  },
  bibleVerseEditButton: {
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    backgroundColor: 'rgba(11, 70, 25, 0.1)',
    width: 28,
    height: 28,
  },
  editContainer: {
    overflow: 'visible',
  },
  bibleVerseEditRow: {
    marginVertical: 8,
  },
  label: {
    fontWeight: 'bold',
    color: '#0B4619',
    marginBottom: 4,
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(11, 70, 25, 0.3)',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    fontSize: 16,
  },
  referenceHelp: {
    color: 'rgba(11, 70, 25, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  bibleVerseEditButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 8,
  },
  cancelButton: {
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(11, 70, 25, 0.1)',
    marginRight: 8,
  },
  saveButton: {
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#0B4619',
  },
  cancelButtonText: {
    color: '#0B4619',
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#F5F5DC',
    fontWeight: 'bold',
  },
  bibleVerseError: {
    color: '#dc3545',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.2)',
  },
}); 