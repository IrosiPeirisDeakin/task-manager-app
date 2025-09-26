const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });

  const existing = await User.findOne({ where: { username } });
  if (existing) return res.status(400).json({ error: 'username taken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });
  res.json({ id: user.id, username: user.username });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'change-this-secret', { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router;
