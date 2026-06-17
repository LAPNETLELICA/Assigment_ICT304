const AccountRepo = require('../repository/accountRepo');

class AccountService {
  constructor() {
    this.repo = new AccountRepo();
  }

  createAccount(payload) {
    if (!payload || !payload.name) throw new Error('Invalid payload');
    const acc = {
      name: payload.name,
      balance: typeof payload.balance === 'number' ? payload.balance : 0,
      owner_id: payload.owner_id || payload.ownerId || null
    };
    return this.repo.save(acc);
  }

  getAccount(id) {
    return this.repo.findById(id);
  }

  getAll(ownerId = null) {
    return this.repo.findAll(ownerId);
  }

  updateAccount(id, payload) {
    const existing = this.repo.findById(id);
    if (!existing) throw new Error('Not found');
    const updated = Object.assign({}, existing, payload);
    return this.repo.save(updated);
  }

  deleteAccount(id) {
    const existing = this.repo.findById(id);
    if (!existing) throw new Error('Not found');
    this.repo.delete(id);
    return true;
  }

  createTransaction(accountId, payload) {
    const acc = this.repo.findById(accountId);
    if (!acc) throw new Error('Account not found');
    const { type, amount, description } = payload || {};
    if (!type || (type !== 'deposit' && type !== 'withdraw')) throw new Error('Invalid transaction type');
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) throw new Error('Invalid amount');

    const tx = {
      id: require('uuid').v4(),
      type,
      amount: amt,
      description: description || '',
      date: new Date().toISOString()
    };

    // update balance
    if (type === 'deposit') {
      acc.balance = (acc.balance || 0) + amt;
    } else {
      if ((acc.balance || 0) < amt) throw new Error('Insufficient funds');
      acc.balance = (acc.balance || 0) - amt;
    }

    // persist
    this.repo.save(acc);
    this.repo.addTransaction(accountId, tx);
    return tx;
  }

  listTransactions(accountId) {
    return this.repo.getTransactions(accountId);
  }

  transfer(fromId, toId, amount, description) {
    if (!fromId || !toId) throw new Error('Missing account id');
    if (fromId === toId) throw new Error('Cannot transfer to self');
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) throw new Error('Invalid amount');

    const from = this.repo.findById(fromId);
    const to = this.repo.findById(toId);
    if (!from || !to) throw new Error('Account not found');
    if ((from.balance || 0) < amt) throw new Error('Insufficient funds');

    const txOut = {
      id: require('uuid').v4(),
      type: 'transfer-out',
      amount: amt,
      description: description || `transfer to ${toId}`,
      date: new Date().toISOString(),
      counterparty: toId
    };
    const txIn = {
      id: require('uuid').v4(),
      type: 'transfer-in',
      amount: amt,
      description: description || `transfer from ${fromId}`,
      date: new Date().toISOString(),
      counterparty: fromId
    };

    from.balance = (from.balance || 0) - amt;
    to.balance = (to.balance || 0) + amt;

    this.repo.save(from);
    this.repo.save(to);
    this.repo.addTransaction(fromId, txOut);
    this.repo.addTransaction(toId, txIn);
    return { from: txOut, to: txIn };
  }
}

module.exports = AccountService;
