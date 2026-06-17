const AccountRepo = require('../src/repository/accountRepo');

describe('AccountRepo', () => {
  let repo;
  beforeEach(() => {
    repo = new AccountRepo();
    repo.clear();
  });

  it('should save and retrieve account', () => {
    const acc = repo.save({ name: 'Alice', balance: 10 });
    const fetched = repo.findById(acc.id);
    expect(fetched).toBeTruthy();
    expect(fetched.name).toBe('Alice');
  });

  it('findAll and delete work', () => {
    const a1 = repo.save({ name: 'One' });
    const a2 = repo.save({ name: 'Two' });
    const all = repo.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    repo.delete(a1.id);
    expect(repo.findById(a1.id)).toBeNull();
  });
});
