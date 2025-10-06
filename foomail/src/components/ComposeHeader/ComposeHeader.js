import React from 'react';
import './ComposeHeader.css';

export default function ComposeHeader({ onClose }) {
  return (
    <div className="compose-header">
      {/* Title of the compose window */}
      <span>New Message</span>

      {/* Close button (calls onClose callback passed from parent) */}
      <button onClick={onClose} className="close-btn">×</button>
    </div>
  );
}
