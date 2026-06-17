const express = require('express');
const router = express.Router();
const UserRepo = require('../repository/userRepo');

const userRepo = new UserRepo();

// signup: { username, password }
router.post('/signup', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const exists = userRepo.findByUsername(username);
  if (exists) return res.status(400).json({ error: 'user exists' });
  const user = userRepo.create({ username, password });
  res.status(201).json(user);
});

// login: returns a simple token (user id) for demo purposes
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = userRepo.findByUsername(username);
  if (!user || user.password !== password) return res.status(401).json({ error: 'invalid credentials' });
  // demo token: user id
  res.json({ token: user.id, username: user.username });
});

module.exports = router;
