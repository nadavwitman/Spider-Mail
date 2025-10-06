// Fetch a user by their ID using the provided token for authorization
export async function getUserById(id, token) {
  const res = await fetch(`/api/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`, // Include Bearer token in headers
    }
  });

  // Throw an error if the request failed
  if (!res.ok) throw new Error('Failed to fetch user');

  // Return the parsed JSON user data
  return await res.json();
}
