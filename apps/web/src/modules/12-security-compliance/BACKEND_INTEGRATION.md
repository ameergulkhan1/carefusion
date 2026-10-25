# Module 12: Security, Compliance, and Audit Trail - Backend Integration Guide

## Overview
Module 12 provides comprehensive security, compliance monitoring, audit trail management, role-based access control (RBAC), encryption utilities, and threat detection for healthcare compliance with HIPAA, GDPR, and HITECH Act.

## API Base URL
```
Base: /api/security
Version: v1
Authentication: Required (JWT Bearer Token)
Authorization: Compliance/Security roles required for sensitive endpoints
```

## Core Endpoints

### 1. AUDIT LOGS & TRAIL

#### Get Audit Logs with Filters
```http
GET /security/audit-logs?startDate={date}&endDate={date}&userId={userId}&action={action}&limit=50
Authorization: Bearer {token}

Query Parameters:
- startDate: ISO date (required, or default: 30 days ago)
- endDate: ISO date (required, or default: today)
- userId: Filter by user UUID (optional)
- action: LOGIN, LOGOUT, CREATE, READ, UPDATE, DELETE, EXPORT (optional)
- resourceType: patient, record, prescription, etc. (optional)
- status: success, failure, partial (optional)
- limit: Items per page (default: 50, max: 500)
- offset: Pagination offset (default: 0)
- sort: timestamp (desc/asc)

Response (200):
{
  "logs": [
    {
      "logId": "log_uuid",
      "timestamp": "2026-04-02T10:30:00Z",
      "userId": "user_uuid",
      "userName": "Dr. Smith",
      "userRole": "doctor",
      "ipAddress": "192.168.1.100",
      "action": "READ",
      "resourceType": "patient_record",
      "resourceId": "patient_uuid",
      "resourceName": "John Doe - Medical Record",
      "status": "success",
      "details": {
        "recordsAccessed": ["clinical_notes", "lab_results"],
        "downloadedFiles": ["report.pdf"],
        "duration": 1250
      },
      "changes": {
        "before": null,
        "after": null
      },
      "consentRequired": true,
      "consentObtained": true,
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "pagination": {
    "totalLogs": 45230,
    "currentPage": 1,
    "totalPages": 905,
    "itemsPerPage": 50
  },
  "summary": {
    "totalLogsInPeriod": 45230,
    "actionBreakdown": {
      "READ": 25000,
      "CREATE": 10000,
      "UPDATE": 8000,
      "DELETE": 1200,
      "LOGIN": 1030
    },
    "statusBreakdown": {
      "success": 44500,
      "failure": 730
    }
  }
}

Error Codes:
- 400: Invalid date range or filters
- 401: Unauthorized
- 403: Insufficient permissions
- 404: No logs found
```

#### Get Resource Audit Trail
```http
GET /security/audit-logs/resource/{resourceType}/{resourceId}
Authorization: Bearer {token}

Path Parameters:
- resourceType: patient, record, prescription, etc.
- resourceId: UUID of the resource

Response (200):
{
  "resource": {
    "resourceType": "patient_record",
    "resourceId": "patient_uuid",
    "resourceName": "John Doe - Medical Record"
  },
  "auditTrail": [
    {
      "logId": "log_uuid",
      "timestamp": "2026-04-02T10:30:00Z",
      "action": "CREATE",
      "performedBy": "Dr. Smith",
      "changes": {
        "before": null,
        "after": {
          "diagnosis": "Hypertension",
          "treatment": "ACE Inhibitors"
        }
      },
      "status": "success"
    },
    {
      "logId": "log_uuid2",
      "timestamp": "2026-04-01T14:20:00Z",
      "action": "UPDATE",
      "performedBy": "Dr. Johnson",
      "changes": {
        "before": {"treatment": "Diuretics"},
        "after": {"treatment": "ACE Inhibitors"}
      },
      "status": "success"
    }
  ],
  "totalChanges": 5
}
```

#### Get User Activity History
```http
GET /security/audit-logs/user/{userId}?startDate={date}&endDate={date}&limit=100
Authorization: Bearer {token}

Path Parameters:
- userId: User UUID (required)

Query Parameters:
- startDate: ISO date
- endDate: ISO date
- actionType: LOGIN, CREATE, READ, UPDATE, DELETE
- limit: Items per page (default: 100, max: 500)

Response (200):
{
  "user": {
    "userId": "user_uuid",
    "name": "Dr. Smith",
    "role": "doctor",
    "email": "dr.smith@example.com"
  },
  "activityHistory": [
    {
      "logId": "log_uuid",
      "timestamp": "2026-04-02T10:30:00Z",
      "action": "READ",
      "resourceType": "patient_record",
      "resourceId": "patient_uuid",
      "status": "success",
      "ipAddress": "192.168.1.100"
    }
  ],
  "summary": {
    "totalActions": 342,
    "loginCount": 23,
    "recordsAccessed": 145,
    "recordsCreated": 8,
    "lastLogin": "2026-04-02T10:30:00Z",
    "firstLogin": "2025-12-15T08:00:00Z"
  }
}
```

#### Log User Action
```http
POST /security/audit-logs
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "userId": "user_uuid",
  "action": "READ",
  "resourceType": "patient_record",
  "resourceId": "patient_uuid",
  "details": {
    "recordsAccessed": ["clinical_notes"],
    "purpose": "Patient consultation"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "status": "success"
}

Response (201):
{
  "logId": "log_uuid",
  "timestamp": "2026-04-02T10:35:00Z",
  "userId": "user_uuid",
  "action": "READ",
  "resourceType": "patient_record",
  "status": "success"
}
```

#### Get Data Access Logs
```http
GET /security/audit-logs/data-access
Authorization: Bearer {token}

Query Parameters:
- startDate: ISO date
- endDate: ISO date
- dataClassification: public, protected, confidential, restricted
- accessType: read, download, export, share
- limit: Default 100

Response (200):
{
  "dataAccessLogs": [
    {
      "logId": "log_uuid",
      "timestamp": "2026-04-02T10:30:00Z",
      "user": {
        "userId": "user_uuid",
        "name": "Dr. Smith",
        "role": "doctor"
      },
      "dataAccessed": {
        "type": "patient_record",
        "classification": "confidential",
        "patientName": "John Doe"
      },
      "accessType": "read",
      "duration": 120,
      "ipAddress": "192.168.1.100",
      "consentVerified": true,
      "purpose": "Patient consultation"
    }
  ],
  "summary": {
    "totalAccess": 234,
    "confidentialDataAccess": 156,
    "restrictedDataAccess": 45
  }
}
```

#### Get Suspicious Activities
```http
GET /security/audit-logs/suspicious-activities?severity=high&status=unresolved
Authorization: Bearer {token}

Query Parameters:
- severity: low, medium, high, critical
- status: detected, investigating, resolved, false-alarm
- activityType: brute_force, unauthorized_access, data_breach, etc.
- limit: Default 50

Response (200):
{
  "suspiciousActivities": [
    {
      "activityId": "activity_uuid",
      "timestamp": "2026-04-02T10:30:00Z",
      "severity": "high",
      "type": "BRUTE_FORCE_ATTACK",
      "description": "Multiple failed login attempts detected",
      "userId": "user_uuid",
      "userName": "user@example.com",
      "ipAddress": "192.168.1.100",
      "attemptCount": 15,
      "timeWindow": 300,
      "status": "detected",
      "detectedAt": "2026-04-02T10:30:45Z",
      "automatedAction": "account_locked",
      "recommendedAction": "Manual review required"
    }
  ],
  "summary": {
    "criticalActivities": 1,
    "highSeverity": 5,
    "mediumSeverity": 12,
    "unresolvedCount": 8
  }
}
```

### 2. COMPLIANCE MANAGEMENT

#### Get Compliance Status
```http
GET /security/compliance/status
Authorization: Bearer {token}

Response (200):
{
  "complianceStatus": {
    "overallStatus": "compliant",
    "complianceScore": "94.5%",
    "lastAuditDate": "2026-03-15T10:00:00Z",
    "nextAuditDate": "2026-06-15T10:00:00Z",
    "certifications": ["HIPAA", "GDPR", "HITECH"]
  },
  "standards": {
    "HIPAA": {
      "status": "compliant",
      "score": "95%",
      "violations": 2,
      "criticalViolations": 0,
      "lastChecked": "2026-04-02T10:00:00Z"
    },
    "GDPR": {
      "status": "compliant",
      "score": "94%",
      "violations": 3,
      "criticalViolations": 0,
      "lastChecked": "2026-04-02T10:00:00Z"
    },
    "HITECH": {
      "status": "compliant",
      "score": "94%",
      "violations": 1,
      "criticalViolations": 0,
      "lastChecked": "2026-04-02T10:00:00Z"
    }
  }
}
```

#### Get HIPAA Compliance Report
```http
GET /security/compliance/hipaa?startDate={date}&endDate={date}&detailed=true
Authorization: Bearer {token}

Query Parameters:
- startDate: ISO date
- endDate: ISO date
- detailed: Include detailed breakdown (true/false)

Response (200):
{
  "standard": "HIPAA",
  "period": {
    "startDate": "2026-03-02",
    "endDate": "2026-04-02"
  },
  "complianceScore": "95%",
  "status": "compliant",
  "checklist": [
    {
      "requirement": "Patient Privacy",
      "status": "compliant",
      "score": "100%",
      "implementation": "Full implementation of patient consent workflows"
    },
    {
      "requirement": "Data Encryption",
      "status": "compliant",
      "score": "98%",
      "implementation": "AES-256 encryption for all PHI"
    },
    {
      "requirement": "Access Controls",
      "status": "compliant",
      "score": "92%",
      "issues": [
        {
          "issue": "Outdated access logs for 2 users",
          "severity": "medium",
          "dueDate": "2026-04-15"
        }
      ]
    }
  ],
  "violations": [
    {
      "violationId": "viol_uuid",
      "requirement": "Access Controls",
      "severity": "medium",
      "description": "Outdated access logs",
      "detectedAt": "2026-04-01T10:30:00Z",
      "remediationDueDate": "2026-04-15"
    }
  ]
}
```

#### Get GDPR Compliance Report
```http
GET /security/compliance/gdpr?startDate={date}&endDate={date}
Authorization: Bearer {token}

Response (200):
{
  "standard": "GDPR",
  "period": {...},
  "complianceScore": "94%",
  "status": "compliant",
  "requirements": [
    {
      "requirement": "Data Subjects Rights",
      "status": "compliant",
      "score": "100%"
    },
    {
      "requirement": "Privacy Notice",
      "status": "compliant",
      "score": "96%"
    },
    {
      "requirement": "Data Protection",
      "status": "compliant",
      "score": "88%",
      "issues": [
        {
          "issue": "Cross-border data transfer documentation incomplete",
          "severity": "high"
        }
      ]
    }
  ],
  "violations": [...]
}
```

#### Get HITECH Act Compliance Report
```http
GET /security/compliance/hitech?startDate={date}&endDate={date}
Authorization: Bearer {token}

Response (200):
{
  "standard": "HITECH Act",
  "period": {...},
  "complianceScore": "94%",
  "status": "compliant",
  "requirements": [
    {
      "requirement": "Breach Notification",
      "status": "compliant",
      "score": "100%"
    },
    {
      "requirement": "Audit and Accountability",
      "status": "compliant",
      "score": "90%"
    }
  ]
}
```

#### Get Compliance Violations
```http
GET /security/compliance/violations?severity=critical&standard=HIPAA&status=unresolved
Authorization: Bearer {token}

Query Parameters:
- severity: critical, high, medium, low
- standard: HIPAA, GDPR, HITECH
- status: unresolved, resolved, in-progress
- limit: Default 50

Response (200):
{
  "violations": [
    {
      "violationId": "viol_uuid",
      "standard": "HIPAA",
      "requirement": "Access Controls",
      "severity": "high",
      "description": "Outdated access logs detected",
      "detectedAt": "2026-04-01T10:30:00Z",
      "status": "in-progress",
      "remediationDueDate": "2026-04-15",
      "assignedTo": "Dr. Smith",
      "remediationPlan": "Update access logs and audit trail",
      "estimatedCost": 5000
    }
  ],
  "summary": {
    "totalViolations": 6,
    "critical": 0,
    "high": 2,
    "medium": 3,
    "low": 1,
    "unresolvedCount": 4
  }
}
```

#### Remediate Compliance Violation
```http
POST /security/compliance/violations/{violationId}/remediate
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "remediationPlan": "Updated access logs and implemented new audit trail",
  "remediationDate": "2026-04-10T10:00:00Z",
  "evidenceDocuments": ["doc_uuid1", "doc_uuid2"],
  "status": "resolved"
}

Response (200):
{
  "violationId": "viol_uuid",
  "status": "resolved",
  "remediatedAt": "2026-04-02T10:35:00Z",
  "remediatedBy": "Dr. Smith",
  "verificationStatus": "pending"
}
```

### 3. ROLE-BASED ACCESS CONTROL (RBAC)

#### Get All Roles
```http
GET /security/roles?limit=50&offset=0
Authorization: Bearer {token}

Response (200):
{
  "roles": [
    {
      "roleId": "role_uuid",
      "name": "Doctor",
      "description": "Healthcare provider with patient care permissions",
      "permissions": ["read_patients", "create_notes", "prescribe"],
      "userCount": 342,
      "isSystem": false,
      "createdAt": "2025-01-15T10:00:00Z"
    },
    {
      "roleId": "role_uuid2",
      "name": "Admin",
      "description": "Platform administrator",
      "permissions": ["*"],
      "userCount": 5,
      "isSystem": true
    }
  ]
}
```

#### Create Role
```http
POST /security/roles
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "name": "Lab Technician",
  "description": "Lab staff with test ordering permissions",
  "permissions": [
    "read_lab_tests",
    "update_test_results",
    "create_reports",
    "manage_inventory"
  ]
}

Response (201):
{
  "roleId": "role_uuid",
  "name": "Lab Technician",
  "description": "Lab staff with test ordering permissions",
  "permissions": [...],
  "createdAt": "2026-04-02T10:35:00Z"
}
```

#### Get All Permissions
```http
GET /security/permissions
Authorization: Bearer {token}

Response (200):
{
  "permissions": [
    {
      "permissionId": "perm_uuid",
      "name": "read_patients",
      "category": "patient_management",
      "description": "View patient records",
      "riskLevel": "high"
    },
    {
      "permissionId": "perm_uuid2",
      "name": "create_notes",
      "category": "clinical_notes",
      "description": "Create clinical notes",
      "riskLevel": "high"
    }
  ],
  "categories": ["patient_management", "clinical_notes", "prescriptions", "admin"]
}
```

#### Assign Roles to User
```http
POST /security/users/{userId}/roles
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "roles": ["doctor", "lab_admin"],
  "assignedAt": "2026-04-02T10:30:00Z",
  "expiresAt": null
}

Response (200):
{
  "userId": "user_uuid",
  "roles": ["doctor", "lab_admin"],
  "assignedAt": "2026-04-02T10:35:00Z"
}
```

#### Get User Roles and Permissions
```http
GET /security/users/{userId}/roles-permissions
Authorization: Bearer {token}

Response (200):
{
  "user": {
    "userId": "user_uuid",
    "name": "Dr. Smith"
  },
  "roles": [
    {
      "roleId": "role_uuid",
      "name": "Doctor",
      "permissions": ["read_patients", "create_notes", "prescribe"]
    }
  ],
  "effectivePermissions": ["read_patients", "create_notes", "prescribe"],
  "deniedPermissions": []
}
```

### 4. THREAT DETECTION & RESPONSE

#### Get Active Threats
```http
GET /security/threats?severity=high&status=active
Authorization: Bearer {token}

Query Parameters:
- severity: critical, high, medium, low
- status: detected, investigating, mitigated, resolved,false-alarm
- threatType: UNAUTHORIZED_ACCESS, BRUTE_FORCE_ATTACK, etc.
- limit: Default 50

Response (200):
{
  "threats": [
    {
      "threatId": "threat_uuid",
      "type": "BRUTE_FORCE_ATTACK",
      "severity": "high",
      "description": "Multiple failed login attempts from IP 192.168.1.100",
      "detectedAt": "2026-04-02T10:30:00Z",
      "source": {
        "ipAddress": "192.168.1.100",
        "location": "New York, USA",
        "userAgent": "Mozilla/5.0..."
      },
      "target": {
        "userId": "user_uuid",
        "userName": "user@example.com",
        "affectedResource": "login"
      },
      "status": "detected",
      "threatScore": 8.5,
      "recommendedActions": [
        "Temporarily lock account",
        "Send security alert to user",
        "Block IP address"
      ],
      "automatedActions": {
        "accountLocked": true,
        "alertSent": true,
        "ipBlocked": false
      }
    }
  ],
  "summary": {
    "totalThreats": 15,
    "criticalThreats": 1,
    "activeThreats": 8,
    "mitigated": 7
  }
}
```

#### Get Threat Details
```http
GET /security/threats/{threatId}
Authorization: Bearer {token}

Response (200):
{
  "threat": {
    "threatId": "threat_uuid",
    "type": "UNAUTHORIZED_ACCESS",
    "severity": "critical",
    "description": "Unauthorized access to patient records detected",
    "timeline": [
      {
        "timestamp": "2026-04-02T10:25:00Z",
        "event": "Suspicious access pattern detected",
        "details": "User accessed 50 records in 5 minutes"
      },
      {
        "timestamp": "2026-04-02T10:30:00Z",
        "event": "Alert generated",
        "automatedAction": "Session terminated"
      }
    ],
    "affectedData": {
      "recordCount": 50,
      "patientCount": 45,
      "dataClassification": "highly_sensitive"
    },
    "responseActions": [
      {
        "action": "Session terminated",
        "performedAt": "2026-04-02T10:30:00Z",
        "performedBy": "system"
      }
    ]
  }
}
```

#### Respond to Threat
```http
POST /security/threats/{threatId}/respond
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "actions": [
    "block_ip",
    "lock_account",
    "reset_password",
    "notify_user"
  ],
  "notes": "Threat response initiated by security team",
  "escalate": false
}

Response (200):
{
  "threatId": "threat_uuid",
  "status": "mitigated",
  "responseAt": "2026-04-02T10:40:00Z",
  "actionsExecuted": [
    {
      "action": "block_ip",
      "status": "success",
      "ipAddress": "192.168.1.100",
      "blockDuration": 3600
    }
  ]
}
```

### 5. SECURITY SETTINGS & 2FA

#### Get 2FA Setup
```http
GET /security/2fa/setup
Authorization: Bearer {token}

Response (200):
{
  "twoFactorAuth": {
    "enabled": false,
    "methods": ["totp", "sms", "email"],
    "qrCode": "data:image/png;base64,...",
    "secret": "JBSWY3DPEBLW64TMMQ======",
    "backupCodes": [
      "12345678",
      "87654321",
      "45678901"
    ]
  }
}
```

#### Enable 2FA
```http
POST /security/2fa/enable
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "method": "totp",
  "verificationCode": "123456"
}

Response (200):
{
  "userId": "user_uuid",
  "twoFactorEnabled": true,
  "method": "totp",
  "backupCodes": [...]
}
```

#### Verify 2FA Code
```http
POST /security/2fa/verify
Content-Type: application/json

Request Body:
{
  "userId": "user_uuid",
  "code": "123456"
}

Response (200):
{
  "verified": true,
  "sessionToken": "session_token"
}
```

### 6. ENCRYPTION UTILITIES (Client-Side)

#### Encrypt Sensitive Data
```javascript
import { encryptionService } from '../modules/12-security-compliance/services/encryptionService';

// Encrypt patient data before sending to server
const encryptedData = await encryptionService.encryptAES(
  {
    patientId: "uuid",
    ssn: "123-45-6789",
    medicalHistory: "confidential data"
  },
  encryptionService.getPublicKey()
);

// Send encryptedData to backend
```

#### Decrypt Data
```javascript
import { encryptionService } from '../modules/12-security-compliance/services/encryptionService';

// Decrypt received data
const decryptedData = await encryptionService.decryptAES(
  encryptedBlob,
  encryptionService.getPrivateKey()
);
```

## Service Integration Examples

### In React Component (Module 12 - Audit Logs Example)
```javascript
import { auditService } from '../modules/12-security-compliance/services/auditService';

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    action: '',
    resourceType: ''
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      const response = await auditService.getAuditLogs(filters);
      setAuditLogs(response.logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const logCustomAction = async (action) => {
    try {
      await auditService.logAction({
        userId: currentUserId,
        action: action.type,
        resourceType: action.resourceType,
        resourceId: action.resourceId,
        details: action.details,
        ipAddress: getUserIPAddress(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  return (
    <div className="audit-logs">
      {/* Audit logs UI */}
    </div>
  );
};

export default AuditLogs;
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "COMPLIANCE_VIOLATION",
    "message": "Action violates compliance policy",
    "details": {
      "policy": "HIPAA",
      "violation": "Unauthorized data access"
    },
    "timestamp": "2026-04-02T10:45:00Z"
  }
}
```

### Common Error Codes
- `COMPLIANCE_VIOLATION` (403): Action violates compliance policy
- `INSUFFICIENT_PERMISSIONS` (403): User lacks required role/permission
- `THREAT_DETECTED` (429): Suspicious activity detected - rate limited
- `2FA_REQUIRED` (401): Two-factor authentication required
- `ENCRYPTION_ERROR` (500): Encryption/decryption failed

## Rate Limiting
```
Audit Logs: 60/minute
Compliance Checks: 10/minute
Threat Response: 30/hour
User Role Changes: 20/hour
2FA Operations: 5/minute
```

## Best Practices

1. **Encryption**: Always encrypt PHI before transmission
2. **Audit Trail**: Log all security-related actions
3. **Consent**: Verify patient consent for data access
4. **2FA**: Enable 2FA for all admin accounts
5. **Monitoring**: Continuously monitor for suspicious activities
6. **Escalation**: Implement automated threat escalation
7. **Documentation**: Maintain detailed compliance documentation
8. **Regular Reviews**: Conduct quarterly compliance audits

## Compliance Checklists

### HIPAA Requirements
- [ ] Patient privacy controls implemented
- [ ] Encryption enabled for all PHI
- [ ] Access controls and audit logs
- [ ] Breach notification procedures
- [ ] Business associate agreements
- [ ] Regular compliance audits

### GDPR Requirements
- [ ] Data subject consent mechanisms
- [ ] Privacy impact assessments
- [ ] Right to be forgotten implementation
- [ ] Data minimization enforcement
- [ ] Cross-border transfer safeguards

### HITECH Requirements
- [ ] Breach notification (60 days)
- [ ] Audit and accountability
- [ ] Encryption standards
- [ ] Risk analysis & management
- [ ] Workforce security training
