import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for the storage
const STORAGE_KEYS = {
  TOOLBAR_HEIGHT: 'parakletos:toolbarHeight',
  BOTTOM_PADDING: 'parakletos:bottomPadding',
};

/**
 * Save the toolbar height preference
 * @param height - The toolbar height in pixels
 */
export const saveToolbarHeight = async (height: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOOLBAR_HEIGHT, height.toString());
  } catch (error) {
    console.error('Error saving toolbar height:', error);
  }
};

/**
 * Get the saved toolbar height preference
 * @returns The saved toolbar height or 50 (default) if not found
 */
export const getToolbarHeight = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.TOOLBAR_HEIGHT);
    return value ? parseInt(value, 10) : 50; // Default to 50 if not found
  } catch (error) {
    console.error('Error getting toolbar height:', error);
    return 50; // Return default in case of error
  }
};

/**
 * Save the bottom padding preference
 * @param padding - The bottom padding in pixels
 */
export const saveBottomPadding = async (padding: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BOTTOM_PADDING, padding.toString());
  } catch (error) {
    console.error('Error saving bottom padding:', error);
  }
};

/**
 * Get the saved bottom padding preference
 * @returns The saved bottom padding or 25 (default) if not found
 */
export const getBottomPadding = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.BOTTOM_PADDING);
    return value ? parseInt(value, 10) : 25; // Default to 25 if not found
  } catch (error) {
    console.error('Error getting bottom padding:', error);
    return 25; // Return default in case of error
  }
}; 