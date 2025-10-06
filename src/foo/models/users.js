const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true }, // user's first name
  lastName: { type: String, required: true },  // user's last name
  birthday: { type: String, required: true },  // DD/MM/YYYY
  gender: { type: String, required: true },    // male/female/other
  userName: { type: String, required: true, unique: true }, // email/username
  password: { type: String, required: true },  // password (plain or hashed)
  picture: { type: String }                    // optional
}, { timestamps: true }); // adds createdAt, updatedAt

module.exports = mongoose.model('User', userSchema);
