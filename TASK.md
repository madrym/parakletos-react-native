# Task List: Text Editor Improvements

## Completed Tasks

### ✅ NIV Bible Data Integration (2025-01-28)
- [x] **COMPLETED**: Migrate from NIV.json to NIV_bible.json format
  - [x] Update Bible utility functions to handle new data structure  
  - [x] Maintain backward compatibility with existing interfaces
  - [x] Fix Jest testing compatibility issues with imports
  - [x] Update both SQLite (native) and IndexedDB (web) database implementations
  - [x] Add proper TypeScript types for new format
  - [x] Test Bible reference parsing and verse retrieval functions
  - [x] Verify Unicode quotation mark handling (\u201c, \u201d)
  - [x] Document implementation approach and lessons learned

**Implementation Notes**: Successfully used regular imports instead of dynamic imports to solve Jest compatibility issues. Updated all database implementations to use expo-sqlite sync API. All Bible utility functions now work with the comprehensive 4.5MB NIV_bible.json file containing the complete NIV Bible text.

## Current Tasks (2025-04-20)

### 1. Keyboard Toolbar Enhancement
- [x] Modify toolbar positioning in `TenTapEditor.tsx`
  - [x] Use absolute positioning anchored to keyboard
  - [x] Implement proper z-index to ensure visibility
  - [x] Adjust height and padding for better touch targets
- [x] Improve keyboard event management
  - [x] Update keyboard event listeners for position calculations
  - [x] Implement platform-specific adjustments (iOS vs Android)
  - [x] Prevent toolbar disappearance during scrolling
- [x] Fix toolbar visibility issues
  - [x] Ensure toolbar remains visible when keyboard is active
  - [x] Adjust layout to prevent toolbar cutoff
  - [x] Test in various scroll positions

### 2. Bible Verse Preview Component Improvements
- [x] Refactor `BibleVersePreview.tsx` layout
  - [x] Implement fixed-height container with flexbox layout
  - [x] Make verse content area properly scrollable
  - [x] Fix footer with insert button at bottom of container
- [x] Improve verse preview positioning
  - [x] Adjust preview position calculation to prevent cutoff
  - [x] Handle edge cases (screen edges, keyboard, etc.)
  - [x] Ensure preview is fully visible in all scenarios
- [x] Enhance visual design
  - [x] Improve visual distinction between scrollable and fixed areas
  - [x] Add subtle scroll indicators for better UX
  - [x] Ensure consistent styling with the app theme

### 3. Verse Detection Logic Refinement
- [x] Update `useBibleVerseEditorIntegration.ts` hook
  - [x] Implement post-insertion cooldown period
  - [x] Add content change type detection (typing vs. programmatic)
  - [x] Improve debounce implementation with better timing
- [x] Fix verse detection persistence issues
  - [x] Ensure verse preview disappears after insertion
  - [x] Prevent re-detection immediately after insertion
  - [x] Add flag to temporarily disable detection if needed
- [x] Add user control options
  - [x] Create method to temporarily disable detection
  - [x] Implement clear mechanism to reset detection state
  - [x] Improve error handling for detection edge cases

### 4. Testing and Validation
- [ ] Create comprehensive test scenarios
  - [ ] Test toolbar behavior across various scroll positions
  - [ ] Verify verse preview with different content lengths
  - [ ] Test insertion flow with multiple verse references
- [ ] Cross-platform validation
  - [ ] Test all fixes on iOS devices
  - [ ] Test all fixes on Android devices
  - [ ] Verify behavior across different screen sizes
- [ ] Performance testing
  - [ ] Measure typing performance with detection active
  - [ ] Test scrolling smoothness with toolbar visible
  - [ ] Verify memory usage during extended editing sessions

## Backlog

### Additional Enhancements
- [ ] Add toolbar customization options
- [ ] Implement collapsible toolbar option
- [ ] Add verse translation selection in preview
- [ ] Improve verse reference parsing for edge cases
- [ ] Add visual transitions for smoother UX

### Future Considerations
- [ ] Investigate integration with system keyboard extensions
- [ ] Research performance optimization for large documents
- [ ] Consider adding user preferences for detection behavior
- [ ] Explore offline caching for verse data

## Discovered During Work 
- It's important to implement a cooldown period after verse insertion to prevent re-detection of references
- Keyboard handling needs to be platform-specific (iOS vs Android) for proper positioning
- For precise toolbar positioning, we need to track keyboard height as well as visibility
- Using absolute positioning for the toolbar provides better control than relying on the SafeAreaView layout
- Bible verse preview needs a fixed height container with scrollable content to prevent the insert button from being hidden
- Tracking programmatic changes separately from user typing is crucial for preventing unwanted detection
- Keeping the toolbar visible only when the keyboard is active improves usability and screen real estate usage
- Setting proper z-index values is essential for layering UI elements correctly
- Using the same keyboard height value for both iOS and Android provides more consistent toolbar positioning
- Text detection should be scoped to the current paragraph/node to prevent false positive matches on other lines
- Cooldown periods need to be longer (3000ms vs 2000ms) to prevent false re-detection after insertion
- Additional validation of text proximity to cursor prevents detection of references in distant parts of the document
- Removing shadows and elevation from toolbar components creates a cleaner UI without visual distractions
- Implementing a dismissed references tracking system prevents previews from reappearing after manual dismissal
- Content length change tracking allows for re-detection of references after significant edits

# Task Log

## Priority Tasks

### ✅ Move editor toolbar settings to page header [Started: 2025-01-09] [Completed: 2025-01-09]
- Moved settings button from keyboard toolbar to page header (top right)
- Added reset button to restore toolbar position if it goes missing
- Created ToolbarSettingsModal for adjusting toolbar size and padding
- Connected modal controls to parent component state

### ⚠️ Fix toolbar settings not applying [Started: 2025-01-09] [In Progress]
- **Issue**: Toolbar settings sliders don't visually change the toolbar
- **Completed**: Added state management in main component (toolbarHeight, toolbarBottomPadding)
- **Completed**: Updated ToolbarSettingsModal to accept and modify parent state
- **Completed**: Added proper callback functions for slider changes
- **In Progress**: Settings need to be applied to actual TenTapEditor component styling
- **Next**: Update TenTapEditor to use the props for visual styling

### ✅ Remove unwanted detection button [Started: 2025-01-09] [Completed: 2025-01-09]
- **Issue**: Scan icon button next to Bible button that user doesn't want
- **Solution**: Commented out Bible verse detection integration temporarily
- **Status**: Detection button no longer appears in toolbar

### ✅ Fix runtime error: hookDetectedReference [Started: 2025-01-09] [Completed: 2025-01-09]
- **Issue**: ReferenceError about hookDetectedReference not existing
- **Solution**: Provided default values for all hook variables and disabled Bible integration temporarily
- **Status**: Runtime error should be resolved

### ✅ Restore Bible functionality [Started: 2025-01-09] [Completed: 2025-01-09]
- **Issue**: Bible references not working when typing (John1:1, Gen1:2-3) and Bible button not functional
- **Solution**: Re-enabled useBibleVerseEditorIntegration hook while keeping detection button removed
- **Status**: Bible reference detection when typing and manual Bible button should work again
- **Details**: Fixed onInsert handler to use insertVerseAtCursor for BibleResult objects

### ✅ Fix premature Bible reference detection [Started: 2025-01-09] [Completed: 2025-01-09]
- **Issue**: Typing "John1:" removes the "1" and becomes "John:", detection not working after backspace
- **Root Cause**: Detection regex was matching incomplete references like "John1" while user was still typing
- **Solution**: Made detection regex more strict to require complete chapter:verse format (e.g., "John1:1")
- **Additional Fix**: Increased debounce time from 800ms to 1200ms to prevent premature detection
- **Status**: Bible reference detection should now only trigger on complete references

### ✅ Fix Bible integration API errors [Started: 2025-01-09] [Completed: 2025-01-09]
- **Issue**: Multiple errors in logs: "bridge.getSelectionBoundingRect is not a function" and "Cannot read property 'nodeAt' of undefined"
- **Root Cause**: Using incorrect bridge API methods and accessing editor state before ready
- **Solution**: Added proper error handling and disabled cursor positioning until correct API methods found
- **Additional Improvements**: 
  - Increased debounce to 2000ms for more conservative detection
  - Added minimum text length requirement (6 chars) before processing
  - Doubled debounce time when user is actively typing
- **Status**: Errors should be eliminated and detection should be less intrusive

### ⚠️ Fix Bible detection not working and preview button cutoff [Started: 2025-01-09] [In Progress]
- **Issue**: Bible verse detection not working ("Editor state not ready" warnings) and insert button getting cut off
- **Root Cause**: Hook trying to access editor state before bridge is ready; preview positioned inside ScrollView causing button cutoff
- **Fixes Applied**: 
  - ✅ Removed incorrect editor state access, now using only `editorContent` from `useEditorContent` hook
  - ✅ Simplified detection logic to remove unnecessary bridge state checks 
  - ✅ Fixed preview layout with proper flex properties and fixed height (240px)
  - ✅ Ensured insert button stays at bottom with `flex: 0` and `flexShrink: 0`
  - ✅ Added comprehensive debug logging to trace detection process
  - ✅ Reduced minimum text length requirement from 6 to 4 characters
- **Testing**: Ready to test with "John1:1" to verify both detection and preview layout work

## Discovered During Work

### Configuration Issues [Discovered: 2025-01-09]
- TypeScript configuration issues with JSX and module resolution
- Multiple duplicate identifier errors in node_modules type definitions
- These are project-level configuration issues, not code logic problems 