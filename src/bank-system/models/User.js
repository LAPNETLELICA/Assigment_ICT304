class User {
  /**
   * @param {string} userId - Unique identifier for the user
   * @param {string} username - User's login name
   * @param {string} passwordHash - Hashed password
   * @param {string} role - 'USER' or 'ADMIN'
   */
  constructor(userId, username, passwordHash, role = 'USER') {
    this.userId = userId;
    this.username = username;
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = new Date();
  }
}

export default User;
