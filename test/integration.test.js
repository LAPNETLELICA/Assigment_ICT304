const request = require('supertest');
const app = require('../src/server');
const AccountRepo = require('../src/repository/accountRepo');

describe('Integration: Account API', () => {
  beforeEach(() => {
    const repo = new AccountRepo();
    repo.clear();
  });

  it('creates and retrieves an account', async () => {
    const resp = await request(app).post('/api/accounts').send({ name: 'Int' });
    expect(resp.status).toBe(201);
    expect(resp.body.id).toBeTruthy();

    const get = await request(app).get(`/api/accounts/${resp.body.id}`);
    expect(get.status).toBe(200);
    expect(get.body.name).toBe('Int');
  });

  it('lists all accounts and deletes an account', async () => {
    const a1 = await request(app).post('/api/accounts').send({ name: 'A1' });
    const a2 = await request(app).post('/api/accounts').send({ name: 'A2' });
    const list = await request(app).get('/api/accounts');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(2);

    const del = await request(app).delete(`/api/accounts/${a1.body.id}`);
    expect(del.status).toBe(204);
    const list2 = await request(app).get('/api/accounts');
    expect(list2.body.find(a => a.id === a1.body.id)).toBeUndefined();
  });
});
