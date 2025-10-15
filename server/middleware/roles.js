// Middleware to check if user has required roles
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];

    // Check if user has any of the allowed roles
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRoles: userRoles
      });
    }

    next();
  };
};

// Middleware to check if user has Admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userRoles = req.user.roles || [];

  if (!userRoles.includes('Admin')) {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }

  next();
};

// Helper function to check if user has a specific role
const hasRole = (user, role) => {
  if (!user || !user.roles) {
    return false;
  }
  return user.roles.includes(role);
};

// Helper function to check if user has any of the specified roles
const hasAnyRole = (user, roles) => {
  if (!user || !user.roles) {
    return false;
  }
  return roles.some(role => user.roles.includes(role));
};

module.exports = {
  requireRoles,
  requireAdmin,
  hasRole,
  hasAnyRole
};
