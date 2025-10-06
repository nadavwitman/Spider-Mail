const BlacklistModel = require('../models/blacklist');
const MailModel = require('../services/mails');
const LabelModel = require('../services/labels');
const UserModel = require('../services/users');
const util = require('util');
const sendToBlacklist = util.promisify(BlacklistModel.sendToBlacklistServer);
const { verifyToken } = require('../models/tokens');

// POST /api/blacklist
exports.addToBlacklist = async (req, res) => {
  // Check Authorization header for token
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .type('application/json')
      .send(JSON.stringify({ error: 'Missing or invalid Authorization header' }, null, 2) + '\n');
  }

  // check if token is valid
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res
      .status(401)
      .type('application/json')
      .send(JSON.stringify({ error: 'Invalid token' }, null, 2) + '\n');
  }

  // Find the user from the decoded token
  const user = await UserModel.findById(decoded.id);
  if (!user) {
    return res
      .status(400)
      .type('application/json')
      .send(JSON.stringify({ error: 'Unauthorized' }, null, 2) + '\n');
  }

  const { mailId } = req.body;

  // Validate that a URL was provided
  if (!mailId) {
    return res
      .status(400)
      .type('application/json')
      .send(JSON.stringify({ error: 'Mail is required' }, null, 2) + '\n');
  }
    const mail = await MailModel.getMailById(mailId);

    // Ensure the mail exists and belongs to the user (sender or recipient)
  if (!mail || (mail.from !== user.userName && !mail.to.includes(user.userName))) {
    return res
      .status(404)
      .type('application/json')
      .send(JSON.stringify({ error: 'Mail not found' }, null, 2) + '\n');
  }

  if (!mail.send) {
    return res
      .status(404)
      .type('application/json')
      .send(JSON.stringify({ error: 'Cant modify draft as a spam' }, null, 2) + '\n');
  }

  const links = await MailModel.extractLinksFromMail(mail.content,mail.subject);

  try {
    // Send the POST request to the blacklist server
    for (const url of links) {
      const response = await sendToBlacklist('POST', url);
      const statusCode = parseInt(response.split(' ')[0], 10);

      if (statusCode !== 201) {
        return res.status(statusCode).send();
      }
    }

    await LabelModel.addMailToLabelByName('Spam',mailId,user.id)
    return res.status(201).send();
  }
   catch (err) {
    // Handle failure to reach the blacklist server
    res
      .status(400)
      .type('application/json')
      .send(JSON.stringify({ error: 'Could not contact blacklist server' }, null, 2) + '\n');
  }
};

// DELETE /api/blacklist/:id
exports.removeFromBlacklist = async (req, res) => {
  // Check Authorization header for token
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .type('application/json')
      .send(JSON.stringify({ error: 'Missing or invalid Authorization header' }, null, 2) + '\n');
  }

  // check if token is valid
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res
      .status(401)
      .type('application/json')
      .send(JSON.stringify({ error: 'Invalid token' }, null, 2) + '\n');
  }

  // Find the user from the decoded token
  const user = await UserModel.findById(decoded.id);
  if (!user) {
    return res
      .status(400)
      .type('application/json')
      .send(JSON.stringify({ error: 'Unauthorized' }, null, 2) + '\n');
  }

  const mailId = req.params.id; 

  // Validate that a URL was provided
  if (!mailId) {
    return res
      .status(400)
      .type('application/json')
      .send(JSON.stringify({ error: 'Mail is required' }, null, 2) + '\n');
  }
    const mail = await MailModel.getMailById(mailId);

    // Ensure the mail exists and belongs to the user (sender or recipient)
  if (!mail || (mail.from !== user.userName && !mail.to.includes(user.userName))) {
    return res
      .status(404)
      .type('application/json')
      .send(JSON.stringify({ error: 'Mail not found' }, null, 2) + '\n');
  }

  const links = await MailModel.extractLinksFromMail(mail.content,mail.subject);

  try {
    // Send the POST request to the blacklist server
    for (const url of links) {
      const response = await sendToBlacklist('DELETE', url);
      const statusCode = parseInt(response.split(' ')[0], 10);

      if (statusCode !== 204) {
        return res.status(statusCode).send();
      }
    }

    await LabelModel.removeMailFromLabelByName('Spam',mailId,user.id)
    return res.status(204).send();
  }
   catch (err) {
    // Handle failure to reach the blacklist server
    res
      .status(400)
      .type('application/json')
      .send(JSON.stringify({ error: 'Could not contact blacklist server' }, null, 2) + '\n');
  }
};
