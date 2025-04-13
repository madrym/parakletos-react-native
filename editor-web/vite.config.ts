import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { exec } from 'child_process';
import path from 'path'; // Import path for resolving node_modules

// Function to resolve paths relative to the project root
const projectRoot = path.resolve(__dirname, '..');
const resolveFromRoot = (...paths: string[]) => path.resolve(projectRoot, ...paths);

// This config is used to build the web editor into a single file for Expo

export default defineConfig({
  root: 'editor-web', // Source files are in editor-web
  build: {
    outDir: 'build', // Output build files here
    emptyOutDir: false, // Keep output dir for post-build script
  },
  resolve: {
    alias: [
      // Alias for TenTap web version
      {
        find: '@10play/tentap-editor',
        replacement: resolveFromRoot('node_modules/@10play/tentap-editor/lib-web/typescript/webEditorUtils/index.js'),
      },
      // Specific aliases for Tiptap dependencies pointing to dist/index.js
      {
        find: '@tiptap/react',
        replacement: resolveFromRoot('node_modules/@tiptap/react/dist/index.js'),
      },
      {
        find: '@tiptap/extension-document',
        replacement: resolveFromRoot('node_modules/@tiptap/extension-document/dist/index.js'),
      },
      {
        find: '@tiptap/extension-paragraph',
        replacement: resolveFromRoot('node_modules/@tiptap/extension-paragraph/dist/index.js'),
      },
      {
        find: '@tiptap/extension-text',
        replacement: resolveFromRoot('node_modules/@tiptap/extension-text/dist/index.js'),
      },
      {
        find: '@tiptap/extension-history',
        replacement: resolveFromRoot('node_modules/@tiptap/extension-history/dist/index.js'),
      },
      {
        find: '@tiptap/extension-hard-break',
        replacement: resolveFromRoot('node_modules/@tiptap/extension-hard-break/dist/index.js'),
      },
      {
        find: '@tiptap/extension-blockquote',
        replacement: resolveFromRoot('node_modules/@tiptap/extension-blockquote/dist/index.js'),
      },
      {
        find: '@tiptap/extension-bold',
        replacement: resolveFromRoot('node_modules/@tiptap/extension-bold/dist/index.js'),
      },
      // Alias for React and ReactDOM to ensure single instance
      {
        find: /^react\/?$/,
        replacement: resolveFromRoot('node_modules/react'),
      },
      {
        find: /^react-dom\/?$/,
        replacement: resolveFromRoot('node_modules/react-dom'),
      },
      {
        find: '@tiptap/core',
        replacement: resolveFromRoot('node_modules/@tiptap/core/dist/index.js'),
      },
      {
        find: '@tiptap/pm/state', // Ensure pm/state is aliased if needed by core
        replacement: resolveFromRoot('node_modules/@tiptap/pm/state/dist/index.js'),
      },
      {
        find: '@tiptap/pm/view', // Ensure pm/view is aliased if needed by core
        replacement: resolveFromRoot('node_modules/@tiptap/pm/view/dist/index.js'),
      },
      {
        find: '@tiptap/pm/model', // Ensure pm/model is aliased if needed by core
        replacement: resolveFromRoot('node_modules/@tiptap/pm/model/dist/index.js'),
      },
      // Specific aliases for Tiptap extensions used
      {
        find: '@tiptap/react',
        replacement: resolveFromRoot('node_modules/@tiptap/react/dist/index.js'),
      },
      // Alias for the custom extension directory
      {
        find: '@extensions',
        replacement: path.resolve(__dirname, 'extensions')
      },
      // Alias for the custom components directory
      {
        find: '@components',
        replacement: path.resolve(__dirname, 'components')
      },
    ],
  },
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'postbuild-commands',
      closeBundle: async () => {
        // Use npm for the post-build script
        exec(
          'npm run editor:post-build',
          (error, stdout, stderr) => {
            if (error) {
              console.error(`Post-build script error: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`Post-build script stderr: ${stderr}`);
              return;
            }
            console.log(`Post-build script stdout: ${stdout}`);
          },
        );
      },
    },
  ],
  server: {
    port: 3000, // Port for potential dev server (not used in watch mode)
  },
}); 