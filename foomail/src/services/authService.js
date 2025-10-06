export async function loginRequest(userName, password) {
  // Send a POST request to /api/tokens with the user credentials
  const res = await fetch('/api/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Tell the server we are sending JSON
    },
    body: JSON.stringify({ userName, password }) // Include userName and password in request body
  });

  // If the response is not ok (status not 2xx), throw an error
  if (!res.ok) {
    throw new Error('Invalid userName or password'); // Generic error message for failed login
  }

  // Parse the JSON response and return it (usually contains the token)
  return res.json();
}
