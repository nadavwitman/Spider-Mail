import React, { useEffect, useState } from 'react';
import './profileView.css';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { getUserById } from '../../services/userService';
import { useCompose } from '../../context/ComposeContext';
import { useTheme } from '../../context/ThemeContext';  

export default function ProfileView({ userid, token }) {
  const [user, setUser] = useState(null); // Store fetched user data
  const { openCompose, closeCompose } = useCompose(); // Access compose mail functions
  const { darkMode } = useTheme(); // Access dark mode setting

  // Fetch user data when component mounts or userid/token changes
  useEffect(() => {
    if (!userid) return;
    const fetchUser = async () => {
      try {
        const data = await getUserById(userid, token);
        setUser(data); // Update state with user info
      } catch (err) {
        console.error('Failed to fetch user:', err.message);
      }
    };
    fetchUser();
  }, [userid, token]);

  if (!user) return null; // Render nothing if user data not yet available

  // Open compose mail window with this user as recipient
  async function handleSendTo(userName) {
    await closeCompose(); // Close any existing compose
    openCompose({
      to: [userName],
      subject: '',
      content: '',
    });
  }

  return (
    <div className={`profile-view ${darkMode ? 'dark' : ''}`}>
      <div className="profile-top-row">
        {/* Display large profile picture */}
        <ProfilePicture
          picture={user.picture}
          firstName={user.firstName}
          className="profile-picture-large"
        />

        {/* Display user's name and username */}
        <div className="profile-text">
          <div className="full-name">{user.firstName} {user.lastName}</div>
          <div className="username">{user.userName}</div>
        </div>
      </div>

      {/* Button to open compose mail to this user */}
      <button
        onClick={() => handleSendTo(user.userName)}
        className="send-to"
      >
        Send Mail
      </button>
    </div>
  );
}
