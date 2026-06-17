const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

function readData() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { accounts: [], transactions: [] };
  }
}

function writeData(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

class AccountRepo {
  constructor() {
    if (!AccountRepo._data) {
      AccountRepo._data = readData();
    }
    this._data = AccountRepo._data;
  }

  save(account) {
    const id = account.id || uuidv4();
    const name = account.name || '';
    const balance = typeof account.balance === 'number' ? account.balance : 0;
    const owner_id = account.owner_id || account.ownerId || null;

    const existingIndex = this._data.accounts.findIndex(a => a.id === id);
    const obj = { id, name, balance, owner_id };
    if (existingIndex >= 0) {
      this._data.accounts[existingIndex] = obj;
    } else {
      this._data.accounts.push(obj);
    }
    writeData(this._data);
    return obj;
  }

  findById(id) {
    return this._data.accounts.find(a => a.id === id) || null;
  }

  findAll(ownerId = null) {
    if (!ownerId) return Array.from(this._data.accounts);
    return this._data.accounts.filter(a => a.owner_id === ownerId);
  }

  delete(id) {
    const before = this._data.accounts.length;
    this._data.accounts = this._data.accounts.filter(a => a.id !== id);
    this._data.transactions = this._data.transactions.filter(t => t.account_id !== id);
    writeData(this._data);
    return this._data.accounts.length < before;
  }

  clear() {
    this._data.accounts = [];
    this._data.transactions = [];
    writeData(this._data);
  }

  addTransaction(accountId, tx) {
    const acc = this.findById(accountId);
    if (!acc) throw new Error('Account not found');
    const record = Object.assign({ account_id: accountId }, tx);
    this._data.transactions.push(record);
    writeData(this._data);
    return record;
  }

  getTransactions(accountId) {
    const rows = this._data.transactions.filter(t => t.account_id === accountId);
    return rows.sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
  }
}

module.exports = AccountRepo;
