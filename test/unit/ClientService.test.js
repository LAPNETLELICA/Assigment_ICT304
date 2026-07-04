/**
 * Unit Tests: ClientService (src/bank-system/services/ClientService.js)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AuthService from '../../src/bank-system/services/AuthService.js';
import ClientService from '../../src/bank-system/services/ClientService.js';
import AdminService from '../../src/bank-system/services/AdminService.js';
import db from '../../src/bank-system/db/MemoryDB.js';

function setup() {
  AuthService.register('alice', 'alice@test.com', 'pass');
  return {
    token: AuthService.login('alice', 'pass').token,
    adminToken: AuthService.login('admin', 'admin123').token
  };
}

function setupTwo() {
  AuthService.register('alice', 'alice@test.com', 'pass');
  AuthService.register('bob', 'bob@test.com', 'pass');
  return {
    alice: AuthService.login('alice', 'pass').token,
    bob: AuthService.login('bob', 'pass').token,
    adminToken: AuthService.login('admin', 'admin123').token
  };
}

describe('ClientService', () => {
  beforeEach(() => { db.clear(); db.seedManager(); });

  // createAccount()
  describe('createAccount()', () => {
    it('creates account with zero balance when no initial deposit', () => {
      const { token } = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      expect(acc.balance).toBe(0);
      expect(acc.status).toBe('PENDING');
      // No extra transactions created because initial deposit is 0
      // Manager seed creates 0 extra transactions
    });

    it('creates account with initial deposit as PENDING transaction', () => {
      const { token, adminToken } = setup();
      const acc = ClientService.createAccount(token, 'Checking', 'pwd', 500);
      expect(acc.balance).toBe(0); // PENDING deposit
      const txs = Array.from(db.transactions.values());
      expect(txs.length).toBe(1);
      expect(txs[0].status).toBe('PENDING');
    });

    it('throws when account name is empty', () => {
      const { token } = setup();
      expect(() => ClientService.createAccount(token, '', 'pwd')).toThrow('Account name is required.');
    });
  });

  describe('updateAccount()', () => {
    it('renames an active account', () => {
      const { token, adminToken } = setup();
      const acc = ClientService.createAccount(token, 'Old', 'pwd');
      AdminService.validateAccount(adminToken, acc.accountId, true);
      expect(ClientService.updateAccount(token, acc.accountId, 'New').name).toBe('New');
    });

    it('throws when account is not ACTIVE', () => {
      const { token } = setup();
      const acc = ClientService.createAccount(token, 'Old', 'pwd');
      // Still PENDING
      expect(() => ClientService.updateAccount(token, acc.accountId, 'New')).toThrow('Cannot update an inactive or closed account.');
    });
  });

  describe('closeAccount()', () => {
    it('closes account with zero balance', () => {
      const { token, adminToken } = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      AdminService.validateAccount(adminToken, acc.accountId, true);
      expect(ClientService.closeAccount(token, acc.accountId).status).toBe('CLOSED');
    });
  });

  describe('deposit()', () => {
    it('creates a PENDING DEPOSIT transaction without increasing balance', () => {
      const { token, adminToken } = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      AdminService.validateAccount(adminToken, acc.accountId, true);
      const { account, transaction } = ClientService.deposit(token, acc.accountId, 250);
      expect(account.balance).toBe(0); // Not validated yet
      expect(transaction.type).toBe('DEPOSIT');
      expect(transaction.status).toBe('PENDING');
    });
  });

  describe('withdraw()', () => {
    it('decreases balance and creates a SUCCESSFUL WITHDRAWAL transaction', () => {
      const { token, adminToken } = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      AdminService.validateAccount(adminToken, acc.accountId, true);
      // Hack balance for test since deposits require validation
      acc.balance = 300;
      const { account, transaction } = ClientService.withdraw(token, acc.accountId, 100, 'pwd');
      expect(account.balance).toBe(200);
      expect(transaction.type).toBe('WITHDRAWAL');
      expect(transaction.status).toBe('SUCCESSFUL');
    });
  });

  describe('transfer()', () => {
    it('moves funds using targetBankId', () => {
      const { alice, bob, adminToken } = setupTwo();
      const src = ClientService.createAccount(alice, 'AliceSavings', 'apwd');
      const tgt = ClientService.createAccount(bob, 'BobSavings', 'bpwd');
      AdminService.validateAccount(adminToken, src.accountId, true);
      AdminService.validateAccount(adminToken, tgt.accountId, true);
      src.balance = 500; // bypass deposit validation
      
      const { sourceAccount, targetAccount, transaction } =
        ClientService.transfer(alice, src.accountId, tgt.bankId, 200, 'apwd');
      expect(sourceAccount.balance).toBe(300);
      expect(targetAccount.balance).toBe(200);
      expect(transaction.type).toBe('TRANSFER');
    });
  });
});
