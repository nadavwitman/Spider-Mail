const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema({
  userId: { type: String, required: true },   // owner user _id as string
  name:   { type: String, required: true },   // label name
  mails:  { type: [String], default: [] }     // mail ids as strings
}, { timestamps: true });                      // createdAt/updatedAt

labelSchema.index({ userId: 1, name: 1 }, { unique: true }); // unique name per user

module.exports = mongoose.model('Label', labelSchema);
