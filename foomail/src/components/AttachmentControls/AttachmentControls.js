// components/AttachmentControls.jsx
import React, { useRef } from 'react';
import './AttachmentControls.css';

export default function AttachmentControls({ onFileSelect, onResetDelete }) {
  // Create references to the hidden <input type="file"> elements
  const fileInputRef = useRef();
  const imageInputRef = useRef();

  return (
    <div className="attachment-controls">
      {/* Attach generic file button */}
      <label title="Attach file">
        <i className="bi bi-paperclip"></i>
        <input
          type="file"
          style={{ display: 'none' }} // hide the input, only use the label/icon
          ref={fileInputRef} // reference to trigger programmatically if needed
          multiple // allow selecting multiple files
          onChange={(e) => {
            const files = Array.from(e.target.files); // convert FileList to array
            onFileSelect(files); // pass selected files to parent callback
            e.target.value = null; // reset value so the same file can be selected again
          }}
        />
      </label>

      {/* Attach image file button */}
      <label title="Attach image">
        <i className="bi bi-image"></i>
        <input
          type="file"
          accept="image/*" // restrict to images only
          style={{ display: 'none' }} // hide input
          ref={imageInputRef} // reference for image input
          multiple // allow multiple images
          onChange={(e) => {
            const files = Array.from(e.target.files); // get image files
            onFileSelect(files); // callback with selected images
            e.target.value = null; // reset input for re-selection
          }}
        />
      </label>

      {/* Clear attachments button */}
      <button title="Clear" onClick={onResetDelete}>
        <i className="bi bi-trash trash-size"></i>
      </button>
    </div>
  );
}
