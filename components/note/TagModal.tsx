import React from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

interface TagModalProps {
    isVisible: boolean;
    onClose: () => void;
    onAdd: () => void;
    value: string;
    onChangeText: (text: string) => void;
    onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
}

export const TagModal: React.FC<TagModalProps> = ({
    isVisible,
    onClose,
    onAdd,
    value,
    onChangeText,
    onKeyPress,
}) => (
    <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <TextInput
                    style={styles.tagInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Add tag..."
                    onKeyPress={onKeyPress}
                    onSubmitEditing={onAdd}
                    blurOnSubmit={false}
                    autoFocus
                />
                <View style={styles.modalButtons}>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={onClose}
                    >
                        <Text style={[styles.modalButtonText, { color: '#0B4619' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.addButton]}
                        onPress={onAdd}
                    >
                        <Text style={styles.modalButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

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
}); 