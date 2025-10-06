// utils/authUtils.js

// Build the payload for a login request
// Trims whitespace from userName and password before sending
export function buildLoginPayload(userName, password) {
  return JSON.stringify({
    userName: userName.trim(), // Remove leading/trailing spaces from username
    password: password.trim(), // Remove leading/trailing spaces from password
  });
}
