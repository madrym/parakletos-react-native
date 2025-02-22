import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVersesFromDB } from '../../app/utils/bible';

interface BibleModalProps {
    isVisible: boolean;
    onClose: () => void;
    onInsert: () => void;
    value: string;
    onChangeText: (text: string) => void;
}

export const BibleModal: React.FC<BibleModalProps> = ({
    isVisible,
    onClose,
    onInsert,
    value,
    onChangeText,
}) => {
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<{ reference: string; text: string } | null>(null);

    useEffect(() => {
        const validateReference = async () => {
            if (!value.trim()) {
                setError(null);
                setPreview(null);
                return;
            }

            setIsValidating(true);
            setError(null);
            try {
                const result = await getVersesFromDB(value);
                if (result.verses.length > 0) {
                    setPreview({
                        reference: result.formattedReference,
                        text: result.verses.map(v => `${v.verse} ${v.text}`).join(' '),
                    });
                    setError(null);
                } else {
                    setPreview(null);
                    setError('No verses found for this reference');
                }
            } catch (err) {
                setPreview(null);
                setError('Invalid reference format');
            } finally {
                setIsValidating(false);
            }
        };

        const timeoutId = setTimeout(validateReference, 500);
        return () => clearTimeout(timeoutId);
    }, [value]);

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>Insert Bible Verse</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#0B4619" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[
                                styles.input,
                                error ? styles.inputError : null
                            ]}
                            value={value}
                            onChangeText={onChangeText}
                            placeholder="Enter reference (e.g., John 3:16 or Gen 1:1-10)"
                            placeholderTextColor="rgba(11, 70, 25, 0.5)"
                            autoFocus
                        />
                        {isValidating && (
                            <ActivityIndicator 
                                style={styles.loadingIndicator} 
                                color="#0B4619" 
                            />
                        )}
                    </View>

                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    {preview && (
                        <View style={styles.previewContainer}>
                            <Text style={styles.previewTitle}>Preview:</Text>
                            <Text style={styles.previewReference}>{preview.reference}</Text>
                            <Text style={styles.previewText} numberOfLines={3}>
                                {preview.text}
                            </Text>
                        </View>
                    )}

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modalButton, 
                                styles.insertButton,
                                (!preview || isValidating) && styles.disabledButton
                            ]}
                            onPress={onInsert}
                            disabled={!preview || isValidating}
                        >
                            <Text style={styles.insertButtonText}>Insert</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
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
    modalContent: {
        backgroundColor: '#F5F5DC',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 500,
        borderWidth: 1,
        borderColor: '#0B4619',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0B4619',
    },
    closeButton: {
        padding: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    input: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#0B4619',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#F5F5DC',
        color: '#0B4619',
    },
    inputError: {
        borderColor: '#FF0000',
    },
    loadingIndicator: {
        position: 'absolute',
        right: 12,
    },
    errorText: {
        color: '#FF0000',
        fontSize: 14,
        marginBottom: 12,
    },
    previewContainer: {
        backgroundColor: 'rgba(11, 70, 25, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0B4619',
        marginBottom: 4,
    },
    previewReference: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0B4619',
        marginBottom: 8,
    },
    previewText: {
        fontSize: 14,
        color: '#0B4619',
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0B4619',
    },
    insertButton: {
        backgroundColor: '#0B4619',
    },
    disabledButton: {
        backgroundColor: 'rgba(11, 70, 25, 0.5)',
    },
    cancelButtonText: {
        color: '#0B4619',
        fontSize: 16,
        fontWeight: 'bold',
    },
    insertButtonText: {
        color: '#F5F5DC',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
