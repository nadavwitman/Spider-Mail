import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MailItem.module.css';
import { addMailToLabel, fetchLabels } from '../../services/labels';
import { deleteMail } from '../../services/mail';
import { useCompose } from '../../context/ComposeContext';
import { useTheme } from '../../context/ThemeContext';
import { markMailAsRead } from '../../services/mail';

function MailItem({ mail, isDraft, onClick, onDelete }) {
  const navigate = useNavigate(); // Hook to navigate programmatically
  const [showLabels, setShowLabels] = useState(false); // State for label menu visibility
  const [labels, setLabels] = useState([]); // State to store fetched labels
  const { openCompose, closeCompose } = useCompose(); // Compose context functions
  const { darkMode } = useTheme(); // Theme context for dark mode

  // Fetch labels when component mounts
  useEffect(() => {
    fetchLabels().then(setLabels).catch(console.error);
  }, []);

  // Handle click on the mail item
  const handleClick = async () => {
    if (isDraft) {
      await closeCompose(); // Close current compose
      openCompose({
        id: mail.id,
        to: mail.to ? [mail.to] : [],
        subject: mail.subject || '',
        content: mail.content || '',
        reply: Array.isArray(mail.reply) ? mail.reply : [],
      }); // Open compose with draft data
      return;
    }
    await markMailAsRead(mail.id); // Mark mail as read
    navigate(`/mail/${mail.id}`); // Navigate to mail detail page
  };

  // Add mail to a label
  const handleAddToLabel = async (labelId) => {
    try {
      await addMailToLabel(mail.id, labelId);
      setShowLabels(false); // Close label menu after adding
    } catch (err) {
      console.error(err);
    }
  };

  // Delete mail
  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click
    try {
      await deleteMail(mail.id);
      if (onDelete) onDelete(mail.id); // Callback to parent if provided
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={`${styles.mailItem} ${darkMode ? styles.dark : ''} ${mail.isRead ? styles.read : styles.unread}`}
      onClick={handleClick} // Click handler for opening mail or draft
    >
      {/* Mail status icon */}
      <span className="mail-status-icon">
        {mail.isRead ? (
          <i className="bi bi-envelope-open" style={{ marginRight: '10px' }}></i>
        ) : (
          <i className="bi bi-envelope" style={{ marginRight: '10px' }}></i>
        )}
      </span>

      {/* Sender */}
      <strong className={styles.from}>{mail.from}</strong>

      {/* Subject and preview */}
      <span className={styles.subject}>
        {mail.subject} -{' '}
        <span className={styles.preview}>
          {mail.content.length > 50 ? mail.content.slice(0, 50) + '...' : mail.content}
        </span>
      </span>

      {/* Date */}
      <span className={styles.date}>
        {mail.date
          ? new Date(mail.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            })
          : 'Today'}
      </span>

      {/* Delete button */}
      <div className={styles.deleteBtn} onClick={handleDelete} title="Delete">
        <i className="bi bi-trash trash-size"></i>
      </div>

      {/* Add to label button */}
      <div
        className={`${styles.labelButton} ${darkMode ? styles.dark : ''} ${mail.isRead ? styles.read : styles.unread}`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent opening mail
          setShowLabels(!showLabels); // Toggle label menu
        }}
      >
        <i className="bi bi-bookmark-plus"></i> Add to label

        {/* Label menu */}
        {showLabels && (
          <div className={`${styles.labelMenu} ${darkMode ? styles.dark : ''}`}>
            {labels.map((label) => (
              <div
                key={label.id}
                className={`${styles.labelOption} ${darkMode ? styles.dark : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent closing menu
                  handleAddToLabel(label.id); // Add mail to label
                }}
              >
                {label.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MailItem;
