// controllers/users.js
const UserService = require('../services/users');     // async user service (Mongoose)
const LabelsService = require('../services/labels');        // async labels service (Mongoose)
const { verifyToken } = require('../models/tokens');        // JWT verify (unchanged)

// register new user
exports.register = async (req, res) => {
  // read input
  const { firstName, lastName, birthday, gender, userName, password, picture } = req.body;

  // basic required fields
  if (!firstName || !lastName || !birthday || !gender || !userName || !password) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Missing fields' }, null, 2) + '\n');
  }

  // birthday format: DD/MM/YYYY
  const birthdayRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!birthdayRegex.test(birthday)) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Invalid birthday format. Use DD/MM/YYYY' }, null, 2) + '\n');
  }

  // birthday not in the future
  const [day, month, year] = birthday.split('/').map(Number);
  const birthdayDate = new Date(year, month - 1, day);
  const now = new Date();
  if (birthdayDate > now) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Birthday cannot be in the future' }, null, 2) + '\n');
  }

  // gender must be one of: male/female/other
  const validGenders = ['male', 'female', 'other'];
  if (!validGenders.includes(gender.toLowerCase())) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Invalid gender. Use male, female, or other' }, null, 2) + '\n');
  }

  // userName must be a gmail address
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(userName)) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Invalid Gmail address' }, null, 2) + '\n');
  }

  // userName uniqueness check (DB)
  const existing = await UserService.findByUserName(userName);
  if (existing) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'User name is already taken' }, null, 2) + '\n');
  }

  // password complexity: min 8, letter, number, special char
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).type('application/json').send(
      JSON.stringify({
        error: 'Password must be minimum 8 characters, include at least one letter, one number, and one special character'
      }, null, 2) + '\n'
    );
  }

  // picture validation (base64 data URL)
  const base64ImageRegex = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i;
  if (picture && !base64ImageRegex.test(picture)) {
    return res.status(400).type('application/json')
      .send(JSON.stringify({ error: 'Invalid picture format. Must be a base64 image data URL' }, null, 2) + '\n');
  }

  // default picture if none
  const finalPicture = picture || null;

  // create user (DB)
  const newUser = await UserService.createUser({
    firstName,
    lastName,
    birthday,
    gender,
    userName,
    password,
    picture: finalPicture
  });

  const defaultLabels = ['Inbox','Sent','Drafts','Spam','Trash','All Mails'];

  await Promise.all(defaultLabels.map((name, i) =>
    LabelsService.createLabel(String(newUser._id), name, { order: i })
  ));

  // respond 201 Created
  res.status(201).location(`/api/users/${newUser._id}`).end();
};

// get user by id (auth required)
exports.getUserById = async (req, res) => {
  // read id from params
  const requestedId = req.params.id;

  // read bearer token
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Missing or invalid Authorization header' }, null, 2) + '\n');
  }
  const token = authHeader.split(' ')[1];

  // verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).type('application/json')
      .send(JSON.stringify({ error: 'Invalid token' }, null, 2) + '\n');
  }

  // fetch user (DB)
  const user = await UserService.findById(requestedId);
  if (!user) {
    return res.status(404).type('application/json')
      .send(JSON.stringify({ error: 'User Not found' }, null, 2) + '\n');
  }

  // strip password before returning
  const raw = typeof user.toObject === 'function' ? user.toObject() : user;
  const { password, ...safeUser } = raw;

  // respond with user (public fields)
  res.status(200).type('application/json')
    .send(JSON.stringify(safeUser, null, 2) + '\n');
};
