import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface MarkdownHelpPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

export const MarkdownHelpPanel: React.FC<MarkdownHelpPanelProps> = ({ isVisible, onClose }) => (
    <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
    >
        <View style={styles.helpModalOverlay}>
            <View style={styles.helpModalContent}>
                <Text style={styles.helpTitle}>Markdown Shortcuts</Text>
                <ScrollView style={styles.helpScroll}>
                    <Text style={styles.helpSection}>Line Starts</Text>
                    <Text style={styles.helpItem}>- | Create bullet point</Text>
                    <Text style={styles.helpItem}>1. | Create numbered list</Text>
                    <Text style={styles.helpItem}># | Heading 1</Text>
                    <Text style={styles.helpItem}>## | Heading 2</Text>
                    <Text style={styles.helpItem}>### | Heading 3</Text>
                    
                    <Text style={styles.helpSection}>Inline Formatting</Text>
                    <Text style={styles.helpItem}>**text** | Bold</Text>
                    <Text style={styles.helpItem}>*text* | Italic</Text>
                    <Text style={styles.helpItem}>`code` | Code</Text>
                    <Text style={styles.helpItem}>[link](url) | Hyperlink</Text>
                </ScrollView>
                <TouchableOpacity style={styles.closeHelpButton} onPress={onClose}>
                    <Text style={styles.closeHelpText}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    helpModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpModalContent: {
        backgroundColor: '#F5F5DC',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    helpTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0B4619',
        marginBottom: 15,
        textAlign: 'center',
    },
    helpSection: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0B4619',
        marginTop: 15,
        marginBottom: 8,
    },
    helpItem: {
        fontSize: 14,
        color: '#0B4619',
        marginBottom: 8,
        paddingLeft: 15,
    },
    helpScroll: {
        marginBottom: 15,
    },
    closeHelpButton: {
        backgroundColor: '#0B4619',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    closeHelpText: {
        color: '#F5F5DC',
        fontSize: 16,
    },
}); 