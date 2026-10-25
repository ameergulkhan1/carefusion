import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import './EnhancedUserManagement.css';

const EnhancedUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await adminService.getUsers();
        const usersList = Array.isArray(response?.data) ? response.data : 
                         response?.users ? response.users : [];
        setUsers(usersList);
        setError(null);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, filterRole, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      
      setUsers(users.map(user =>
        user._id === userId || user.id === userId
          ? { ...user, status: newStatus }
          : user
      ));

      setSuccess(`User status updated to ${newStatus}`);
      setTimeout(() => setSuccess(null), 3000);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to update user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    try {
      await adminService.toggleUserBlock(userId, isBlocked);
      
      setUsers(users.map(user =>
        user._id === userId || user.id === userId
          ? { ...user, isBlocked }
          : user
      ));

      setSuccess(isBlocked ? 'User blocked successfully' : 'User unblocked successfully');
      setTimeout(() => setSuccess(null), 3000);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to block user:', err);
      setError('Failed to block user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminService.deleteUser(userId);
        
        setUsers(users.filter(user => user._id !== userId && user.id !== userId));
        setSuccess('User deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
        setShowModal(false);
      } catch (err) {
        console.error('Failed to delete user:', err);
        setError('Failed to delete user');
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge-active';
      case 'inactive':
        return 'badge-inactive';
      case 'pending':
        return 'badge-pending';
      default:
        return 'badge-default';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-admin';
      case 'doctor':
        return 'badge-doctor';
      case 'patient':
        return 'badge-patient';
      case 'pharmacy':
        return 'badge-pharmacy';
      case 'lab':
        return 'badge-lab';
      default:
        return 'badge-default';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="user-management-container">
      <div className="management-header">
        <h2>User Management</h2>
        <button className="btn-add-user">+ Add New User</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Search by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="lab">Laboratory</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user._id || user.id} className={user.isBlocked ? 'blocked' : ''}>
                    <td>
                      <div className="user-name">
                        <div className="avatar">{user.name?.charAt(0)}</div>
                        <span>{user.name || user.fullName}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                        {user.status}
                      </span>
                      {user.isBlocked && <span className="badge badge-blocked">BLOCKED</span>}
                    </td>
                    <td>{formatDate(user.createdAt || user.joinedDate)}</td>
                    <td>
                      <div className="actions-menu">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setModalAction('details');
                            setShowModal(true);
                          }}
                          className="btn-action btn-view"
                          title="View details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setModalAction('edit');
                            setShowModal(true);
                          }}
                          className="btn-action btn-edit"
                          title="Edit user"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setModalAction('block');
                            setShowModal(true);
                          }}
                          className="btn-action btn-block"
                          title={user.isBlocked ? 'Unblock user' : 'Block user'}
                        >
                          🚫
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setModalAction('delete');
                            setShowModal(true);
                          }}
                          className="btn-action btn-delete"
                          title="Delete user"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="page-btn"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => setShowModal(false)}
              className="close-btn"
            >
              ✕
            </button>

            {modalAction === 'details' && (
              <>
                <h3>User Details</h3>
                <div className="user-details">
                  <p><strong>Name:</strong> {selectedUser.name || selectedUser.fullName}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <p><strong>Status:</strong> {selectedUser.status}</p>
                  <p><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</p>
                  {selectedUser.phone && <p><strong>Phone:</strong> {selectedUser.phone}</p>}
                  {selectedUser.specialty && <p><strong>Specialty:</strong> {selectedUser.specialty}</p>}
                  <p><strong>Blocked:</strong> {selectedUser.isBlocked ? 'Yes' : 'No'}</p>
                </div>
              </>
            )}

            {modalAction === 'block' && (
              <>
                <h3>{selectedUser.isBlocked ? 'Unblock User?' : 'Block User?'}</h3>
                <p>
                  {selectedUser.isBlocked
                    ? 'This user will be able to access the platform again.'
                    : 'This user will not be able to access the platform.'}
                </p>
                <div className="modal-actions">
                  <button
                    onClick={() => handleBlockUser(selectedUser._id || selectedUser.id, !selectedUser.isBlocked)}
                    className="btn-primary"
                  >
                    {selectedUser.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalAction === 'delete' && (
              <>
                <h3>Delete User?</h3>
                <p className="warning">
                  ⚠️ This action cannot be undone. All user data will be permanently deleted.
                </p>
                <div className="modal-actions">
                  <button
                    onClick={() => handleDeleteUser(selectedUser._id || selectedUser.id)}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUserManagement;
