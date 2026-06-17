const AccountService = require('../src/service/accountService');
const AccountRepo = require('../src/repository/accountRepo');

describe('AccountService', () => {
  let service;
  beforeEach(() => {
    const repo = new AccountRepo();
    repo.clear();
    service = new AccountService();
    service.repo = repo;
  });

  it('creates account with default balance', () => {
    const acc = service.createAccount({ name: 'Bob' });
    expect(acc).toBeTruthy();
    expect(acc.balance).toBe(0);
  });

  it('updates account', () => {
    const acc = service.createAccount({ name: 'C' });
    const updated = service.updateAccount(acc.id, { balance: 50 });
    expect(updated.balance).toBe(50);
  });

  it('getAll and delete account', () => {
    service.createAccount({ name: 'X' });
    service.createAccount({ name: 'Y' });
    const all = service.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const acc = all[0];
    const res = service.deleteAccount(acc.id);
    expect(res).toBe(true);
    expect(service.getAccount(acc.id)).toBeNull();
  });
});
