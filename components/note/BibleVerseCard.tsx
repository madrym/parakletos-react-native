import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';

interface BibleVerseCardProps {
    reference: string;
    verses: Array<{verse: number; text: string}>;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
    isExpanded: boolean;
}

export const BibleVerseCard: React.FC<BibleVerseCardProps> = ({ 
    reference, 
    verses, 
    onEdit, 
    onDelete, 
    onToggle,
    isExpanded 
}) => {
    return (
        <Card style={styles.card}>
            <TouchableOpacity onPress={onToggle}>
                <Card.Title
                    title={reference}
                    titleStyle={styles.title}
                    right={(props) => (
                        <View style={styles.actions}>
                            <IconButton
                                icon="pencil"
                                size={18}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                style={styles.iconButton}
                            />
                            <IconButton
                                icon="close"
                                size={18}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                style={[styles.iconButton, styles.deleteButton]}
                            />
                        </View>
                    )}
                    style={styles.cardTitle}
                />
            </TouchableOpacity>
            {isExpanded && (
                <Card.Content style={styles.content}>
                    {verses.map((verse, index) => (
                        <Text key={index} style={styles.verseText}>
                            <Text style={styles.verseNumber}>{verse.verse}</Text>
                            {' '}{verse.text}
                        </Text>
                    ))}
                </Card.Content>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        elevation: 2,
    },
    cardTitle: {
        paddingRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0B4619',
    },
    content: {
        paddingTop: 8,
        paddingBottom: 16,
    },
    verseText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#0B4619',
    },
    verseNumber: {
        fontSize: 10,
        lineHeight: 10,
        color: '#0B4619',
        opacity: 0.7,
    },
    iconButton: {
        margin: 0,
        opacity: 0.8,
    },
    deleteButton: {
        marginLeft: -8,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
}); 