# Cursor Memory: Notes & Learnings

## Application Theming (Added: 2025-04-12)

### Color Scheme
- Primary app color palette: 
  - Dark green (#0B4619) - Used for headers and primary UI elements
  - Beige (#F5F5DC) - Used for text and contrast against dark backgrounds
  - Light green (#87A96B) - Used for highlights, links, and active elements
  - Dark gray (#272727) - Used for backgrounds and editor canvas

### Editor Styling
- TenTapEditor can be customized via the `useEditorBridge` hook's `theme` property
- Important theme sections:
  - `toolbar` - Controls the styling of the formatting toolbar
  - `webview` - Controls the styling of the editor content area
  - `colorKeyboard` - Controls color picker options
- Default white background was replaced with dark theme for better aesthetics and eye comfort

### Theme Implementation (Updated: 2025-04-12)
- TenTapEditor requires specific property naming in the `theme` object to avoid linter errors
- Theme customization uses two primary approaches:
  1. Native UI theming via the `theme` property
  2. Content styling via CSS injection through bridge extensions
- CSS can be injected in multiple ways:
  - Using `CoreBridge.configureCSS()` during initialization
  - Using `editor.injectCSS()` method for dynamic theme changes
- TenTap provides built-in themes and CSS:
  - `darkEditorTheme` - Native UI dark theme
  - `darkEditorCss` - Content styling for dark theme
- For theme switching, maintain separate theme configurations:
  - Native UI theme objects
  - CSS string templates for content styling

### Available Editor Themes (Added: 2025-04-12)
- Light - Standard light theme with white background and dark text
- Dark - Standard dark theme with dark background and light text
- Obsidian - Dark theme inspired by Obsidian note-taking app
- Nature - App-branded theme using the standard color palette:
  - Beige background (#F5F5DC)
  - Dark green text (#0B4619)
  - Light green accents (#87A96B)
  - Enhanced styling for headings and blockquotes
  - Custom styling for code blocks with light green background

### Mobile UI Patterns (Updated: 2025-04-12)
- Bottom Sheet Pattern:
  - Used a bottom sheet for theme selection UI that slides up from bottom
  - Implemented with Animated API for smooth animations with spring physics
  - Better suited for mobile than modal dialogs
  - Semi-transparent backdrop for focus on the bottom sheet content
  - Touch outside to dismiss
- Direct Action Pattern:
  - Replaced multi-level navigation (settings > theme) with direct access to theme selector
  - Changed settings icon to color palette icon for clearer meaning
  - Single tap to open theme selection
- Visual Indicators:
  - Theme preview color swatch
  - Checkmark for currently selected theme
  - Subtle background color change for selected option

### React Native Animation Techniques (Added: 2025-04-12)
- Used React Native's Animated API for smooth transitions
- Implemented responsive animations that work with device dimensions
- Animation configuration:
  - Spring physics for natural motion
  - Native driver for better performance
  - Configurable tension and friction for fine-tuning motion feel
- Proper animation cleanup through conditional rendering

### React Native Styling Patterns
- Container components should have consistent background colors (#272727)
- Navigation headers use the primary green (#0B4619)
- Text should use the beige color (#F5F5DC) for good contrast on dark backgrounds
- Maintain padding of 16px for content areas
- Consistent border radius of 8px for UI elements

## Component Communication (Added: 2025-04-12)
- Used React's forwardRef and useImperativeHandle for parent-child communication:
  - Parent component passes theme ID to child
  - Child exposes methods (updateTheme) that parent can call
  - This creates a clean separation of concerns while allowing bidirectional communication
- Defined clear TypeScript interfaces for props and ref methods to ensure type safety
- Established a consistent theme switching flow:
  1. User selects theme from settings menu
  2. Parent component updates its theme state
  3. Parent calls child component's updateTheme method via ref
  4. Child component applies the theme changes

## User Preferences (Added: 2025-04-12)
- Theme selection UI is positioned in a bottom sheet for better mobile UX
- Clear visual feedback for the currently selected theme
- When implementing theme switching:
  1. Update React Native component styles
  2. Update editor content via CSS injection
  3. Persist user preferences for future sessions (to be implemented)

## Mobile-First Development Lessons (Added: 2025-04-12)
- Modal dialogs can be problematic on mobile - use bottom sheets or action sheets instead
- For interactive controls, ensure tap targets are at least 44x44 points
- Test animations on device to ensure proper performance
- Prefer direct actions over multi-level navigation when possible
- Use native mobile patterns (swipe, bottom sheets) rather than web patterns (modals, dropdowns)
- Ensure clear visual feedback for user interactions
- KeyboardAvoidingView with proper configuration is essential for a good mobile editing experience
- Title input field should have clear focus/blur states for better user feedback
- Text inputs should handle empty values gracefully with sensible defaults

## Future Enhancements to Consider
- Consider adding an option to toggle between light and dark themes
- Explore saving user preferences for editor font size and line spacing
- Investigate performance optimizations for large documents in the editor
- Implement a proper theme context using React Context API to share theme state across components
- Add more settings options to the settings menu (font size, line spacing, auto-save frequency)

## Title Editing Implementation (Added: 2025-04-12)

### Input Field Design
- Used a dedicated TextInput component for title editing
- Styled consistently with the app's theme system
- Implemented visual feedback for focus state:
  - Subtle border-bottom highlight when focused
  - Use of the app's primary color (#0B4619) for focus indicators
- Positioned the title field above the content editor for natural information hierarchy

### State Management
- Managed title state at the editor page component level
- Implemented validation to prevent empty titles (fallback to "Untitled Note")
- Used multiple state variables for cleaner code organization:
  - `title` for the actual title text
  - `isEditing` to track focused state
  - `isSaving` to manage save operation feedback

### User Experience Considerations
- Clear visual distinction between title and content
- Auto-trimming of whitespace when user finishes editing
- Default placeholder text for new notes
- Keyboard avoidance to prevent input field from being covered
- Visual feedback during save operations:
  - Disabled save button during saving
  - Icon change to indicate in-progress state
  - Completion notification on success

### Mobile-Specific Optimizations
- Used KeyboardAvoidingView with proper configuration:
  - Different behavior for iOS and Android (padding vs. height)
  - Custom offset to account for header height
- Optimized input field size for touch interaction on mobile
- Implemented proper placeholder color with opacity for subtle appearance

### Integration with Backend
- Prepared simulated save functionality with timeout
- Added structure for Convex integration (commented code)
- Implemented error handling for save operations
- Used async/await pattern for asynchronous operations 

## Label Management Implementation (Added: 2025-04-12)

### UI Design for Labels
- Implemented label chips with rounded corners for a modern look
- Used horizontal scrolling for labels on mobile (better than wrapping)
- Semi-transparent background (20% opacity) using color from the theme
- Added close button for each label with appropriate touch target size
- Displayed labels between title and editor content for logical organization

### Bottom Sheet Interface
- Reused the bottom sheet pattern from theme selection for consistency
- Created a dedicated bottom sheet for label creation and selection
- Used tab-targeted focus to automatically highlight the label input
- Provided a list of previously used labels for quick selection
- Disabled submission for empty labels

### Label State Management
- Created distinct state arrays for active labels and previously used labels
- Used array operations for adding and removing labels
- Implemented duplicate prevention for both active and previously used labels
- Ensured labels are properly passed to save operation

### Mobile UX Considerations
- Used clear visual icons (price tag) for label management
- Made label input keyboard behavior optimized for quick entry
- Implemented return key to add a label
- Provided visual feedback with disabled state for empty inputs
- Ensured proper input clearing after submission

### Pattern Reuse
- Leveraged existing bottom sheet pattern for better code maintainability
- Used consistent styling approach across theme and label interfaces
- Applied shared animation techniques for smoother transitions
- Maintained the same approach to backdrop and dismissal behavior

### Data Flow
- Properly integrated labels with save functionality
- Structured the component to reflect the backend data model
- Used arrays that can be directly passed to Convex mutations
- Set up app data in a format matching the schema.ts definition

## Mobile-First Development Lessons (Added: 2025-04-12)

- Horizontal scrolling for labels provides better UX than wrapping on mobile
- Reusing UI patterns across features creates a more coherent, learnable interface
- Previously used selections improve usability by reducing repetitive typing
- Use opacity values for visual hierarchy (e.g., 20% opacity backgrounds for chips)

## Folder Selection Implementation (Added: 2025-04-12)

### UI Design for Folders
- Created a dedicated bottom sheet with two distinct modes:
  - Selection mode - Displays existing folders with checkmarks for current selection
  - Creation mode - Form with name input and emoji selector
- Used familiar folder icons and emoji for strong visual identification
- Displayed the current folder with a subtle badge at the top of the editor
- Used consistent styling with other interface elements to maintain cohesion

### Emoji Selector
- Implemented a grid-based emoji selector for visual folder identification
- Limited options to relevant emojis to reduce cognitive load
- Used selection state highlighting to show current choice
- Made touch targets appropriately sized for mobile (44x44 pts)
- Displayed the selected emoji alongside folder name for quick recognition

### State Management
- Managed folder state with proper TypeScript interfaces
- Used nullable state (Folder | null) to handle the "no folder" case
- Implemented simulated creation flow that would connect to Convex backend
- Handled ID generation with timestamp (would be replaced by backend ID)

### User Experience Flow
- Implemented multi-step process with clear navigation:
  1. Tap folder icon in header to open selector
  2. View and select existing folders or tap "Create New Folder"
  3. If creating: enter name, select emoji, tap create
  4. Selected folder appears as badge at top of editor
- Added "No Folder (Root)" option for notes without a folder

### Mobile-Optimized Interactions
- Created a visually compact folder indicator
- Used semi-transparent background with 10% opacity for subtle visual cue
- Added emoji prefix to folder name for quick visual identification
- Ensured all elements maintain proper spacing and alignment on mobile

### Pattern Consistency
- Reused the bottom sheet pattern from theme and label selection
- Maintained consistent animations, transitions, and dismissal behaviors
- Utilized the same form styling for folder creation
- Created a cohesive ecosystem of bottom sheets with predictable behavior

### Component Structure
- Created a dedicated component for the folder bottom sheet
- Separated folder display and creation into logical sections
- Used conditional rendering to switch between modes
- Maintained clean type definitions with interfaces

## Mobile-First Development Lessons (Added: 2025-04-12)

- Emoji selection provides distinct visual cues that work across language barriers
- Multiple bottom sheets with consistent UI patterns improves learnability
- Semi-transparent UI elements (10-20% opacity) create visual hierarchy without overwhelming
- Two-mode interfaces (selection/creation) work well when clearly separated
- Grid layouts for small touch targets provide efficient use of limited mobile space

## Keyboard Handling Implementation (Added: 2025-04-12)

### Event Handling for Keyboard
- Used Keyboard API listeners to detect keyboard appearance and dismissal
- Implemented different event names for iOS vs Android:
  - iOS: `keyboardWillShow` and `keyboardWillHide` (predictive)
  - Android: `keyboardDidShow` and `keyboardDidHide` (reactive)
- Stored keyboard height and visibility state in component state
- Ensured proper cleanup of listeners in useEffect return function

### KeyboardAvoidingView Configuration
- Used different behavior based on platform:
  - iOS: `padding` behavior works best (adjusts content padding)
  - Android: `height` behavior is more reliable (adjusts container height)
- Calculated dynamic vertical offset based on platform and orientation
- Enabled smooth animations when keyboard appears/disappears
- Wrapped ScrollView inside TouchableWithoutFeedback for tap-to-dismiss

### Layout Animations
- Implemented LayoutAnimation for smooth transitions when keyboard appears/hides
- Added configuration for Android with UIManager.setLayoutAnimationEnabledExperimental
- Used easeInEaseOut preset for natural feeling animations
- Applied animations triggered by keyboard events

### Scroll Position Management
- Added ref to ScrollView for programmatic scrolling
- Auto-scrolled to bottom when keyboard appears for better focus visibility
- Used small timeout delay to ensure layout completes before scrolling
- Set keyboardShouldPersistTaps="handled" to prevent keyboard dismissal when interacting with scrollable content

### Floating Action Button
- Added floating action button (FAB) that appears only when keyboard is visible
- Positioned at bottom-right for easy thumb access on mobile
- Connected to save functionality for quick saving without dismissing keyboard
- Applied same visual styling and feedback as header save button
- Used appropriate z-index to ensure visibility

### Device Orientation Handling
- Added orientation detection using Dimensions event listener
- Adjusted layouts dynamically based on portrait/landscape orientation
- Used reduced editor height in landscape mode
- Modified keyboard offsets based on orientation
- Added cleanup for dimension listeners in useEffect

### Platform-Specific Optimizations
- Implemented different bottom padding strategies:
  - iOS: Added extra view with fixed height
  - Android: Used dynamic padding based on keyboard height
- Added additional padding when bottom toolbar present
- Optimized for both iOS and Android keyboard behaviors
- Tested various device sizes in both orientations

### Content Accessibility
- Ensured all content remains accessible when keyboard is visible
- Used scrollable container to allow viewing content behind keyboard
- Implemented proper handling for fixed-position elements
- Added extra padding at bottom of content to prevent clipping
- Preserved all navigation controls during keyboard interaction

## Mobile-First Development Lessons (Added: 2025-04-12)

- Different keyboard handling is required for iOS vs Android platforms
- Layout animations make keyboard transitions feel more natural and polished
- Floating action buttons (FABs) provide easy access to important actions
- Plan for both portrait and landscape orientations with responsive adjustments
- Use programmatic scrolling to keep the focused input field in view
- Wrap scrollable content in TouchableWithoutFeedback for easy keyboard dismissal
- Different bottom padding strategies are needed for various platforms

## Toolbar Implementation (Added: 2025-04-12)

### Keyboard-Anchored Toolbar
- Positioned the formatting toolbar directly above the keyboard for a more native feel
- Used absolute positioning with bottom: 0 to ensure toolbar is always at keyboard level
- Added border and background styling to visually separate toolbar from keyboard
- Ensured toolbar appears and disappears with keyboard through keyboard event listeners
- Designed the toolbar to look like an extension of the native keyboard

### Toggle Mechanism
- Added a small floating toggle button above the toolbar
- Implemented toggle animation for showing/hiding toolbar with user control
- Used chevron icons (up/down) to indicate current state and action
- Positioned the toggle button for easy one-handed access on mobile
- Maintained consistent styling with the rest of the app

### Animation Techniques
- Implemented smooth animations for hiding/showing toolbar
- Used Animated API with translateY transform for natural sliding motion
- Captured toolbar height to ensure smooth animations regardless of content
- Added opacity animation for subtle fade effect during transitions
- Set appropriate animation duration (200ms) for responsive but smooth feel

### Component Integration
- Ensured proper communication between editor and toolbar components
- Passed editor instance correctly to toolbar for formatting actions
- Connected keyboard events and toolbar state for coordinated behavior
- Used refs and props to maintain clean component boundaries
- Designed the toolbar to maintain state across keyboard hide/show events

### Mobile UX Considerations
- Reduced screen space used by moving toolbar to keyboard area
- Provided user control over visibility for maximum screen space when needed
- Implemented proper z-indexing to ensure toolbar appears above content
- Added visual elevation (shadow) to the toggle button for better visibility
- Ensured touch targets were appropriately sized for mobile interaction

### Platform-Specific Handling
- Adjusted toolbar behavior based on platform differences
- Accounted for different keyboard behaviors on iOS and Android
- Used platform-specific keyboard event names for predictive vs. reactive behavior
- Ensured cleanup of event listeners to prevent memory leaks
- Tested on various device sizes for consistent experience

### Performance Optimization
- Used native driver for animations to keep them on the UI thread
- Implemented efficient rendering by minimizing state changes
- Only showed toolbar when keyboard is visible to reduce unnecessary rendering
- Used layout measurement to dynamically adapt to different device sizes
- Added memoization where appropriate to prevent wasteful recalculations

## Mobile-First Development Lessons (Added: 2025-04-12)

- Attaching UI elements to the keyboard creates a more integrated mobile experience
- Toggle controls work well for optional UI elements that users may want to hide
- Animation cues help users understand the relationship between UI elements
- Toolbar positioning directly above keyboard follows platform UI conventions
- Small toggle buttons with clear icons require less explanation for users
- Coordinating animations with keyboard behavior creates smoother transitions
- Absolute positioning works better than fixed positioning for keyboard-related UI on mobile

## Bible Verse Insertion Feature (Added: 2025-04-15)

### Bible Reference Parsing
- Created a comprehensive Bible reference parser in `utils/bible.ts` that handles:
  - Full book names: "Genesis 1:1"
  - Abbreviated book names: "Gen 1:1"
  - Chapter-only references: "Genesis 1" (returns entire chapter)
  - Verse ranges: "Genesis 1:1-10"
  - Format variations: "Gen1:1", "Gen 1:1"
- Used a combination of regex patterns and normalization logic to handle diverse input formats
- Implemented a large mapping of book abbreviations to full names for maximum compatibility
- Created utility functions for:
  - Reference parsing (`parseReference`)
  - Verse retrieval (`getVersesFromReference`) 
  - Reference detection in text (`detectBibleReference`)
  - Reference validation (`isValidReference`)

### Data Structure and Management
- Used a structured JSON format (NIV.json) to store Bible verses
- Implemented proper TypeScript interfaces for Bible data:
  - `BibleVerse` - Individual verse with number and text
  - `BibleChapter` - Collection of verses within a chapter
  - `BibleBook` - Collection of chapters within a book
  - `BibleResult` - Search result with formatted reference and verses
- Implemented caching mechanism to load Bible data only once 
- Created efficient lookup functions to retrieve verses based on references
- Handled error cases gracefully with informative error messages

### Component Architecture
- Designed three core components for the feature:
  - `BibleVersePreview` - Displays a preview of detected/selected Bible verses
  - `CollapsibleVerseComponent` - Renders inserted verses in the editor (expandable/collapsible)
  - `BibleReferenceModal` - Modal for manual Bible reference entry
- Created a custom React hook (`useBibleReferenceHandler`) to:
  - Detect Bible references in editor content
  - Manage Bible verse lookup and state
  - Provide callbacks for verse insertion
  - Handle debounced detection to prevent performance issues

### User Experience Design
- Created two distinct paths for verse insertion:
  1. Inline detection:
     - Automatically detects Bible references as the user types
     - Shows preview popup with verse text
     - Offers option to insert formatted verses
  2. Toolbar button:
     - Bible icon in editor toolbar
     - Opens modal for manual reference entry
     - Provides feedback during lookup
     - Shows preview before insertion
- Designed collapsible verse blocks in editor:
  - Collapsed state shows just the reference for cleaner notes
  - Expanded state shows full verse text with proper formatting
  - Toggle with click/tap for easy expansion
  - Visually distinct from regular text with subtle styling

### Mobile Optimizations
- Used debouncing for reference detection to prevent performance issues on mobile
- Designed scrollable verse previews for larger verse selections
- Implemented responsive layout that adapts to available screen space
- Added proper keyboard handling for reference input
- Used appropriate touch targets for all interactive elements
- Implemented loading indicators for feedback during verse lookup

### Performance Considerations
- Added caching for Bible data to prevent repeated loading
- Used debounced detection to minimize processing during typing
- Implemented efficient regex patterns for reference detection
- Added reference validation before fetching verses to prevent unnecessary lookups
- Limited verse preview height with scrollable container for larger selections
- Applied memoization via useCallback for event handlers

### UI Integration
- Matched the Bible verse UI components with the app's existing theme system
- Used consistent colors and styling across all components
- Added proper icon usage (Bible icon from assets)
- Designed modular components that can receive theme properties
- Created adaptive UI that responds to the current app theme

### Lessons Learned
- Bible reference parsing is complex due to various formats and abbreviations
- Custom nodes in rich text editors require careful integration with the editor's internal structure
- Debouncing is essential for text processing operations during typing
- Preview features need careful positioning to avoid covering the user's input
- Collapsible content requires thoughtful design to indicate expandability
- Local data storage (NIV.json) is preferable to network requests for a better mobile experience
- Semi-transparent backgrounds create visual distinction without being distracting
- Expandable UI elements should include clear visual indicators of their state

## Folder Selection Implementation (Added: 2025-04-12)

### UI Design for Folders
- Created a dedicated bottom sheet with two distinct modes:
  - Selection mode - Displays existing folders with checkmarks for current selection
  - Creation mode - Form with name input and emoji selector
- Used familiar folder icons and emoji for strong visual identification
- Displayed the current folder with a subtle badge at the top of the editor
- Used consistent styling with other interface elements to maintain cohesion

### Emoji Selector
- Implemented a grid-based emoji selector for visual folder identification
- Limited options to relevant emojis to reduce cognitive load
- Used selection state highlighting to show current choice
- Made touch targets appropriately sized for mobile (44x44 pts)
- Displayed the selected emoji alongside folder name for quick recognition

### State Management
- Managed folder state with proper TypeScript interfaces
- Used nullable state (Folder | null) to handle the "no folder" case
- Implemented simulated creation flow that would connect to Convex backend
- Handled ID generation with timestamp (would be replaced by backend ID)

### User Experience Flow
- Implemented multi-step process with clear navigation:
  1. Tap folder icon in header to open selector
  2. View and select existing folders or tap "Create New Folder"
  3. If creating: enter name, select emoji, tap create
  4. Selected folder appears as badge at top of editor
- Added "No Folder (Root)" option for notes without a folder

### Mobile-Optimized Interactions
- Created a visually compact folder indicator
- Used semi-transparent background with 10% opacity for subtle visual cue
- Added emoji prefix to folder name for quick visual identification
- Ensured all elements maintain proper spacing and alignment on mobile

### Pattern Consistency
- Reused the bottom sheet pattern from theme and label selection
- Maintained consistent animations, transitions, and dismissal behaviors
- Utilized the same form styling for folder creation
- Created a cohesive ecosystem of bottom sheets with predictable behavior

### Component Structure
- Created a dedicated component for the folder bottom sheet
- Separated folder display and creation into logical sections
- Used conditional rendering to switch between modes
- Maintained clean type definitions with interfaces

## Mobile-First Development Lessons (Added: 2025-04-12)

- Emoji selection provides distinct visual cues that work across language barriers
- Multiple bottom sheets with consistent UI patterns improves learnability
- Semi-transparent UI elements (10-20% opacity) create visual hierarchy without overwhelming
- Two-mode interfaces (selection/creation) work well when clearly separated
- Grid layouts for small touch targets provide efficient use of limited mobile space

## Keyboard Handling Implementation (Added: 2025-04-12)

### Event Handling for Keyboard
- Used Keyboard API listeners to detect keyboard appearance and dismissal
- Implemented different event names for iOS vs Android:
  - iOS: `keyboardWillShow` and `keyboardWillHide` (predictive)
  - Android: `keyboardDidShow` and `keyboardDidHide` (reactive)
- Stored keyboard height and visibility state in component state
- Ensured proper cleanup of listeners in useEffect return function

### KeyboardAvoidingView Configuration
- Used different behavior based on platform:
  - iOS: `padding` behavior works best (adjusts content padding)
  - Android: `height` behavior is more reliable (adjusts container height)
- Calculated dynamic vertical offset based on platform and orientation
- Enabled smooth animations when keyboard appears/disappears
- Wrapped ScrollView inside TouchableWithoutFeedback for tap-to-dismiss

### Layout Animations
- Implemented LayoutAnimation for smooth transitions when keyboard appears/hides
- Added configuration for Android with UIManager.setLayoutAnimationEnabledExperimental
- Used easeInEaseOut preset for natural feeling animations
- Applied animations triggered by keyboard events

### Scroll Position Management
- Added ref to ScrollView for programmatic scrolling
- Auto-scrolled to bottom when keyboard appears for better focus visibility
- Used small timeout delay to ensure layout completes before scrolling
- Set keyboardShouldPersistTaps="handled" to prevent keyboard dismissal when interacting with scrollable content

### Floating Action Button
- Added floating action button (FAB) that appears only when keyboard is visible
- Positioned at bottom-right for easy thumb access on mobile
- Connected to save functionality for quick saving without dismissing keyboard
- Applied same visual styling and feedback as header save button
- Used appropriate z-index to ensure visibility

### Device Orientation Handling
- Added orientation detection using Dimensions event listener
- Adjusted layouts dynamically based on portrait/landscape orientation
- Used reduced editor height in landscape mode
- Modified keyboard offsets based on orientation
- Added cleanup for dimension listeners in useEffect

### Platform-Specific Optimizations
- Implemented different bottom padding strategies:
  - iOS: Added extra view with fixed height
  - Android: Used dynamic padding based on keyboard height
- Added additional padding when bottom toolbar present
- Optimized for both iOS and Android keyboard behaviors
- Tested various device sizes in both orientations

### Content Accessibility
- Ensured all content remains accessible when keyboard is visible
- Used scrollable container to allow viewing content behind keyboard
- Implemented proper handling for fixed-position elements
- Added extra padding at bottom of content to prevent clipping
- Preserved all navigation controls during keyboard interaction

## Mobile-First Development Lessons (Added: 2025-04-12)

- Different keyboard handling is required for iOS vs Android platforms
- Layout animations make keyboard transitions feel more natural and polished
- Floating action buttons (FABs) provide easy access to important actions
- Plan for both portrait and landscape orientations with responsive adjustments
- Use programmatic scrolling to keep the focused input field in view
- Wrap scrollable content in TouchableWithoutFeedback for easy keyboard dismissal
- Different bottom padding strategies are needed for various platforms

## Toolbar Implementation (Added: 2025-04-12)

### Keyboard-Anchored Toolbar
- Positioned the formatting toolbar directly above the keyboard for a more native feel
- Used absolute positioning with bottom: 0 to ensure toolbar is always at keyboard level
- Added border and background styling to visually separate toolbar from keyboard
- Ensured toolbar appears and disappears with keyboard through keyboard event listeners
- Designed the toolbar to look like an extension of the native keyboard

### Toggle Mechanism
- Added a small floating toggle button above the toolbar
- Implemented toggle animation for showing/hiding toolbar with user control
- Used chevron icons (up/down) to indicate current state and action
- Positioned the toggle button for easy one-handed access on mobile
- Maintained consistent styling with the rest of the app

### Animation Techniques
- Implemented smooth animations for hiding/showing toolbar
- Used Animated API with translateY transform for natural sliding motion
- Captured toolbar height to ensure smooth animations regardless of content
- Added opacity animation for subtle fade effect during transitions
- Set appropriate animation duration (200ms) for responsive but smooth feel

### Component Integration
- Ensured proper communication between editor and toolbar components
- Passed editor instance correctly to toolbar for formatting actions
- Connected keyboard events and toolbar state for coordinated behavior
- Used refs and props to maintain clean component boundaries
- Designed the toolbar to maintain state across keyboard hide/show events

### Mobile UX Considerations
- Reduced screen space used by moving toolbar to keyboard area
- Provided user control over visibility for maximum screen space when needed
- Implemented proper z-indexing to ensure toolbar appears above content
- Added visual elevation (shadow) to the toggle button for better visibility
- Ensured touch targets were appropriately sized for mobile interaction

### Platform-Specific Handling
- Adjusted toolbar behavior based on platform differences
- Accounted for different keyboard behaviors on iOS and Android
- Used platform-specific keyboard event names for predictive vs. reactive behavior
- Ensured cleanup of event listeners to prevent memory leaks
- Tested on various device sizes for consistent experience

### Performance Optimization
- Used native driver for animations to keep them on the UI thread
- Implemented efficient rendering by minimizing state changes
- Only showed toolbar when keyboard is visible to reduce unnecessary rendering
- Used layout measurement to dynamically adapt to different device sizes
- Added memoization where appropriate to prevent wasteful recalculations

## Mobile-First Development Lessons (Added: 2025-04-12)

- Attaching UI elements to the keyboard creates a more integrated mobile experience
- Toggle controls work well for optional UI elements that users may want to hide
- Animation cues help users understand the relationship between UI elements
- Toolbar positioning directly above keyboard follows platform UI conventions
- Small toggle buttons with clear icons require less explanation for users
- Coordinating animations with keyboard behavior creates smoother transitions
- Absolute positioning works better than fixed positioning for keyboard-related UI on mobile

## TenTap Advanced Editor Setup (Added: 2025-04-16)

- **Setup Type**: Implemented the "Advanced Setup" for TenTapEditor, specifically using the "Alternative Setup" tailored for Expo development.
- **Directory**: Created a separate `editor-web` directory for the web-based editor code.
- **Bundler**: Uses Vite to bundle the `editor-web` code into a single `editorHtml.ts` file.
- **Build Process**: 
    - `npm run editor:build`: Builds the web editor.
    - `npm run editor:dev`: Runs Vite in watch mode (`-w build`) to automatically rebuild `editorHtml.ts` on changes. Expo's Metro bundler then picks up the change in the imported `editorHtml.ts` file.
    - `npm run editor:post-build`: Script provided by TenTap to convert the built HTML into the `.ts` export.
- **Integration**: The main `components/TenTapEditor.tsx` imports `editorHtml` from `editor-web/build/editorHtml.ts` and passes it to `useEditorBridge` via the `customSource` option.
- **Configuration**: Requires careful setup of `editor-web/tsconfig.json`, `editor-web/vite.config.ts`, and excluding `editor-web` from the root `tsconfig.json`.

### Lessons Learned During Setup (2025-04-16)
- **Dependency Conflicts**: Be mindful of `@types/react` version compatibility when installing dependencies (`@types/react-dom`). Had to explicitly install v18 compatible versions.
- **Vite Aliases**: Resolving `node_modules` dependencies (especially `@tiptap/*` and `@10play/tentap-editor`) within the nested `editor-web` environment required specific aliases in `vite.config.ts`. 
    - Initially tried generic regex aliases (`/^@tiptap\/(.*)$/`), but these failed.
    - Switched to explicit aliases for each required Tiptap package, pointing directly to their `dist/index.js` entry points (discovered via `list_dir`).
    - Also needed aliases for `react` and `react-dom` to ensure a single instance.
- **Duplicate Extensions**: The `TenTapStartKit` bridge includes many common Tiptap extensions. Avoid explicitly adding these same extensions again in the `tiptapOptions.extensions` array within `AdvancedEditor.tsx`, as this causes `Duplicate extension names found` warnings and `RangeError: Adding different instances of a keyed plugin` errors (e.g., for `History`). Only add extensions *not* included in the kit.
- **Testing Web Components**: Testing React components designed for a WebView (`AdvancedEditor.tsx`) with `jest-expo` is limited. Basic render tests with mocks for hooks like `useTenTap` are possible, but full functionality testing requires manual verification or E2E tools.
- **TypeScript Resolution**: There can be discrepancies between how TypeScript (via editor tooling using `tsconfig.json`) resolves types and how Vite resolves modules during build (using `vite.config.ts` aliases). Removing `paths` from `editor-web/tsconfig.json` helped reduce linter noise once the Vite build was working correctly.

## Future Enhancements to Consider
- Consider adding an option to toggle between light and dark themes
- Explore saving user preferences for editor font size and line spacing
- Investigate performance optimizations for large documents in the editor
- Implement a proper theme context using React Context API to share theme state across components
- Add more settings options to the settings menu (font size, line spacing, auto-save frequency)

- Modal dialogs can be problematic on mobile - use bottom sheets or action sheets instead
- For interactive controls, ensure tap targets are at least 44x44 points
- Test animations on device to ensure proper performance
- Prefer direct actions over multi-level navigation when possible
- Use native mobile patterns (swipe, bottom sheets) rather than web patterns (modals, dropdowns)
- Ensure clear visual feedback for user interactions
- KeyboardAvoidingView with proper configuration is essential for a good mobile editing experience
- Title input field should have clear focus/blur states for better user feedback
- Text inputs should handle empty values gracefully with sensible defaults

## React Native <-> WebView (TenTap Editor) Communication Learnings (YYYY-MM-DD):

*   **Problem:** Communicating reliably from React Native (e.g., `useBibleVerseEditorIntegration.ts`) to execute commands on the Tiptap editor instance inside the WebView (`editor-web/AdvancedEditor.tsx`) using `@10play/tentap-editor` is prone to timing issues.
*   **`injectJS` Timing:** `editor.injectJS` from RN often runs *before* the WebView's Tiptap `onCreate` callback finishes.
*   **Failed Approaches:**
    *   Directly accessing `window.tipTapEditor` from injected JS often fails because it's not ready.
    *   Using `window.ReactNativeWebView.postMessage` from injected JS did *not* reliably trigger the `onBridgeMessage` handler in `useTenTap`'s config.
    *   The bridge object returned by `useEditorBridge` did *not* expose a direct `send` method for RN -> WebView messages.
*   **Working Solution:**
    1.  **Define a global function in WebView:** Define a function on the `window` object (e.g., `window.myApp_insertBibleVerse`) *inside* the Tiptap `onCreate` callback in the WebView (`editor-web/AdvancedEditor.tsx`). This function closes over the `editor` instance provided by `onCreate`.
    2.  **Use `injectJS` with Retry from RN:** From the React Native hook (`useBibleVerseEditorIntegration.ts`), use `editor.injectJS` to execute a small script.
    3.  **Retry Logic in Injected Script:** This injected script must contain a retry mechanism (e.g., `setTimeout`) that repeatedly checks for the existence of the global function (`typeof window.myApp_insertBibleVerse === 'function'`) before attempting to call it. This handles the delay until `onCreate` runs.
*   **Tiptap Initialization:**
    *   Ensure Tiptap lifecycle callbacks (`onCreate`, etc.) are correctly placed in the `useTenTap` configuration (likely within `tiptapOptions`).
    *   Errors in custom extensions, especially those using `ReactNodeViewRenderer` (like `BibleVerseNode`), can prevent the editor from initializing and stop `onCreate` from running. Temporarily disable complex extensions/NodeViews to debug initialization failures. 

## Text Editor UI Improvements (Added: 2025-04-20)

### Keyboard-Anchored Toolbar Implementation
- **Absolute Positioning:** For toolbar components that need to stay fixed relative to the keyboard, use absolute positioning with explicit bottom values.
- **Platform-Specific Handling:** iOS and Android have different keyboard behavior requiring platform-specific code:
  ```tsx
  // Position toolbar above keyboard on iOS, at bottom of screen on Android
  bottom: Platform.OS === 'ios' ? keyboardHeight : 0
  ```
- **Keyboard Height Tracking:** Track both keyboard visibility and height for precise positioning:
  ```tsx
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // In useEffect with keyboard listeners
  const handleKeyboardShow = (event: any) => {
    const keyboardFrame = event.endCoordinates;
    setKeyboardVisible(true);
    setKeyboardHeight(keyboardFrame.height);
  };
  ```
- **Z-Index Management:** Set appropriate z-index for layered UI components (toolbar, preview windows):
  ```tsx
  zIndex: 1000,
  elevation: 5, // Android requires elevation
  ```

### Scrollable Content with Fixed Headers/Footers
- **Flexbox Layout for Mixed Scrolling:** Use a combination of fixed and flexible containers:
  ```tsx
  container: {
    overflow: 'hidden',
    maxHeight: MAX_PREVIEW_HEIGHT,
    flexDirection: 'column',
  },
  header: {
    minHeight: 60, // Fixed height
  },
  scrollableWrapper: {
    flexGrow: 1,
    flexShrink: 1,
    maxHeight: MAX_CONTENT_HEIGHT,
  },
  footer: {
    minHeight: 60, // Fixed height
  }
  ```
- **ScrollView Configuration:** Ensure proper scrolling behavior:
  ```tsx
  <ScrollView
    style={styles.versesScrollView}
    contentContainerStyle={styles.versesContainer}
    showsVerticalScrollIndicator={true}
    indicatorStyle="black"
    alwaysBounceVertical={false}
  >
    {/* Scrollable content */}
  </ScrollView>
  ```

### Text Input Detection and Debouncing
- **Programmatic vs. User Changes:** Track the source of text changes to prevent unwanted side effects:
  ```tsx
  const programmaticChange = useRef<boolean>(false);
  
  // Before programmatic change
  programmaticChange.current = true;
  
  // In detection logic
  if (programmaticChange.current) {
    programmaticChange.current = false;
    return; // Skip processing
  }
  ```
- **Adaptive Debouncing:** Adjust debounce timing based on typing speed:
  ```tsx
  const timeSinceLastChange = Date.now() - lastContentChange.current;
  const effectiveDebounce = timeSinceLastChange < debounceMs ? debounceMs * 1.5 : debounceMs;
  ```
- **Cooldown Periods:** Implement cooldown after certain actions:
  ```tsx
  const temporarilyDisableDetection = useCallback((durationMs = 2000) => {
    setDetectionEnabled(false);
    setTimeout(() => {
      setDetectionEnabled(true);
    }, durationMs);
  }, []);
  ```

### Mobile Keyboard Handling
- **Platform-Specific Events:** Use different events based on platform:
  ```tsx
  // iOS events fire before keyboard appears/disappears
  const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
  ```
- **Dynamic UI Adjustments:** Adapt UI based on keyboard state:
  ```tsx
  // Only show toolbar when keyboard is visible
  {keyboardVisible && (
    <View style={[styles.fixedToolbarWrapper, { /* styles */ }]}>
      <Toolbar editor={bridge} items={toolbarItems} />
    </View>
  )}
  ```
- **Positioning Relative to Keyboard:** Calculate positions to avoid keyboard overlap:
  ```tsx
  const availableHeight = windowHeight - (keyboardVisible ? keyboardHeight : 0) - 60;
  ```

### Optimizing Bible Verse Detection and Insertion
- **Smart Reference Detection:** Using a combination of debouncing and content monitoring:
  - Monitor text content for potential Bible references
  - Apply debounce to avoid excessive processing during typing
  - Track cursor position to detect references near cursor
- **Preventing Unwanted Re-detection:**
  - Implement cooldown periods after insertion
  - Mark programmatic changes to distinguish from user typing
  - Clear detection state properly after insertion
- **Enhancing Preview Components:**
  - Use fixed-height containers with flexible scrollable content
  - Ensure action buttons are always visible regardless of content length
  - Position previews based on keyboard state and screen constraints 

## Bible Data Integration (Completed: 2025-01-28)

### ✅ Successfully Migrated to NIV_bible.json Format

**COMPLETED**: Full integration of the new NIV_bible.json format with backward compatibility maintained.

#### New Data Format Implementation
- Successfully migrated from the original NIV.json format to the comprehensive NIV_bible.json format
- New format structure:
  ```json
  {
    "Book Name": {
      "chapter_number": {
        "verse_number": "verse text with Unicode quotation marks"
      }
    }
  }
  ```
- The new format uses Unicode quotation marks (\u201c, \u201d) instead of regular quotes to differentiate from JSON syntax

#### Final Technical Implementation
- **Import Strategy**: Used **regular imports** instead of dynamic imports for better Jest compatibility and React Native bundling
- **Backward Compatibility**: Maintained all existing interfaces and function signatures
- **Format Conversion**: Created `convertToOldFormat()` function to transform new data structure to existing BibleVerse interface
- **Type Safety**: Added proper TypeScript types for the new format while keeping existing types for compatibility

#### Files Successfully Updated
1. **utils/bible.ts**: ✅ Core utility functions updated to work with new format using regular imports
2. **app/utils/database/database.native.ts**: ✅ SQLite integration for React Native using expo-sqlite sync API
3. **app/utils/database/database.web.ts**: ✅ IndexedDB integration for web platforms  
4. **app/utils/database/types.ts**: ✅ Updated BibleResult interface to include book, chapter, startVerse, endVerse fields
5. **utils/__tests__/bible.test.ts**: ✅ Updated tests to work with real data instead of mocks

#### Key Technical Decisions That Worked
- **Regular Import over Dynamic Import**: Solved Jest testing issues and React Native bundling compatibility
- **SQLite Sync API**: Used `openDatabaseSync`, `runSync`, `getFirstSync`, `getAllSync` from expo-sqlite for cleaner async handling
- **Unified parseReference**: Used the comprehensive parseReference function from bible.ts across all modules for consistency
- **Type Assertion**: Properly typed the imported JSON data as `Record<string, Record<string, Record<string, string>>>`

#### Testing Status
- **parseReference function**: ✅ All tests passing - handles various formats, abbreviations, and error cases
- **detectBibleReference function**: ✅ All tests passing - regex detection working correctly  
- **Bible data loading**: ✅ Successfully loads 4.5MB NIV_bible.json file
- **Format compatibility**: ✅ Maintains backward compatibility with existing components

#### Performance Characteristics
- **Large File Handling**: The NIV_bible.json file (~4.5MB) loads properly via regular imports
- **Memory Management**: No caching layer needed - let React Native Metro bundler handle optimization
- **Database Performance**: Both SQLite and IndexedDB implementations include proper indexing for fast lookups
- **Mobile Performance**: Regular imports work better with React Native's bundling system than dynamic imports

#### Unicode Character Handling
- **Quotation Marks**: The new format correctly preserves Unicode quotation marks (\u201c\u201d) 
- **Text Integrity**: All verse text maintains original formatting including special characters and Unicode symbols
- **JSON Compatibility**: Unicode quotes don't interfere with JSON parsing since they're different from ASCII quotes

#### Integration Points
- **Bible Verse Editor Integration**: ✅ Ready to use with existing Bible verse insertion features
- **Database Layer**: ✅ Both native (SQLite) and web (IndexedDB) databases updated to handle new format
- **Search and Detection**: ✅ All Bible reference detection and parsing functions working with new data

#### Lessons Learned
- **Jest + Dynamic Imports = Problems**: Dynamic imports in Jest require special configuration; regular imports work out of the box
- **React Native Metro Bundler**: Handles large JSON files efficiently when using regular imports
- **expo-sqlite API Evolution**: Use the newer sync API (openDatabaseSync, runSync, etc.) for cleaner code
- **Type Safety**: Explicit type assertions on imported JSON data prevent runtime errors
- **Mobile Bundle Size**: 4.5MB JSON file doesn't significantly impact app startup when bundled properly

### Future Enhancements Considered
- Consider implementing partial loading strategies for even larger Bible datasets
- Monitor memory usage on mobile devices with the large dataset  
- Potential for adding multiple Bible translations using the same data structure pattern
- Could implement intelligent caching if performance becomes an issue 

## Toolbar Settings Implementation Status (Added: 2025-01-09)

### ✅ Completed: Main Component State Management
- Added `toolbarHeight` and `toolbarBottomPadding` state variables to mobile-friendly-editor.tsx
- Updated ToolbarSettingsModal to receive props from parent and call back on changes
- Enhanced ToolbarSettingsModalProps interface with proper callback functions
- Connected slider controls to actual parent component state

### ✅ Completed: User Interface 
- Settings button properly positioned in header (top right)
- Reset button added to header with confirmation dialog
- Modal sliders now update parent state in real-time
- Proper text input validation with number-only keyboard

### 🚧 Current Issues: TenTapEditor Integration
1. **Import Path Issues**: Bible verse integration hooks and EditorToolbar imports failing
2. **Variable Conflicts**: Local `toolbarHeight` variable conflicts with prop name
3. **Detection Button**: Scan icon button still present in toolbar (user wants removed)
4. **Settings Not Applied**: Props added to interface but not used for actual styling

### Next Implementation Steps
1. Fix import paths for Bible verse integration
2. Remove detection toggle button from toolbar
3. Apply toolbar settings props to actual toolbar component styling
4. Test that settings changes are visible in the toolbar
5. Add settings persistence to storage

### User Feedback Addressed
- **Issue 1**: "Toolbar settings not doing anything" - Partially fixed (connected to state, needs styling application)
- **Issue 2**: "Unwanted button next to Bible book button" - Identified as detection toggle (scan icon), needs removal