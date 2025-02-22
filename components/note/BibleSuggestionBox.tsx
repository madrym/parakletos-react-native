import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Verse {
    verse: number;
    text: string;
}

interface BibleSuggestionBoxProps {
    reference: string;
    verses: Verse[];
    onInsert: (reference: string) => void;
}

export const BibleSuggestionBox: React.FC<BibleSuggestionBoxProps> = ({
    reference,
    verses,
    onInsert,
}) => {
    const supMap: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    };

    const toSuperscript = (num: string) => {
        return num.split('').map(digit => supMap[digit] || digit).join('');
    };

    return (
        <View style={styles.suggestionBox}>
            <View style={styles.header}>
                <Text style={styles.suggestionReference}>{reference}</Text>
                <TouchableOpacity
                    style={styles.insertButton}
                    onPress={() => onInsert(reference)}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#F5F5DC" />
                    <Text style={styles.insertButtonText}>Insert</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.suggestionContent}>
                {verses.map((verse, index) => (
                    <View key={index} style={styles.verseContainer}>
                        <Text style={styles.suggestionText}>
                            <Text style={styles.verseNumber}>
                                {toSuperscript(verse.verse.toString())}
                            </Text>
                            {" " + verse.text}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    suggestionBox: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#F5F5DC',
        borderRadius: 12,
        padding: 16,
        width: 300,
        maxHeight: 300,
        borderWidth: 1,
        borderColor: '#0B4619',
        ...Platform.select({
            web: {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
            },
        }),
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#0B4619',
    },
    suggestionReference: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0B4619',
        flex: 1,
    },
    suggestionContent: {
        maxHeight: 200,
    },
    verseContainer: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(11, 70, 25, 0.1)',
    },
    suggestionText: {
        fontSize: 16,
        color: '#0B4619',
        lineHeight: 24,
    },
    verseNumber: {
        fontSize: 12,
        color: '#0B4619',
        fontWeight: 'bold',
    },
    insertButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B4619',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 12,
    },
    insertButtonText: {
        color: '#F5F5DC',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});
