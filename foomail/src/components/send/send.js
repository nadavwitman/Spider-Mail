// SendButton component handles sending emails immediately or scheduling them
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './send.css';

export default function SendButton({ onSendNow, onScheduleSend }) {
  const [menuOpen, setMenuOpen] = useState(false); // State for dropdown menu visibility
  const menuRef = useRef(null); // Ref for detecting clicks outside menu
  const { darkMode } = useTheme(); // Theme context for dark mode

  // Effect to close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false); // Close menu if clicked outside
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="send-button-wrapper" ref={menuRef}>
      {/* Main send button */}
      <button className="send-main-btn" onClick={onSendNow}>
        Send
      </button>

      {/* Dropdown toggle button */}
      <button className="send-dropdown-btn" onClick={() => setMenuOpen(!menuOpen)}>
        <span className={`dropdown-icon ${menuOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* Dropdown menu for scheduling */}
      {menuOpen && (
        <div className={`send-menu ${darkMode ? 'dark' : ''}`}>
          <div
            className="send-menu-item"
            onClick={() => {
              setMenuOpen(false); // Close menu
              onScheduleSend(); // Trigger schedule send
            }}
          >
            <i className="bi bi-clock" style={{ marginRight: '6px' }}></i>
            Schedule send
          </div>
        </div>
      )}
    </div>
  );
}
