/**
 * Unit Tests: authController (src/controller/authController.js)
 *
 * Uses supertest to exercise every HTTP route:
 *  POST /api/auth/signup
 *  POST /api/auth/login
 *  GET  /api/auth/users
 *  GET  /api/auth/users/:id
 *
 * Also covers the extractToken helper via account routes that depend on it.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import db from '../../src/bank-system/db/MemoryDB.js';

describe('authController', () => {
  beforeEach(() => { db.clear(); });

  // POST /api/auth/signup
  describe('POST /api/auth/signup', () => {
    it('201 – registers a new user', async () => {
      const res = await request(app).post('/api/auth/signup')
        .send({ username: 'alice', email: 'alice@test.com', password: 'pass' });
      expect(res.status).toBe(201);
      expect(res.body.username).toBe('alice');
      expect(res.body.role).toBe('USER');
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('201 – registers an ADMIN when role is provided', async () => {
      const res = await request(app).post('/api/auth/signup')
        .send({ username: 'admin', email: 'admin@test.com', password: 'pass', role: 'ADMIN' });
      expect(res.status).toBe(201);
      expect(res.body.role).toBe('ADMIN');
    });

    it('400 – rejects duplicate username', async () => {
      await request(app).post('/api/auth/signup')
        .send({ username: 'alice', email: 'a@b.com', password: 'p' });
      const res = await request(app).post('/api/auth/signup')
        .send({ username: 'alice', email: 'c@d.com', password: 'p' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Username already taken/);
    });

    it('400 – rejects missing fields', async () => {
      const res = await request(app).post('/api/auth/signup').send({});
      expect(res.status).toBe(400);
    });
  });

  // POST /api/auth/login
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/signup')
        .send({ username: 'alice', email: 'alice@test.com', password: 'pass' });
    });

    it('200 – returns token on valid credentials', async () => {
      const res = await request(app).post('/api/auth/login')
        .send({ username: 'alice', password: 'pass' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('401 – returns error on wrong password', async () => {
      const res = await request(app).post('/api/auth/login')
        .send({ username: 'alice', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid username or password/);
    });
  });

  // GET /api/auth/users
  describe('GET /api/auth/users', () => {
    it('200 – returns user list without password hashes', async () => {
      await request(app).post('/api/auth/signup')
        .send({ username: 'alice', email: 'alice@test.com', password: 'pass' });
      const res = await request(app).get('/api/auth/users');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].passwordHash).toBeUndefined();
      expect(res.body[0].username).toBe('alice');
    });

    it('200 – returns empty array when no users exist', async () => {
      const res = await request(app).get('/api/auth/users');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // GET /api/auth/users/:id
  describe('GET /api/auth/users/:id', () => {
    it('200 – returns user by valid ID', async () => {
      const signup = await request(app).post('/api/auth/signup')
        .send({ username: 'alice', email: 'alice@test.com', password: 'pass' });
      const userId = signup.body.id;
      const res = await request(app).get(`/api/auth/users/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('alice');
    });

    it('404 – returns error for unknown ID', async () => {
      const res = await request(app).get('/api/auth/users/NONEXISTENT');
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/User not found/);
    });
  });

  // extractToken helper – tested indirectly via account routes
  describe('extractToken helper', () => {
    let token;
    beforeEach(async () => {
      await request(app).post('/api/auth/signup')
        .send({ username: 'alice', email: 'alice@test.com', password: 'pass' });
      const res = await request(app).post('/api/auth/login')
        .send({ username: 'alice', password: 'pass' });
      token = res.body.token;
    });

    it('accepts Bearer token in Authorization header', async () => {
      const res = await request(app).get('/api/accounts')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('accepts raw token in Authorization header (no Bearer prefix)', async () => {
      const res = await request(app).get('/api/accounts')
        .set('Authorization', token);
      expect(res.status).toBe(200);
    });

    it('accepts token as query parameter', async () => {
      const res = await request(app).get(`/api/accounts?token=${token}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/accounts');
      expect(res.status).toBe(401);
    });
  });
});
