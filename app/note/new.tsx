import { useEffect } from 'react';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { Alert } from 'react-native';

export default function NewNotePage() {
  const { user } = useUser();
  const createNote = useMutation(api.mutations.createNote);

  useEffect(() => {
    async function createNewNote() {
      if (!user) {
        Alert.alert('Error', 'You must be signed in to create a note');
        router.back();
        return;
      }

      try {
        const result = await createNote({
          title: 'Untitled Note',
          content: '',
          userId: user.id,
          tags: [],
        });
        router.replace(`/note/${result}`);
      } catch (error) {
        console.error('Error creating note:', error);
        Alert.alert('Error', 'Failed to create new note. Please try again.');
        router.back();
      }
    }

    createNewNote();
  }, [user]);

  return null; // This page immediately redirects, so no need to render anything
} 