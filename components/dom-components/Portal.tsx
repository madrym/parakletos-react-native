import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

/**
 * Simple Portal component for rendering content at the root of the document
 * This is used for overlays, modals, etc. that need to render outside
 * of their parent component's DOM hierarchy
 */
export const Portal: React.FC<PortalProps> = ({ children }) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create the portal element on mount
    const div = document.createElement('div');
    div.setAttribute('data-portal-container', 'true');
    document.body.appendChild(div);
    
    setPortalContainer(div);

    // Clean up on unmount
    return () => {
      document.body.removeChild(div);
    };
  }, []);

  // Only render once we have a container
  if (!portalContainer) return null;
  
  return createPortal(children, portalContainer);
}; 