// src/utils/jwtUtils.js

import { jwtDecode } from 'jwt-decode';

// Extracts the user ID from a JWT token
export function extractUserIdFromToken(token) {
  try {
    const decoded = jwtDecode(token); // Decode the JWT payload
    return decoded.id || null; // Return the 'id' field, or null if not present
  } catch (err) {
    console.error('Failed to decode token', err); // Log error if decoding fails
    return null; // Return null on failure
  }
}
