// Module 12 - Security, Compliance, and Audit Trail
// Main exports for security and compliance services and components

// Services
export { encryptionService } from './services/encryptionService';
export { auditService } from './services/auditService';
export { rolePermissionService } from './services/rolePermissionService';
export { threatDetectionService } from './services/threatDetectionService';
export { complianceService } from './services/complianceService';

// Pages
export { default as SecurityDashboard } from './pages/SecurityDashboard/SecurityDashboard';
export { default as AuditLogs } from './pages/AuditLogs/AuditLogs';
export { default as SecurityCompliance } from './pages/SecurityCompliance/SecurityCompliance';
export { default as SecuritySettings } from './pages/SecuritySettings/SecuritySettings';
export { default as UserSecurityProfiles } from './pages/UserSecurityProfiles/UserSecurityProfiles';
export { default as SecurityVulnerabilities } from './pages/SecurityVulnerabilities/SecurityVulnerabilities';

// Components
export { default as AuditLogTable } from './components/AuditLogTable';
export { default as AuditDashboard } from './components/AuditDashboard';
export { default as ComplianceReport } from './components/ComplianceReport';
export { default as ViolationsList } from './components/ViolationsList';
export { default as ThreatDetection } from './components/ThreatDetection';
export { default as ThreatAlert } from './components/ThreatAlert';
export { default as TwoFactorAuth } from './components/TwoFactorAuth';
