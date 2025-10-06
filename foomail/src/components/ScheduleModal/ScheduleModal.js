import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './ScheduleModal.css';
import { useTheme } from '../../context/ThemeContext'; 
import { useCompose } from '../../context/ComposeContext';
import DynamicMessage from '../DynamicMessage/DynamicMessage';

// Helper function to get local datetime string in the format suitable for input[type=datetime-local]
function getLocalDatetimeString(minutesFromNow = 5) {
  const local = new Date(Date.now() + minutesFromNow * 60000); // Add minutesFromNow to current time
  const offset = local.getTimezoneOffset(); // Get timezone offset in minutes
  const localDate = new Date(local.getTime() - offset * 60000); // Adjust to local time
  return localDate.toISOString().slice(0, 16); // Format as "YYYY-MM-DDTHH:MM"
}

export default function ScheduleModal({ onSchedule, onCancel }) {
  const [scheduledTime, setScheduledTime] = useState(() => getLocalDatetimeString()); // Default to 5 minutes from now
  const { darkMode } = useTheme(); // Access dark mode
  const { closeCompose } = useCompose(); // Access compose mail context
  const [dynamicMessage, setDynamicMessage] = useState(null); // Store error messages

  // Handle scheduling the mail
  const handleSchedule = async () => {
    if (!scheduledTime) return;

    const selected = new Date(scheduledTime);
    const now = new Date();

    // Validate selected time is in the future
    if (selected <= now) {
      setDynamicMessage({
        mode: 'alert',
        title: 'Invalid Time',
        message: 'Please choose a time in the future.',
      });
      return;
    }

    onSchedule(scheduledTime); // Call callback with selected datetime
    await closeCompose(); // Close compose window
  };

  // Modal content to be rendered via portal
  const modalContent = (
    <div className={`schedule-modal-backdrop ${darkMode ? 'dark' : ''}`}>
      <div className={`schedule-modal-content ${darkMode ? 'dark' : ''}`}>
        <h3 className="Schedule-title">Schedule Send</h3>

        {/* Input for selecting datetime */}
        <input
          type="datetime-local"
          value={scheduledTime}
          min={getLocalDatetimeString(0)} // Earliest selectable time is now
          onChange={(e) => setScheduledTime(e.target.value)}
        />

        {/* Action buttons */}
        <div className="schedule-modal-actions">
          <button onClick={handleSchedule}>Schedule</button>
          <button onClick={onCancel}>Cancel</button>
        </div>

        {/* Display dynamic error messages if any */}
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

  // Render the modal into the document body using portal
  return ReactDOM.createPortal(modalContent, document.body);
}
