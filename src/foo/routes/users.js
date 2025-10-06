const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');

// Create new user (register)
router.post('/', userController.register);

// Get user profile by ID (only the user can access their own data)
router.get('/:id', userController.getUserById);

module.exports = router;
