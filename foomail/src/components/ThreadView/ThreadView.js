import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../pages/ViewSingleMail.module.css';
import inboxStyles from '../../pages/inbox.module.css';
import Sidebar from '../Sidebar/Sidebar';
import HeaderIcons from '../Header/Header';
import { deleteMail } from '../../services/mail';
import { getLabelByName, removeMailFromLabel } from '../../services/labels';
import { useCompose } from '../../context/ComposeContext';
import { downloadBase64File } from '../../utils/fileUtils';
import { useTheme } from '../../context/ThemeContext';
import DynamicMessage from '../DynamicMessage/DynamicMessage';

// Component for viewing an entire email thread
const ThreadView = ({ mailId }) => {
  const navigate = useNavigate();
  const { openCompose, closeCompose } = useCompose();
  const [thread, setThread] = useState([]); // array of mail objects in the thread
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  const [dynamicMessage, setDynamicMessage] = useState(null);

  // Fetch a single mail by ID using the stored token
  const fetchMail = async (id) => {
    const token = sessionStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');

    const res = await fetch(`/api/mails/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch mail ${id}`);
    return res.json();
  };

  // Recursively fetch all mails in the thread (DFS to include replies)
  const fetchThread = async (id) => {
    const collected = [];
    const visited = new Set();

    const dfs = async (currentId) => {
      if (visited.has(currentId)) return; // avoid cycles
      visited.add(currentId);

      const mail = await fetchMail(currentId);

      if (Array.isArray(mail.reply)) {
        for (const prevId of mail.reply) {
          await dfs(prevId);
        }
      }

      collected.push(mail);
    };

    await dfs(id);
    return collected;
  };

  // Load the thread when mailId changes
  useEffect(() => {
    const loadThread = async () => {
      try {
        setLoading(true);
        setError(null);
        const mails = await fetchThread(mailId);
        // sort thread chronologically
        mails.sort((a, b) => new Date(a.date) - new Date(b.date));
        setThread(mails);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadThread();
  }, [mailId]);

  // Delete a mail and its replies
  const handleDelete = async (mail) => {
    try {
      await deleteMail(mail.id);
      navigate('/inbox', { state: { refresh: true } });
    } catch (err) {
      console.error(err);
      alert('Failed to delete mail');
    }
  };

  // Remove a label from a mail
  const handleRemoveLabel = async (mail, labelToRemove) => {
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

      // update thread state locally
      setThread((prevThread) =>
        prevThread.map((m) =>
          m.id === mail.id
            ? { ...m, labels: m.labels.filter((l) => l !== labelToRemove) }
            : m
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Forward mail: open compose with original content prepended
  const handleForward = async (mail) => {
    await closeCompose();

    const forwardSubject = mail.subject.startsWith('Fwd:')
      ? mail.subject
      : `Fwd: ${mail.subject}`;

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

  // Reply to mail: open compose with original mail in reply chain
  const handleReply = async (mail) => {
    await closeCompose();
    openCompose({
      to: [mail.from],
      subject: mail.subject?.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
      reply: [...(mail.reply || []), mail.id],
    });
  };

  // Show error if thread failed to load
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`${styles.outerWrapper} ${darkMode ? styles.dark : ''} threadView`}>
      <header className={`${inboxStyles.inboxHeader} ${darkMode ? inboxStyles.dark : ''}`}>
        <HeaderIcons />
      </header>

      <div className={styles.container}>
        <div className={`${styles.sidebar} ${darkMode ? styles.dark : ''}`}>
          <Sidebar />
        </div>

        <div className={`${styles.content} ${darkMode ? styles.dark : ''}`}>
          {thread.map((mail, idx) => (
            <div key={mail.id || idx} className={`${styles.threadMail} ${darkMode ? styles.dark : ''}`}>
              {idx > 0 && <hr className={styles.threadDivider} />}

              {/* Mail subject and labels */}
              <div className={styles.subjectRow}>
               <h1 className={`${styles.subject} ${darkMode ? styles.dark : ''}`}>{mail.subject}</h1>
                <div className={styles.labelsRow}>
                  {mail.labels && mail.labels.length > 0 ? (
                    mail.labels.map((label) => (
                      <span key={label} className={`${styles.label} ${darkMode ? styles.dark : ''}`}>
                        {label}
                        <button
                          className={styles.removeLabelBtn}
                          title={`Remove label ${label}`}
                          onClick={() => handleRemoveLabel(mail, label)}
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

              {/* Mail meta info: From, To, Date */}
              <div className={styles.metaRow}>
                <div>
                  <span>
                    <strong>From:</strong> {mail.from}
                  </span>
                  <span>
                    <strong>To:</strong> {mail.to.join(', ')}
                  </span>
                </div>
                <span>{new Date(mail.date).toLocaleString()}</span>
              </div>

              {/* Mail actions */}
              <div className={styles.actions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleReply(mail)}
                  title="Reply"
                >
                  <i className="bi bi-reply-all"></i>
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleForward(mail)}
                  title="Forward"
                >
                  <i className="bi bi-forward"></i>
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(mail)}
                  title="Delete"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              
              {/* Mail content/body */}
              <div className={`${styles.body} ${darkMode ? styles.dark : ''}`}>{mail.content}</div>

              {/* Attachments */}
              {mail.files?.length > 0 && (
                <div className={`${styles.attachments} ${darkMode ? styles.dark : ''}`}>
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
                          <div
                            className={styles.attachmentIcon}
                            onClick={() => downloadBase64File(file)}
                          >
                            <i class="bi bi-file-earmark-arrow-down" style={{ marginTop: "4px" }}></i>
                          </div>
                        )}
                        <span className={styles.attachmentName}>{file.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic alert/input messages */}
      {dynamicMessage && (
        <DynamicMessage
          mode={dynamicMessage.mode}
          title={dynamicMessage.title}
          message={dynamicMessage.message}
          onClose={() => setDynamicMessage(null)}
        />
      )}
    </div>
  );
};

export default ThreadView;
