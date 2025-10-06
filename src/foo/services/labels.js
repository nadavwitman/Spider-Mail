const util = require('util');
const Label = require('../models/labels');                 // mongoose label model (schema separated)
const UserService = () => require('./users');                    // your users API (now async w/ mongoose)
const MailService = () => require('./mails');                    // your mails API (now async)
const BlacklistModel = require('../models/blacklist');

const addToBlacklist = util.promisify(BlacklistModel.addToBlacklist);           // TCP add
const removeFromBlacklist = util.promisify(BlacklistModel.removeFromBlacklist); // TCP remove

// Create a new label
async function createLabel(userId, name) {
  const doc = await Label.create({ userId: String(userId), name, mails: [] }); // create label
  return { id: String(doc._id), userId: doc.userId, name: doc.name };          // return minimal shape
}

// Return all labels for a specific user
async function getAllLabels(userId) {
  const docs = await Label.find({ userId: String(userId) }).lean().exec();

  const DEFAULT_ORDER = ['Inbox','Sent','Drafts','Spam','Trash','All Mails'];

  const defaults = [];
  const customs = [];

  for (const d of docs) {
    if (DEFAULT_ORDER.includes(d.name)) {
      defaults.push(d);
    } else {
      customs.push(d);
    }
  }

  // Defaults in fixed order
  defaults.sort(
    (a, b) => DEFAULT_ORDER.indexOf(a.name) - DEFAULT_ORDER.indexOf(b.name)
  );

  // Customs oldest → newest
  customs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const ordered = [...defaults, ...customs];

  return ordered.map(d => ({
    id: String(d._id),
    userId: d.userId,
    name: d.name,
    mails: Array.isArray(d.mails) ? d.mails : [],
    createdAt: d.createdAt
  }));
}

// Get a specific label by ID
async function getLabelById(id) {
  const d = await Label.findById(id).lean().exec();        // find by id
  if (!d) return undefined;
  return { id: String(d._id), userId: d.userId, name: d.name, mails: d.mails }; // expose mails internally
}

// Update the name of a label
async function updateLabel(id, newName) {
  await Label.findByIdAndUpdate(id, { name: newName }).exec(); // rename
}

// Delete a label
async function deleteLabel(id) {
  await Label.findByIdAndDelete(id).exec(); // remove
}

// Add a mail to a label by label name
async function addMailToLabelByName(labelName, mailId, userId) {
  const label = await Label.findOne({ name: labelName, userId: String(userId) }).exec(); // find label
  if (!label) return;
  if (!label.mails.includes(String(mailId))) label.mails.push(String(mailId));           // add if not exists
  await label.save();
}

// Remove a mail from a label by label name
async function removeMailFromLabelByName(labelName, mailId, userId) {
  const label = await Label.findOne({ name: labelName, userId: String(userId) }).exec(); // find label
  if (!label) return;
  label.mails = label.mails.filter(id => id !== String(mailId));                         // remove mail
  await label.save();
}

// Add a mail to a label by label ID
async function addMailToLabelByID(labelId, mailId) {
  const label = await Label.findById(labelId).exec();    // load label
  if (!label) return;

  if (!label.mails.includes(String(mailId))) {
    if (label.name !== 'Trash') {
      await removeMailFromLabelByName('Trash', mailId, label.userId); // remove from Trash if exists
    }
    label.mails.push(String(mailId));                     // add mail
    await label.save();
  }

  // if label is spam, add links from mail to blacklist
  if (label.name.toLowerCase() === 'spam') {
    const mail = await MailService().getMailById(mailId);     // get mail (async API)
    if (mail) {
      const links = MailService().extractLinksFromMail(mail.subject, mail.content); // extract urls
      for (const link of links) {
        try { await addToBlacklist(link); } catch (e) { console.error(e); }     // best-effort
      }
    }
  }
}

// Remove a mail from a label by label ID
async function removeMailFromLabelByID(labelId, mailId) {
  const label = await Label.findById(labelId).exec();     // load label
  if (!label) return;

  if (label.mails.includes(String(mailId))) {
    label.mails = label.mails.filter(id => id !== String(mailId)); // remove mail
    await label.save();
  }

  // if label is spam, remove links from blacklist
  if (label.name.toLowerCase() === 'spam') {
    const mail = await MailService().getMailById(mailId);
    if (mail) {
      const links = MailService().extractLinksFromMail(mail.subject, mail.content);
      for (const link of links) {
        try { await removeFromBlacklist(link); } catch (e) { console.error(e); }
      }
    }
  }
}

// Find a label by user ID and label name
async function findLabelByUserIdAndName(userId, labelName) {
  const d = await Label.findOne({ userId: String(userId), name: labelName }).lean().exec(); // find by composite
  if (!d) return undefined;
  return { id: String(d._id), userId: d.userId, name: d.name, mails: d.mails };            // shape
}

// Get all mails for a label with filtering (not deleted, last in thread, etc.)
async function getMailsForLabel(labelId) {
  const label = await getLabelById(labelId);             // load label details
  if (!label) return [];

  const user = await UserService().findById(label.userId);   // load user
  if (!user) return [];

  const userEmail = user.userName;

  const allMails = [];
  for (const mailId of label.mails) {
    const m = await MailService().getMailById(mailId);       // get mail (returns with .id)
    if (m) allMails.push(m);
  }

  const mailMap = new Map();                             // unique per mail id
  const repliedToSet = new Set();                        // replied ids

  for (const mail of allMails) {
    const senderUser = await UserService().findByUserName(mail.from); // resolve sender full name
    const mailWithFullName = { ...mail };                // clone
    if (senderUser) mailWithFullName.from = `${senderUser.firstName} ${senderUser.lastName}`;
    mailMap.set(String(mail.id || mail._id), mailWithFullName);

    if (Array.isArray(mail.reply)) {
      for (const repliedId of mail.reply) repliedToSet.add(String(repliedId));
    }
  }

  const lastMails = [...mailMap.values()].filter(m => !repliedToSet.has(String(m.id || m._id)));

  // filter: not deleted + relevant to user
  return lastMails.filter(m => {
    const isSender = m.from === userEmail || m.from === `${user.firstName} ${user.lastName}`;
    const isRecipient = Array.isArray(m.to) && m.to.includes(userEmail);

    return isSender || isRecipient;
  });
}

// Get all mails for a label without filtering
async function getMailsForLabelNoFilter(labelId) {
  const label = await getLabelById(labelId);             // load label
  if (!label) return [];

  const user = await UserService().findById(label.userId);   // load user
  if (!user) return [];

  const allMails = [];
  for (const mailId of label.mails) {
    const m = await MailService().getMailById(mailId);
    if (m) allMails.push(m);
  }
  return allMails;
}

// Remove a mail from all labels of a user
async function removeMailFromAllLabels(mailId, userId) {
  await Label.updateMany(
    { userId: String(userId) },
    { $pull: { mails: String(mailId) } }
  ).exec(); // remove mailId from all labels of that user
}

// Add a mail to all thread-related labels for the sender
async function addMailToThreadLabels(newMail) {
  const sender = await UserService().findByUserName(newMail.from);
  if (!sender) return;
  const userId = String(sender._id || sender.id);

  const userLabels = await Label.find({ userId }).exec();
  const threadMailIds = new Set(Array.isArray(newMail.reply) ? newMail.reply.map(String) : []);
  threadMailIds.add(String(newMail.id || newMail._id));  // include current mail id

  for (const label of userLabels) {
    const hasThreadMail = label.mails.some(mid => threadMailIds.has(String(mid)));
    if (hasThreadMail && !label.mails.includes(String(newMail.id || newMail._id))) {
      label.mails.push(String(newMail.id || newMail._id));
      await label.save();
    }
  }
}

// Add a mail to all thread-related labels for recipients
async function addMailToThreadLabelsForRecipients(mail) {
  const repliedMailIds = Array.isArray(mail.reply) ? mail.reply.map(String) : [];
  if (repliedMailIds.length === 0) return;

  for (const recipientEmail of mail.to || []) {
    const user = await UserService().findByUserName(recipientEmail);
    if (!user) continue;
    const userId = String(user._id || user.id);

    const labels = await Label.find({ userId }).exec();
    for (const label of labels) {
      const hasAny = label.mails.some(mid => repliedMailIds.includes(String(mid)));
      if (hasAny && !label.mails.includes(String(mail.id || mail._id))) {
        label.mails.push(String(mail.id || mail._id));
        await label.save();
      }
    }
  }
}

module.exports = {
  createLabel,
  getAllLabels,
  getLabelById,
  updateLabel,
  deleteLabel,
  addMailToLabelByID,
  addMailToLabelByName,
  removeMailFromLabelByName,
  removeMailFromLabelByID,
  getMailsForLabel,
  getMailsForLabelNoFilter,
  findLabelByUserIdAndName,
  removeMailFromAllLabels,
  addMailToThreadLabels,
  addMailToThreadLabelsForRecipients
};
