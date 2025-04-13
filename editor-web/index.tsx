import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdvancedEditor } from './AdvancedEditor';
import type { Editor } from '@tiptap/core'; // Import type for declaration

/**
 * This is the entrypoint for the "web" part of our editor that will be built with vite
 */
console.log('[Editor Web] index.tsx starting'); // Log start

declare global {
  interface Window {
    contentInjected: boolean | undefined;
    dynamicHeight?: boolean; // Add optional dynamicHeight flag
    tipTapEditor?: Editor | null; // Expose Tiptap editor instance globally
  }
}

/**
 * On android - react-native-webview there is a bug where sometimes the content
 * is injected after the window is loaded https://github.com/react-native-webview/react-native-webview/pull/2960
 * To overcome this we will check if the content is injected before rendering the editor
 */
const contentInjected = () => window.contentInjected;
let interval: NodeJS.Timeout;
interval = setInterval(() => {
  if (!contentInjected()) {
    console.log('[Editor Web] Waiting for content injection...'); // Log wait
    return;
  }
  // Once content is injected into the webview, we can render the editor
  console.log('[Editor Web] Content injected! Rendering AdvancedEditor...'); // Log render start
  const container = document.getElementById('root');
  if (!container) {
    console.error('[Editor Web] Root container not found');
    clearInterval(interval);
    return;
  }
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AdvancedEditor />
    </React.StrictMode>,
  );
  console.log('[Editor Web] AdvancedEditor rendered.'); // Log render end
  clearInterval(interval);
}, 100); // Increase interval slightly for logging 