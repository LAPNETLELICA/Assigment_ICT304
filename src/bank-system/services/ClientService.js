import db from '../db/MemoryDB.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import AuthService from './AuthService.js';

class ClientService {
  /**
   * Create a new bank account for a user
   */
  static createAccount(token, accountName) {
    const user = AuthService.validateToken(token, 'USER');
    
    if (!accountName || accountName.trim() === '') {
      throw new Error("Account name is required.");
    }

    const accountId = db.generateAccountId();
    const newAccount = new Account(accountId, user.userId, accountName);
    db.accounts.set(accountId, newAccount);

    return newAccount;
  }

  /**
   * Fetch all accounts belonging to the user
   */
  static getMyAccounts(token) {
    const user = AuthService.validateToken(token);
    
    const userAccounts = [];
    for (const account of db.accounts.values()) {
      if (account.ownerId === user.userId) {
        userAccounts.push(account);
      }
    }
    return userAccounts;
  }

  /**
   * View a single account by ID (must own it)
   */
  static getAccountById(token, accountId) {
    const user = AuthService.validateToken(token);
    const account = db.accounts.get(accountId);

    if (!account) {
      throw new Error("Account not found.");
    }
    if (account.ownerId !== user.userId) {
      throw new Error("Forbidden: You do not own this account.");
    }

    return account;
  }

  /**
   * Update account details (e.g., rename)
   */
  static updateAccount(token, accountId, newName) {
    const account = this.getAccountById(token, accountId);
    
    if (!newName || newName.trim() === '') {
      throw new Error("New account name is required.");
    }
    if (account.status !== 'ACTIVE') {
      throw new Error("Cannot update an inactive or closed account.");
    }

    account.name = newName;
    return account;
  }

  /**
   * Close/delete an account (only if the balance is exactly zero)
   */
  static closeAccount(token, accountId) {
    const account = this.getAccountById(token, accountId);

    if (account.status === 'CLOSED') {
      throw new Error("Account is already closed.");
    }
    if (account.balance !== 0) {
      throw new Error("Cannot close an account with a non-zero balance.");
    }

    account.status = 'CLOSED';
    return account;
  }

  /**
   * Deposit money into an account
   */
  static deposit(token, accountId, amount) {
    const account = this.getAccountById(token, accountId);
    const user = AuthService.validateToken(token);

    account.deposit(amount);

    const transaction = new Transaction(
      db.generateTransactionId(),
      'DEPOSIT',
      amount,
      null,
      accountId,
      user.userId
    );
    db.transactions.set(transaction.transactionId, transaction);

    return { account, transaction };
  }

  /**
   * Withdraw money from an account
   */
  static withdraw(token, accountId, amount) {
    const account = this.getAccountById(token, accountId);
    const user = AuthService.validateToken(token);

    account.withdraw(amount);

    const transaction = new Transaction(
      db.generateTransactionId(),
      'WITHDRAWAL',
      amount,
      accountId,
      null,
      user.userId
    );
    db.transactions.set(transaction.transactionId, transaction);

    return { account, transaction };
  }

  /**
   * Peer-to-Peer (P2P) Transfers between accounts
   */
  static transfer(token, sourceAccountId, targetAccountId, amount) {
    if (sourceAccountId === targetAccountId) {
      throw new Error("Cannot transfer to the same account.");
    }

    const sourceAccount = this.getAccountById(token, sourceAccountId);
    const targetAccount = db.accounts.get(targetAccountId);
    const user = AuthService.validateToken(token);

    if (!targetAccount) {
      throw new Error("Target account not found.");
    }
    if (targetAccount.status !== 'ACTIVE') {
      throw new Error("Target account is not active.");
    }

    // Perform withdrawal and deposit logic
    sourceAccount.withdraw(amount);
    targetAccount.deposit(amount);

    const transaction = new Transaction(
      db.generateTransactionId(),
      'TRANSFER',
      amount,
      sourceAccountId,
      targetAccountId,
      user.userId
    );
    db.transactions.set(transaction.transactionId, transaction);

    return { sourceAccount, targetAccount, transaction };
  }

  /**
   * Personal Audit Trail: Access an isolated transaction history filtered only to accounts they own.
   */
  static getAuditTrail(token) {
    const user = AuthService.validateToken(token);
    const userAccounts = this.getMyAccounts(token).map(acc => acc.accountId);

    const history = [];
    for (const transaction of db.transactions.values()) {
      if (
        userAccounts.includes(transaction.sourceAccountId) ||
        userAccounts.includes(transaction.targetAccountId)
      ) {
        history.push(transaction);
      }
    }

    // Sort by timestamp descending
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }
}

export default ClientService;
