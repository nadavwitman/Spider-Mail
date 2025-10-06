// Function to sign up a new user
export const signupUser = async (data) => {
  // Send POST request to /api/users with user data
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // JSON payload
    body: JSON.stringify(data),
  });

  let result = {};
  try {
    const text = await res.text(); // Get response as text
    result = text ? JSON.parse(text) : {}; // Parse JSON if not empty
  } catch (jsonErr) {
    console.error('Failed to parse JSON response:', jsonErr); // Log parsing errors
  }

  // Throw error if signup request failed
  if (!res.ok) {
    throw new Error(result.error || `Signup failed: ${res.status}`);
  }

  return result; // Return the parsed result
};
