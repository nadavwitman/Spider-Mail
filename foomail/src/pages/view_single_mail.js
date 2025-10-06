import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ViewSingleMail.module.css';
import Sidebar from '../components/Sidebar/Sidebar';
import { deleteMail } from '../services/mail';
import HeaderIcons from '../components/Header/Header';
import inboxStyles from '../pages/inbox.module.css';
import { getLabelByName, removeMailFromLabel } from '../services/labels';
import { useCompose } from '../context/ComposeContext';
import ThreadView from '../components/ThreadView/ThreadView';
import { useTheme } from '../context/ThemeContext';
import { downloadBase64File } from '../utils/fileUtils';
import DynamicMessage from '../components/DynamicMessage/DynamicMessage';

function ViewMail() {
  const navigate = useNavigate();
  const { id } = useParams(); // Mail ID from route params

  const [mail, setMail] = useState(null); // Mail data
  const [error, setError] = useState(''); // Error messages
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar toggle
  const { openCompose, closeCompose } = useCompose(); // Compose context
  const { darkMode } = useTheme(); // Dark mode context
  const [dynamicMessage, setDynamicMessage] = useState(null); // Alerts/messages

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch mail data on component mount or ID change
  useEffect(() => {
    const fetchMail = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in.');
          return;
        }

        const res = await fetch(`/api/mails/${id}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Failed to fetch mail: ${res.status}`);
        const data = await res.json();
        setMail(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchMail();
  }, [id]);

  // Delete the current mail
  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteMail(mail.id);
      navigate('/inbox', { state: { refresh: true } });
    } catch (err) {
      console.error(err);
    }
  };

  // Remove a specific label from the mail
  const handleRemoveLabel = async (labelToRemove) => {
    try {
      const labelObj = await getLabelByName(labelToRemove);
      if (!labelObj) {
        setDynamicMessage({
          mode: 'alert',
          title: 'Label Error',
          message: `Label "${labelToRemove}" not found`,
        });
        return;
      }

      await removeMailFromLabel(mail.id, labelObj.id);

      setMail(prev => ({
        ...prev,
        labels: prev.labels.filter(l => l !== labelToRemove),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Forward mail
  const handleForward = async () => {
    await closeCompose();
    const forwardSubject = mail.subject.startsWith('Fwd:') ? mail.subject : `Fwd: ${mail.subject}`;
    const forwardBody = `
---------- Forwarded message ----------
From: ${mail.from}
Date: ${new Date(mail.date).toLocaleString()}
Subject: ${mail.subject}
To: ${mail.to.join(', ')}


${mail.content}
    `;
    openCompose({
      to: [],
      subject: forwardSubject,
      content: forwardBody,
      files: mail.files || []  
    });
  };

  // Reply to mail
  const handleReply = async () => {
    await closeCompose();
    openCompose({
      to: [mail.from],
      subject: mail.subject?.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
      reply: [...(mail.reply || []), mail.id],
    });
  };

  // Display error or loading states
  if (error) return <div className={styles.error}>{error}</div>;
  if (!mail) return <div className={styles.loading}>Loading...</div>;

  // If mail has replies, show thread view
  if (mail.reply && mail.reply.length > 0) {
    return <ThreadView mailId={mail.id} />;
  }

  return (
    <div className={`${styles.outerWrapper} ${darkMode ? styles.dark : ''}`}>
      <header className={inboxStyles.inboxHeader}>
        <HeaderIcons onToggleSidebar={toggleSidebar} />
      </header>

      <div className={styles.container}>
        <div className={styles.sidebar}>
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        </div>

        <div className={styles.content}>
          {/* Mail subject and labels */}
          <div className={styles.subjectRow}>
            <h1 className={styles.subject}>{mail.subject}</h1>
            <div className={styles.labelsRow}>
              {mail.labels && mail.labels.length > 0 ? (
                mail.labels.map(label => (
                  <span key={label} className={styles.label}>
                    {label}
                    <button
                      className={styles.removeLabelBtn}
                      title={`Remove label ${label}`}
                      onClick={() => handleRemoveLabel(label)}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className={styles.noLabels}>No labels</span>
              )}
            </div>
          </div>

          {/* Mail metadata */}
          <div className={styles.metaRow}>
            <div>
              <span><strong>From:</strong> {mail.from}</span>
              <span><strong>To:</strong> {Array.isArray(mail.to) ? mail.to.join(', ') : mail.to}</span>
            </div>
            <span>{new Date(mail.date).toLocaleString()}</span>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            <button className={styles.iconButton} onClick={handleReply} title="Reply">
              <i className="bi bi-reply-all"></i>
            </button>
            <button className={styles.iconButton} onClick={handleForward} title="Forward">
              <i className="bi bi-forward"></i>
            </button>
            <button className={styles.iconButton} onClick={handleDelete} title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>

          {/* Mail content */}
          <div className={styles.body}>{mail.content}</div>

          {/* Attachments */}
          {mail.files?.length > 0 && (
            <div className={styles.attachments}>
              <h3 className={styles.attachmentHeader}>Attachments</h3>
              <ul className={styles.attachmentList}>
                {mail.files.map((file, idx) => (
                  <li key={idx} className={styles.attachmentItem}>
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.data}
                        alt={file.name}
                        className={styles.attachmentImage}
                        onClick={() => downloadBase64File(file)}
                      />
                    ) : (
                      <>
                        <div
                          className={styles.attachmentIcon}
                          onClick={() => downloadBase64File(file)}
                        >
                          <i className="bi bi-file-earmark-arrow-down" style={{ marginTop: "4px" }}></i>
                        </div>
                        <div className={styles.attachmentName}>{file.name}</div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Dynamic message/alert */}
        {dynamicMessage && (
          <DynamicMessage
            mode={dynamicMessage.mode}
            title={dynamicMessage.title}
            message={dynamicMessage.message}
            onClose={() => setDynamicMessage(null)}
          />
        )}
      </div>
    </div>
  );
}

export default ViewMail;
