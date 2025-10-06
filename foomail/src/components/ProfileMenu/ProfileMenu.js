import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import './ProfileMenu.css';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext'; 

export default function ProfileMenu({ onClose }) {
  const { user, logout } = useAuth(); // Access user info and logout function
  const navigate = useNavigate(); // Hook for navigation
  const { darkMode } = useTheme(); // Access dark mode setting

  // Handle user logout and navigate to login page
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`profile-menu ${darkMode ? 'dark' : ''}`}>
      {/* Close button for menu */}
      <button className="close-btn" onClick={onClose}>×</button>

      {/* Display username */}
      <div className="username">{user.userName}</div>

      {/* Display profile picture */}
      <ProfilePicture picture={user.picture} firstName={user.firstName} />

      {/* Greeting */}
      <div className="hello">Hi, {user.firstName}!</div>

      {/* Logout button */}
      <button className="logout-btn" onClick={handleLogout}>
        Sign out
      </button>
    </div>
  );
}
