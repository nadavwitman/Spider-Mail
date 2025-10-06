import React from 'react';
import './AttachmentList.css';
import { useTheme } from '../../context/ThemeContext';

export default function AttachmentList({ files, setFiles }) {
  const { darkMode } = useTheme();

  if (!files?.length) return null;

  const handleRemove = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`attachment-list ${darkMode ? 'dark' : ''}`}>
      {files.map((file, i) => (
        <div key={i} className={`attachment-item ${darkMode ? 'dark' : ''}`}>
          <i className="bi bi-paperclip"></i> {file.name}
          <button
            className="attachment-remove-btn"
            onClick={() => handleRemove(i)}
            title="Remove attachment"
          >
            ✖
          </button>
        </div>
      ))}
    </div>
  );
}
