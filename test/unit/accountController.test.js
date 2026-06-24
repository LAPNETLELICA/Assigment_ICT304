/**
 * Unit Tests: accountController (src/controller/accountController.js)
 *
 * Uses supertest to exercise every HTTP route:
 *  GET    /api/accounts
 *  POST   /api/accounts
 *  GET    /api/accounts/:id
 *  PUT    /api/accounts/:id
 *  DELETE /api/accounts/:id
 *  POST   /api/accounts/:id/transactions  (deposit & withdraw)
 *  GET    /api/accounts/:id/transactions
 *  POST   /api/accounts/transfer
 *
 * Tests both USER paths and ADMIN paths (dual-role fallback logic).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import db from '../../src/bank-system/db/MemoryDB.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
async function signupAndLogin(username, email, password, role = 'USER') {
  await request(app).post('/api/auth/signup').send({ username, email, password, role });
  const res = await request(app).post('/api/auth/login').send({ username, password });
  return res.body.token;
}

async function createAccount(token, name = 'Savings', accountPassword = 'pwd', initialDeposit) {
  const body = { name, accountPassword };
  if (initialDeposit !== undefined) body.initialDeposit = initialDeposit;
  const res = await request(app).post('/api/accounts')
    .set('Authorization', `Bearer ${token}`).send(body);
  return res.body;
}

describe('accountController', () => {
  let userToken, adminToken, accId;

  beforeEach(async () => {
    db.clear();
    userToken = await signupAndLogin('alice', 'alice@test.com', 'pass');
    adminToken = await signupAndLogin('admin', 'admin@test.com', 'pass', 'ADMIN');
    const acc = await createAccount(userToken);
    accId = acc.accountId;
  });

  // GET /api/accounts
  describe('GET /api/accounts', () => {
    it('200 – USER sees only their own accounts', async () => {
      const res = await request(app).get('/api/accounts').set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('200 – ADMIN sees all accounts', async () => {
      const res = await request(app).get('/api/accounts').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('401 – returns error when no token', async () => {
      const res = await request(app).get('/api/accounts');
      expect(res.status).toBe(401);
    });
  });

  // POST /api/accounts
  describe('POST /api/accounts', () => {
    it('201 – creates an account', async () => {
      const res = await request(app).post('/api/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Checking', accountPassword: 'secret' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Checking');
    });

    it('400 – rejects missing account name', async () => {
      const res = await request(app).post('/api/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ accountPassword: 'pwd' });
      expect(res.status).toBe(400);
    });
  });

  // GET /api/accounts/:id
  describe('GET /api/accounts/:id', () => {
    it('200 – USER retrieves their own account', async () => {
      const res = await request(app).get(`/api/accounts/${accId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.accountId).toBe(accId);
    });

    it('200 – ADMIN retrieves any account with ownerUsername', async () => {
      const res = await request(app).get(`/api/accounts/${accId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.ownerUsername).toBe('alice');
    });

    it('404 – returns error for nonexistent account', async () => {
      const res = await request(app).get('/api/accounts/NONE')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  // POST /api/accounts/:id/transactions – deposit
  describe('POST /api/accounts/:id/transactions (deposit)', () => {
    it('201 – processes a deposit', async () => {
      const res = await request(app).post(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'deposit', amount: 100 });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('DEPOSIT');
    });

    it('400 – rejects invalid transaction type', async () => {
      const res = await request(app).post(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'magic', amount: 100 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid transaction type/);
    });
  });

  // POST /api/accounts/:id/transactions – withdraw
  describe('POST /api/accounts/:id/transactions (withdraw)', () => {
    beforeEach(async () => {
      await request(app).post(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'deposit', amount: 200 });
    });

    it('201 – processes a withdrawal', async () => {
      const res = await request(app).post(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'withdraw', amount: 50, accountPassword: 'pwd' });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('WITHDRAWAL');
    });

    it('400 – rejects wrong account password', async () => {
      const res = await request(app).post(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'withdraw', amount: 50, accountPassword: 'WRONG' });
      expect(res.status).toBe(400);
    });
  });

  // GET /api/accounts/:id/transactions
  describe('GET /api/accounts/:id/transactions', () => {
    beforeEach(async () => {
      await request(app).post(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'deposit', amount: 100 });
    });

    it('200 – USER retrieves their account transactions', async () => {
      const res = await request(app).get(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('200 – ADMIN retrieves all transactions for an account', async () => {
      const res = await request(app).get(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('401 – returns error when token is missing', async () => {
      const res = await request(app).get(`/api/accounts/${accId}/transactions`);
      expect(res.status).toBe(401);
    });
  });

  // POST /api/accounts/transfer
  describe('POST /api/accounts/transfer', () => {
    let accId2;
    beforeEach(async () => {
      // Fund first account
      await request(app).post(`/api/accounts/${accId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'deposit', amount: 500 });
      // Create second account for another user
      const bobToken = await signupAndLogin('bob', 'bob@test.com', 'pass');
      const acc2 = await createAccount(bobToken, 'BobSavings', 'bpwd');
      accId2 = acc2.accountId;
    });

    it('201 – transfers funds between accounts', async () => {
      const res = await request(app).post('/api/accounts/transfer')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ from: accId, to: accId2, amount: 100, accountPassword: 'pwd' });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('TRANSFER');
    });

    it('400 – rejects transfer to non-existent target', async () => {
      const res = await request(app).post('/api/accounts/transfer')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ from: accId, to: 'NONE', amount: 100, accountPassword: 'pwd' });
      expect(res.status).toBe(400);
    });
  });

  // PUT /api/accounts/:id
  describe('PUT /api/accounts/:id', () => {
    it('200 – USER renames their account', async () => {
      const res = await request(app).put(`/api/accounts/${accId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Premium' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Premium');
    });

    it('200 – ADMIN force-updates account status', async () => {
      const res = await request(app).put(`/api/accounts/${accId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DEACTIVATED' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('DEACTIVATED');
    });

    it('400 – rejects invalid update (empty name for user)', async () => {
      const res = await request(app).put(`/api/accounts/${accId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  // DELETE /api/accounts/:id
  describe('DELETE /api/accounts/:id', () => {
    it('204 – USER closes their zero-balance account', async () => {
      const res = await request(app).delete(`/api/accounts/${accId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(204);
    });

    it('204 – ADMIN deactivates any account', async () => {
      const res = await request(app).delete(`/api/accounts/${accId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it('404 – returns error for nonexistent account', async () => {
      // Use a user token so admin path is not tried first
      const res = await request(app).delete('/api/accounts/NONE')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });
});
