import React, { useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

/**
 * React Component to render the BibleVerseNode within the Tiptap editor.
 * Handles the display and toggle interaction.
 */
export const BibleVerseComponent: React.FC<NodeViewProps> = ({ node }) => {
  const { reference, versesText } = node.attrs;
  const [isExpanded, setIsExpanded] = useState(false); // Internal state for toggling

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Basic sanitization/parsing of verse text HTML (can be improved)
  const createMarkup = (htmlString: string) => {
    // WARNING: This is basic and might be unsafe if versesText contains malicious script.
    // Consider using a proper sanitizer library (like DOMPurify) if the source isn't trusted.
    // For now, we assume versesText from our hook is safe.
    return { __html: htmlString };
  };

  return (
    <NodeViewWrapper className="bible-verse-block" data-drag-handle>
      <div className="bible-verse-header" onClick={toggleExpand} style={{ cursor: 'pointer' }}>
        <span className="bible-verse-reference">{reference}</span>
        <span className={`bible-verse-toggle ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? '▼' : '▶'} {/* Simple toggle indicator */}
        </span>
      </div>
      {/* Conditionally render content based on isExpanded state */}
      <div 
        className="bible-verse-content" 
        style={{ 
          maxHeight: isExpanded ? '1000px' : '0', // Control expansion with max-height
          overflow: 'hidden',
          padding: isExpanded ? '8px 12px' : '0 12px', // Adjust padding on expansion
          transition: 'max-height 0.3s ease-out, padding 0.3s ease-out' // Smooth transition
        }}
        // Use dangerouslySetInnerHTML to render the pre-formatted verse HTML
        dangerouslySetInnerHTML={createMarkup(versesText)}
      />
      {/* Hidden div to store raw versesText for parsing (alternative to data-attribute) */}
      {/* <div className="bible-verse-content-data" style={{ display: 'none' }}>{versesText}</div> */}
    </NodeViewWrapper>
  );
}; 