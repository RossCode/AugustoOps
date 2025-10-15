const jwt = require('jsonwebtoken');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  // Check if user is authenticated via session (Passport)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // No valid authentication found
  return res.status(401).json({ error: 'Authentication required' });
};

// Generate JWT token for a user
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    roles: user.roles || []
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = {
  requireAuth,
  generateToken
};
