class Account {
  /**
   * @param {string} accountId - Unique identifier for the account
   * @param {string} ownerId - ID of the User who owns this account
   * @param {string} name - Name of the account (e.g., "Checking", "Savings")
   */
  constructor(accountId, ownerId, name) {
    this.accountId = accountId;
    this.ownerId = ownerId;
    this.name = name;
    this.balance = 0;
    this.status = 'ACTIVE'; // 'ACTIVE', 'CLOSED', 'DEACTIVATED'
    this.createdAt = new Date();
  }

  deposit(amount) {
    if (amount <= 0) {
      throw new Error("Deposit amount must be strictly positive.");
    }
    if (this.status !== 'ACTIVE') {
      throw new Error("Cannot deposit into an inactive or closed account.");
    }
    this.balance += amount;
  }

  withdraw(amount) {
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be strictly positive.");
    }
    if (this.status !== 'ACTIVE') {
      throw new Error("Cannot withdraw from an inactive or closed account.");
    }
    if (this.balance < amount) {
      throw new Error("Insufficient funds for withdrawal.");
    }
    this.balance -= amount;
  }
}

export default Account;
