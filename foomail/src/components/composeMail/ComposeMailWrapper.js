// ComposeMailWrapper.jsx
import React from 'react';
import ComposeMail from './composeMail';
import { useCompose } from '../../context/ComposeContext';

export default function ComposeMailWrapper() {
  // Extract values from ComposeContext
  const { isOpen, draftData, closeCompose } = useCompose();

  // If the compose window is not open, render nothing
  if (!isOpen) return null;

  // Render the ComposeMail component, passing draft data and close handler
  return <ComposeMail draftData={draftData} onClose={closeCompose} />;
}
