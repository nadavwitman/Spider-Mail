// DynamicMessage.js
import React, { useState } from 'react';
import './DynamicMessage.css';
import { useTheme } from '../../context/ThemeContext';

export default function DynamicMessage({ 
  mode = "alert",       // Determines the type of message (alert or input mode)
  title = "Notice",     // Title text for the message
  message = "",         // Main message text
  onClose,              // Callback for closing the message
  inputValue = "",      // Initial input value (used in input mode)
  onInputChange,        // Callback for when input value changes
  placeholder = "",     // Placeholder text for input field
  onConfirm             // Callback when confirming input (only in input mode)
}) {
  const { darkMode } = useTheme();     // Access theme context for dark mode
  const [value, setValue] = useState(inputValue);  // Local state for input field

  // Handle input changes and notify parent if onInputChange is provided
  const handleChange = (e) => {
    setValue(e.target.value);
    if (onInputChange) onInputChange(e.target.value);
  };

  return (
    <div className={`dm-container ${darkMode ? 'dm-dark' : ''}`}>
      {/* Close button */}
      <button className="dm-close-btn" onClick={onClose}>×</button>

      {/* Optional title */}
      {title && <div className="dm-title">{title}</div>}

      {/* Optional message */}
      {message && <div className="dm-message">{message}</div>}

      {/* Input mode UI */}
      {mode === 'input' && (
        <div className="dm-input-wrapper">
          <input 
            type="text" 
            value={value} 
            onChange={handleChange} 
            placeholder={placeholder || "Type here..."} 
          />
          <div className="dm-actions">
            <button 
              className="dm-action-btn" 
              onClick={() => onConfirm && onConfirm(value)}
            >
              OK
            </button>
            <button 
              className="dm-action-btn" 
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
