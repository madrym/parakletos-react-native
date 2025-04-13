import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path'; // Import path module for resolving paths

// https://vitejs.dev/config/
export default defineConfig({
  // Explicitly set root relative to the project directory where the vite command is run
  root: 'editor-web',
  build: {
    outDir: 'build',
    // Consider adding emptyOutDir: true, unless using the alternative setup for dev watching
    // emptyOutDir: true, 
  },
  resolve: {
    alias: [
      {
        find: '@10play/tentap-editor',
        // Use the /lib-web path alias 
        replacement: path.resolve(__dirname, '../node_modules/@10play/tentap-editor/lib-web'),
      },
      // Aliases recommended by TenTap docs to avoid ProseMirror version conflicts
      {
        find: '@tiptap/pm/view',
        replacement: path.resolve(__dirname, '../node_modules/@10play/tentap-editor/lib-web'),
      },
      {
        find: '@tiptap/pm/state',
        replacement: path.resolve(__dirname, '../node_modules/@10play/tentap-editor/lib-web'),
      },
      // Add aliases for your local components/extensions if needed for bundling
      { find: '@components', replacement: path.resolve(__dirname, './components') },
      { find: '@extensions', replacement: path.resolve(__dirname, './extensions') },
    ],
  },
  plugins: [
    react(), 
    viteSingleFile() // Bundles everything into a single index.html
    // If using the alternative setup for dev watch, add the postbuild command plugin here
  ],
  server: {
    port: 3000, // Port for dev server (if used)
  },
}); 