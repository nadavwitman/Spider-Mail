const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokens');

// Check if the user exist
router.post('/', tokenController.login);

module.exports = router;
