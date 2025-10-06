import React, { createContext, useContext, useState, useCallback } from 'react';

// Create a React context for the compose modal
const ComposeContext = createContext();

// Provider component that wraps the app and provides compose state
export function ComposeProvider({ children }) {
  // State to track if compose modal is open
  const [isOpen, setIsOpen] = useState(false);
  // State to hold current draft data (to, subject, content, etc.)
  const [draftData, setDraftData] = useState(null);

  // Function to open compose modal with optional draft data
  const openCompose = useCallback((draft) => {
    setDraftData(draft || null);
    setIsOpen(true);
  }, []);

  // Function to close compose modal and clear draft data
  // Returns a promise that resolves immediately (for async sequencing)
  const closeCompose = useCallback(() => {
    return new Promise((resolve) => {
      setIsOpen(false);
      setDraftData(null);
      setTimeout(resolve, 0); // ensures state updates propagate before continuation
    });
  }, []);

  // Provide compose state and functions to children components
  return (
    <ComposeContext.Provider value={{ isOpen, draftData, openCompose, closeCompose }}>
      {children}
    </ComposeContext.Provider>
  );
}

// Custom hook to easily access compose context
export function useCompose() {
  return useContext(ComposeContext);
}
