/**
 * Unit Tests: AdminService (src/bank-system/services/AdminService.js)
 *
 * Covers ALL branches across:
 *  - getAllAccounts(), getAccountDetails()
 *  - forceUpdateAccount(), modifyBalance()
 *  - deactivateAccount(), getMasterAuditTrail()
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AuthService from '../../src/bank-system/services/AuthService.js';
import ClientService from '../../src/bank-system/services/ClientService.js';
import AdminService from '../../src/bank-system/services/AdminService.js';
import db from '../../src/bank-system/db/MemoryDB.js';

function setupAdmin() {
  AuthService.register('admin', 'admin@test.com', 'pass', 'ADMIN');
  return AuthService.login('admin', 'pass').token;
}

function setupUser() {
  AuthService.register('alice', 'alice@test.com', 'pass');
  return AuthService.login('alice', 'pass').token;
}

describe('AdminService', () => {
  beforeEach(() => { db.clear(); });

  // getAllAccounts()
  describe('getAllAccounts()', () => {
    it('returns all accounts in the system', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      ClientService.createAccount(userToken, 'Savings', 'pwd');
      ClientService.createAccount(userToken, 'Checking', 'pwd');
      expect(AdminService.getAllAccounts(adminToken)).toHaveLength(2);
    });

    it('throws when called with a non-ADMIN token', () => {
      const userToken = setupUser();
      expect(() => AdminService.getAllAccounts(userToken)).toThrow('Forbidden: Insufficient privileges.');
    });
  });

  // getAccountDetails()
  describe('getAccountDetails()', () => {
    it('returns account with ownerUsername resolved', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      const details = AdminService.getAccountDetails(adminToken, acc.accountId);
      expect(details.ownerUsername).toBe('alice');
    });

    it('returns UNKNOWN ownerUsername when owner is missing from DB', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      // Manually remove the owner from DB
      const ownerId = acc.ownerId;
      db.users.delete(ownerId);
      const details = AdminService.getAccountDetails(adminToken, acc.accountId);
      expect(details.ownerUsername).toBe('UNKNOWN');
    });

    it('throws when account does not exist', () => {
      const adminToken = setupAdmin();
      expect(() => AdminService.getAccountDetails(adminToken, 'NONE')).toThrow('Account not found.');
    });
  });

  // forceUpdateAccount()
  describe('forceUpdateAccount()', () => {
    it('updates account name', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Old', 'pwd');
      const updated = AdminService.forceUpdateAccount(adminToken, acc.accountId, { name: 'New' });
      expect(updated.name).toBe('New');
    });

    it('updates account status to DEACTIVATED', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      const updated = AdminService.forceUpdateAccount(adminToken, acc.accountId, { status: 'DEACTIVATED' });
      expect(updated.status).toBe('DEACTIVATED');
    });

    it('updates account status to CLOSED', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      const updated = AdminService.forceUpdateAccount(adminToken, acc.accountId, { status: 'CLOSED' });
      expect(updated.status).toBe('CLOSED');
    });

    it('throws on invalid status value', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      expect(() => AdminService.forceUpdateAccount(adminToken, acc.accountId, { status: 'BANANA' })).toThrow('Invalid status.');
    });

    it('throws when account does not exist', () => {
      const adminToken = setupAdmin();
      expect(() => AdminService.forceUpdateAccount(adminToken, 'NONE', { name: 'x' })).toThrow('Account not found.');
    });

    it('applies no changes when updates object has no recognised keys', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      const updated = AdminService.forceUpdateAccount(adminToken, acc.accountId, {});
      expect(updated.name).toBe('Savings');
      expect(updated.status).toBe('ACTIVE');
    });
  });

  // modifyBalance()
  describe('modifyBalance()', () => {
    it('increases balance and logs an ADMIN_ADJUSTMENT transaction (positive difference)', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      const { account, transaction } = AdminService.modifyBalance(adminToken, acc.accountId, 1000, 'Bonus');
      expect(account.balance).toBe(1000);
      expect(transaction.type).toBe('ADMIN_ADJUSTMENT');
      expect(transaction.amount).toBe(1000);
      expect(transaction.targetAccountId).toBe(acc.accountId);
      expect(transaction.sourceAccountId).toBeNull();
      expect(transaction.reason).toBe('Bonus');
    });

    it('decreases balance and logs correct transaction (negative difference)', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      acc.balance = 500;
      const { account, transaction } = AdminService.modifyBalance(adminToken, acc.accountId, 200, 'Penalty');
      expect(account.balance).toBe(200);
      expect(transaction.amount).toBe(300);
      expect(transaction.sourceAccountId).toBe(acc.accountId);
      expect(transaction.targetAccountId).toBeNull();
    });

    it('handles zero difference (balance unchanged)', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      acc.balance = 100;
      const { account, transaction } = AdminService.modifyBalance(adminToken, acc.accountId, 100, 'No-op');
      expect(account.balance).toBe(100);
      expect(transaction.amount).toBe(0);
    });

    it('uses default reason when none provided', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      const { transaction } = AdminService.modifyBalance(adminToken, acc.accountId, 50);
      expect(transaction.reason).toBe('Administrative adjustment');
    });

    it('throws when newBalance is negative', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      expect(() => AdminService.modifyBalance(adminToken, acc.accountId, -1)).toThrow('Balance must be a non-negative number.');
    });

    it('throws when newBalance is not a number', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      expect(() => AdminService.modifyBalance(adminToken, acc.accountId, 'abc')).toThrow('Balance must be a non-negative number.');
    });

    it('throws when account does not exist', () => {
      const adminToken = setupAdmin();
      expect(() => AdminService.modifyBalance(adminToken, 'NONE', 100)).toThrow('Account not found.');
    });
  });

  // deactivateAccount()
  describe('deactivateAccount()', () => {
    it('sets account status to DEACTIVATED', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      const result = AdminService.deactivateAccount(adminToken, acc.accountId);
      expect(result.status).toBe('DEACTIVATED');
    });

    it('throws when account does not exist', () => {
      const adminToken = setupAdmin();
      expect(() => AdminService.deactivateAccount(adminToken, 'NONE')).toThrow('Account not found.');
    });
  });

  // getMasterAuditTrail()
  describe('getMasterAuditTrail()', () => {
    it('returns all transactions sorted in descending timestamp order', () => {
      const adminToken = setupAdmin();
      const userToken = setupUser();
      const acc = ClientService.createAccount(userToken, 'Savings', 'pwd');
      ClientService.deposit(userToken, acc.accountId, 100);
      AdminService.modifyBalance(adminToken, acc.accountId, 50, 'Test');
      const trail = AdminService.getMasterAuditTrail(adminToken);
      expect(trail).toHaveLength(2);
      expect(trail[0].timestamp.getTime()).toBeGreaterThanOrEqual(trail[1].timestamp.getTime());
    });

    it('returns empty array when no transactions exist', () => {
      const adminToken = setupAdmin();
      expect(AdminService.getMasterAuditTrail(adminToken)).toEqual([]);
    });

    it('throws when called with a non-ADMIN token', () => {
      const userToken = setupUser();
      expect(() => AdminService.getMasterAuditTrail(userToken)).toThrow('Forbidden: Insufficient privileges.');
    });
  });
});
