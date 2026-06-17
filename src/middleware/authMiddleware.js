const UserRepo = require('../repository/userRepo');

const userRepo = new UserRepo();

// Simple middleware: reads token from Authorization header or query/body and
// attaches user to req.user when valid. Token is demo user id.
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'] || req.query.token || req.body && req.body.token;
  if (!auth) return next();
  const token = (typeof auth === 'string' && auth.startsWith('Bearer ')) ? auth.slice(7) : auth;
  const user = userRepo.findById(token);
  if (user) {
    req.user = { id: user.id, username: user.username, role: user.role || 'client' };
  }
  next();
}

module.exports = authMiddleware;
