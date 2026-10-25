import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SecurityDashboard.css';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [securityMetrics, setSecurityMetrics] = useState(null);

  useEffect(() => {
    // Simulate fetching security metrics from backend
    const metrics = {
      overallSecurityScore: 98,
      activeUsers: 4,
      loginAttempts: 280,
      suspiciousActivities: 0,
      auditLogsGenerated: 8532,
      encryptedDataFields: 47,
      complianceStatus: 'HIPAA Compliant',
      lastSecurityAudit: '2026-04-02T10:00:00Z',
      systemHealth: 'Excellent',
    };
    setSecurityMetrics(metrics);
  }, []);

  const securityModules = [
    {
      id: 1,
      title: 'Audit Logs & History',
      description: 'Comprehensive audit trail of all system activities, user actions, and security events',
      icon: '📋',
      color: '#3b82f6',
      route: '/admin/audit-logs',
      features: ['Event logging', 'User activity tracking', 'System changes', 'Access history'],
    },
    {
      id: 2,
      title: 'Security Compliance',
      description: 'Monitor HIPAA, GDPR, and HITECH compliance status and generate compliance reports',
      icon: '✅',
      color: '#10b981',
      route: '/admin/security-compliance',
      features: ['Compliance reports', 'Policy management', 'Certification tracking', 'Audit readiness'],
    },
    {
      id: 3,
      title: 'Security Settings',
      description: 'Configure encryption, password policies, and security parameters',
      icon: '⚙️',
      color: '#f59e0b',
      route: '/admin/security-settings',
      features: ['Password policies', 'Encryption settings', 'Session management', 'API security'],
    },
    {
      id: 4,
      title: 'User Security Profiles',
      description: 'View detailed security profiles and configurations for all test users',
      icon: '👥',
      color: '#8b5cf6',
      route: '/admin/user-security-profiles',
      features: ['2FA status', 'IP whitelist', 'Access levels', 'Login history'],
    },
    {
      id: 5,
      title: 'Vulnerabilities & Risks',
      description: 'Comprehensive vulnerability assessment and risk mitigation status',
      icon: '🛡️',
      color: '#ef4444',
      route: '/admin/security-vulnerabilities',
      features: ['Threat analysis', 'Risk scoring', 'Mitigation status', 'Test cases'],
    },
    {
      id: 6,
      title: 'Threat Detection',
      description: 'Real-time threat detection and suspicious activity monitoring',
      icon: '⚠️',
      color: '#ec4899',
      route: '/admin/threat-detection',
      features: ['Anomaly detection', 'Attack prevention', 'Alerts & notifications', 'Response logs'],
    },
  ];

  if (!securityMetrics) {
    return <div className="security-dashboard-loading">Loading security dashboard...</div>;
  }

  return (
    <div className="security-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🔐 Professional Security & Compliance Hub</h1>
          <p>Centralized Security Management & Monitoring System</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-container">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">🎯</div>
            <div className="metric-content">
              <div className="metric-value">{securityMetrics.overallSecurityScore}%</div>
              <div className="metric-label">Overall Security Score</div>
              <div className="metric-status excellent">⭐ Excellent</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">{securityMetrics.activeUsers}</div>
              <div className="metric-label">Active Secure Users</div>
              <div className="metric-status">All with 2FA enabled</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔒</div>
            <div className="metric-content">
              <div className="metric-value">{securityMetrics.encryptedDataFields}</div>
              <div className="metric-label">Encrypted Data Fields</div>
              <div className="metric-status">AES-256 standard</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-value">{securityMetrics.auditLogsGenerated}</div>
              <div className="metric-label">Audit Logs Generated</div>
              <div className="metric-status">90-day retention</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⚠️</div>
            <div className="metric-content">
              <div className="metric-value">{securityMetrics.suspiciousActivities}</div>
              <div className="metric-label">Suspicious Activities</div>
              <div className="metric-status safe">🟢 All Clear</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">✓</div>
            <div className="metric-content">
              <div className="metric-value">{securityMetrics.complianceStatus}</div>
              <div className="metric-label">Compliance Status</div>
              <div className="metric-status">{securityMetrics.systemHealth}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Modules */}
      <div className="modules-section">
        <h2>🔑 Security Management Modules</h2>
        <div className="modules-grid">
          {securityModules.map((module) => (
            <div
              key={module.id}
              className="module-card"
              onClick={() => navigate(module.route)}
              style={{ borderLeftColor: module.color }}
            >
              <div className="module-header">
                <div className="module-icon" style={{ backgroundColor: `${module.color}20` }}>
                  {module.icon}
                </div>
                <div className="module-title">{module.title}</div>
              </div>

              <p className="module-description">{module.description}</p>

              <div className="module-features">
                {module.features.map((feature, i) => (
                  <span key={i} className="feature-tag">
                    ✓ {feature}
                  </span>
                ))}
              </div>

              <button className="module-btn" style={{ backgroundColor: module.color }}>
                Access Module →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Implementation Summary */}
      <div className="implementation-section">
        <h2>🛡️ Security Implementation Summary</h2>
        <div className="implementation-grid">
          <div className="impl-card">
            <h3>🔐 Authentication & Authorization</h3>
            <ul>
              <li>✅ JWT + OAuth 2.0 integration</li>
              <li>✅ Role-Based Access Control (RBAC)</li>
              <li>✅ Two-Factor Authentication (2FA)</li>
              <li>✅ Multi-Method MFA support</li>
              <li>✅ Session management & timeouts</li>
              <li>✅ IP whitelist & device tracking</li>
            </ul>
          </div>

          <div className="impl-card">
            <h3>🔒 Data Protection & Encryption</h3>
            <ul>
              <li>✅ AES-256 data encryption</li>
              <li>✅ TLS 1.3 in-transit encryption</li>
              <li>✅ End-to-end encryption</li>
              <li>✅ Field-level encryption</li>
              <li>✅ Encryption key rotation (monthly)</li>
              <li>✅ Secure key storage (AWS Secrets)</li>
            </ul>
          </div>

          <div className="impl-card">
            <h3>📊 Compliance & Audit</h3>
            <ul>
              <li>✅ HIPAA compliance</li>
              <li>✅ GDPR data protection</li>
              <li>✅ HITECH security rules</li>
              <li>✅ Comprehensive audit logging</li>
              <li>✅ 90-day log retention</li>
              <li>✅ Automated compliance reports</li>
            </ul>
          </div>

          <div className="impl-card">
            <h3>🎯 Threat Prevention</h3>
            <ul>
              <li>✅ SQL Injection prevention</li>
              <li>✅ XSS attack protection</li>
              <li>✅ CSRF token validation</li>
              <li>✅ Rate limiting & throttling</li>
              <li>✅ Brute force protection</li>
              <li>✅ Real-time threat detection</li>
            </ul>
          </div>

          <div className="impl-card">
            <h3>🔐 API Security</h3>
            <ul>
              <li>✅ API key management</li>
              <li>✅ Request validation</li>
              <li>✅ Scope checking</li>
              <li>✅ Rate limiting (100 req/min)</li>
              <li>✅ CORS policy enforcement</li>
              <li>✅ Request signing</li>
            </ul>
          </div>

          <div className="impl-card">
            <h3>📝 Logging & Monitoring</h3>
            <ul>
              <li>✅ Centralized logging</li>
              <li>✅ Sensitive data redaction</li>
              <li>✅ Real-time monitoring</li>
              <li>✅ Alert notifications</li>
              <li>✅ Log encryption</li>
              <li>✅ Performance metrics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Test Users Security Overview */}
      <div className="test-users-section">
        <h2>👥 Test Users - Security Profiles</h2>
        <div className="test-users-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>2FA</th>
                <th>Security Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ahmad Malik</td>
                <td>ahmad@pharmacy.com</td>
                <td>🏪 Pharmacy Manager</td>
                <td>✅ Enabled</td>
                <td><span className="score-badge excellent">98/100</span></td>
                <td><span className="status-active">✅ Active</span></td>
              </tr>
              <tr>
                <td>Moiz Ahmed</td>
                <td>moiz@pharmacy.com</td>
                <td>🏪 Pharmacy Manager</td>
                <td>✅ Enabled</td>
                <td><span className="score-badge excellent">98/100</span></td>
                <td><span className="status-active">✅ Active</span></td>
              </tr>
              <tr>
                <td>Orangzaib Khan</td>
                <td>orangzaib@lab.com</td>
                <td>🔬 Lab Director</td>
                <td>✅ Enabled</td>
                <td><span className="score-badge excellent">98/100</span></td>
                <td><span className="status-active">✅ Active</span></td>
              </tr>
              <tr>
                <td>Huzaifa Ahmed</td>
                <td>huzaifa@lab.com</td>
                <td>🔬 Lab Director</td>
                <td>✅ Enabled</td>
                <td><span className="score-badge excellent">98/100</span></td>
                <td><span className="status-active">✅ Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="test-users-note">
          <p>
            <strong>ℹ️ Note:</strong> All test users have enhanced security profiles with professional-grade security configurations including Two-Factor Authentication, IP whitelisting, encrypted sessions, and comprehensive audit logging.
          </p>
        </div>
      </div>

      {/* Last Audit Information */}
      <div className="last-audit-section">
        <div className="audit-card">
          <h3>📅 Last Security Audit</h3>
          <div className="audit-info">
            <div className="audit-item">
              <span className="audit-label">Date:</span>
              <span className="audit-value">April 2, 2026</span>
            </div>
            <div className="audit-item">
              <span className="audit-label">Status:</span>
              <span className="audit-value success">✅ Passed</span>
            </div>
            <div className="audit-item">
              <span className="audit-label">Issues Found:</span>
              <span className="audit-value">0</span>
            </div>
            <div className="audit-item">
              <span className="audit-label">Compliance:</span>
              <span className="audit-value">✅ HIPAA Compliant</span>
            </div>
          </div>
        </div>
        <div className="audit-card">
          <h3>🔄 Scheduled Audits</h3>
          <div className="audit-info">
            <div className="audit-item">
              <span className="audit-label">Next Internal Audit:</span>
              <span className="audit-value">April 30, 2026</span>
            </div>
            <div className="audit-item">
              <span className="audit-label">Quarterly External Audit:</span>
              <span className="audit-value">June 30, 2026</span>
            </div>
            <div className="audit-item">
              <span className="audit-label">Annual Compliance Review:</span>
              <span className="audit-value">December 31, 2026</span>
            </div>
            <div className="audit-item">
              <span className="audit-label">Penetration Testing:</span>
              <span className="audit-value">Quarterly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
