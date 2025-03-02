import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Verse {
    verse: number;
    text: string;
}

interface BibleSuggestionBoxProps {
    reference: string;
    verses: Verse[];
    onInsert: (reference: string) => void;
    onClose: () => void;
    position?: { top: number; left: number };
}

export const BibleSuggestionBox = ({
    reference,
    verses,
    onInsert,
    onClose,
    position,
}: BibleSuggestionBoxProps) => {
    const supMap: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    };

    const toSuperscript = (num: string) => {
        return num.split('').map(digit => supMap[digit] || digit).join('');
    };

    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const boxWidth = Math.min(screenWidth * 0.85, 350); // 85% of screen width, max 350px

    // Determine if we should use the position or centered placement
    const usePositioned = !!position;
    
    // Calculate adjusted position to ensure the box stays within viewport bounds
    const adjustedPosition = position ? {
        top: Math.min(Math.max(position.top, 10), screenHeight - 270),
        left: Math.min(Math.max(position.left, 10), screenWidth - boxWidth - 10),
    } : undefined;

    return (
        <View style={[
            styles.backdropContainer,
            usePositioned && styles.transparentBackdrop,
        ]}>
            <View style={[
                styles.suggestionBox,
                { width: boxWidth },
                usePositioned && styles.positionedBox,
                adjustedPosition && { 
                    position: 'absolute', 
                    top: adjustedPosition.top, 
                    left: adjustedPosition.left 
                }
            ]}>
                <View style={styles.header}>
                    <Text style={styles.suggestionReference}>{reference}</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.insertButton}
                            onPress={() => onInsert(reference)}
                            accessibilityLabel="Insert verse"
                        >
                            <Ionicons name="add-circle-outline" size={22} color="#F5F5DC" />
                            <Text style={styles.insertButtonText}>Insert</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            accessibilityLabel="Close suggestion"
                        >
                            <Ionicons name="close-circle" size={22} color="#F5F5DC" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Scrollable content area with persistent shadow indicators */}
                <View style={styles.scrollContainer}>
                    <View style={styles.topScrollShadow} />
                    <ScrollView 
                        style={styles.suggestionContent}
                        showsVerticalScrollIndicator={true}
                        persistentScrollbar={true}
                    >
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
                    <View style={styles.bottomScrollShadow} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdropContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
    },
    transparentBackdrop: {
        backgroundColor: 'transparent',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    suggestionBox: {
        backgroundColor: '#F5F5DC',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#0B4619',
        height: 250, // Fixed height for mobile
        ...Platform.select({
            web: {
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 8,
            },
        }),
        zIndex: 1001,
    },
    positionedBox: {
        position: 'absolute',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#0B4619',
        backgroundColor: '#0B4619',
    },
    suggestionReference: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F5F5DC',
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scrollContainer: {
        flex: 1,
        position: 'relative',
    },
    suggestionContent: {
        flex: 1,
        paddingHorizontal: 12,
    },
    topScrollShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: 'rgba(245, 245, 220, 0.8)',
        zIndex: 2,
        pointerEvents: 'none',
    },
    bottomScrollShadow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: 'rgba(245, 245, 220, 0.8)',
        zIndex: 2,
        pointerEvents: 'none',
    },
    verseContainer: {
        marginVertical: 8,
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
        backgroundColor: '#104E23',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
        minHeight: 44, // Minimum touch target size
    },
    insertButtonText: {
        color: '#F5F5DC',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    closeButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#104E23',
        width: 44, // Square button with good touch target
        height: 44,
        borderRadius: 8,
        marginLeft: 4,
    },
});
