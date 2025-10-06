// Utility function to normalize the "to" field into an array of email addresses
function normalizeTo(to) {
  if (to === undefined || to === null) return []; // Return empty array if undefined/null

  if (Array.isArray(to)) {
    return to; // Already an array, return as-is
  }

  if (typeof to === 'string') {
    // Split string by commas if present
    if (to.includes(',')) {
      return to
        .split(',')
        .map(s => s.trim()) // Remove whitespace around each entry
        .filter(Boolean);   // Remove empty strings
    } 
    // Split string by spaces if no commas
    else if (to.includes(' ')) {
      return to
        .split(' ')
        .map(s => s.trim())
        .filter(Boolean);
    } 
    // Single email address string
    else {
      return [to.trim()];
    }
  }

  return []; // Fallback: empty array for unexpected input
}

// Function to save a draft (either create or update)
export async function saveMailDraft(params) {
  const { token, draftId, to, subject, content, files, scheduledSend, reply } = params;

  // Determine URL and HTTP method depending on whether it's an existing draft
  const url = draftId
    ? `/api/mails/${draftId}`
    : `/api/mails`;
  const method = draftId ? 'PATCH' : 'POST';

  // Send request to server
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: normalizeTo(to), // Normalize recipients
      subject,
      content,
      files,
      scheduledSend,
      reply
    }),
  });

  // Throw error if request failed
  if (!res.ok) throw new Error('Failed to save draft');

  // Parse response as JSON (or return empty object)
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// Function to send a mail immediately (create or update draft + send)
export async function sendMailNow(params) {
  const { token, draftId, to, subject, content, files, scheduledSend, reply } = params;

  // Determine URL and method depending on draft existence
  const url = draftId
    ? `/api/mails/${draftId}`
    : `/api/mails`;
  const method = draftId ? 'PATCH' : 'POST';

  // Send mail request
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: normalizeTo(to),
      subject,
      content,
      files,
      scheduledSend,
      send: 'true', // Indicate that this is an immediate send
      reply
    }),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    console.warn('Response is not valid JSON', text);
  }

  // Throw error if request failed
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error("Request Entity Too Large");
    } 
    else {
      const serverMessage = data.error || data.message || `Error ${res.status} ${res.statusText}`;
      throw new Error(serverMessage);  }
    }
  return data;
}

// Function to delete a draft by its ID
export async function deleteDraft({ token, draftId }) {
  const res = await fetch(`/api/mails/${draftId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete draft');
}
