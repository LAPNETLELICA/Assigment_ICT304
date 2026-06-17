const { v4: uuidv4 } = require('uuid');

class AccountRepo {
  constructor() {
    if (!AccountRepo.store) AccountRepo.store = new Map();
  }

  save(account) {
    const id = account.id || uuidv4();
    const data = Object.assign({ id }, account);
    AccountRepo.store.set(id, data);
    return data;
  }

  findById(id) {
    return AccountRepo.store.get(id) || null;
  }

  findAll() {
    return Array.from(AccountRepo.store.values());
  }

  delete(id) {
    return AccountRepo.store.delete(id);
  }

  clear() {
    AccountRepo.store.clear();
  }
}

module.exports = AccountRepo;
