/**
 * Unit Tests: MemoryDB (src/bank-system/db/MemoryDB.js)
 *
 * Covers:
 *  - Singleton pattern (two requires return the same instance)
 *  - All three ID generators
 *  - clear() resets all maps and counters
 *  - 100% statement, branch, and line coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import db, { MemoryDB } from '../../src/bank-system/db/MemoryDB.js';

describe('MemoryDB', () => {
  beforeEach(() => {
    db.clear();
  });

  // ── Singleton ────────────────────────────────────────────────────────────
  it('is a singleton – calling new MemoryDB() returns the existing instance', () => {
    // Since the module-level dbInstance is already set, calling new MemoryDB()
    // hits the early-return branch (lines 4-5) and returns the same object.
    const second = new MemoryDB();
    expect(second).toBe(db);
  });

  it('is a singleton – multiple imports resolve to the same instance', async () => {
    const { default: db2 } = await import('../../src/bank-system/db/MemoryDB.js');
    expect(db).toBe(db2);
  });

  // ── ID Generators ─────────────────────────────────────────────────────────
  it('generates sequential User IDs starting from U1', () => {
    expect(db.generateUserId()).toBe('U1');
    expect(db.generateUserId()).toBe('U2');
    expect(db.generateUserId()).toBe('U3');
  });

  it('generates sequential Account IDs starting from A1', () => {
    expect(db.generateAccountId()).toBe('A1');
    expect(db.generateAccountId()).toBe('A2');
  });

  it('generates sequential Transaction IDs starting from T1', () => {
    expect(db.generateTransactionId()).toBe('T1');
    expect(db.generateTransactionId()).toBe('T2');
  });

  // ── clear() ───────────────────────────────────────────────────────────────
  it('clear() empties all maps', () => {
    db.users.set('U1', { userId: 'U1' });
    db.accounts.set('A1', { accountId: 'A1' });
    db.transactions.set('T1', { transactionId: 'T1' });

    db.clear();

    expect(db.users.size).toBe(0);
    expect(db.accounts.size).toBe(0);
    expect(db.transactions.size).toBe(0);
  });

  it('clear() resets all ID counters back to 1', () => {
    db.generateUserId();
    db.generateAccountId();
    db.generateTransactionId();

    db.clear();

    expect(db.generateUserId()).toBe('U1');
    expect(db.generateAccountId()).toBe('A1');
    expect(db.generateTransactionId()).toBe('T1');
  });
});
