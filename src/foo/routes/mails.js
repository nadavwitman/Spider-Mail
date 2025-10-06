const express = require('express');
const router = express.Router();
const controller = require('../controllers/mails');

// Define routes for /api/mails
router.route('/')
  .get(controller.getAllMails)
  .post(controller.createMail);

// Define routes for /api/mails/:id
router.route('/:id')
  .get(controller.getMailById)
  .patch(controller.updateMail)
  .delete(controller.deleteMail);

// Search route
router.get('/search/:query', controller.searchMails);


module.exports = router;
