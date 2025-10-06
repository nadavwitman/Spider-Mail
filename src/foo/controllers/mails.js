// controllers/mails.js
const MailService = require('../services/mails');       // async mail service
const UserService = require('../services/users');       // async user service
const LabelsService = require('../services/labels');    // async labels service
const { verifyToken } = require('../models/tokens');    // JWT verify 

// GET /api/mails - return the last 50 mails for the logged-in user
exports.getAllMails = async (req, res) => {
  const authHeader = req.headers['authorization']; // read auth header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(400).json({ error: 'Unauthorized' });

  const user = await UserService.findById(decoded.id); // DB user
  if (!user) return res.status(400).json({ error: 'Unauthorized' });

  const mails = await MailService.getAllMailsForUser(user.userName); // user mails
  const publicMails = mails.map(mail => {
    const { readBy, send, ...safe } = mail;
    return {
      ...safe,
      isRead: readBy.includes(String(decoded.id)) // read flag
    };
  });
  res.status(200).json(publicMails);
};

// POST /api/mails - create a new mail
exports.createMail = async (req, res) => {
  try {
    const authHeader = req.headers['authorization']; // read auth header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1]; // get JWT token
    const decoded = verifyToken(token);     // verify JWT
    if (!decoded) return res.status(400).json({ error: 'Unauthorized' });

    const sender = await UserService.findById(decoded.id); // DB sender
    if (!sender) return res.status(400).json({ error: 'Unauthorized' });

    const { to, subject, content, send, reply, files } = req.body; // mail fields from request

    // required when sending
    if (send === 'true' && (!to || (typeof to === 'string' && to.trim() === ''))) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // recipients must exist (when sending)
    if (to && send === 'true') {
      const recipients = Array.isArray(to) ? to : [to];
      for (const recipient of recipients) {
        const exists = await UserService.findByUserName(recipient);
        if (!exists) {
          return res.status(404).json({ error: `Recipient not found: ${recipient}` });
        }
      }
    }

    // blacklist check
    const links = MailService.extractLinksFromMail(subject, content);
    const respond = await MailService.checkLinksAgainstBlacklist(links);

    // create mail
    const mail = await MailService.createMail({
      from: sender.userName,
      to,
      subject,
      content,
      send,
      spam: respond.blocked,
      reply,
      files,
      readBy: [String(decoded.id)]
    });

    // respond with created mail id
    res.status(201).json({ id: String(mail._id) });

  } catch (err) {
    // catch any unexpected errors and log them
    console.error('[createMail] Fatal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/mails/:id - get a specific mail by ID
exports.getMailById = async (req, res) => {
  try {
    const mailId = req.params.id;

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(400).json({ error: 'Unauthorized' });

    const user = await UserService.findById(decoded.id);
    if (!user) return res.status(400).json({ error: 'Unauthorized' });

    const mail = await MailService.getMailById(mailId); // DB mail
    if (
      !mail ||
      (mail.from !== user.userName && (!Array.isArray(mail.to) || !mail.to.includes(user.userName)))
    ) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    // collect labels that include this mail
    const userLabels = await LabelsService.getAllLabels(String(user._id));
    const labelsForMail = [];
    if (Array.isArray(userLabels)) {
      for (const label of userLabels) {
        const labelMails = await LabelsService.getMailsForLabelNoFilter(label.id);
        if (Array.isArray(labelMails) && labelMails.some(m => String(m.id) === String(mailId))) {
          labelsForMail.push(label.name);
        }
      }
    }

    const safeMail = mail;
    safeMail.labels = labelsForMail;
    safeMail.send = mail.send;
    safeMail.isRead = mail.readBy.includes(String(decoded.id));

    res.status(200).json(safeMail);
  } catch (err) {
    console.error('[getMailById] Fatal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/mails/:id - edit an existing mail
exports.updateMail = async (req, res) => {
  const mailId = req.params.id;
  const { to, subject, content, send, reply, files, readBy } = req.body;

  // Normalize recipients into array if provided
  const newRecipients = to !== undefined ? (Array.isArray(to) ? to : [to]) : [];

  // Authorization header must be present and start with Bearer
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'Unauthorized' });
  }

  // Decode and verify JWT
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(400).json({ error: 'Unauthorized' });

  // Fetch user by ID from token
  const user = await UserService.findById(decoded.id);
  if (!user) return res.status(400).json({ error: 'Unauthorized' });

  // Ensure there is at least one field to update
  if (!to && !subject && !content && !send && reply === undefined && readBy === undefined) {
    return res.status(400).json({ error: 'Missing field to update' });
  }

  // Perform blacklist check on subject/content (even if empty, same as original)
  const links = MailService.extractLinksFromMail(subject, content);
  const respond = await MailService.checkLinksAgainstBlacklist(links);

  // Get current mail by ID
  const mail1 = await MailService.getMailById(mailId);

  // Only the author may edit, except allowing recipients to update readBy
  if (!mail1 || mail1.from !== user.userName) {
    if (readBy) {
      // Allow readBy updates by recipient
    } else {
      return res.status(400).json({ error: 'You are allowed to edit only mails that you wrote' });
    }
  }

  // Disallow editing a mail that was already sent
  if (mail1.send === 'true') {
    return res.status(400).json({ error: 'You cannot edit mail that already sent' });
  }

  // If sending now, validate recipients
  if (send === 'true') {
    if (!newRecipients || newRecipients.length === 0) {
      return res.status(400).json({ error: 'Insert at least one recipient' });
    }

    // Verify each recipient exists
    for (const recipient of newRecipients) {
      const exists = await UserService.findByUserName(recipient);
      if (!exists) {
        return res.status(404).json({ error: `Recipient not found: ${recipient}` });
      }
    }
  }

  // Build recipientDetected array for response if recipients are valid
  const recipientDetected = [];
  for (const recipient of newRecipients) {
    const recipientUser = await UserService.findByUserName(recipient);
    if (recipientUser) {
      recipientDetected.push({
        id: recipientUser.id,          // use raw id as in original
        userName: recipientUser.userName,
        firstName: recipientUser.firstName,
        lastName: recipientUser.lastName,
      });
    }
  }

  // Check blacklist again before deciding spam flag
  const links1 = MailService.extractLinksFromMail(subject, content);
  const respond1 = await MailService.checkLinksAgainstBlacklist(links1);
  const spam = respond1.blocked;

  // If readBy is provided, mark with current user's id
  let finalReadBy = readBy;
  if (readBy !== undefined) finalReadBy = decoded.id;

  // Call MailService update method with provided fields
  await MailService.updateMail(
    mailId,
    to,
    subject,
    content,
    send,
    spam,
    reply,
    files,
    finalReadBy
  );

  // If new recipients were detected, return them in response
  if (recipientDetected.length > 0) {
    return res.status(200).json({ recipientDetected });
  }

  // Otherwise, respond with 204 No Content
  res.status(204).end();
};

// DELETE /api/mails/:id - delete a mail
exports.deleteMail = async (req, res) => {
  const mailId = req.params.id;

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(400).json({ error: 'Unauthorized' });

  const user = await UserService.findById(decoded.id);
  if (!user) return res.status(400).json({ error: 'Unauthorized' });

  const mail = await MailService.getMailById(mailId); // DB mail
  if (!mail || (mail.from !== user.userName && !mail.to.includes(user.userName))) {
    return res.status(400).json({ error: 'Not allowed to delete this mail' });
  }

  await MailService.deleteMail(mailId, user.userName);
  res.status(204).end();
};

// GET /api/mails/search/:query - search mails by query
exports.searchMails = async (req, res) => {
  const query = String(req.params.query || '').toLowerCase();

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(400).json({ error: 'Unauthorized' });

  const user = await UserService.findById(decoded.id);
  if (!user) return res.status(400).json({ error: 'Unauthorized' });

  const allMails = await MailService.getAllMailsForUser(user.userName);
  const filteredMails = allMails.filter(mail =>
    String(mail.subject || '').toLowerCase().includes(query) ||
    String(mail.content || '').toLowerCase().includes(query)
  );

  const publicMails = filteredMails.map(({ send, ...safe }) => safe);
  res.status(200).json(publicMails);
};
