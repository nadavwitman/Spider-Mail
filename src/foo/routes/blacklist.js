const express = require('express');
const router = express.Router();
const controller = require('../controllers/blacklist');

// POST to add a blacklisted URL
router.post('/', controller.addToBlacklist);

// DELETE by ID or URL string
router.delete('/:id', controller.removeFromBlacklist);

module.exports = router;
