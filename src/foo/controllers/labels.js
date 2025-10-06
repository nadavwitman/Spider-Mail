// controllers/labels.js
const LabelsService = require('../services/labels');     // async labels service
const UserService   = require('../services/users'); // async users service
const MailService   = require('../services/mails');       // async mails service
const { verifyToken } = require('../models/tokens');      // JWT verify (unchanged)

// GET /api/labels
exports.getAllLabels = async (req, res) => {
  const authHeader = req.headers['authorization'];

  // validate Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Missing or invalid Authorization header' }, null, 2) + '\n');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  // validate token + user
  const user = decoded ? await UserService.findById(decoded.id) : null;
  if (!decoded || !user) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Unauthorized' }, null, 2) + '\n');
  }

  const labels = await LabelsService.getAllLabels(String(user._id));
  res.status(200).type('application/json')
    .send(JSON.stringify(labels, null, 2) + '\n');
};

// POST /api/labels
exports.createLabel = async (req, res) => {
  const authHeader = req.headers['authorization'];

  // validate Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Missing or invalid Authorization header' }, null, 2) + '\n');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  const user = decoded ? await UserService.findById(decoded.id) : null;
  if (!decoded || !user) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Unauthorized' }, null, 2) + '\n');
  }

  // read label name
  const { name } = req.body;
  if (!name) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Label name is required' }, null, 2) + '\n');
  }

  // uniqueness per user
  const existingLabel = await LabelsService.findLabelByUserIdAndName(String(user._id), name);
  if (existingLabel) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Label name already exists' }, null, 2) + '\n');
  }

  await LabelsService.createLabel(String(user._id), name);
  return res.status(201).end();
};

// GET /api/labels/:id
exports.getLabelById = async (req, res) => {
  const labelId = req.params.id;
  const authHeader = req.headers['authorization'];

  // validate Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Missing or invalid Authorization header' }, null, 2) + '\n');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  const user = decoded ? await UserService.findById(decoded.id) : null;
  if (!decoded || !user) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Unauthorized' }, null, 2) + '\n');
  }

  // load label
  const label = await LabelsService.getLabelById(labelId);
  if (!label || label.userId !== String(user._id)) {
    return res.status(404).type('application/json')
      .send(JSON.stringify({ error: 'Label not found' }, null, 2) + '\n');
  }

  // mails for this label (filtered like before)
  let mails = await LabelsService.getMailsForLabel(labelId);

  // exclude spam mails when label is not "Spam"
  if (label.name !== 'Spam') {
    const spamLabel = await LabelsService.findLabelByUserIdAndName(String(user._id), 'Spam');
    const spamMailIds = new Set((spamLabel?.mails || []).map(String));
    mails = mails.filter(m => !spamMailIds.has(String(m.id)));
  }

  // sort mails newest first
  mails.sort((a, b) => new Date(b.date) - new Date(a.date));

  // shape response (add isRead)
  const safeMails = mails.map(mail => {
    const { send, readBy, ...safeMail } = mail;
    return {
      ...safeMail,
      isRead: Array.isArray(readBy) && readBy.includes(String(user._id))
    };
  });

  res.status(200).type('application/json')
    .send(JSON.stringify({ ...label, mails: safeMails }, null, 2) + '\n');
};

// PATCH /api/labels/:id
exports.updateLabel = async (req, res) => {
  const labelId = req.params.id;
  const { name, action, mailId } = req.body;

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Missing or invalid Authorization header' }, null, 2) + '\n');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  const user = decoded ? await UserService.findById(decoded.id) : null;
  if (!decoded || !user) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Unauthorized' }, null, 2) + '\n');
  }

  // load label and authorize ownership
  const label = await LabelsService.getLabelById(labelId);
  if (!label || label.userId !== String(user._id)) {
    return res.status(404).type('application/json')
      .send(JSON.stringify({ error: 'Label not found' }, null, 2) + '\n');
  }

  // action on mail inside label
  if (action && mailId) {
    const mail = await MailService.getMailById(mailId);
    if (!mail) {
      return res.status(404).type('application/json')
        .send(JSON.stringify({ error: 'Mail not found' }, null, 2) + '\n');
    }

    if (action === 'ADD') {
      await LabelsService.addMailToLabelByID(labelId, mailId);
    } else if (action === 'REMOVE') {
      await LabelsService.removeMailFromLabelByID(labelId, mailId);
    } else {
      return res.status(400).type('application/json')
        .send(JSON.stringify({ error: 'Invalid action' }, null, 2) + '\n');
    }

    return res.status(204).end();
  }

  // rename label
  if (!name) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'New label name is required' }, null, 2) + '\n');
  }

  // prevent duplicate name for same user
  const existing = await LabelsService.findLabelByUserIdAndName(String(user._id), name);
  if (existing && String(existing.id) !== String(labelId)) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Label name already exists' }, null, 2) + '\n');
  }

  await LabelsService.updateLabel(labelId, name);
  res.status(204).end();
};

// DELETE /api/labels/:id
exports.deleteLabel = async (req, res) => {
  const labelId = req.params.id;

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Missing or invalid Authorization header' }, null, 2) + '\n');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  const user = decoded ? await UserService.findById(decoded.id) : null;
  if (!decoded || !user) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Unauthorized' }, null, 2) + '\n');
  }

  const label = await LabelsService.getLabelById(labelId);
  if (!label || label.userId !== String(user._id)) {
    return res.status(404).type('application/json')
      .send(JSON.stringify({ error: 'Label not found' }, null, 2) + '\n');
  }

  await LabelsService.deleteLabel(labelId);
  res.status(204).end();
};
