/**
 * Authorization Utility
 * Centralized role and permission checking
 */

// Define role hierarchy (higher roles inherit lower role permissions)
const ROLE_HIERARCHY = {
  admin: 5,
  doctor: 4,
  pharmacy: 3,
  lab: 3,
  patient: 2
};

// Define role-based permissions
const ROLE_PERMISSIONS = {
  admin: ['*'], // All permissions
  
  doctor: [
    'view:all-patients',
    'view:patient-details',
    'create:medical-records',
    'update:medical-records',
    'view:appointments',
    'create:appointments',
    'update:appointments',
    'cancel:appointments',
    'create:prescriptions',
    'view:prescriptions',
    'create:clinical-notes',
    'view:lab-results',
    'update:doctor-profile'
  ],
  
  patient: [
    'view:own-profile',
    'update:own-profile',
    'view:own-medical-records',
    'view:own-medical-history',
    'view:own-appointments',
    'book:appointments',
    'cancel:own-appointments',
    'view:own-prescriptions',
    'view:own-lab-results',
    'order:medicines',
    'view:own-orders'
  ],
  
  pharmacy: [
    'view:prescriptions',
    'update:prescription-status',
    'manage:inventory',
    'view:orders',
    'update:order-status',
    'create:orders',
    'view:patients-basic',
    'update:pharmacy-profile'
  ],
  
  lab: [
    'view:test-orders',
    'update:test-status',
    'upload:test-results',
    'manage:test-catalog',
    'view:patients-basic',
    'update:lab-profile'
  ]
};

// Define route access matrix
const ROUTE_ACCESS_MATRIX = {
  // Patient routes
  '/profile': ['patient'],
  '/medical-records': ['patient'],
  '/medical-history': ['patient'],
  '/appointments': ['patient'],
  '/prescriptions': ['patient'],
  '/lab-tests': ['patient'],
  '/telemedicine': ['patient'],
  '/patient/*': ['patient'],
  
  // Doctor routes
  '/doctor/dashboard': ['doctor'],
  '/doctor/patients': ['doctor'],
  '/doctor/appointments': ['doctor'],
  '/doctor/consultations': ['doctor'],
  '/doctor/clinical-notes': ['doctor'],
  '/doctor/prescriptions': ['doctor'],
  '/doctor/schedule': ['doctor'],
  '/doctor/profile': ['doctor'],
  '/doctor/*': ['doctor'],
  
  // Pharmacy routes
  '/pharmacy/dashboard': ['pharmacy'],
  '/pharmacy/prescriptions': ['pharmacy'],
  '/pharmacy/inventory': ['pharmacy'],
  '/pharmacy/orders': ['pharmacy'],
  '/pharmacy/patients': ['pharmacy'],
  '/pharmacy/reports': ['pharmacy'],
  '/pharmacy/settings': ['pharmacy'],
  '/pharmacy/*': ['pharmacy'],
  
  // Lab routes
  '/lab/test-bookings': ['lab'],
  '/lab/upload-results': ['lab'],
  '/lab/*': ['lab'],
  
  // Admin routes
  '/admin/dashboard': ['admin'],
  '/admin/users': ['admin'],
  '/admin/doctors': ['admin'],
  '/admin/patients': ['admin'],
  '/admin/appointments': ['admin'],
  '/admin/pharmacy': ['admin'],
  '/admin/laboratory': ['admin'],
  '/admin/reports': ['admin'],
  '/admin/settings': ['admin'],
  '/admin/audit-logs': ['admin'],
  '/admin/*': ['admin']
};

/**
 * Check if user has specific role
 */
export const hasRole = (user, role) => {
  if (!user || !user.role) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.role || !Array.isArray(roles)) return false;
  return roles.includes(user.role);
};

/**
 * Check if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  
  // Admin wildcard check
  if (permissions.includes('*')) return true;
  
  return permissions.includes(permission);
};

/**
 * Check if user can access route
 */
export const canAccessRoute = (user, route) => {
  if (!user || !user.role) return false;
  
  // Check exact route match first
  if (ROUTE_ACCESS_MATRIX[route]) {
    return ROUTE_ACCESS_MATRIX[route].includes(user.role);
  }
  
  // Check wildcard routes
  const matchingPattern = Object.keys(ROUTE_ACCESS_MATRIX).find(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(route);
    }
    return false;
  });
  
  if (matchingPattern) {
    return ROUTE_ACCESS_MATRIX[matchingPattern].includes(user.role);
  }
  
  // Default: admin can access everything
  return user.role === 'admin';
};

/**
 * Get user's role level (for hierarchy comparison)
 */
export const getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

/**
 * Check if user role is higher than specified role
 */
export const isRoleHigherThan = (userRole, compareRole) => {
  return getRoleLevel(userRole) > getRoleLevel(compareRole);
};

/**
 * Check if user is admin
 */
export const isAdmin = (user) => {
  return user && user.role === 'admin';
};

/**
 * Check if user is healthcare provider
 */
export const isHealthcareProvider = (user) => {
  return user && ['doctor', 'pharmacy', 'lab'].includes(user.role);
};

/**
 * Get allowed routes for user role
 */
export const getAllowedRoutes = (role) => {
  return Object.entries(ROUTE_ACCESS_MATRIX)
    .filter(([_, allowedRoles]) => allowedRoles.includes(role))
    .map(([route]) => route);
};

/**
 * Get user permissions list
 */
export const getUserPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    admin: 'Administrator',
    doctor: 'Doctor',
    patient: 'Patient',
    pharmacy: 'Pharmacy',
    lab: 'Laboratory'
  };
  return displayNames[role] || role;
};

/**
 * Get role color (for UI badges)
 */
export const getRoleColor = (role) => {
  const colors = {
    admin: '#dc3545',
    doctor: '#4a90e2',
    patient: '#28a745',
    pharmacy: '#ffc107',
    lab: '#17a2b8'
  };
  return colors[role] || '#6c757d';
};

/**
 * Validate user access with detailed error
 */
export const validateAccess = (user, requiredRole, requiredPermission = null) => {
  if (!user) {
    return {
      allowed: false,
      reason: 'NOT_AUTHENTICATED',
      message: 'Authentication required'
    };
  }
  
  if (requiredRole && !hasAnyRole(user, Array.isArray(requiredRole) ? requiredRole : [requiredRole])) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_ROLE',
      message: `This resource requires ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role`
    };
  }
  
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_PERMISSION',
      message: `You don't have permission: ${requiredPermission}`
    };
  }
  
  return {
    allowed: true,
    reason: null,
    message: null
  };
};

export default {
  hasRole,
  hasAnyRole,
  hasPermission,
  canAccessRoute,
  getRoleLevel,
  isRoleHigherThan,
  isAdmin,
  isHealthcareProvider,
  getAllowedRoutes,
  getUserPermissions,
  getRoleDisplayName,
  getRoleColor,
  validateAccess,
  ROUTE_ACCESS_MATRIX,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY
};
