import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { BibleVerseComponent } from '../components/BibleVerseComponent';

/**
 * Tiptap Node Extension for rendering interactive Bible verse blocks.
 */
export const BibleVerseNode = Node.create({
  name: 'bibleVerseBlock', // Unique name for the node

  group: 'block', // Belongs to the block group (like paragraph, heading)

  content: '', // Atom nodes should generally have empty content definition

  defining: true, // Ensures this node type wraps content correctly

  atom: true, // Treat as a single, indivisible unit in the editor

  addAttributes() {
    return {
      reference: {
        default: 'Genesis 1:1', // Default reference
        parseHTML: element => element.getAttribute('data-reference'),
        renderHTML: attributes => ({ 'data-reference': attributes.reference }),
      },
      versesText: {
        default: 'In the beginning...', // Default verses text
        parseHTML: element => element.querySelector('.bible-verse-content-data')?.innerHTML,
        renderHTML: attributes => ({ 'data-verses': attributes.versesText }), // Store in data-attribute for parsing
      },
      // Add an 'isExpanded' attribute if we want to save the state, 
      // but managing state purely in the NodeView is often simpler.
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.bible-verse-block[data-reference][data-verses]', // Make attributes required
        getAttrs: element => {
          if (typeof element === 'string') return false; // Type guard
          const reference = element.getAttribute('data-reference');
          const versesText = element.getAttribute('data-verses'); // Read from data-verses
          
          return reference && versesText !== null ? { reference, versesText } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // Render basic structure for saving
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'bible-verse-block', 'data-reference': node.attrs.reference, 'data-verses': node.attrs.versesText }),
      // Render simple representation when NodeView is disabled
      // ['strong', node.attrs.reference],
      // ['div', { class: 'simple-verses-text' }, node.attrs.versesText] \n    ];
    ];
  },

  // Restore the React NodeView
  addNodeView() {
    return ReactNodeViewRenderer(BibleVerseComponent);
  },
}); 