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
    return { users: [], accounts: [], transactions: [] };
  }
}

function writeData(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

class UserRepo {
  constructor() {
    if (!UserRepo._data) UserRepo._data = readData();
    this._data = UserRepo._data;
  }

  create(user) {
    const id = uuidv4();
    const role = user.role || 'client';
    const obj = { id, username: user.username, password: user.password, role };
    this._data.users.push(obj);
    writeData(this._data);
    return { id, username: user.username, role };
  }

  findByUsername(username) {
    return this._data.users.find(u => u.username === username) || null;
  }

  findById(id) {
    return this._data.users.find(u => u.id === id) || null;
  }
}

module.exports = UserRepo;
