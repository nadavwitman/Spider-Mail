const userModel = require('../services/users');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your-secret-key'; 
// Async function with proper error handling
exports.login = async (req, res) => {
  try {
    const { userName, password } = req.body || {};

    // Validate required fields
    if (!userName || !password) {
      return res.status(400).json({ error: 'User name and password are required' });
    }

    // Use the correct service function (case sensitive)
    const user = await userModel.findByUserName(userName);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If passwords are hashed in DB, use bcrypt.compare instead of plain comparison
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Usually Mongoose documents have _id, not id
    const token = jwt.sign(
      { id: user._id, userName: user.userName }, 
      SECRET_KEY, 
      { expiresIn: '2h' } // Token expiration time
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error('[LOGIN] error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
