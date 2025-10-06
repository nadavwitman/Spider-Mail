const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// load environment by NODE_ENV from ./config (e.g., .env.development)
require('custom-env').env(process.env.NODE_ENV, './config');

// connect to MongoDB from env (required)
if (!process.env.CONNECTION_STRING) {
  console.error('CONNECTION_STRING is not defined in config/.env.<env>');
  process.exit(1);
}
mongoose.set('strictQuery', true);
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('[DB] Connected to MongoDB'))
  .catch((err) => {
    console.error('[DB] Mongo connection error:', err.message);
    process.exit(1);
  });

// middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

// static images
app.use('/images', express.static(path.join(__dirname, '../images')));

// routes
const userRoutes = require('./routes/users');
const mailRoutes = require('./routes/mails');
const labelRoutes = require('./routes/labels');
const blacklistRoutes = require('./routes/blacklist');
const tokenRoutes = require('./routes/tokens');

app.use('/api/users', userRoutes);
app.use('/api/mails', mailRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/tokens', tokenRoutes);

// default route (same as your original)
app.get('/', (req, res) => {
  res.send('Gmail MVC server is running.');
});

// start server (PORT from env; fallback is OK, not sensitive)
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
