const AccountService = require('../src/service/accountService');

describe('Account Transactions', () => {
  let service;
  beforeEach(() => {
    const repo = new (require('../src/repository/accountRepo'))();
    repo.clear();
    service = new AccountService();
    service.repo = repo;
  });

  it('creates deposit and records transaction', () => {
    const acc = service.createAccount({ name: 'T1', balance: 0 });
    const tx = service.createTransaction(acc.id, { type: 'deposit', amount: 50, description: 'init' });
    expect(tx).toBeTruthy();
    const updated = service.getAccount(acc.id);
    expect(updated.balance).toBe(50);
    const txs = service.listTransactions(acc.id);
    expect(txs.length).toBe(1);
    expect(txs[0].type).toBe('deposit');
  });

  it('prevents overdraft on withdraw', () => {
    const acc = service.createAccount({ name: 'T2', balance: 10 });
    expect(() => service.createTransaction(acc.id, { type: 'withdraw', amount: 20 })).toThrow();
  });
});
