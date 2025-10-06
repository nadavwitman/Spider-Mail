import React from 'react';
import './RecipientTag.css';

function RecipientTag({ user, onRemove }) {
  // Render a tag with the user's username and a remove button
  return (
    <span className="recipient-tag">
      {user.userName}

      {/* Button to remove the recipient from the list */}
      <button
        className="recipient-tag-remove"
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering parent click handlers
          onRemove(user.id); // Call onRemove callback with user id
        }}
        aria-label={`Remove ${user.userName}`} // Accessibility label
      >
        ×
      </button>
    </span>
  );
}

export default RecipientTag;
