// Sidebar component displays the list of labels, allows creating, renaming, deleting labels, and composing new mails
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { fetchLabels, createLabel, updateLabel, deleteLabel } from '../../services/labels.js';
import { useCompose } from '../../context/ComposeContext';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext'; 
import DynamicMessage from '../DynamicMessage/DynamicMessage';

function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useSidebar(); // Sidebar context state
  const [labels, setLabels] = useState([]); // List of labels
  const [openMenuId, setOpenMenuId] = useState(null); // ID of label menu currently open
  const [error, setError] = useState(''); // Error message
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme(); // Dark mode context
  const [dynamicMessage, setDynamicMessage] = useState(null); // State for modal/input messages

  const protectedLabels = ['Inbox', 'Sent', 'Drafts', 'Spam', 'Trash', 'All Mails']; // Labels that cannot be modified
  const { openCompose } = useCompose(); // Compose context

  // Fetch labels from backend
  const loadLabels = async () => {
    try {
      const data = await fetchLabels();
      setLabels(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle creating new label
  const handleCreateLabel = () => {
    setDynamicMessage({
      mode: 'input',
      title: 'New Label',
      placeholder: 'Enter label name',
      onConfirm: async (name) => {
        if (!name) return;
        try {
          await createLabel(name);
          loadLabels();
        } catch (err) {
          setDynamicMessage({
            mode: 'alert',
            title: 'Error',
            message: err.message,
          });
        }
        setDynamicMessage(null); 
      },
      onCancel: () => setDynamicMessage(null),
    });
  };

  // Handle renaming existing label
  const handleRenameLabel = (id, oldName) => {
    setDynamicMessage({
      mode: 'input',
      title: 'Rename Label',
      placeholder: oldName,
      onConfirm: async (name) => {
        if (!name || name === oldName) return;
        try {
          await updateLabel(id, name);
          loadLabels();
        } catch (err) {
          setDynamicMessage({
            mode: 'alert',
            title: 'Error',
            message: err.message,
          });
        }
        setDynamicMessage(null);
      },
      onCancel: () => setDynamicMessage(null),
    });
  };

  // Handle deleting a label
  const handleDeleteLabel = async (id) => {
    try {
      await deleteLabel(id);
      loadLabels();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id); // Toggle dropdown menu for label
  };

  useEffect(() => {
    loadLabels(); // Load labels on mount
  }, []);

  const menuRef = useRef(null);

  // Close label menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Sidebar backdrop */}
      {isSidebarOpen && <div className={styles.backdrop} onClick={closeSidebar} />}
      
      {/* Sidebar container */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''} ${darkMode ? styles.dark : ''}`}>
        
        {/* Compose button */}
        <button
          className={styles.composeBtn}
          onClick={() =>
            openCompose({
              to: [],
              subject: '',
              content: '',
              mode: 'full', 
            })
          }
        >
          <i className="bi bi-envelope" style={{ marginRight: '8px', fontSize: '18px' }}></i> Compose
        </button>

        {/* Labels header with add button */}
        <div className={styles.labelsHeader}>
          <h4>Labels</h4>
          <button className={styles.addLabelBtn} onClick={handleCreateLabel}>＋</button>
        </div>

        {/* Labels list */}
        <ul className={styles.labelsList}>
          {labels.length === 0 ? (
            <li className={styles.noLabels}>No labels</li>
          ) : (
            labels.map(label => {
              const isProtected = protectedLabels.includes(label.name);

              return (
                <li key={label.id} className={styles.labelItem}>
                  <span
                    className={styles.labelName}
                    onClick={() => navigate(`/label/${label.id}`)}
                  >
                    {label.name}
                  </span>

                  {/* Dropdown menu for non-protected labels */}
                  {!isProtected && (
                    <div className={styles.labelMenuContainer}>
                      <button className={styles.menuBtn} onClick={() => toggleMenu(label.id)}>⋮</button>
                      {openMenuId === label.id && (
                        <div ref={menuRef} className={styles.menu}>
                          <button onClick={() => handleRenameLabel(label.id, label.name)}><i className="bi bi-pencil"></i> Rename</button>
                          <button onClick={() => handleDeleteLabel(label.id)}><i className="bi bi-trash3"></i> Delete</button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>

        {/* Error message */}
        {error && <p className={styles.error}>{error}</p>}

        {/* Dynamic input or alert messages */}
        {dynamicMessage && (
          <DynamicMessage
            mode={dynamicMessage.mode}
            title={dynamicMessage.title}
            message={dynamicMessage.message}
            placeholder={dynamicMessage.placeholder}
            onConfirm={dynamicMessage.onConfirm}
            onClose={dynamicMessage.onCancel || (() => setDynamicMessage(null))}
          />
        )}
      </div>
    </>
  );
}

export default Sidebar;
