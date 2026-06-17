const request = require('supertest');
const express = require('express');
const router = require('../src/controller/accountController');
const AccountService = require('../src/service/accountService');

const app = express();
app.use(express.json());
app.use('/api/accounts', router);

describe('AccountController (unit)', () => {
  beforeEach(() => {
    // restore any previous mocks
    if (global.vi && global.vi.restoreAllMocks) global.vi.restoreAllMocks();
  });

  it('POST / should create account and return 201', async () => {
    const mockAcc = { id: '1', name: 'Unit', balance: 0 };
    global.vi.spyOn(AccountService.prototype, 'createAccount').mockImplementation(() => mockAcc);

    const res = await request(app).post('/api/accounts').send({ name: 'Unit' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockAcc);
  });

  it('GET / should return list from service', async () => {
    const list = [{ id: '1', name: 'A' }];
    global.vi.spyOn(AccountService.prototype, 'getAll').mockImplementation(() => list);

    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(list);
  });

  it('GET /:id returns 200 when found and 404 when not', async () => {
    const acc = { id: '42', name: 'Found' };
    global.vi.spyOn(AccountService.prototype, 'getAccount').mockImplementation((id) => (id === '42' ? acc : null));

    const ok = await request(app).get('/api/accounts/42');
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual(acc);

    const not = await request(app).get('/api/accounts/99');
    expect(not.status).toBe(404);
  });

  it('PUT /:id returns updated object or 400 on error', async () => {
    const updated = { id: '1', name: 'Updated' };
    global.vi.spyOn(AccountService.prototype, 'updateAccount').mockImplementation((id, payload) => {
      if (!payload || !payload.name) throw new Error('Invalid payload');
      return updated;
    });

    const ok = await request(app).put('/api/accounts/1').send({ name: 'Updated' });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual(updated);

    const bad = await request(app).put('/api/accounts/1').send({});
    expect(bad.status).toBe(400);
  });

  it('DELETE /:id returns 204 on success and 404 on not found', async () => {
    global.vi.spyOn(AccountService.prototype, 'deleteAccount').mockImplementation((id) => {
      if (id === 'exists') return true;
      throw new Error('Not found');
    });

    const ok = await request(app).delete('/api/accounts/exists');
    expect(ok.status).toBe(204);

    const not = await request(app).delete('/api/accounts/missing');
    expect(not.status).toBe(404);
  });

  it('POST /:id/transactions should create tx and GET /:id/transactions lists them', async () => {
    const tx = { id: 't1', type: 'deposit', amount: 10, date: new Date().toISOString() };
    global.vi.spyOn(AccountService.prototype, 'createTransaction').mockImplementation(() => tx);
    global.vi.spyOn(AccountService.prototype, 'listTransactions').mockImplementation(() => [tx]);

    const post = await request(app).post('/api/accounts/1/transactions').send({ type: 'deposit', amount: 10 });
    expect(post.status).toBe(201);
    expect(post.body.type).toBe('deposit');

    const get = await request(app).get('/api/accounts/1/transactions');
    expect(get.status).toBe(200);
    expect(Array.isArray(get.body)).toBe(true);
  });
});
