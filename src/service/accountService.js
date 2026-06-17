const AccountRepo = require('../repository/accountRepo');

class AccountService {
  constructor() {
    this.repo = new AccountRepo();
  }

  createAccount(payload) {
    if (!payload || !payload.name) throw new Error('Invalid payload');
    const acc = {
      name: payload.name,
      balance: typeof payload.balance === 'number' ? payload.balance : 0
    };
    return this.repo.save(acc);
  }

  getAccount(id) {
    return this.repo.findById(id);
  }

  getAll() {
    return this.repo.findAll();
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
}

module.exports = AccountService;
