// ComposeMail.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './composeMail.css';
import SendButton from '../send/send.js';
import AttachmentControls from '../AttachmentControls/AttachmentControls.js';
import ScheduleModal from '../ScheduleModal/ScheduleModal.js';
import AttachmentList from '../AttachmentList/AttachmentList.js';
import { saveMailDraft, sendMailNow, deleteDraft } from '../../services/composeService.js';
import { useMailScheduler } from '../../context/MailSchedulerContext.js';
import RecipientTag from '../RecipientTag/RecipientTag.js';
import ProfileView from '../profileView/profileView.js';
import { useTheme } from '../../context/ThemeContext';
import { toBase64 } from '../../utils/fileUtils.js';
import DynamicMessage from '../DynamicMessage/DynamicMessage';

function ComposeMail({ onClose, draftData }) {
  // State variables for managing compose box behavior, form data, attachments, etc.
  const [mode, setMode] = useState('mid'); // 'mid', 'full', or 'closed'
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [recipientTags, setRecipientTags] = useState([]); // recipients added as tags
  const [suggestedRecipients, setSuggestedRecipients] = useState([]); // suggested users from server
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]); // ignored suggestions
  const [hoveredUserId, setHoveredUserId] = useState(null); // hovered recipient tag
  const [hovered, setHovered] = useState(false);
  const [originalTo, setOriginalTo] = useState(''); // for reply handling
  const [originalSubject, setOriginalSubject] = useState('');
  const [replyIds, setReplyIds] = useState([]); 
  const { darkMode } = useTheme();
  const [dynamicErrorMessage, setDynamicErrorMessage] = useState(null); // error display

  // Scheduler context functions
  const {
    setScheduledSend,
    setSendFn,
    scheduleMail
  } = useMailScheduler();

  // Refs for outside click detection & debouncing save
  const mailRef = useRef(null);
  const debounceTimer = useRef(null);

  // Compute reply field: if "To" or subject is changed, replyIds reset
  const getReplyField = () => {
    const currentSubject = subject.trim();
    const currentRecipients = [...recipientTags.map(u => u.userName)];
    if (to.trim()) currentRecipients.push(to.trim());

    const originalRecipients = originalTo.split(',').map(s => s.trim());

    const isToChanged =
      currentRecipients.length !== originalRecipients.length ||
      currentRecipients.some(r => !originalRecipients.includes(r));

    const isSubjectChanged = currentSubject !== originalSubject?.trim();

    if (replyIds.length > 0 && (isToChanged || isSubjectChanged)) {
      return []; 
    }
    return replyIds;
  };
  
  // Add recipient as tag & remove from "to" text input
  const addRecipientTag = useCallback((user) => {
    setRecipientTags(prev => {
      if (prev.some(u => u.id === user.id)) return prev; // avoid duplicates
      return [...prev, user];
    });
    setTo(prevText => {
      const regex = new RegExp(`\\b${user.userName}\\b`, 'gi');
      return prevText.replace(regex, '').trim();
    });
  }, []);

  // Accept a suggested recipient
  const handleAcceptSuggestion = useCallback((user) => {
    addRecipientTag(user);
    setSuggestedRecipients(prev => prev.filter(u => u.id !== user.id));
  }, [addRecipientTag]);

  // Keyboard behavior for "To" input
  const handleKeyDownInTo = useCallback((e) => {
    // Enter → accept first suggestion
    if (['Enter'].includes(e.key) && suggestedRecipients.length > 0) {
      e.preventDefault();
      handleAcceptSuggestion(suggestedRecipients[0]);
    }
    // Space → dismiss first suggestion
    if (e.key === ' ' && suggestedRecipients.length > 0) {
      e.preventDefault(); 
      const dismissed = suggestedRecipients[0];
      setDismissedSuggestions(prev => [...prev, dismissed.id]);
      setSuggestedRecipients(prev => prev.slice(1));
    }
  }, [suggestedRecipients, handleAcceptSuggestion]);

  // Remove a recipient tag
  function removeRecipientTag(userId) {
    setRecipientTags(prev => prev.filter(user => user.id !== userId));
  }

  // Convert uploaded files to base64 and store
  const handleFileSelect = async (selectedFiles) => {
    const base64Files = await Promise.all(
      selectedFiles.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        data: await toBase64(file)
      }))
    );
    setFiles((prev) => [...prev, ...base64Files]);
  };

  // Format recipients list for sending
  function formatToForSend() {
    const parts = [...recipientTags.map(u => u.userName)];
    if (to.trim()) parts.push(to.trim());
    return parts;
  }

  // Reset compose form (close without deleting draft from server)
  const resetForm = useCallback(() => {
    setTo('');
    setSubject('');
    setContent('');
    setFiles([]);
    setScheduledSend('');
    setDraftId(null);
    setMode('mid');
    onClose();
  }, [onClose, setScheduledSend]);

  // Reset compose form and delete draft from server if exists
  const resetFormDelete = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token && draftId) {
        await deleteDraft({ token, draftId });
      }
    } catch (err) {
      console.error('Error deleting draft:', err.message);
    }
    setTo('');
    setSubject('');
    setContent('');
    setFiles([]);
    setScheduledSend('');
    setDraftId(null);
    setMode('mid');
    onClose();
  }, [draftId, onClose, setScheduledSend]);

  // Save draft (auto-save logic)
  const saveDraft = useCallback(async () => {
    const isEmpty =
      !to && !subject && !content &&
      files.length === 0 && recipientTags.length === 0;

    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      // Delete empty draft if exists
      if (isEmpty) {
        if (draftId) {
          await deleteDraft({ token, draftId });
          setDraftId(null);
          setDraftSaved(false);
        }
        return;
      }

      // Save or update draft
      const data = await saveMailDraft({
        token,
        draftId,
        to: formatToForSend(),
        subject,
        content,
        files,
        scheduledSend: '',
        reply: getReplyField()
      });

      // Update draftId if new draft created
      if (!draftId && data.id) setDraftId(data.id);

      // Update suggestions
      if (data.recipientDetected) {
        setSuggestedRecipients(
          data.recipientDetected.filter(
            user =>
              !recipientTags.some(tag => tag.id === user.id) &&
              !dismissedSuggestions.includes(user.id)
          )
        );
      }

      // Show draft saved feedback
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 1500);
    } catch (err) {
      console.error('Error saving draft:', err.message);
    }
  }, [draftId, to, subject, content, files, recipientTags, addRecipientTag]);

  // Send mail immediately
  const sendMail = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');
      await sendMailNow({
        token,
        draftId,
        to: formatToForSend(),
        subject,
        content,
        files,
        scheduledSend: '',
        reply: getReplyField()
      });
      setMailSent(true);
      setTimeout(() => setMailSent(false), 3000);
      resetForm();
    } catch (err) {
      setDynamicErrorMessage(err.message);
    }
  }, [draftId, to, subject, content, files, recipientTags, resetForm]);

  // Register send function in scheduler context
  useEffect(() => {
    setSendFn(() => sendMail);
  }, [sendMail, setSendFn]);

  // Collapse to "mid" when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mailRef.current && !mailRef.current.contains(e.target)) {
        if (mode === 'full') setMode('mid');
      }
    };
    if (mode !== 'closed') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode]);

  // Auto-save draft with debounce
  useEffect(() => {
    if (mode === 'closed') return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(saveDraft, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [to, subject, content, files, recipientTags, mode, saveDraft]);

  // Load draft data if editing existing draft
  useEffect(() => {
    if (draftData) {
      setTo((draftData.to || []).join(', '));
      setSubject(draftData.subject || '');
      setContent(draftData.content || '');
      setDraftId(draftData.id || null);
      setFiles(draftData.files || []);

      if (draftData.reply && draftData.reply.length > 0) {
        const toText = (draftData.to || []).join(', ');
        setOriginalTo(toText);
        setOriginalSubject(draftData.subject || '');
        setReplyIds(draftData.reply);
      } else {
        setReplyIds([]); 
      }
    }
  }, [draftData]);

  // --- UI Renders ---
  const renderClosedBar = () => (
    <div className="compose-closed-bar" onClick={(e) => e.stopPropagation()}>
      <span className="compose-title">New Message</span>
      <div className="compose-controls">
        <button onClick={() => setMode('mid')} title="Expand to mid">🗗</button>
        <button onClick={() => setMode('full')} title="Expand to full"><i className="bi bi-fullscreen"></i></button>
        <button onClick={resetForm} title="Close all">✖</button>
      </div>
    </div>
  );

  const renderComposeBox = () => (
    <div
      className={`compose-mail-box ${mode === 'full' ? 'full' : 'mid'} ${darkMode ? 'dark' : ''}`}
      ref={mailRef}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="compose-content">
        {/* Header with expand/shrink/close controls */}
        <div className="compose-header-unified">
          <span className="compose-title">New Message</span>
          <div className="compose-controls">
            <button onClick={() => setMode('closed')} title="Minimize to bar">🗕</button>
            {mode === 'mid' ? (
              <button onClick={() => setMode('full')} title="Expand to full"><i className="bi bi-fullscreen"></i></button>
            ) : (
              <button onClick={() => setMode('mid')} title="Shrink to mid">🗗</button>
            )}
            <button onClick={resetForm} title="Close all">✖</button>
          </div>
        </div>

        {/* To field with recipient tags and suggestions */}
        <div className="to-input-container">
          {recipientTags.map(user => (
            <div
              key={user.id}
              className="recipient-tag-wrapper"
              onMouseEnter={() => {
                setHoveredUserId(user.id);
                setHovered(true);
              }}
              onMouseLeave={() => {
                setHovered(false);
                setTimeout(() => setHoveredUserId(null), 200);
              }}
            >
              <RecipientTag user={user} onRemove={removeRecipientTag} />
              {hovered && hoveredUserId === user.id && (
                <div>
                  <ProfileView userid={user.id} token={sessionStorage.getItem('token')} />
                </div>
              )}
            </div>
          ))}

          <input
            type="text"
            placeholder="To"
            value={to}
            onChange={e => setTo(e.target.value)}
            onKeyDown={handleKeyDownInTo}
          />
        </div>

        {/* Suggested recipients section */}
        {suggestedRecipients.length > 0 && (
          <div className="recipient-suggestions">
            {suggestedRecipients.map(user => (
              <div
                key={user.id}
                className="suggestion-item"
                onClick={() => handleAcceptSuggestion(user)}
              >
                Press ⏎ to add <strong>{user.userName}</strong> as a recipient
                <div className="full-name">
                  {user.firstName} {user.lastName}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Subject and body */}
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          type="text"
          placeholder="Message body"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="message-body-input"
        />

        {/* Attachments */}
        <AttachmentList files={files} setFiles={setFiles} />

        {/* Send + attachment controls */}
        <div className="send-attachment-bar">
          <SendButton
            onSendNow={sendMail}
            onScheduleSend={() => setShowScheduleModal(true)}
          />
          <AttachmentControls
            onFileSelect={handleFileSelect}
            onImageSelect={handleFileSelect}  
            onReset={resetForm}
            onResetDelete={resetFormDelete}
          />
        </div>

        {/* Success message */}
        {mailSent && <div className="draft-status"> Mail sent successfully!</div>}

        {/* Schedule modal */}
        {showScheduleModal && (
          <ScheduleModal
            onSchedule={(datetime) => {
              setScheduledSend(datetime);
              scheduleMail(new Date(datetime).getTime(), sendMail);
              setShowScheduleModal(false);
            }}
            onCancel={() => setShowScheduleModal(false)}
          />
        )}

        {/* Error message */}
        {dynamicErrorMessage && (
          <DynamicMessage
            mode="alert"
            title="Error"
            message={dynamicErrorMessage}
            onClose={() => setDynamicErrorMessage(null)} 
          />
        )}
      </div>
    </div>
  );

  return (
    <div>
      {mode === 'closed' ? renderClosedBar() : renderComposeBox()}
    </div>
  );
}

export default ComposeMail;
