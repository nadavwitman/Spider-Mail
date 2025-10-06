const User = require('../models/users');

function createUser(data) {
  return User.create(data); // create new user document
}

function findByUserName(userName) {
  return User.findOne({ userName }).exec(); // find user by username
}

function findById(id) {
  return User.findById(id).exec(); // find user by _id
}

module.exports = {
  createUser,
  findByUserName,
  findById
};
