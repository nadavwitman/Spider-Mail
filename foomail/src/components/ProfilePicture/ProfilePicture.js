import React from 'react';
import './ProfilePicture.css';
import { useTheme } from '../../context/ThemeContext';  

export default function ProfilePicture({ picture, firstName }) {
  const { darkMode } = useTheme();  // Access dark mode setting
  const isDefaultAvatar = !picture; // Check if user has a custom picture
  const firstLetter = firstName?.[0]?.toUpperCase() || '?'; // Fallback initial
  const bgColor = getColorFromName(firstName || 'Unknown'); // Generate background color based on name

  return (
    <div className={`avatar-wrapper ${darkMode ? 'dark' : ''}`}>
      {isDefaultAvatar ? (
        // Render default avatar with colored background and first letter
        <div className="avatar default-avatar" style={{ backgroundColor: bgColor }}>
          {firstLetter}
        </div>
      ) : (
        // Render user-provided profile picture
        <img src={picture} alt="User avatar" className="avatar" />
      )}
    </div>
  );
}

// Generate a consistent background color based on the first character of the name
function getColorFromName(name) {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#3F51B5',
    '#03A9F4', '#009688', '#4CAF50', '#FF9800',
    '#795548', '#607D8B'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

