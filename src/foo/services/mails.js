const util = require('util');
const UserService = () => require('./users');          // user lookups via Mongoose
const BlacklistTCP = require('../models/blacklist');             // your TCP helper
const sendToBlacklist = util.promisify(BlacklistTCP.sendToBlacklistServer); // promisified TCP
const Mail = require('../models/mails');                                  // Mongoose Mail model
const LabelsService = () => require('./labels');                 // keep using your labels module

// Create a new mail 
async function createMail({ from, to, subject, content, send, spam, reply, files, readBy }) {
  const toArr = Array.isArray(to) ? to : (to !== undefined ? [to] : []); // normalize to[]
  const replyArr = Array.isArray(reply) ? reply.map(String) : [];        // normalize reply[]
  const filesArr = Array.isArray(files) ? files : [];                    // normalize files[]
  const readByArr = Array.isArray(readBy) ? readBy : (readBy ? [readBy] : []);

  const mail = await Mail.create({
    from,
    to: toArr,
    subject,
    content,
    date: new Date(),
    send: send === 'true', // coerce string -> boolean
    reply: replyArr,
    files: filesArr,
    readBy: readByArr
  });

  // sender user (needed for labels)
  const sender = await UserService().findByUserName(mail.from);   // returns doc or null

  if (mail.send) {
    await LabelsService().addMailToLabelByName('Sent', String(mail._id), String(sender._id)); // add to Sent

    // add to recipients (Inbox/Spam)
    for (const receiverEmail of mail.to) {
      const user = await UserService().findByUserName(receiverEmail);
      if (user) {
        if (spam) await LabelsService().addMailToLabelByName('Spam', String(mail._id), String(user._id));
        else      await LabelsService().addMailToLabelByName('Inbox', String(mail._id), String(user._id));
      }
    }

    // thread labels (same logic you had, working with ids as strings)
    await LabelsService().addMailToThreadLabels({ ...mail.toObject(), id: String(mail._id) });
    await LabelsService().addMailToThreadLabelsForRecipients({ ...mail.toObject(), id: String(mail._id) });

  } else {
    await LabelsService().addMailToLabelByName('Drafts', String(mail._id), String(sender._id)); // draft
  }

  // return the created mail doc
  return mail;
}

// Return last 50 mails for a user (newest first)
async function getAllMailsForUser(userName) {
  const user = await UserService().findByUserName(userName);
  if (!user) return [];
  const userId = String(user._id);

  // Get all labels that belong to this user (including Trash)
  const labels = await LabelsService().getAllLabels(userId);

  // Collect all unique mail IDs from the user's labels
  const mailIds = new Set();
  for (const label of labels) {
    for (const mailId of label.mails) {
      mailIds.add(String(mailId));
    }
  }

  // Load all mails for these IDs
  const mails = [];
  for (const id of mailIds) {
    const m = await getMailById(id);
    if (m) mails.push(m);
  }

  // Collect all mail IDs that were replied to
  const repliedIds = new Set();
  for (const mail of mails) {
    if (Array.isArray(mail.reply)) {
      mail.reply.forEach(rid => repliedIds.add(String(rid)));
    }
  }

  // Keep only the last mails in each thread (not replied-to)
  const lastMails = mails.filter(m => 
    !repliedIds.has(String(m.id || m._id)) && 
    m.send === true                             
  );

  // Sort by date (descending) and return up to 50
  return lastMails
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 50);
}

// Get a specific mail by ID (labels module calls this)
async function getMailById(id) {
  const doc = await Mail.findById(id).lean().exec();
  if (!doc) return undefined;
  return { ...doc, id: String(doc._id) }; // keep .id like your in-memory code expects
}

// Update mail 
async function updateMail(id, to, subject, content, send, spam, reply, files, readBy) {
  const mail = await Mail.findById(id).exec();
  if (!mail) return;

  if (to !== undefined)     mail.to = Array.isArray(to) ? to : [to];
  if (subject !== undefined)mail.subject = subject;
  if (content !== undefined)mail.content = content;
  if (reply !== undefined)  mail.reply = Array.isArray(reply) ? reply.map(String) : [];
  if (files !== undefined)  mail.files = Array.isArray(files) ? files : [];
  if (readBy !== undefined) {
    const arr = Array.isArray(readBy) ? readBy : [readBy];
    for (const u of arr) if (!mail.readBy.includes(u)) mail.readBy.push(u);
    await mail.save();
    return;
  }

  const sender = await UserService().findByUserName(mail.from);

  if (mail.send || send === 'true') {
    mail.send = true;
    if (sender) {
      await LabelsService().addMailToLabelByName('Sent', String(mail._id), String(sender._id));
      await LabelsService().removeMailFromLabelByName('Drafts', String(mail._id), String(sender._id));
    }

    for (const receiverEmail of mail.to) {
      const user = await UserService().findByUserName(receiverEmail);
      if (user) {
        if (spam) await LabelsService().addMailToLabelByName('Spam', String(mail._id), String(user._id));
        else      await LabelsService().addMailToLabelByName('Inbox', String(mail._id), String(user._id));
      }
    }

    await LabelsService().addMailToThreadLabels({ ...mail.toObject(), id: String(mail._id) });
    await LabelsService().addMailToThreadLabelsForRecipients({ ...mail.toObject(), id: String(mail._id) });

  } else {
    if (sender) await LabelsService().addMailToLabelByName('Drafts', String(mail._id), String(sender._id));
  }

  await mail.save();
}

// Delete mail (thread-aware by your reply-closure)
async function deleteMail(id, userName) {
  const mail = await Mail.findById(id).exec();
  if (!mail) return;

  const user = await UserService().findByUserName(userName);
  if (!user) return;
  const userId = String(user._id);

  if (!mail.send) {
    await LabelsService().removeMailFromLabelByName('Drafts', String(id), userId);
    return;
  }

  // Efficient Trash membership check
  const trashLabel = await LabelsService().findLabelByUserIdAndName(userId, 'Trash');
  const trashSet = new Set((trashLabel?.mails || []).map(String));
  const isInTrash = trashSet.has(String(id));

  // Build target set: this mail + all replies (already-all-descendants per your model)
  const replies = Array.isArray(mail.reply) ? mail.reply.map(String) : [];
  const targets = new Set([String(id), ...replies].filter(Boolean));

  // 1) remove from all labels (for this user)
  for (const tid of targets) {
    await LabelsService().removeMailFromAllLabels(tid, userId);
  }

  // 2) toggle trash for the whole set
  if (isInTrash) {
    for (const tid of targets) {
      await LabelsService().removeMailFromLabelByName('Trash', tid, userId);
    }
  } else {
    for (const tid of targets) {
      await LabelsService().addMailToLabelByName('Trash', tid, userId);
    }
  }
}

// Extract links from subject + content
function extractLinksFromMail(subject, content) {
  const allcontent = `${subject} ${content}`;
  const urlRegex = /((https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,})(\/\S*)?/g;
  return allcontent.match(urlRegex) || [];
}

// Check links against blacklist server 
async function checkLinksAgainstBlacklist(links) {
  for (const link of links) {
    try {
      const response = await sendToBlacklist('GET', link);
      if (!response.includes('false')) {
        return { blocked: true, reason: 'Mail contains blacklisted link' };
      }
    } catch (_e) {
      return { blocked: true, reason: 'Could not contact blacklist server' };
    }
  }
  return { blocked: false };
}

module.exports = {
  createMail,
  getAllMailsForUser,
  getMailById,
  updateMail,
  deleteMail,
  extractLinksFromMail,
  checkLinksAgainstBlacklist
};
