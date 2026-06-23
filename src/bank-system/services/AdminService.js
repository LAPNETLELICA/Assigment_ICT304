import db from '../db/MemoryDB.js';
import AuthService from './AuthService.js';
import Transaction from '../models/Transaction.js';

class AdminService {
  /**
   * View all user accounts in the system
   */
  static getAllAccounts(token) {
    AuthService.validateToken(token, 'ADMIN');
    return Array.from(db.accounts.values());
  }

  /**
   * View specific account details by ID, resolving the owner's username
   */
  static getAccountDetails(token, accountId) {
    AuthService.validateToken(token, 'ADMIN');
    
    const account = db.accounts.get(accountId);
    if (!account) {
      throw new Error("Account not found.");
    }

    const owner = db.users.get(account.ownerId);
    
    return {
      ...account,
      ownerUsername: owner ? owner.username : 'UNKNOWN'
    };
  }

  /**
   * Force-update account metadata
   */
  static forceUpdateAccount(token, accountId, updates) {
    AuthService.validateToken(token, 'ADMIN');

    const account = db.accounts.get(accountId);
    if (!account) {
      throw new Error("Account not found.");
    }

    // Apply allowed updates
    if (updates.name !== undefined) {
      account.name = updates.name;
    }
    if (updates.status !== undefined) {
      if (!['ACTIVE', 'CLOSED', 'DEACTIVATED'].includes(updates.status)) {
        throw new Error("Invalid status.");
      }
      account.status = updates.status;
    }

    return account;
  }

  /**
   * Modify balance (e.g., for corrections, chargebacks)
   */
  static modifyBalance(token, accountId, newBalance, reason) {
    const adminUser = AuthService.validateToken(token, 'ADMIN');

    const account = db.accounts.get(accountId);
    if (!account) {
      throw new Error("Account not found.");
    }
    if (typeof newBalance !== 'number' || newBalance < 0) {
      throw new Error("Balance must be a non-negative number.");
    }

    const oldBalance = account.balance;
    const difference = newBalance - oldBalance;
    
    account.balance = newBalance;

    // Log the administrative action
    const transaction = new Transaction(
      db.generateTransactionId(),
      'ADMIN_ADJUSTMENT',
      Math.abs(difference),
      difference < 0 ? accountId : null,
      difference > 0 ? accountId : null,
      adminUser.userId
    );
    // Add reason to the transaction object dynamically for audit
    transaction.reason = reason || 'Administrative adjustment';
    
    db.transactions.set(transaction.transactionId, transaction);

    return { account, transaction };
  }

  /**
   * Soft-delete/deactivate accounts
   */
  static deactivateAccount(token, accountId) {
    AuthService.validateToken(token, 'ADMIN');

    const account = db.accounts.get(accountId);
    if (!account) {
      throw new Error("Account not found.");
    }

    account.status = 'DEACTIVATED';
    return account;
  }

  /**
   * Master Audit Trail: View a unified global transaction ledger
   */
  static getMasterAuditTrail(token) {
    AuthService.validateToken(token, 'ADMIN');
    
    const history = Array.from(db.transactions.values());
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }
}

export default AdminService;
