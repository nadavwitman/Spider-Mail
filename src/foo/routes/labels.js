const express = require('express');
const router = express.Router();
const controller = require('../controllers/labels');

// GET all labels / POST new label
router.route('/')
  .get(controller.getAllLabels)
  .post(controller.createLabel);

// GET / PATCH / DELETE a specific label by ID
router.route('/:id')
  .get(controller.getLabelById)
  .patch(controller.updateLabel)
  .delete(controller.deleteLabel);
// // Adds a specific mail to a specific label (both by id)
// router.route('/:id/:mailId')
//   .post(controller.addMailToLabel);


module.exports = router;
