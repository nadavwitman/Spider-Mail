import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './inbox.module.css';
import Sidebar from '../components/Sidebar/Sidebar';
import HeaderIcons from '../components/Header/Header';
import MailItem from '../components/MailItem/MailItem';
import { useParams } from 'react-router-dom';
import { getLabelByName } from '../services/labels';
import { useTheme } from '../context/ThemeContext';

let token = sessionStorage.getItem('token');
if (!token) {
  const localToken = localStorage.getItem('token');
  if (localToken) {
    sessionStorage.setItem('token', localToken);
  }
}

function Inbox() {
  const [mails, setMails] = useState([]); // list of mails to display
  const [error, setError] = useState(''); // error message
  const [sidebarOpen, setSidebarOpen] = useState(true); // sidebar visibility
  const [isDraft, setIsDraft] = useState(false); // whether current label is Drafts
  const [searchQuery, setSearchQuery] = useState(''); // search input
  const [loading, setLoading] = useState(false); // loading state
  const { darkMode } = useTheme(); // dark mode from context

  const { labelId } = useParams(); // current label ID from route
  const prevFirstMailId = useRef(null); // to avoid unnecessary re-render
  const controllerRef = useRef(null); // AbortController for fetch
  const debounceTimeout = useRef(null); // debounce timer for search

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Function to load mails based on current label
  const loadMails = useCallback(async () => {
    try {
      setError('');
      const token = sessionStorage.getItem('token');

      // Abort previous request if any
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const allMailsLabel = await getLabelByName('All Mails');
      const allMailsLabelId = allMailsLabel ? allMailsLabel.id : null;

      let data = [];

      if (labelId) {
        if (labelId === allMailsLabelId) {
          // Fetch all mails
          const res = await fetch(`/api/mails`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            signal
          });
          if (!res.ok) throw new Error(`All mails fetch failed: ${res.status}`);
          data = await res.json();
          setIsDraft(false);
        } else {
          // Fetch mails for specific label
          const res = await fetch(`/api/labels/${labelId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            signal
          });
          if (!res.ok) throw new Error(`Label fetch failed: ${res.status}`);
          const labelData = await res.json();
          data = Array.isArray(labelData.mails) ? labelData.mails : [];
          setIsDraft(labelData.name === 'Drafts');
          if (labelData.name === 'Drafts') {
            setMails(data);
          }
        }
      } else {
        // If no labelId, default to Inbox
        const resLabels = await fetch('/api/labels', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          signal
        });
        if (!resLabels.ok) throw new Error(`Labels fetch failed: ${resLabels.status}`);
        const labels = await resLabels.json();

        const inboxLabel = labels.find(l => l.name === 'Inbox');
        if (!inboxLabel) throw new Error('Inbox label not found');

        const inboxRes = await fetch(`/api/labels/${inboxLabel.id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          signal
        });
        if (!inboxRes.ok) throw new Error(`Inbox mails fetch failed: ${inboxRes.status}`);
        const inboxData = await inboxRes.json();
        data = Array.isArray(inboxData.mails) ? inboxData.mails : [];
        setIsDraft(false);
      }

      // Only update mails if the first mail changed
      const newFirstId = data.length > 0 ? data[0].id : null;
      if (newFirstId !== prevFirstMailId.current) {
        setMails(data);
        prevFirstMailId.current = newFirstId;
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    }
  }, [labelId]);

  // Load mails initially and every 5 seconds
  useEffect(() => {
    loadMails();
    const intervalId = setInterval(() => loadMails(), 5000);
    return () => clearInterval(intervalId);
  }, [loadMails]);

  // Search functionality with debounce
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      if (searchQuery.trim() === '') {
        await loadMails();
        setLoading(false);
        return;
      }

      setError('');
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`/api/mails/search/${encodeURIComponent(searchQuery.trim())}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        setMails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [loadMails, searchQuery]);

  // Reset search when label changes
  useEffect(() => setSearchQuery(''), [labelId]);

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  return (
    <div className={`${styles.inboxContainer} ${darkMode ? styles.dark : ''}`}>
      <header className={styles.inboxHeader}>
        {/* Header with icons and search */}
        <HeaderIcons
          onToggleSidebar={toggleSidebar}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery} 
        />
      </header>

      <div className={styles.inboxBody}>
        {/* Sidebar */}
        <div className={styles.sidebarContainer}>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main mail list */}
        <main className={styles.mailList}>
          {error && <p className={styles.error}>{error}</p>}
          {loading && <p>Loading...</p>}
          {(!loading && mails.length === 0) && <p className={styles.empty}>No mails to display</p>}
          {mails.map(mail => (
            <MailItem
              key={mail.id}
              mail={mail}
              isDraft={isDraft}
              onDelete={deletedId => setMails(prev => prev.filter(m => m.id !== deletedId))}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

export default Inbox;
