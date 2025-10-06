// utils/formUtils.js

// Builds a FormData object for sending mail via multipart/form-data
export function buildMailFormData({ to, subject, content, files, scheduledSend, sendNow }) {
  const formData = new FormData(); // Create a new FormData instance

  // Append basic mail fields
  formData.append('to', to); // Recipient(s)
  formData.append('subject', subject); // Mail subject
  formData.append('content', content); // Mail body/content
  formData.append('send', sendNow ? 'true' : 'false'); // Whether to send immediately
  formData.append('scheduledSend', scheduledSend || ''); // Optional scheduled send time

  // Append any attached files
  files.forEach((file) => {
    formData.append('attachments', file); // Multiple attachments allowed
  });

  return formData; // Return the FormData ready for submission
}
