import express from 'express';
import { AuthService, MemoryDB } from '../bank-system/index.js';

const router = express.Router();

function extractToken(req) {
  const auth = req.headers['authorization'] || req.query.token || (req.body && req.body.token);
  if (!auth) return null;
  return (typeof auth === 'string' && auth.startsWith('Bearer ')) ? auth.slice(7) : auth;
}

router.post('/signup', (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const user = AuthService.register(username, email, password, role || 'USER');
    // Hide password hash
    res.status(201).json({ id: user.userId, username: user.username, email: user.email, role: user.role });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const { token, user } = AuthService.login(username, password);
    res.json({ token, id: user.userId, username: user.username, role: user.role, email: user.email });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

router.get('/users', (req, res) => {
  // Simple check for users, hiding passwords
  const users = Array.from(MemoryDB.users.values()).map(u => ({
    id: u.userId, username: u.username, role: u.role, email: u.email
  }));
  res.json(users);
});

router.get('/users/:id', (req, res) => {
  const user = MemoryDB.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.userId, username: user.username, role: user.role, email: user.email });
});

export { extractToken };
export default router;
