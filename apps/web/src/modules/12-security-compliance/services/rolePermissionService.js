import api from '../../../utils/api';

/**
 * Role and Permission Management Service
 * Handles role-based access control (RBAC)
 */
export const rolePermissionService = {
  /**
   * Get all roles
   * @returns {Promise} - List of roles
   */
  getAllRoles: async () => {
    try {
      const response = await api.get('/security/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  /**
   * Create new role
   * @param {object} roleData - Role details
   * @returns {Promise} - Created role
   */
  createRole: async (roleData) => {
    try {
      const response = await api.post('/security/roles', {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        status: roleData.status || 'active'
      });
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  /**
   * Update role
   * @param {string} roleId - Role ID
   * @param {object} updateData - Updated role data
   * @returns {Promise} - Updated role
   */
  updateRole: async (roleId, updateData) => {
    try {
      const response = await api.put(`/security/roles/${roleId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  /**
   * Delete role
   * @param {string} roleId - Role ID
   * @returns {Promise} - Delete confirmation
   */
  deleteRole: async (roleId) => {
    try {
      const response = await api.delete(`/security/roles/${roleId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },

  /**
   * Get role with permissions
   * @param {string} roleId - Role ID
   * @returns {Promise} - Role with permissions
   */
  getRoleWithPermissions: async (roleId) => {
    try {
      const response = await api.get(`/security/roles/${roleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  },

  /**
   * Get all permissions
   * @returns {Promise} - List of permissions
   */
  getAllPermissions: async () => {
    try {
      const response = await api.get('/security/permissions');
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Promise} - Assignment confirmation
   */
  assignRoleToUser: async (userId, roleId) => {
    try {
      const response = await api.post(`/security/users/${userId}/roles`, {
        roleId
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  /**
   * Remove role from user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Promise} - Removal confirmation
   */
  removeRoleFromUser: async (userId, roleId) => {
    try {
      const response = await api.delete(`/security/users/${userId}/roles/${roleId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  },

  /**
   * Get user roles
   * @param {string} userId - User ID
   * @returns {Promise} - User roles
   */
  getUserRoles: async (userId) => {
    try {
      const response = await api.get(`/security/users/${userId}/roles`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  },

  /**
   * Get user permissions
   * @param {string} userId - User ID
   * @returns {Promise} - User permissions
   */
  getUserPermissions: async (userId) => {
    try {
      const response = await api.get(`/security/users/${userId}/permissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  },

  /**
   * Check if user has permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission name
   * @returns {Promise} - Boolean result
   */
  checkUserPermission: async (userId, permission) => {
    try {
      const response = await api.post(`/security/users/${userId}/check-permission`, {
        permission
      });
      return response.data.hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },

  /**
   * Add permission to role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @returns {Promise} - Updated role
   */
  addPermissionToRole: async (roleId, permissionId) => {
    try {
      const response = await api.post(`/security/roles/${roleId}/permissions`, {
        permissionId
      });
      return response.data;
    } catch (error) {
      console.error('Error adding permission to role:', error);
      throw error;
    }
  },

  /**
   * Remove permission from role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @returns {Promise} - Updated role
   */
  removePermissionFromRole: async (roleId, permissionId) => {
    try {
      const response = await api.delete(
        `/security/roles/${roleId}/permissions/${permissionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error removing permission from role:', error);
      throw error;
    }
  },

  /**
   * Create custom permission
   * @param {object} permissionData - Permission details
   * @returns {Promise} - Created permission
   */
  createPermission: async (permissionData) => {
    try {
      const response = await api.post('/security/permissions', {
        name: permissionData.name,
        description: permissionData.description,
        category: permissionData.category
      });
      return response.data;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  }
};

export default rolePermissionService;
