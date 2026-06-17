const request = require('supertest');
const app = require('../src/server');
const AccountRepo = require('../src/repository/accountRepo');

describe('Integration: Account API', () => {
  beforeEach(() => {
    const repo = new AccountRepo();
    repo.clear();
  });

  it('creates and retrieves an account', async () => {
    // create a demo user and use token as owner_id
    await request(app).post('/api/auth/signup').send({ username: 'x', password: 'p' });
    const login = await request(app).post('/api/auth/login').send({ username: 'x', password: 'p' });
    const token = login.body.token;
    const resp = await request(app).post('/api/accounts').send({ name: 'Int', owner_id: token });
    expect(resp.status).toBe(201);
    expect(resp.body.id).toBeTruthy();

    const get = await request(app).get(`/api/accounts/${resp.body.id}`);
    expect(get.status).toBe(200);
    expect(get.body.name).toBe('Int');
  });

  it('lists all accounts and deletes an account', async () => {
    await request(app).post('/api/auth/signup').send({ username: 'u1', password: 'p' });
    const login = await request(app).post('/api/auth/login').send({ username: 'u1', password: 'p' });
    const token = login.body.token;
    const a1 = await request(app).post('/api/accounts').send({ name: 'A1', owner_id: token });
    const a2 = await request(app).post('/api/accounts').send({ name: 'A2', owner_id: token });
    const list = await request(app).get('/api/accounts?owner_id=' + token);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(2);

    const del = await request(app).delete(`/api/accounts/${a1.body.id}`);
    expect(del.status).toBe(204);
    const list2 = await request(app).get('/api/accounts');
    expect(list2.body.find(a => a.id === a1.body.id)).toBeUndefined();
  });

  it('performs deposit and lists transactions', async () => {
    await request(app).post('/api/auth/signup').send({ username: 'tx', password: 'p' });
    const login = await request(app).post('/api/auth/login').send({ username: 'tx', password: 'p' });
    const token = login.body.token;
    const a = await request(app).post('/api/accounts').send({ name: 'TxAcc', owner_id: token });
    const id = a.body.id;
    const tx = await request(app).post(`/api/accounts/${id}/transactions`).send({ type: 'deposit', amount: 100, description: 'seed' });
    expect(tx.status).toBe(201);
    const txs = await request(app).get(`/api/accounts/${id}/transactions`);
    expect(txs.status).toBe(200);
    expect(Array.isArray(txs.body)).toBe(true);
    expect(txs.body.length).toBeGreaterThanOrEqual(1);
    expect(txs.body[0].type).toBe('deposit');
  });
});
