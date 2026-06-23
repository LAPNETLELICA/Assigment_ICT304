class Transaction {
  /**
   * @param {string} transactionId - Unique identifier
   * @param {string} type - 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ADMIN_ADJUSTMENT'
   * @param {number} amount - Transaction amount
   * @param {string|null} sourceAccountId - Account funds were taken from
   * @param {string|null} targetAccountId - Account funds were sent to
   * @param {string} initiatorId - User ID who initiated this action
   */
  constructor(transactionId, type, amount, sourceAccountId, targetAccountId, initiatorId) {
    this.transactionId = transactionId;
    this.type = type;
    this.amount = amount;
    this.sourceAccountId = sourceAccountId;
    this.targetAccountId = targetAccountId;
    this.initiatorId = initiatorId;
    this.timestamp = new Date();
  }
}

export default Transaction;
