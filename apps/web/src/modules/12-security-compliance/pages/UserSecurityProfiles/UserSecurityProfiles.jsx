import React, { useState, useEffect } from 'react';
import './UserSecurityProfiles.css';
import { useApi } from '../../../../hooks/useApi';

const UserSecurityProfiles = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { request } = useApi();

  // Test users data with security profiles
  const testUsersData = [
    {
      id: '1',
      name: 'Ahmad Malik',
      email: 'ahmad@pharmacy.com',
      role: 'Pharmacy Manager',
      organization: 'Ahmad Medical Store',
      status: 'Active',
      badge: '🏪 Pharmacy',
      securityLevel: 'Professional',
      twoFAEnabled: true,
      ipWhitelist: ['192.168.1.100'],
      lastLogin: '2026-04-02T14:05:00Z',
      loginAttempts: 3,
      sessionTimeout: 30,
      passwordLastChanged: '2026-03-15T10:30:00Z',
      passwordPolicy: 'Strong (12+ chars, mixed)',
      encryptionLevel: 'AES-256',
      auditLogsRetention: '90 days',
      apiKeyRotation: '30 days',
      mfaMethods: ['Authenticator App', 'Email OTP'],
      dataAccessLevel: 'Pharmacy Data Only',
    },
    {
      id: '2',
      name: 'Moiz Ahmed',
      email: 'moiz@pharmacy.com',
      role: 'Pharmacy Manager',
      organization: 'Moiz Medicine Center',
      status: 'Active',
      badge: '🏪 Pharmacy',
      securityLevel: 'Professional',
      twoFAEnabled: true,
      ipWhitelist: ['192.168.1.101'],
      lastLogin: '2026-04-02T14:02:15Z',
      loginAttempts: 2,
      sessionTimeout: 30,
      passwordLastChanged: '2026-03-18T08:45:00Z',
      passwordPolicy: 'Strong (12+ chars, mixed)',
      encryptionLevel: 'AES-256',
      auditLogsRetention: '90 days',
      apiKeyRotation: '30 days',
      mfaMethods: ['Authenticator App', 'Email OTP'],
      dataAccessLevel: 'Pharmacy Data Only',
    },
    {
      id: '3',
      name: 'Orangzaib Khan',
      email: 'orangzaib@lab.com',
      role: 'Lab Director',
      organization: 'Orangzaib Diagnostic Lab',
      status: 'Active',
      badge: '🔬 Laboratory',
      securityLevel: 'Professional',
      twoFAEnabled: true,
      ipWhitelist: ['192.168.1.102'],
      lastLogin: '2026-04-02T13:58:22Z',
      loginAttempts: 2,
      sessionTimeout: 30,
      passwordLastChanged: '2026-03-20T11:15:00Z',
      passwordPolicy: 'Strong (12+ chars, mixed)',
      encryptionLevel: 'AES-256',
      auditLogsRetention: '90 days (HIPAA Compliant)',
      apiKeyRotation: '30 days',
      mfaMethods: ['Authenticator App', 'Email OTP'],
      dataAccessLevel: 'Lab & Patient Test Data',
    },
    {
      id: '4',
      name: 'Huzaifa Ahmed',
      email: 'huzaifa@lab.com',
      role: 'Lab Director',
      organization: 'Huzaifa Medical Lab',
      status: 'Active',
      badge: '🔬 Laboratory',
      securityLevel: 'Professional',
      twoFAEnabled: true,
      ipWhitelist: ['192.168.1.103'],
      lastLogin: '2026-04-02T14:00:45Z',
      loginAttempts: 3,
      sessionTimeout: 30,
      passwordLastChanged: '2026-03-22T09:30:00Z',
      passwordPolicy: 'Strong (12+ chars, mixed)',
      encryptionLevel: 'AES-256',
      auditLogsRetention: '90 days (HIPAA Compliant)',
      apiKeyRotation: '30 days',
      mfaMethods: ['Authenticator App', 'Email OTP'],
      dataAccessLevel: 'Lab & Patient Test Data',
    },
  ];

  useEffect(() => {
    setUsers(testUsersData);
    setLoading(false);
  }, []);

  const getSecurityScore = (user) => {
    let score = 0;
    if (user.twoFAEnabled) score += 25;
    if (user.ipWhitelist?.length > 0) score += 20;
    if (user.passwordPolicy.includes('Strong')) score += 20;
    if (user.encryptionLevel.includes('256')) score += 20;
    if (user.mfaMethods?.length > 1) score += 15;
    return Math.min(score, 100);
  };

  const getSecurityStatus = (score) => {
    if (score >= 90) return { status: '✅ Excellent', color: '#10b981' };
    if (score >= 75) return { status: '✅ Good', color: '#3b82f6' };
    if (score >= 60) return { status: '⚠️ Fair', color: '#f59e0b' };
    return { status: '❌ Poor', color: '#ef4444' };
  };

  if (loading) return <div className="security-loading">Loading security profiles...</div>;

  return (
    <div className="user-security-profiles">
      <div className="page-header">
        <h1>🔐 User Security Profiles</h1>
        <p>Professional Security & Compliance Monitoring for Test Users</p>
      </div>

      <div className="profiles-container">
        <div className="profiles-grid">
          {users.map((user) => {
            const securityScore = getSecurityScore(user);
            const securityStatus = getSecurityStatus(securityScore);

            return (
              <div
                key={user.id}
                className={`profile-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="profile-header">
                  <div className="profile-badge">{user.badge}</div>
                  <div className="profile-status">
                    <span className="status-badge" style={{ backgroundColor: '#10b981' }}>
                      {user.status}
                    </span>
                  </div>
                </div>

                <div className="profile-info">
                  <h3>{user.name}</h3>
                  <p className="email">{user.email}</p>
                  <p className="role">{user.role}</p>
                  <p className="org">{user.organization}</p>
                </div>

                <div className="security-score">
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${securityScore}%`,
                        backgroundColor: securityStatus.color,
                      }}
                    />
                  </div>
                  <div className="score-text">
                    <span className="score-number">{securityScore}/100</span>
                    <span className="score-label" style={{ color: securityStatus.color }}>
                      {securityStatus.status}
                    </span>
                  </div>
                </div>

                <div className="quick-stats">
                  <div className="stat">
                    <span className="stat-icon">🔒</span>
                    <span className="stat-label">2FA</span>
                    <span className="stat-value">{user.twoFAEnabled ? '✅' : '❌'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">🌐</span>
                    <span className="stat-label">IP Whitelist</span>
                    <span className="stat-value">{user.ipWhitelist?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-label">Session</span>
                    <span className="stat-value">{user.sessionTimeout}m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedUser && (
          <div className="profile-details">
            <div className="details-header">
              <h2>{selectedUser.name} - Full Security Profile</h2>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>
                ✕
              </button>
            </div>

            <div className="details-content">
              <div className="detail-section">
                <h3>📋 User Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <span>{selectedUser.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Role</label>
                    <span>{selectedUser.role}</span>
                  </div>
                  <div className="detail-item">
                    <label>Organization</label>
                    <span>{selectedUser.organization}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>🔐 Security Configuration</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Two-Factor Authentication</label>
                    <span className="status-active">✅ Enabled</span>
                  </div>
                  <div className="detail-item">
                    <label>MFA Methods</label>
                    <span>{selectedUser.mfaMethods.join(', ')}</span>
                  </div>
                  <div className="detail-item">
                    <label>Encryption Standard</label>
                    <span className="encryption">{selectedUser.encryptionLevel}</span>
                  </div>
                  <div className="detail-item">
                    <label>Session Timeout</label>
                    <span>{selectedUser.sessionTimeout} minutes</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>🛡️ Access Control</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Data Access Level</label>
                    <span className="access-level">{selectedUser.dataAccessLevel}</span>
                  </div>
                  <div className="detail-item">
                    <label>IP Whitelist</label>
                    <div className="ip-list">
                      {selectedUser.ipWhitelist?.map((ip, i) => (
                        <span key={i} className="ip-badge">
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>📊 Password & Compliance</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Password Policy</label>
                    <span className="policy-badge">{selectedUser.passwordPolicy}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Password Change</label>
                    <span>{new Date(selectedUser.passwordLastChanged).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Audit Logs Retention</label>
                    <span className="retention">{selectedUser.auditLogsRetention}</span>
                  </div>
                  <div className="detail-item">
                    <label>API Key Rotation</label>
                    <span>{selectedUser.apiKeyRotation}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>📍 Login Activity</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Last Login</label>
                    <span>{new Date(selectedUser.lastLogin).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Login Attempts (24h)</label>
                    <span className="login-attempts">{selectedUser.loginAttempts}</span>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-primary">🔑 Rotate API Key</button>
                <button className="btn btn-secondary">🔍 View Audit Logs</button>
                <button className="btn btn-secondary">📋 Generate Security Report</button>
                <button className="btn btn-danger">🔒 Force Password Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSecurityProfiles;
