import db from '../db/MemoryDB.js';
import User from '../models/User.js';

class AuthService {
  /**
   * Register a new user
   * @param {string} username 
   * @param {string} email
   * @param {string} password 
   * @param {string} role 'USER' or 'ADMIN'
   * @returns {User}
   */
  static register(username, email, password, role = 'USER') {
    if (!username || !email || !password) {
      throw new Error("Username, email, and password are required.");
    }

    // Check if username already exists
    for (const user of db.users.values()) {
      if (user.username === username) {
        throw new Error("Username already taken.");
      }
      if (user.email === email) {
        throw new Error("Email already registered.");
      }
    }

    const userId = db.generateUserId();
    // In a real app, hash the password (e.g., with bcrypt)
    const passwordHash = `hashed_${password}`; 
    
    const newUser = new User(userId, username, email, passwordHash, role);
    db.users.set(userId, newUser);
    return newUser;
  }

  /**
   * Authenticate a user and return a simple mock token
   * @param {string} username 
   * @param {string} password 
   * @returns {Object} mock token object { token: "...", user: User }
   */
  static login(username, password) {
    let foundUser = null;
    const passwordHash = `hashed_${password}`;

    for (const user of db.users.values()) {
      if (user.username === username && user.passwordHash === passwordHash) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      throw new Error("Invalid username or password.");
    }

    // Simple mock token
    const token = `token_for_${foundUser.userId}`;
    return { token, user: foundUser };
  }

  /**
   * Validates a token and retrieves the associated user.
   * Throws if invalid or if role is required and doesn't match.
   */
  static validateToken(token, requiredRole = null) {
    if (!token || !token.startsWith('token_for_')) {
      throw new Error("Unauthorized: Invalid token format.");
    }

    const userId = token.split('token_for_')[1];
    const user = db.users.get(userId);

    if (!user) {
      throw new Error("Unauthorized: User not found.");
    }

    if (requiredRole && user.role !== requiredRole) {
      throw new Error("Forbidden: Insufficient privileges.");
    }

    return user;
  }
}

export default AuthService;
