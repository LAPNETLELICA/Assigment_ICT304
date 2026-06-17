const express = require('express');
const router = express.Router();
const AccountService = require('../service/accountService');
const UserRepo = require('../repository/userRepo');

const service = new AccountService();
const userRepo = new UserRepo();

// create bank account for authenticated user (owner id expected in body)
router.post('/', (req, res) => {
  try {
    const ownerId = req.body.owner_id || req.body.ownerId || null;
    const acc = service.createAccount(Object.assign({}, req.body, { owner_id: ownerId }));
    res.status(201).json(acc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// list accounts, optionally filtered by owner_id query param
router.get('/', (req, res) => {
  const ownerId = req.query.owner_id || req.query.ownerId || null;
  const all = service.getAll(ownerId);
  res.json(all);
});

router.get('/:id', (req, res) => {
  const acc = service.getAccount(req.params.id);
  if (!acc) return res.status(404).json({ error: 'Not found' });
  res.json(acc);
});

router.post('/:id/transactions', (req, res) => {
  try {
    const tx = service.createTransaction(req.params.id, req.body);
    res.status(201).json(tx);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:id/transactions', (req, res) => {
  const txs = service.listTransactions(req.params.id);
  res.json(txs);
});

router.post('/transfer', (req, res) => {
  try {
    const { from, to, amount, description } = req.body || {};
    const out = service.transfer(from, to, amount, description);
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const acc = service.updateAccount(req.params.id, req.body);
    res.json(acc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    service.deleteAccount(req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

module.exports = router;
