const AccountService = require('../src/service/accountService');

describe('Transfers', () => {
  let service;
  beforeEach(() => {
    const repo = new (require('../src/repository/accountRepo'))();
    repo.clear();
    service = new AccountService();
    service.repo = repo;
  });

  it('transfers funds between accounts', () => {
    const a1 = service.createAccount({ name: 'From', balance: 100 });
    const a2 = service.createAccount({ name: 'To', balance: 10 });
    const res = service.transfer(a1.id, a2.id, 30, 'payment');
    expect(res.from.type).toBe('transfer-out');
    expect(service.getAccount(a1.id).balance).toBe(70);
    expect(service.getAccount(a2.id).balance).toBe(40);
  });
});
