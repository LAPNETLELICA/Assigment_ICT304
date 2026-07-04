import User from '../models/User.js';
import Account from '../models/Account.js';

class MemoryDB {
  constructor() {
    if (MemoryDB.instance) {
      return MemoryDB.instance;
    }
    // Maps act as our in-memory tables
    this.users = new Map();         // userId -> User
    this.accounts = new Map();      // accountId -> Account
    this.transactions = new Map();  // transactionId -> Transaction
    
    // Auto-increment mock IDs
    this.userIdCounter = 1;
    this.accountIdCounter = 1;
    this.transactionIdCounter = 1;

    MemoryDB.instance = this;

    // Seed Manager
    this.seedManager();
  }

  seedManager() {
    const managerId = this.generateUserId();
    const managerUser = new User(managerId, 'admin', 'admin@apexvault.com', 'hashed_admin123', 'ADMIN');
    this.users.set(managerId, managerUser);

    const managerAccountId = this.generateAccountId();
    const managerAccount = new Account(managerAccountId, managerId, 'Manager Vault', 'vaultpassword', 'BNK-MANAGER');
    managerAccount.balance = 1000000000;
    managerAccount.status = 'ACTIVE';
    this.accounts.set(managerAccountId, managerAccount);
  }

  generateUserId() {
    return `U${this.userIdCounter++}`;
  }

  generateAccountId() {
    return `A${this.accountIdCounter++}`;
  }

  generateTransactionId() {
    return `T${this.transactionIdCounter++}`;
  }

  clear() {
    this.users.clear();
    this.accounts.clear();
    this.transactions.clear();
    this.userIdCounter = 1;
    this.accountIdCounter = 1;
    this.transactionIdCounter = 1;
  }
}

// Export as a singleton
const dbInstance = new MemoryDB();
export { MemoryDB };
export default dbInstance;
