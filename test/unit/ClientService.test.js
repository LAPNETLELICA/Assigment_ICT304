/**
 * Unit Tests: ClientService (src/bank-system/services/ClientService.js)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AuthService from '../../src/bank-system/services/AuthService.js';
import ClientService from '../../src/bank-system/services/ClientService.js';
import db from '../../src/bank-system/db/MemoryDB.js';

function setup() {
  AuthService.register('alice', 'alice@test.com', 'pass');
  return AuthService.login('alice', 'pass').token;
}

function setupTwo() {
  AuthService.register('alice', 'alice@test.com', 'pass');
  AuthService.register('bob', 'bob@test.com', 'pass');
  return {
    alice: AuthService.login('alice', 'pass').token,
    bob: AuthService.login('bob', 'pass').token,
  };
}

describe('ClientService', () => {
  beforeEach(() => { db.clear(); });

  // createAccount()
  describe('createAccount()', () => {
    it('creates account with zero balance when no initial deposit', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      expect(acc.balance).toBe(0);
      expect(db.transactions.size).toBe(0);
    });

    it('creates account with initial deposit and logs a transaction', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Checking', 'pwd', 500);
      expect(acc.balance).toBe(500);
      expect(db.transactions.size).toBe(1);
    });

    it('does not create transaction when initialDeposit is 0', () => {
      const token = setup();
      ClientService.createAccount(token, 'Checking', 'pwd', 0);
      expect(db.transactions.size).toBe(0);
    });

    it('throws when account name is empty', () => {
      const token = setup();
      expect(() => ClientService.createAccount(token, '', 'pwd')).toThrow('Account name is required.');
    });

    it('throws when account name is whitespace', () => {
      const token = setup();
      expect(() => ClientService.createAccount(token, '   ', 'pwd')).toThrow('Account name is required.');
    });

    it('throws when account password is empty', () => {
      const token = setup();
      expect(() => ClientService.createAccount(token, 'Savings', '')).toThrow('Account password is required.');
    });

    it('throws when account password is whitespace', () => {
      const token = setup();
      expect(() => ClientService.createAccount(token, 'Savings', '   ')).toThrow('Account password is required.');
    });

    it('throws when token belongs to ADMIN (not USER)', () => {
      AuthService.register('admin', 'admin@test.com', 'pass', 'ADMIN');
      const { token } = AuthService.login('admin', 'pass');
      expect(() => ClientService.createAccount(token, 'Savings', 'pwd')).toThrow('Forbidden: Insufficient privileges.');
    });
  });

  // getMyAccounts()
  describe('getMyAccounts()', () => {
    it('returns only accounts owned by the authenticated user', () => {
      const { alice, bob } = setupTwo();
      ClientService.createAccount(alice, 'A1', 'pwd');
      ClientService.createAccount(alice, 'A2', 'pwd');
      ClientService.createAccount(bob, 'B1', 'pwd');
      expect(ClientService.getMyAccounts(alice)).toHaveLength(2);
    });

    it('returns empty array when user has no accounts', () => {
      const token = setup();
      expect(ClientService.getMyAccounts(token)).toEqual([]);
    });
  });

  // getAccountById()
  describe('getAccountById()', () => {
    it('returns account when user owns it', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      expect(ClientService.getAccountById(token, acc.accountId).accountId).toBe(acc.accountId);
    });

    it('throws when account does not exist', () => {
      const token = setup();
      expect(() => ClientService.getAccountById(token, 'NONE')).toThrow('Account not found.');
    });

    it('throws when user does not own the account', () => {
      const { alice, bob } = setupTwo();
      const bobAcc = ClientService.createAccount(bob, 'BobSavings', 'pwd');
      expect(() => ClientService.getAccountById(alice, bobAcc.accountId)).toThrow('Forbidden: You do not own this account.');
    });
  });

  // updateAccount()
  describe('updateAccount()', () => {
    it('renames an active account', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Old', 'pwd');
      expect(ClientService.updateAccount(token, acc.accountId, 'New').name).toBe('New');
    });

    it('throws when new name is empty', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Old', 'pwd');
      expect(() => ClientService.updateAccount(token, acc.accountId, '')).toThrow('New account name is required.');
    });

    it('throws when new name is whitespace', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Old', 'pwd');
      expect(() => ClientService.updateAccount(token, acc.accountId, '  ')).toThrow('New account name is required.');
    });

    it('throws when account is not ACTIVE', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Old', 'pwd');
      acc.status = 'CLOSED';
      expect(() => ClientService.updateAccount(token, acc.accountId, 'New')).toThrow('Cannot update an inactive or closed account.');
    });
  });

  // closeAccount()
  describe('closeAccount()', () => {
    it('closes account with zero balance', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      expect(ClientService.closeAccount(token, acc.accountId).status).toBe('CLOSED');
    });

    it('throws when account is already CLOSED', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      ClientService.closeAccount(token, acc.accountId);
      expect(() => ClientService.closeAccount(token, acc.accountId)).toThrow('Account is already closed.');
    });

    it('throws when balance is non-zero', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      ClientService.deposit(token, acc.accountId, 100);
      expect(() => ClientService.closeAccount(token, acc.accountId)).toThrow('Cannot close an account with a non-zero balance.');
    });
  });

  // deposit()
  describe('deposit()', () => {
    it('increases balance and creates a DEPOSIT transaction', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      const { account, transaction } = ClientService.deposit(token, acc.accountId, 250);
      expect(account.balance).toBe(250);
      expect(transaction.type).toBe('DEPOSIT');
    });

    it('propagates Account.deposit() errors', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      expect(() => ClientService.deposit(token, acc.accountId, -1)).toThrow('Deposit amount must be strictly positive.');
    });
  });

  // withdraw()
  describe('withdraw()', () => {
    it('decreases balance and creates a WITHDRAWAL transaction', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      ClientService.deposit(token, acc.accountId, 300);
      const { account, transaction } = ClientService.withdraw(token, acc.accountId, 100, 'pwd');
      expect(account.balance).toBe(200);
      expect(transaction.type).toBe('WITHDRAWAL');
    });

    it('throws on wrong account password', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'correctpwd');
      ClientService.deposit(token, acc.accountId, 100);
      expect(() => ClientService.withdraw(token, acc.accountId, 50, 'wrong')).toThrow('Unauthorized: Invalid account password.');
    });

    it('propagates insufficient funds error', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      expect(() => ClientService.withdraw(token, acc.accountId, 100, 'pwd')).toThrow('Insufficient funds for withdrawal.');
    });
  });

  // transfer()
  describe('transfer()', () => {
    it('moves funds and creates a TRANSFER transaction', () => {
      const { alice, bob } = setupTwo();
      const src = ClientService.createAccount(alice, 'AliceSavings', 'apwd');
      const tgt = ClientService.createAccount(bob, 'BobSavings', 'bpwd');
      ClientService.deposit(alice, src.accountId, 500);
      const { sourceAccount, targetAccount, transaction } =
        ClientService.transfer(alice, src.accountId, tgt.accountId, 200, 'apwd');
      expect(sourceAccount.balance).toBe(300);
      expect(targetAccount.balance).toBe(200);
      expect(transaction.type).toBe('TRANSFER');
    });

    it('throws when source and target are the same', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      expect(() => ClientService.transfer(token, acc.accountId, acc.accountId, 10, 'pwd')).toThrow('Cannot transfer to the same account.');
    });

    it('throws on wrong account password', () => {
      const { alice, bob } = setupTwo();
      const src = ClientService.createAccount(alice, 'AliceSavings', 'apwd');
      const tgt = ClientService.createAccount(bob, 'BobSavings', 'bpwd');
      ClientService.deposit(alice, src.accountId, 100);
      expect(() => ClientService.transfer(alice, src.accountId, tgt.accountId, 50, 'WRONG')).toThrow('Unauthorized: Invalid account password.');
    });

    it('throws when target account does not exist', () => {
      const token = setup();
      const src = ClientService.createAccount(token, 'Savings', 'pwd');
      ClientService.deposit(token, src.accountId, 100);
      expect(() => ClientService.transfer(token, src.accountId, 'NONEXISTENT', 50, 'pwd')).toThrow('Target account not found.');
    });

    it('throws when target account is not ACTIVE', () => {
      const { alice, bob } = setupTwo();
      const src = ClientService.createAccount(alice, 'AliceSavings', 'apwd');
      const tgt = ClientService.createAccount(bob, 'BobSavings', 'bpwd');
      ClientService.deposit(alice, src.accountId, 200);
      tgt.status = 'DEACTIVATED';
      expect(() => ClientService.transfer(alice, src.accountId, tgt.accountId, 50, 'apwd')).toThrow('Target account is not active.');
    });
  });

  // getAuditTrail()
  describe('getAuditTrail()', () => {
    it('returns all transactions related to the user sorted by timestamp', () => {
      const token = setup();
      const acc = ClientService.createAccount(token, 'Savings', 'pwd');
      ClientService.deposit(token, acc.accountId, 100);
      ClientService.withdraw(token, acc.accountId, 20, 'pwd');
      const trail = ClientService.getAuditTrail(token);
      expect(trail).toHaveLength(2);
      // Both types should be present (timestamps may resolve within same ms)
      const types = trail.map(t => t.type);
      expect(types).toContain('DEPOSIT');
      expect(types).toContain('WITHDRAWAL');
    });

    it('returns empty array when user has no transactions', () => {
      const token = setup();
      ClientService.createAccount(token, 'Savings', 'pwd');
      expect(ClientService.getAuditTrail(token)).toEqual([]);
    });

    it('excludes transactions from other users', () => {
      const { alice, bob } = setupTwo();
      const aliceAcc = ClientService.createAccount(alice, 'AliceSavings', 'apwd');
      const bobAcc = ClientService.createAccount(bob, 'BobSavings', 'bpwd');
      ClientService.deposit(alice, aliceAcc.accountId, 100);
      ClientService.deposit(bob, bobAcc.accountId, 200);
      const trail = ClientService.getAuditTrail(alice);
      expect(trail).toHaveLength(1);
      expect(trail[0].amount).toBe(100);
    });
  });
});
