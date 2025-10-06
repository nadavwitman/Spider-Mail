const mongoose = require('mongoose');

const mailSchema = new mongoose.Schema({
  from: { type: String, required: true },                      // sender username/email
  to: { type: [String], default: [] },                         // recipients
  subject: { type: String, default: '' },                      // subject
  content: { type: String, default: '' },                      // body
  date: { type: Date, default: Date.now },                     // created/sent time
  send: { type: Boolean, default: false },                     // sent (true) or draft (false)                                                          // username -> true
  reply: { type: [String], default: [] },                      // replied-to mail ids (keep as strings for compatibility)
  files: {
  type: [
    {
      name: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true },
      data: { type: String, required: true }                   // base64
    }
  ],
  default: []
  },                                                           // attachments refs (paths/ids)
  readBy: { type: [String], default: [] }                      // users who read
}, { timestamps: true });

module.exports = mongoose.model('Mail', mailSchema);
