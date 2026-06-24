/**
 * Unit Tests: Transaction model (src/bank-system/models/Transaction.js)
 *
 * Covers:
 *  - Constructor field assignment for every parameter
 *  - All common transaction types
 */

import { describe, it, expect } from 'vitest';
import Transaction from '../../src/bank-system/models/Transaction.js';

describe('Transaction model', () => {
  it('stores all constructor fields for a DEPOSIT', () => {
    const t = new Transaction('T1', 'DEPOSIT', 100, null, 'A1', 'U1');
    expect(t.transactionId).toBe('T1');
    expect(t.type).toBe('DEPOSIT');
    expect(t.amount).toBe(100);
    expect(t.sourceAccountId).toBeNull();
    expect(t.targetAccountId).toBe('A1');
    expect(t.initiatorId).toBe('U1');
    expect(t.timestamp).toBeInstanceOf(Date);
  });

  it('stores all constructor fields for a WITHDRAWAL', () => {
    const t = new Transaction('T2', 'WITHDRAWAL', 50, 'A1', null, 'U1');
    expect(t.type).toBe('WITHDRAWAL');
    expect(t.sourceAccountId).toBe('A1');
    expect(t.targetAccountId).toBeNull();
  });

  it('stores all constructor fields for a TRANSFER', () => {
    const t = new Transaction('T3', 'TRANSFER', 200, 'A1', 'A2', 'U1');
    expect(t.type).toBe('TRANSFER');
    expect(t.sourceAccountId).toBe('A1');
    expect(t.targetAccountId).toBe('A2');
  });

  it('stores all constructor fields for an ADMIN_ADJUSTMENT', () => {
    const t = new Transaction('T4', 'ADMIN_ADJUSTMENT', 999, null, 'A3', 'U2');
    expect(t.type).toBe('ADMIN_ADJUSTMENT');
    expect(t.amount).toBe(999);
    expect(t.initiatorId).toBe('U2');
  });

  it('timestamp is close to current time', () => {
    const before = Date.now();
    const t = new Transaction('T5', 'DEPOSIT', 1, null, 'A1', 'U1');
    const after = Date.now();
    expect(t.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(t.timestamp.getTime()).toBeLessThanOrEqual(after);
  });
});
