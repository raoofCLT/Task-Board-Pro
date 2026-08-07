/**
 * Role Middleware
 * Restricts access to users with specific roles
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'manager')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Role '${req.user.role}' is not authorized to perform this action`
      });
    }

    next();
  };
};
