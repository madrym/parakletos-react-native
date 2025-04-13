import React from 'react';
import { render } from '@testing-library/react';
import { AdvancedEditor } from '../AdvancedEditor';

// Mock the useTenTap hook as it requires a browser environment
// and bridge communication not available in Jest's jsdom environment.
jest.mock('@10play/tentap-editor', () => ({
  ...jest.requireActual('@10play/tentap-editor'), // Keep other exports
  useTenTap: jest.fn(() => null), // Return null or a mock editor object
}));

// Mock Tiptap extensions if necessary (usually not needed for basic render tests)

// Mock window properties if needed
// global.window.dynamicHeight = false;

describe('AdvancedEditor', () => {
  it('renders without crashing', () => {
    // Basic render test to catch immediate errors
    // Note: This does not test the editor functionality itself
    const { container } = render(<AdvancedEditor />);
    expect(container).toBeDefined();
  });

  // Add more tests here if possible, keeping in mind the environment limitations.
  // For example, testing specific props or conditional rendering based on mocks.
}); 