/**
 * Unit Tests: AuthService (src/bank-system/services/AuthService.js)
 *
 * Covers ALL branches:
 *  - register(): missing fields, duplicate username, duplicate email, success
 *  - login(): wrong password / unknown user, success
 *  - validateToken(): null token, bad format, unknown user, role mismatch, success (with and without requiredRole)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AuthService from '../../src/bank-system/services/AuthService.js';
import db from '../../src/bank-system/db/MemoryDB.js';

describe('AuthService', () => {
  beforeEach(() => {
    db.clear();
  });

  // ── register() ────────────────────────────────────────────────────────────
  describe('register()', () => {
    it('creates a new USER with hashed password', () => {
      const user = AuthService.register('alice', 'alice@test.com', 'mypass');
      expect(user.username).toBe('alice');
      expect(user.email).toBe('alice@test.com');
      expect(user.role).toBe('USER');
      expect(user.passwordHash).toBe('hashed_mypass');
      expect(db.users.size).toBe(1);
    });

    it('creates a new ADMIN when role is specified', () => {
      const user = AuthService.register('admin', 'admin@test.com', 'adminpass', 'ADMIN');
      expect(user.role).toBe('ADMIN');
    });

    it('throws when username is empty string', () => {
      expect(() => AuthService.register('', 'a@b.com', 'pass'))
        .toThrow('Username, email, and password are required.');
    });

    it('throws when username is falsy (null)', () => {
      expect(() => AuthService.register(null, 'a@b.com', 'pass'))
        .toThrow('Username, email, and password are required.');
    });

    it('throws when email is falsy', () => {
      expect(() => AuthService.register('alice', '', 'pass'))
        .toThrow('Username, email, and password are required.');
    });

    it('throws when password is falsy', () => {
      expect(() => AuthService.register('alice', 'alice@test.com', ''))
        .toThrow('Username, email, and password are required.');
    });

    it('throws on duplicate username', () => {
      AuthService.register('alice', 'alice@test.com', 'pass');
      expect(() => AuthService.register('alice', 'other@test.com', 'pass2'))
        .toThrow('Username already taken.');
    });

    it('throws on duplicate email', () => {
      AuthService.register('alice', 'alice@test.com', 'pass');
      expect(() => AuthService.register('bob', 'alice@test.com', 'pass2'))
        .toThrow('Email already registered.');
    });
  });

  // ── login() ───────────────────────────────────────────────────────────────
  describe('login()', () => {
    beforeEach(() => {
      AuthService.register('alice', 'alice@test.com', 'correctpass');
    });

    it('returns token and user on valid credentials', () => {
      const { token, user } = AuthService.login('alice', 'correctpass');
      expect(token).toMatch(/^token_for_/);
      expect(user.username).toBe('alice');
    });

    it('throws on wrong password', () => {
      expect(() => AuthService.login('alice', 'wrongpass'))
        .toThrow('Invalid username or password.');
    });

    it('throws on unknown username', () => {
      expect(() => AuthService.login('nobody', 'correctpass'))
        .toThrow('Invalid username or password.');
    });
  });

  // ── validateToken() ───────────────────────────────────────────────────────
  describe('validateToken()', () => {
    let validToken;

    beforeEach(() => {
      AuthService.register('alice', 'alice@test.com', 'pass');
      const res = AuthService.login('alice', 'pass');
      validToken = res.token;
    });

    it('returns the user for a valid token without role check', () => {
      const user = AuthService.validateToken(validToken);
      expect(user.username).toBe('alice');
    });

    it('returns the user when role matches', () => {
      const user = AuthService.validateToken(validToken, 'USER');
      expect(user.username).toBe('alice');
    });

    it('throws when token is null', () => {
      expect(() => AuthService.validateToken(null))
        .toThrow('Unauthorized: Invalid token format.');
    });

    it('throws when token is an empty string', () => {
      expect(() => AuthService.validateToken(''))
        .toThrow('Unauthorized: Invalid token format.');
    });

    it('throws when token does not start with token_for_', () => {
      expect(() => AuthService.validateToken('random_garbage'))
        .toThrow('Unauthorized: Invalid token format.');
    });

    it('throws when token refers to a non-existent user', () => {
      expect(() => AuthService.validateToken('token_for_GHOST_USER'))
        .toThrow('Unauthorized: User not found.');
    });

    it('throws when role is required but does not match', () => {
      expect(() => AuthService.validateToken(validToken, 'ADMIN'))
        .toThrow('Forbidden: Insufficient privileges.');
    });
  });
});
