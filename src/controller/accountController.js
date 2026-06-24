import express from 'express';
import { ClientService, AdminService } from '../bank-system/index.js';
import { extractToken } from './authController.js';

const router = express.Router();

// Get account details
router.get('/:id', (req, res) => {
  try {
    const token = extractToken(req);
    // Client view requires ownership, Admin view bypasses it and adds username
    try {
      const acc = AdminService.getAccountDetails(token, req.params.id);
      res.json(acc);
    } catch(adminErr) {
      const acc = ClientService.getAccountById(token, req.params.id);
      res.json(acc);
    }
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Create account
router.post('/', (req, res) => {
  try {
    const token = extractToken(req);
    const { name, accountPassword, initialDeposit } = req.body;
    const acc = ClientService.createAccount(token, name, accountPassword, initialDeposit);
    res.status(201).json(acc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List accounts
router.get('/', (req, res) => {
  try {
    const token = extractToken(req);
    try {
      const all = AdminService.getAllAccounts(token);
      res.json(all);
    } catch(adminErr) {
      const mine = ClientService.getMyAccounts(token);
      res.json(mine);
    }
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

// Deposit or Withdraw
router.post('/:id/transactions', (req, res) => {
  try {
    const token = extractToken(req);
    const { type, amount, accountPassword } = req.body;
    
    let result;
    if (type === 'deposit') {
      result = ClientService.deposit(token, req.params.id, amount);
    } else if (type === 'withdraw') {
      result = ClientService.withdraw(token, req.params.id, amount, accountPassword);
    } else {
      throw new Error("Invalid transaction type");
    }
    res.status(201).json(result.transaction);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List transactions
router.get('/:id/transactions', (req, res) => {
  try {
    const token = extractToken(req);
    try {
      const allAudit = AdminService.getMasterAuditTrail(token);
      res.json(allAudit.filter(t => t.sourceAccountId === req.params.id || t.targetAccountId === req.params.id));
    } catch(err) {
      const audit = ClientService.getAuditTrail(token);
      res.json(audit.filter(t => t.sourceAccountId === req.params.id || t.targetAccountId === req.params.id));
    }
  } catch(e) {
    res.status(401).json({ error: e.message });
  }
});

// Transfer
router.post('/transfer', (req, res) => {
  try {
    const token = extractToken(req);
    const { from, to, amount, accountPassword } = req.body;
    const result = ClientService.transfer(token, from, to, amount, accountPassword);
    res.status(201).json(result.transaction);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update Account
router.put('/:id', (req, res) => {
  try {
    const token = extractToken(req);
    const { name, status } = req.body;
    try {
      // If admin, they can force update status
      const updated = AdminService.forceUpdateAccount(token, req.params.id, { name, status });
      res.json(updated);
    } catch(adminErr) {
      const updated = ClientService.updateAccount(token, req.params.id, name);
      res.json(updated);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete (Close/Deactivate) Account
router.delete('/:id', (req, res) => {
  try {
    const token = extractToken(req);
    try {
      AdminService.deactivateAccount(token, req.params.id);
      res.status(204).end();
    } catch(adminErr) {
      ClientService.closeAccount(token, req.params.id);
      res.status(204).end();
    }
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

export default router;
