/**
 * Unit Tests: Legacy Account model (src/model/account.js)
 *
 * This is a CommonJS stub (module.exports) unused by the bank-system.
 * We use createRequire to load it from an ESM test file.
 */

import { describe, it, expect } from 'vitest';
import Account from '../../src/model/account.js';

describe('Legacy Account model (src/model/account.js)', () => {
  it('stores id, name, and balance from constructor', () => {
    const acc = new Account({ id: '1', name: 'Savings', balance: 500 });
    expect(acc.id).toBe('1');
    expect(acc.name).toBe('Savings');
    expect(acc.balance).toBe(500);
  });

  it('allows zero balance', () => {
    const acc = new Account({ id: '2', name: 'Empty', balance: 0 });
    expect(acc.balance).toBe(0);
  });

  it('is an instance of Account', () => {
    const acc = new Account({ id: '3', name: 'Test', balance: 10 });
    expect(acc).toBeInstanceOf(Account);
  });
});
