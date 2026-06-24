import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService, ClientService, AdminService, MemoryDB } from '../src/bank-system/index.js';

describe('Bank Account Management System', () => {
  beforeEach(() => {
    MemoryDB.clear();
  });

  describe('AuthService', () => {
    it('registers a user successfully', () => {
      const user = AuthService.register('testuser', 'test@example.com', 'password');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('USER');
      expect(MemoryDB.users.size).toBe(1);
    });

    it('prevents duplicate usernames', () => {
      AuthService.register('testuser', 'test@example.com', 'password');
      expect(() => AuthService.register('testuser', 'test2@example.com', 'pass2')).toThrow('Username already taken.');
    });

    it('requires username, email, and password', () => {
      expect(() => AuthService.register('', 'test@example.com', 'password')).toThrow('Username, email, and password are required.');
    });

    it('logs in successfully and returns a token', () => {
      AuthService.register('testuser', 'test@example.com', 'password');
      const { token, user } = AuthService.login('testuser', 'password');
      expect(token).toBeDefined();
      expect(user.username).toBe('testuser');
    });

    it('fails login with wrong credentials', () => {
      AuthService.register('testuser', 'test@example.com', 'password');
      expect(() => AuthService.login('testuser', 'wrong')).toThrow('Invalid username or password.');
    });

    it('validates roles correctly', () => {
      AuthService.register('admin', 'admin@example.com', 'pass', 'ADMIN');
      const { token } = AuthService.login('admin', 'pass');
      expect(() => AuthService.validateToken(token, 'ADMIN')).not.toThrow();
      
      AuthService.register('user', 'user@example.com', 'pass', 'USER');
      const userRes = AuthService.login('user', 'pass');
      expect(() => AuthService.validateToken(userRes.token, 'ADMIN')).toThrow('Forbidden: Insufficient privileges.');
    });
  });

  describe('ClientService', () => {
    let token, accountId;

    beforeEach(() => {
      AuthService.register('client', 'client@example.com', 'pass');
      const res = AuthService.login('client', 'pass');
      token = res.token;
    });

    it('creates an account', () => {
      const acc = ClientService.createAccount(token, 'Savings', 'secretpass');
      expect(acc.name).toBe('Savings');
      expect(acc.balance).toBe(0);
      accountId = acc.accountId;
    });

    it('prevents empty account name', () => {
      expect(() => ClientService.createAccount(token, '', 'secretpass')).toThrow('Account name is required.');
    });

    it('deposits money', () => {
      const acc = ClientService.createAccount(token, 'Savings', 'secretpass');
      ClientService.deposit(token, acc.accountId, 100);
      expect(acc.balance).toBe(100);
    });

    it('withdraws money', () => {
      const acc = ClientService.createAccount(token, 'Savings', 'secretpass');
      ClientService.deposit(token, acc.accountId, 100);
      ClientService.withdraw(token, acc.accountId, 40, 'secretpass');
      expect(acc.balance).toBe(60);
    });

    it('prevents overdraft', () => {
      const acc = ClientService.createAccount(token, 'Savings', 'secretpass');
      ClientService.deposit(token, acc.accountId, 100);
      expect(() => ClientService.withdraw(token, acc.accountId, 200, 'secretpass')).toThrow('Insufficient funds for withdrawal.');
    });

    it('transfers money', () => {
      const acc1 = ClientService.createAccount(token, 'Checking', 'secret1');
      const acc2 = ClientService.createAccount(token, 'Savings', 'secret2');
      ClientService.deposit(token, acc1.accountId, 100);
      ClientService.transfer(token, acc1.accountId, acc2.accountId, 30, 'secret1');
      
      expect(acc1.balance).toBe(70);
      expect(acc2.balance).toBe(30);
    });

    it('updates account name', () => {
      const acc = ClientService.createAccount(token, 'Checking', 'secretpass');
      const updated = ClientService.updateAccount(token, acc.accountId, 'Premium Checking');
      expect(updated.name).toBe('Premium Checking');
    });

    it('closes account with zero balance', () => {
      const acc = ClientService.createAccount(token, 'Checking', 'secretpass');
      ClientService.closeAccount(token, acc.accountId);
      expect(acc.status).toBe('CLOSED');
    });

    it('prevents closing account with non-zero balance', () => {
      const acc = ClientService.createAccount(token, 'Checking', 'secretpass');
      ClientService.deposit(token, acc.accountId, 100);
      expect(() => ClientService.closeAccount(token, acc.accountId)).toThrow('Cannot close an account with a non-zero balance.');
    });

    it('fetches audit trail', () => {
      const acc = ClientService.createAccount(token, 'Checking', 'secretpass');
      ClientService.deposit(token, acc.accountId, 100);
      ClientService.withdraw(token, acc.accountId, 20, 'secretpass');
      const trail = ClientService.getAuditTrail(token);
      expect(trail.length).toBe(2);
    });
  });

  describe('AdminService', () => {
    let adminToken, userToken, accId;

    beforeEach(() => {
      AuthService.register('admin', 'admin@example.com', 'pass', 'ADMIN');
      adminToken = AuthService.login('admin', 'pass').token;

      AuthService.register('client', 'client@example.com', 'pass');
      userToken = AuthService.login('client', 'pass').token;
      
      const acc = ClientService.createAccount(userToken, 'Checking', 'secretpass');
      accId = acc.accountId;
    });

    it('gets all accounts', () => {
      const accounts = AdminService.getAllAccounts(adminToken);
      expect(accounts.length).toBe(1);
    });

    it('gets account details with username', () => {
      const details = AdminService.getAccountDetails(adminToken, accId);
      expect(details.ownerUsername).toBe('client');
    });

    it('forces update account', () => {
      AdminService.forceUpdateAccount(adminToken, accId, { status: 'DEACTIVATED' });
      const details = AdminService.getAccountDetails(adminToken, accId);
      expect(details.status).toBe('DEACTIVATED');
    });

    it('modifies balance', () => {
      AdminService.modifyBalance(adminToken, accId, 1000, 'Correction');
      const details = AdminService.getAccountDetails(adminToken, accId);
      expect(details.balance).toBe(1000);
    });

    it('gets master audit trail', () => {
      ClientService.deposit(userToken, accId, 100);
      AdminService.modifyBalance(adminToken, accId, 50, 'Penalty');
      const audit = AdminService.getMasterAuditTrail(adminToken);
      expect(audit.length).toBe(2);
    });
  });
});
