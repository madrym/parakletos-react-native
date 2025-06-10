# Text Editor Improvements

## Project Vision
Enhance the text editor experience to provide a more intuitive, reliable, and user-friendly interface for creating and editing notes. Focus on improving keyboard toolbar behavior, Bible verse preview functionality, and verse detection to eliminate usability issues.

## Current Issues
1. **Keyboard Toolbar Issues**
   - Too small and difficult to use
   - Not consistently positioned above keyboard
   - Disappears when scrolling to the top of the page

2. **Insert Verse Functionality Issues**
   - Button not always visible in the preview
   - Verse preview not properly scrollable with fixed window size
   - Insert verse button sometimes cut off or requires scrolling to view

3. **Verse Detection Issues**
   - Preview keeps reappearing during typing
   - Pop-up persists after verse insertion
   - Constant detection makes app difficult to use

## Architecture Improvements

### 1. Keyboard Toolbar Enhancement
- **Positioning:** Anchor toolbar permanently to the top of the keyboard
- **Visibility:** Ensure toolbar is always visible when keyboard is active
- **Size & Usability:** Increase touch target sizes for better usability
- **Scrolling Behavior:** Prevent toolbar disappearance during scrolling

### 2. Bible Verse Preview Improvements
- **Container Layout:** Fixed height container with proper content scrolling
- **Button Visibility:** Ensure insert button is always visible regardless of content size
- **Positioning:** Improve verse preview positioning to avoid cutoff
- **Responsive Design:** Adapt to different screen sizes and orientations

### 3. Verse Detection Logic Refinement
- **Detection Algorithm:** Improve detection algorithm to reduce false positives
- **Post-Insertion Behavior:** Clear detection state after insertion
- **Debounce Logic:** Enhance debounce mechanism to prevent constant re-detection
- **User Control:** Add ability to temporarily disable detection if needed

## Technical Implementation

### Keyboard Toolbar Fixes
1. Modify `TenTapEditor.tsx` to use absolute positioning for toolbar
2. Implement keyboard event listeners for reliable position calculation
3. Adjust styles to ensure proper visibility during scrolling
4. Improve toolbar rendering to maintain visibility in all states

### Bible Verse Preview Component Improvements
1. Refactor `BibleVersePreview.tsx` with fixed-height container
2. Implement proper ScrollView for verse content only
3. Ensure footer with insert button remains fixed at bottom
4. Improve layout calculations to prevent cutoff in different screen sizes

### Verse Detection Enhancements
1. Update `useBibleVerseEditorIntegration.ts` hook with improved verse detection logic
2. Implement "cooldown" period after insertion to prevent immediate re-detection
3. Add content change tracking to identify typing vs. programmatic changes
4. Refine debounce timing and detection triggers

## Mobile-First Considerations
- Ensure touch targets are appropriately sized (minimum 44×44 pts)
- Optimize for various screen sizes and orientations
- Test thoroughly on both iOS and Android
- Ensure smooth performance with React Native optimizations

## Testing Strategy
1. Test toolbar visibility across multiple scrolling scenarios
2. Verify verse preview displays correctly with various content lengths
3. Confirm insert button is always accessible
4. Test verse detection behavior after insertion and during typing
5. Verify all fixes work consistently across iOS and Android

## Performance Considerations
- Minimize unnecessary re-renders
- Optimize detection algorithm to avoid performance impact
- Use layout performance optimization techniques
- Ensure smooth scrolling and editing experience

## Accessibility
- Ensure all touch targets meet accessibility guidelines
- Provide proper accessibility labels for buttons
- Support screen readers for verse preview and insertion
- Maintain good contrast ratios for text

## Mobile-Friendly Editor Uplift

## Project Vision
Enhance the current mobile-friendly-editor.tsx to provide a polished and integrated editing experience that matches the design aesthetic of the rest of the application. The enhanced editor will provide a seamless mobile experience with improved UI/UX, while adding functionality for note title editing, label management, and folder selection.

## Architecture

### Components
1. **Enhanced Mobile Editor**
   - Updated UI matching app theme (beige and green color scheme)
   - Improved text input with proper padding/margins
   - Mobile keyboard-aware scrolling

2. **Title Editor**
   - Stylized input for note title
   - Proper typography and spacing

3. **Label Management**
   - Label input/creation interface
   - Label selection from previously used labels
   - Label display with delete functionality

4. **Folder Selection**
   - Folder dropdown/modal for selection
   - Option to create new folders
   - Visual indication of selected folder

5. **Bible Verse Insertion**
   - Bible reference parser (handles various formats: "Genesis 1:1", "Gen 1:1", etc.)
   - Verse preview component (scrollable, with verse numbers)
   - Collapsible verse component within editor
   - Toolbar integration with Bible icon
   - Inline reference detection and suggestion

### Data Flow
1. User edits note content using TenTapEditor
2. User can modify title, labels, and folder selection
3. Data is saved to Convex backend
4. Previously used labels are stored for future selection
5. Bible references are parsed, verses retrieved from local database, and inserted as collapsible components

## Bible Verse Feature Specifics

### Bible Reference Parser
- Detect and parse various Bible reference formats:
  - Full book names: "Genesis 1:1"
  - Abbreviated book names: "Gen 1:1"
  - Chapter-only references: "Genesis 1" (returns entire chapter)
  - Verse ranges: "Genesis 1:1-10"
  - Whitespace variations: "Gen1:1", "Gen 1:1", etc.

### Verse Preview Component
- Scrollable container showing retrieved verses
- Formatted with proper verse numbers
- Clean typography for readability
- Action buttons for insertion/cancellation

### Collapsible Verse Component
- Collapsed state: Shows only verse reference (e.g., "Genesis 1:1-10")
- Expanded state: Shows full text of all verses
- Toggle control for expansion/collapse
- Distinctive styling to differentiate from regular text

### Integration Methods
1. **Inline Detection**:
   - Monitor editor content for potential Bible references
   - Show verse preview when a valid reference is detected
   - Allow insertion directly from preview

2. **Toolbar Button**:
   - Bible icon in editor toolbar
   - Opens modal for manual reference entry
   - Shows preview and allows insertion

## Tech Stack
- **Frontend**: React Native with Expo
- **Backend**: Convex
- **Editor**: TenTapEditor (already implemented)
- **Navigation**: Expo Router
- **State Management**: React hooks for local state
- **Bible Data**: Local JSON file (NIV.json)

## UI/UX Principles
- **Color Scheme**: Match app's existing color scheme (#F5F5DC, #0B4619)
- **Typography**: Consistent with app's existing text styles
- **Spacing**: Proper padding and margins for mobile viewing
- **Keyboard Handling**: Ensure content doesn't get hidden by keyboard
- **Responsive Design**: Ensure proper layout on different screen sizes

## Mobile-First Considerations
- Ensure touch targets are appropriately sized (minimum 44x44 pts)
- Implement proper keyboard avoidance
- Optimize scrolling behavior
- Ensure accessible text sizes
- Implement efficient auto-save functionality

## Data Schema
The existing Convex schema supports:
- Notes (title, content, userId, folderId, tags, timestamps)
- Folders (name, emoji, userId, timestamps)
- Users (name, email, tokenIdentifier)

No schema changes are required for this implementation.

## Bible Data Structure
The Bible data is stored in a structured JSON format:
```json
[
  {
    "book": "Genesis",
    "chapters": [
      {
        "chapter": 1,
        "verses": [
          {
            "verse": 1,
            "text": "In the beginning God created the heavens and the earth."
          },
          // Additional verses...
        ]
      }
    ]
  }
]
```

## API Endpoints
The existing Convex mutations will be used:
- `createNote` - Creating new notes
- `updateNote` - Updating existing notes
- `createFolder` - Creating new folders

## Constraints
- Maintain compatibility with existing TenTapEditor
- Ensure performance on mobile devices
- Preserve existing note data structure
- Implement auto-save functionality similar to other parts of the app
- Efficiently handle the potentially large Bible data set
- Provide graceful fallbacks if references are invalid 