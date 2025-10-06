const baseUrl = 'http://localhost:3000/api/labels'; // Base URL for label-related API calls

// Fetch a single label by its ID
export const getLabelById = async (id) => {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'GET',
    headers: getAuthHeaders() // Include auth headers
  });
  if (!res.ok) throw new Error('Failed to fetch label');
  return res.json();
};

// Fetch all mails
export async function fetchAllMails() {
  const res = await fetch('/api/mails', {
    method: 'GET',
    headers: getAuthHeaders(), // Include auth headers
  });
  if (!res.ok) throw new Error('Failed to fetch all mails');
  return res.json();
}

// Helper to safely parse JSON from response
const parseJsonSafe = async (res) => {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

// Helper to get authorization headers from sessionStorage
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  if (!token) throw new Error('No token found. Please log in.');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Fetch all labels
export const fetchLabels = async () => {
  const res = await fetch(baseUrl, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch labels: ${res.status}`);
  return parseJsonSafe(res);
};

// Create a new label
export const createLabel = async (name) => {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name })
  });

  if (!res.ok) throw new Error(`Failed to create label: ${res.status}`);
  return parseJsonSafe(res);
};

// Update an existing label by ID
export const updateLabel = async (id, name) => {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name })
  });

  if (!res.ok) throw new Error(`Failed to update label: ${res.status}`);
  return parseJsonSafe(res);
};

// Delete a label by ID
export const deleteLabel = async (id) => {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to delete label: ${res.status}`);
  return parseJsonSafe(res);
};

// Add a mail to a label
export async function addMailToLabel(mailId, labelId) {
  const token = sessionStorage.getItem('token');

  const res = await fetch(`/api/labels/${labelId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: 'ADD', // Specify action to add mail
      mailId: mailId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add mail to label: ${res.statusText}`);
  }
}

// Remove a mail from a label
export async function removeMailFromLabel(mailId, labelId) {
  const token = sessionStorage.getItem('token');

  const res = await fetch(`/api/labels/${labelId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: 'REMOVE', // Specify action to remove mail
      mailId: mailId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to remove mail from label: ${res.statusText}`);
  }
}

// Fetch a label by its name
export const getLabelByName = async (name) => {
  const labels = await fetchLabels(); // Fetch all labels
  return labels.find(l => l.name === name); // Return the first label matching the name
};
