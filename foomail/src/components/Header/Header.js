import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import ProfileMenu from '../ProfileMenu/ProfileMenu';
import { useSidebar } from '../../context/SidebarContext';  
import { useTheme } from '../../context/ThemeContext'; 
import './Header.css';
import LogoIcon from '../../assets/logo_txt.png';

export default function HeaderIcons({ onToggleSidebar, onToggleTheme, searchQuery, setSearchQuery }) {
  const { user } = useAuth(); // Get authenticated user from AuthContext
  const [menuOpen, setMenuOpen] = useState(false); // Local state for profile menu visibility
  const { darkMode, toggleDarkMode } = useTheme(); // Theme context (dark/light mode)
  const { toggleSidebar } = useSidebar(); // Sidebar context (toggle open/close)
  
  // Toggle profile menu open/close
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // If user data isn't loaded yet, show loading placeholder
  if (!user) return <div>Loading...</div>;

  return (
    <div className={`header-icons ${darkMode ? 'dark-header' : ''}`}>
      {/* Profile picture button (opens profile menu) */}
      <button className="profile-button" onClick={toggleMenu} title='View Profile'>
        <ProfilePicture picture={user.picture} firstName={user.firstName} />
      </button>

      {/* Dark mode toggle button */}
      <button 
        className="icon-button" 
        onClick={toggleDarkMode} 
        aria-label="Toggle Dark Mode" 
        title={darkMode ? "Dark Mode On" : "Dark Mode Off"}
      >
        <i 
          className={`bi ${darkMode ? 'bi-lamp-fill' : 'bi-lamp'}`} 
          style={{ fontSize: '1.3rem' }}
        ></i>
      </button>

      {/* Search bar for mail */}
      <div className="search-container">
        <input
          title='Search mail...'
          type="text"
          placeholder="Search mail..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* App logo */}
      <div className="logo-container">
        <img src={LogoIcon} alt="Logo" className="logo" />
      </div>

      {/* Sidebar toggle button */}
      <button className="icon-button" onClick={toggleSidebar} title='Side Bar'> 
        <i className="bi bi-list"></i>
      </button>

      {/* Conditionally render profile menu */}
      {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
