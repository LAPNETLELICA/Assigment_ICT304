/**
 * Unit Tests: Account model (src/bank-system/models/Account.js)
 *
 * Covers every branch in deposit() and withdraw() including:
 *  - amount <= 0
 *  - account.status !== 'ACTIVE'
 *  - insufficient funds
 *  - happy paths
 */

import { describe, it, expect } from 'vitest';
import Account from '../../src/bank-system/models/Account.js';

function makeAccount(status = 'ACTIVE') {
  const acc = new Account('A1', 'U1', 'Savings', 'pass123');
  acc.status = status;
  return acc;
}

describe('Account model', () => {
  // ── Constructor ──────────────────────────────────────────────────────────
  it('sets all constructor fields correctly', () => {
    const acc = new Account('A1', 'U1', 'Checking', 'secretpass');
    expect(acc.accountId).toBe('A1');
    expect(acc.ownerId).toBe('U1');
    expect(acc.name).toBe('Checking');
    expect(acc.accountPassword).toBe('secretpass');
    expect(acc.balance).toBe(0);
    expect(acc.status).toBe('ACTIVE');
    expect(acc.createdAt).toBeInstanceOf(Date);
  });

  // ── deposit() ─────────────────────────────────────────────────────────────
  describe('deposit()', () => {
    it('increases balance on valid deposit', () => {
      const acc = makeAccount();
      acc.deposit(100);
      expect(acc.balance).toBe(100);
    });

    it('accumulates multiple deposits', () => {
      const acc = makeAccount();
      acc.deposit(50);
      acc.deposit(75);
      expect(acc.balance).toBe(125);
    });

    it('throws when amount is zero', () => {
      const acc = makeAccount();
      expect(() => acc.deposit(0)).toThrow('Deposit amount must be strictly positive.');
    });

    it('throws when amount is negative', () => {
      const acc = makeAccount();
      expect(() => acc.deposit(-10)).toThrow('Deposit amount must be strictly positive.');
    });

    it('throws when account is CLOSED', () => {
      const acc = makeAccount('CLOSED');
      expect(() => acc.deposit(100)).toThrow('Cannot deposit into an inactive or closed account.');
    });

    it('throws when account is DEACTIVATED', () => {
      const acc = makeAccount('DEACTIVATED');
      expect(() => acc.deposit(100)).toThrow('Cannot deposit into an inactive or closed account.');
    });
  });

  // ── withdraw() ───────────────────────────────────────────────────────────
  describe('withdraw()', () => {
    it('decreases balance on valid withdrawal', () => {
      const acc = makeAccount();
      acc.balance = 200;
      acc.withdraw(80);
      expect(acc.balance).toBe(120);
    });

    it('allows withdrawal of the entire balance', () => {
      const acc = makeAccount();
      acc.balance = 50;
      acc.withdraw(50);
      expect(acc.balance).toBe(0);
    });

    it('throws when amount is zero', () => {
      const acc = makeAccount();
      expect(() => acc.withdraw(0)).toThrow('Withdrawal amount must be strictly positive.');
    });

    it('throws when amount is negative', () => {
      const acc = makeAccount();
      expect(() => acc.withdraw(-5)).toThrow('Withdrawal amount must be strictly positive.');
    });

    it('throws when account is CLOSED', () => {
      const acc = makeAccount('CLOSED');
      acc.balance = 100;
      expect(() => acc.withdraw(10)).toThrow('Cannot withdraw from an inactive or closed account.');
    });

    it('throws when account is DEACTIVATED', () => {
      const acc = makeAccount('DEACTIVATED');
      acc.balance = 100;
      expect(() => acc.withdraw(10)).toThrow('Cannot withdraw from an inactive or closed account.');
    });

    it('throws on insufficient funds', () => {
      const acc = makeAccount();
      acc.balance = 30;
      expect(() => acc.withdraw(100)).toThrow('Insufficient funds for withdrawal.');
    });
  });
});
