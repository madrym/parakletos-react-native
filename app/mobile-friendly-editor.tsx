import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  SafeAreaView, 
  StatusBar,
  Alert
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TenTapEditor from '../components/TenTapEditor';

// Mobile friendly editor using 10tap
export default function MobileFriendlyEditorPage() {
  // Simple save function
  const saveNote = () => {
    Alert.alert('Save Note', 'Note saved successfully');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Mobile Friendly Editor',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#F5F5DC" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={saveNote} style={styles.saveButton}>
              <Ionicons name="save-outline" size={24} color="#F5F5DC" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#1E1E1E',
          },
          headerTintColor: '#F5F5DC',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <StatusBar barStyle="light-content" />
      <View style={styles.editorContainer}>
        <TenTapEditor initialContent="<p>Start writing in your mobile friendly editor...</p>" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D2D30',
  },
  backButton: {
    marginLeft: 10,
  },
  saveButton: {
    marginRight: 10,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  }
}); 