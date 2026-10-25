// Role-based access control middleware

// Check if user has required role
exports.hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Check if user is patient
exports.isPatient = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Patient role required.'
    });
  }
  next();
};

// Check if user is doctor
exports.isDoctor = (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor role required.'
    });
  }
  next();
};

// Check if user is lab
exports.isLab = (req, res, next) => {
  if (req.user.role !== 'lab') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Laboratory role required.'
    });
  }
  next();
};

// Check if user is pharmacy
exports.isPharmacy = (req, res, next) => {
  if (req.user.role !== 'pharmacy') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Pharmacy role required.'
    });
  }
  next();
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Check if user is healthcare provider (doctor, lab, pharmacy)
exports.isHealthcareProvider = (req, res, next) => {
  const providerRoles = ['doctor', 'lab', 'pharmacy'];
  if (!providerRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Healthcare provider role required.'
    });
  }
  next();
};

// Check if user owns the resource or is admin
exports.isOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (req.user.role === 'admin' || req.user.userId.toString() === resourceUserId.toString()) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  };
};
