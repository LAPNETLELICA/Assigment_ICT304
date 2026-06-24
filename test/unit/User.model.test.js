/**
 * Unit Tests: User model (src/bank-system/models/User.js)
 *
 * Covers:
 *  - Constructor field assignment
 *  - Default role value ('USER')
 *  - Explicit role override ('ADMIN')
 */

import { describe, it, expect } from 'vitest';
import User from '../../src/bank-system/models/User.js';

describe('User model', () => {
  it('stores all constructor fields correctly', () => {
    const user = new User('U1', 'alice', 'alice@example.com', 'hashed_password', 'USER');
    expect(user.userId).toBe('U1');
    expect(user.username).toBe('alice');
    expect(user.email).toBe('alice@example.com');
    expect(user.passwordHash).toBe('hashed_password');
    expect(user.role).toBe('USER');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('defaults role to USER when not provided', () => {
    const user = new User('U2', 'bob', 'bob@example.com', 'hash');
    expect(user.role).toBe('USER');
  });

  it('stores ADMIN role when explicitly provided', () => {
    const admin = new User('U3', 'carol', 'carol@example.com', 'hash', 'ADMIN');
    expect(admin.role).toBe('ADMIN');
  });

  it('createdAt is a recent Date', () => {
    const before = Date.now();
    const user = new User('U4', 'dan', 'dan@example.com', 'hash');
    const after = Date.now();
    expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(user.createdAt.getTime()).toBeLessThanOrEqual(after);
  });
});
