// Fetch all mails for the logged-in user
export const fetchMails = async () => {
  const token = sessionStorage.getItem('token'); // Get auth token from session
  if (!token) {
    throw new Error('No token found. Please log in.');
  }

  const res = await fetch('/api/mails', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // Include token in request
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch mails: ${res.status}`);
  }

  return await res.json(); // Return JSON response
};

// Delete a mail by its ID
export async function deleteMail(mailId) {
  const token = sessionStorage.getItem('token'); // Get auth token
  const res = await fetch(`/api/mails/${mailId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // Include token in request
    }
  });

  if (!res.ok) throw new Error('Failed to delete mail');
}

// Mark a mail as read by updating the 'readBy' field
export async function markMailAsRead(mailId) {
  const token = sessionStorage.getItem('token'); // Get auth token
  const res = await fetch(`/api/mails/${mailId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json', // Specify JSON content type
    },
    body: JSON.stringify({
      readBy: true // Mark mail as read
    }),
  });

  if (!res.ok) throw new Error('Failed to mark mail as read');

  const text = await res.text(); // Parse response as text
  return text ? JSON.parse(text) : {}; // Return parsed JSON or empty object
}
