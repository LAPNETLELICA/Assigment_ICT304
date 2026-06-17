const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

function readFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const txt = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(txt || '{}');
  } catch (e) {
    return null;
  }
}

function writeFile(obj) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    // ignore write errors for now
  }
}

class AccountRepo {
  constructor() {
    if (!AccountRepo.store) {
      AccountRepo.store = new Map();
      // try to load persisted data
      const data = readFile();
      if (data && data.accounts) {
        Object.values(data.accounts).forEach(a => AccountRepo.store.set(a.id, a));
      }
    }
  }

  save(account) {
    const id = account.id || uuidv4();
    const data = Object.assign({ id }, account);
    // ensure transactions array exists
    if (!Array.isArray(data.transactions)) data.transactions = account.transactions || [];
    AccountRepo.store.set(id, data);
    // persist
    writeFile({ accounts: Object.fromEntries(AccountRepo.store) });
    return data;
  }

  addTransaction(accountId, tx) {
    const acc = this.findById(accountId);
    if (!acc) throw new Error('Account not found');
    acc.transactions = acc.transactions || [];
    acc.transactions.push(tx);
    AccountRepo.store.set(accountId, acc);
    return tx;
  }

  getTransactions(accountId) {
    const acc = this.findById(accountId);
    if (!acc) return [];
    return acc.transactions || [];
  }

  findById(id) {
    return AccountRepo.store.get(id) || null;
  }

  findAll() {
    return Array.from(AccountRepo.store.values());
  }

  delete(id) {
    const ok = AccountRepo.store.delete(id);
    writeFile({ accounts: Object.fromEntries(AccountRepo.store) });
    return ok;
  }

  clear() {
    AccountRepo.store.clear();
    writeFile({ accounts: {} });
  }
}

module.exports = AccountRepo;
