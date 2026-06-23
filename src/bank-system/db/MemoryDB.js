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
export default dbInstance;
