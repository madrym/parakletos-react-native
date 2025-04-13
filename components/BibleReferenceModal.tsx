import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Keyboard,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BibleVersePreview from './BibleVersePreview';
import { getVersesFromReference, isValidReference, BibleResult } from '../utils/bible';

interface BibleReferenceModalProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (result: BibleResult) => void;
  theme?: {
    background: string;
    text: string;
    header: string;
  };
}

/**
 * Modal for manually entering Bible references
 */
const BibleReferenceModal: React.FC<BibleReferenceModalProps> = ({
  visible,
  onClose,
  onInsert,
  theme = {
    background: '#F5F5DC', // Default beige
    text: '#0B4619', // Default green
    header: '#0B4619' // Default green
  }
}) => {
  const [reference, setReference] = useState('');
  const [bibleResult, setBibleResult] = useState<BibleResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  
  // Auto-focus the input when modal opens
  const inputRef = useRef<TextInput>(null);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      // Small delay to avoid keyboard issues
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setReference('');
      setBibleResult(undefined);
      setError(undefined);
    }
  }, [visible]);
  
  // Debounce lookup to prevent too many API calls while typing
  useEffect(() => {
    if (!reference.trim()) {
      setBibleResult(undefined);
      setError(undefined);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(undefined);
        
        // First check if it's a valid reference to avoid unnecessary lookups
        const isValid = await isValidReference(reference);
        if (!isValid) {
          setLoading(false);
          return;
        }
        
        // Get verses
        const result = await getVersesFromReference(reference);
        setBibleResult(result);
        setError(undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid reference');
        setBibleResult(undefined);
      } finally {
        setLoading(false);
      }
    }, 700); // Delay lookup to avoid excessive calls while typing
    
    return () => clearTimeout(timer);
  }, [reference]);
  
  const handleInsert = () => {
    if (bibleResult) {
      onInsert(bibleResult);
      onClose();
    }
  };
  
  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <View style={[
                styles.modalContainer,
                { backgroundColor: theme.background }
              ]}>
                <View style={[styles.header, { backgroundColor: theme.header }]}>
                  <Text style={styles.headerText}>Insert Bible Verse</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#F5F5DC" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.content}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    Enter Bible reference (e.g., "Genesis 1:1" or "Gen 1:1-10")
                  </Text>
                  
                  <View style={[
                    styles.inputContainer,
                    { borderColor: theme.header + '50' } // Semi-transparent border
                  ]}>
                    <TextInput
                      ref={inputRef}
                      style={[styles.input, { color: theme.text }]}
                      value={reference}
                      onChangeText={setReference}
                      placeholder="Example: John 3:16"
                      placeholderTextColor={theme.text + '80'} // Semi-transparent text
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="search"
                    />
                    
                    {loading && (
                      <ActivityIndicator 
                        size="small" 
                        color={theme.header} 
                        style={styles.inputIcon}
                      />
                    )}
                    
                    {!loading && reference.trim() !== '' && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setReference('')}
                      >
                        <Ionicons name="close-circle" size={18} color={theme.text + '80'} />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {error && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}
                  
                  {(bibleResult || loading || error) && (
                    <BibleVersePreview
                      reference={reference}
                      bibleResult={bibleResult}
                      loading={loading}
                      error={error}
                      onInsert={handleInsert}
                      onClose={() => {
                        setBibleResult(undefined);
                        setError(undefined);
                      }}
                      theme={theme}
                    />
                  )}
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 500, // Limit width on larger screens
    alignSelf: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5DC',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  inputIcon: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    color: '#FF6347',
    fontSize: 14,
    marginBottom: 8,
  },
});

export default BibleReferenceModal; 