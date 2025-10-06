const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your-secret-key'; 

function verifyToken(token) {
  try {
    // Verifies the token and returns decoded payload
    return jwt.verify(token, SECRET_KEY); 
  } catch (err) {
    // Invalid token
    return null; 
  }
}

module.exports = {
  verifyToken
};
