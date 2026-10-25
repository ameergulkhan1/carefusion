# Module 11: Admin Dashboard and Analytics - Backend Integration Guide

## Overview
Module 11 provides comprehensive platform administration, analytics, reporting, system monitoring, and user management capabilities for healthcare administrators.

## API Base URL
```
Base: /api/admin
Version: v1
Authentication: Required (JWT Bearer Token - admin role)
Authorization: Admin role required for all endpoints
```

## Core Endpoints

### 1. DASHBOARD STATISTICS & OVERVIEW

#### Get Overall Dashboard Statistics
```http
GET /admin/stats
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- timeRange: today, week, month, quarter, year (default: month)
- includeComparison: true/false (compare with previous period)

Response (200):
{
  "stats": {
    "totalUsers": 5432,
    "totalDoctors": 342,
    "totalPatients": 4890,
    "totalLabs": 45,
    "totalPharmacies": 78,
    "activeUsers": 1245,
    "newUsersThisMonth": 234,
    "newPatientsThisMonth": 189,
    "totalAppointments": 12543,
    "completedAppointments": 11850,
    "pendingAppointments": 693,
    "completionRate": "94.5%",
    "averageRating": 4.6,
    "totalRevenue": 125400.50,
    "revenueThisMonth": 12450.75,
    "timeRange": "month",
    "comparison": {
      "userGrowth": "+12.5%",
      "appointmentGrowth": "+8.3%",
      "revenueGrowth": "+15.2%"
    }
  },
  "timestamp": "2026-04-02T10:30:00Z"
}
```

#### Get Real-Time Metrics
```http
GET /admin/metrics/realtime
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "metrics": {
    "activeUsersNow": 342,
    "onlineDoctors": 87,
    "onlinePatients": 215,
    "activeConsultations": 12,
    "messageQueueLength": 3,
    "apiResponseTime": 142,
    "databaseResponseTime": 78,
    "systemLoad": "45%",
    "memory": "62%",
    "diskSpace": "78%",
    "apiErrors": 2,
    "errorRate": "0.002%"
  },
  "timestamp": "2026-04-02T10:35:45Z"
}
```

#### Get Platform Usage Overview
```http
GET /admin/usage?startDate={date}&endDate={date}
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- startDate: ISO date (required)
- endDate: ISO date (required)
- groupBy: day, week, month (default: day)
- includeBreakdown: true/false

Response (200):
{
  "usage": {
    "period": {
      "startDate": "2026-03-01",
      "endDate": "2026-04-02"
    },
    "dailyData": [
      {
        "date": "2026-04-02",
        "activeUsers": 342,
        "appointments": 45,
        "messages": 1230,
        "prescriptions": 23,
        "labTests": 15,
        "pharmacyOrders": 8
      }
    ],
    "totalAppointments": 1250,
    "totalMessages": 34567,
    "totalPrescriptions": 456,
    "totalLabTests": 234,
    "totalPharmacyOrders": 123,
    "topFeatures": ["Appointments", "Messaging", "Prescriptions"],
    "userEngagement": "78%"
  }
}
```

### 2. APPOINTMENTS & CONSULTATIONS

#### Get All Appointments with Filters
```http
GET /admin/appointments?status={status}&doctorId={doctorId}&patientId={patientId}&page=1&limit=50
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- status: scheduled, completed, cancelled, no-show (optional)
- doctorId: Filter by doctor UUID (optional)
- patientId: Filter by patient UUID (optional)
- dateFrom: ISO date (optional)
- dateTo: ISO date (optional)
- speciality: Filter by speciality (optional)
- page: Page number (default: 1)
- limit: Items per page (default: 50, max: 500)
- sort: createdAt, date, status, rating

Response (200):
{
  "appointments": [
    {
      "appointmentId": "appt_uuid",
      "doctorId": "doctor_uuid",
      "doctorName": "Dr. Smith",
      "doctorSpeciality": "Cardiology",
      "patientId": "patient_uuid",
      "patientName": "John Doe",
      "scheduledDate": "2026-04-05T14:00:00Z",
      "duration": 30,
      "status": "scheduled",
      "consultationType": "video",
      "fees": 500,
      "rating": 4.8,
      "notes": "Appointment notes",
      "createdAt": "2026-04-02T10:30:00Z",
      "cancelledAt": null,
      "cancelReason": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 25,
    "totalItems": 1250,
    "itemsPerPage": 50
  },
  "summary": {
    "scheduled": 450,
    "completed": 750,
    "cancelled": 50
  }
}
```

#### Get Appointment Statistics
```http
GET /admin/appointments/stats?startDate={date}&endDate={date}
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- startDate: ISO date (required)
- endDate: ISO date (required)
- groupBy: day, week, month (default: day)
- includeBreakdown: true/false

Response (200):
{
  "stats": {
    "period": {
      "startDate": "2026-03-02",
      "endDate": "2026-04-02"
    },
    "totalAppointments": 1250,
    "completedAppointments": 1100,
    "cancelledAppointments": 150,
    "noShowAppointments": 8,
    "completionRate": "88%",
    "averageRating": 4.6,
    "averageDuration": 28,
    "peakHours": ["14:00", "15:00", "16:00"],
    "mostBusyDoctors": [
      {
        "doctorId": "doctor_uuid",
        "name": "Dr. Smith",
        "appointments": 156,
        "averageRating": 4.9
      }
    ],
    "consultationTypes": {
      "video": 670,
      "chat": 450,
      "in-person": 130
    },
    "bySpeciality": [
      {
        "speciality": "Cardiology",
        "count": 234,
        "completionRate": "92%"
      }
    ]
  }
}
```

#### Get Consultation Metrics
```http
GET /admin/consultations/metrics
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "metrics": {
    "totalConsultations": 892,
    "activeConsultations": 12,
    "averageDuration": 32,
    "completedToday": 45,
    "cancelledToday": 2,
    "averageRating": 4.7,
    "highestRatedDoctor": {
      "doctorId": "doctor_uuid",
      "name": "Dr. Johnson",
      "rating": 4.9
    },
    "consultationTypeBreakdown": {
      "video": 56,
      "chat": 32,
      "audio": 4
    },
    "responseTimeMetrics": {
      "average": 45,
      "min": 2,
      "max": 120
    }
  }
}
```

### 3. PERFORMANCE & ANALYTICS

#### Get Doctor Performance Metrics
```http
GET /admin/doctors/performance
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- sortBy: appointments, rating, earnings, response-time (default: appointments)
- limit: Top N doctors (default: 10, max: 100)
- startDate: ISO date (optional)
- endDate: ISO date (optional)

Response (200):
{
  "doctors": [
    {
      "doctorId": "doctor_uuid",
      "name": "Dr. Smith",
      "speciality": "Cardiology",
      "totalAppointments": 320,
      "completedAppointments": 310,
      "cancelledAppointments": 10,
      "averageRating": 4.85,
      "patientSatisfaction": "94%",
      "responseTime": 8,
      "totalEarnings": 45600.50,
      "appointmentsThisMonth": 28,
      "newPatients": 15,
      "repeatPatientRate": "68%"
    }
  ],
  "topPerformer": {
    "doctorId": "doctor_uuid",
    "name": "Dr. Johnson",
    "metric": "rating",
    "value": 4.95
  }
}
```

#### Get Doctor-Specific Performance
```http
GET /admin/doctors/{doctorId}/metrics
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "doctor": {
    "doctorId": "doctor_uuid",
    "name": "Dr. Smith",
    "speciality": "Cardiology",
    "email": "dr.smith@example.com",
    "phone": "+1234567890",
    "registrationDate": "2025-01-15T10:00:00Z",
    "status": "active"
  },
  "metrics": {
    "totalAppointments": 320,
    "appointmentsThisMonth": 28,
    "completedAppointments": 310,
    "cancelledAppointments": 10,
    "noShowAppointments": 2,
    "averageRating": 4.85,
    "reviews": 156,
    "totalPatients": 245,
    "newPatientsThisMonth": 12,
    "averageConsultationDuration": 32,
    "totalEarnings": 45600.50,
    "earningsThisMonth": 4200.00,
    "responseTime": 8,
    "onlineStatus": "online",
    "lastActive": "2026-04-02T10:15:00Z"
  },
  "monthlyTrend": [
    {
      "month": "2026-04",
      "appointments": 28,
      "revenue": 4200,
      "rating": 4.85
    }
  ]
}
```

### 4. REPORTS & ANALYTICS

#### Generate Custom Report
```http
POST /admin/reports/generate
Content-Type: application/json
Authorization: Bearer {token}
X-Admin-Required: true

Request Body:
{
  "reportType": "comprehensive",
  "title": "Q1 Performance Report",
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-31",
    "speciality": ["Cardiology", "Neurology"],
    "status": "completed"
  },
  "sections": ["summary", "appointments", "performance", "revenue", "trends"],
  "format": "pdf",
  "includeCharts": true,
  "sendEmail": true
}

Response (201):
{
  "reportId": "report_uuid",
  "title": "Q1 Performance Report",
  "status": "generating",
  "createdAt": "2026-04-02T10:30:00Z",
  "estimatedCompletionTime": 120,
  "format": "pdf"
}
```

#### Get Predefined Reports
```http
GET /admin/reports/predefined
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "reports": [
    {
      "reportId": "monthly_summary",
      "title": "Monthly Summary Report",
      "description": "Overview of platform metrics for the month",
      "frequency": "monthly",
      "generatedAt": "2026-04-01T00:00:00Z",
      "lastUpdated": "2026-04-02T10:30:00Z",
      "sections": ["summary", "top_doctors", "revenue"]
    },
    {
      "reportId": "financial",
      "title": "Financial Report",
      "description": "Revenue and expense analysis",
      "frequency": "monthly",
      "generatedAt": "2026-04-01T00:00:00Z"
    }
  ]
}
```

#### Get Report by ID
```http
GET /admin/reports/{reportId}
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "reportId": "report_uuid",
  "title": "Monthly Summary Report",
  "generatedAt": "2026-04-01T00:00:00Z",
  "content": {
    "summary": {
      "totalAppointments": 1250,
      "completionRate": "88%",
      "totalEarnings": 125400.50
    },
    "sections": [
      {
        "name": "Top Doctors",
        "data": [...]
      }
    ]
  },
  "format": "pdf",
  "downloadUrl": "https://api.example.com/reports/uuid/download"
}
```

#### Export Report
```http
GET /admin/reports/{reportId}/export?format=pdf
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- format: pdf, csv, xlsx, json (default: pdf)

Response (200): Binary file
Content-Type: application/pdf
Content-Disposition: attachment; filename="report.pdf"
```

#### Get Financial Analytics
```http
GET /admin/analytics/financial?startDate={date}&endDate={date}
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- startDate: ISO date (required)
- endDate: ISO date (required)
- groupBy: day, week, month

Response (200):
{
  "period": {
    "startDate": "2026-03-02",
    "endDate": "2026-04-02"
  },
  "financialData": {
    "totalRevenue": 125400.50,
    "doctorCommissions": 87780.35,
    "platformFees": 37620.15,
    "refunds": 2450.00,
    "netRevenue": 123000.50,
    "averageTransactionValue": 487.50,
    "transactionCount": 1340,
    "dailyBreakdown": [
      {
        "date": "2026-04-02",
        "revenue": 2340.75,
        "transactions": 8,
        "averageValue": 292.59
      }
    ]
  },
  "payoutInfo": {
    "totalPayouts": 87780.35,
    "lastPayoutDate": "2026-04-01T12:00:00Z",
    "nextScheduledPayout": "2026-04-08T12:00:00Z",
    "pendingPayouts": 5200.00
  }
}
```

#### Get User Growth Analytics
```http
GET /admin/analytics/user-growth
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- timeRange: week, month, quarter, year (default: month)
- includeByType: true/false

Response (200):
{
  "growthData": {
    "timeRange": "month",
    "totalUsers": 5432,
    "newUsersThisMonth": 234,
    "activeUsers": 1245,
    "churnRate": "2.3%",
    "retentionRate": "97.7%",
    "usersByType": {
      "patients": {
        "total": 4890,
        "newThisMonth": 189,
        "activeThisMonth": 1200
      },
      "doctors": {
        "total": 342,
        "newThisMonth": 28,
        "activeThisMonth": 280
      },
      "labs": {
        "total": 45,
        "newThisMonth": 5,
        "activeThisMonth": 42
      },
      "pharmacies": {
        "total": 78,
        "newThisMonth": 8,
        "activeThisMonth": 75
      }
    },
    "monthlyTrend": [
      {
        "month": "2026-02",
        "newUsers": 210,
        "activeUsers": 1180
      }
    ]
  }
}
```

### 5. SYSTEM PERFORMANCE & MONITORING

#### Get System Health
```http
GET /admin/system/health
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "status": "healthy",
  "checks": {
    "api": {
      "status": "healthy",
      "responseTime": 142,
      "uptime": "99.98%"
    },
    "database": {
      "status": "healthy",
      "responseTime": 78,
      "connections": {
        "used": 45,
        "available": 95,
        "total": 100
      }
    },
    "cache": {
      "status": "healthy",
      "hitRate": "87%",
      "memory": "234MB / 512MB"
    },
    "fileStorage": {
      "status": "healthy",
      "used": "875GB / 1TB",
      "usagePercent": "87.5%"
    },
    "email": {
      "status": "healthy",
      "queueLength": 12
    }
  },
  "timestamp": "2026-04-02T10:35:45Z"
}
```

#### Get Performance Metrics
```http
GET /admin/system/performance
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "metrics": {
    "apiResponseTime": {
      "average": 142,
      "p50": 95,
      "p95": 450,
      "p99": 1200
    },
    "databaseResponseTime": {
      "average": 78,
      "p50": 45,
      "p95": 250,
      "p99": 800
    },
    "systemLoad": {
      "cpu": "45%",
      "memory": "62%",
      "disk": "78%"
    },
    "uptime": "99.98%",
    "errorRate": "0.002%",
    "requestsPerSecond": 342,
    "activeConnections": 1245
  }
}
```

#### Get Server Logs
```http
GET /admin/system/logs?limit=100&offset=0&level=all&source=api
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- limit: Number of logs (default: 100, max: 1000)
- offset: Pagination offset (default: 0)
- level: info, warning, error, critical (default: all)
- source: api, database, auth, payment, etc.
- search: Search in log messages

Response (200):
{
  "logs": [
    {
      "logId": "log_uuid",
      "timestamp": "2026-04-02T10:35:45Z",
      "level": "info",
      "source": "api",
      "message": "User logged in successfully",
      "userId": "user_uuid",
      "details": {
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    }
  ],
  "pagination": {
    "totalLogs": 45230,
    "limit": 100,
    "offset": 0
  }
}
```

#### Get Error Logs
```http
GET /admin/system/errors?limit=100&offset=0&severity=all
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- limit: Number of errors (default: 100, max: 1000)
- offset: Pagination offset
- severity: low, medium, high, critical
- errorType: API, Database, Auth, Payment, etc.
- dateFrom: ISO date
- dateTo: ISO date

Response (200):
{
  "errors": [
    {
      "errorId": "error_uuid",
      "timestamp": "2026-04-02T10:35:45Z",
      "severity": "high",
      "errorType": "Database",
      "message": "Connection timeout",
      "stackTrace": "...",
      "affectedUsers": 45,
      "resolution": "Auto-resolved after 3 retries"
    }
  ],
  "summary": {
    "totalErrorsToday": 12,
    "criticalErrors": 0,
    "highErrors": 1,
    "mediumErrors": 8
  }
}
```

#### Get API Performance
```http
GET /admin/system/api-performance
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "endpoints": [
    {
      "endpoint": "POST /appointments",
      "method": "POST",
      "requestCount": 1250,
      "averageResponseTime": 145,
      "errorRate": "0.1%",
      "p95ResponseTime": 450,
      "throughput": "12.5 req/sec"
    }
  ],
  "topSlowest": [...],
  "topErrorProne": [...]
}
```

#### Get Database Performance
```http
GET /admin/system/db-performance
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "metrics": {
    "queries": {
      "average": 78,
      "p95": 250,
      "p99": 800,
      "slowQueries": 3
    },
    "connections": {
      "active": 45,
      "idle": 15,
      "total": 100
    },
    "replication": {
      "status": "healthy",
      "lag": "0ms"
    },
    "storage": {
      "used": "875GB",
      "total": "1TB",
      "growth": "+45GB/month"
    }
  }
}
```

### 6. USER MANAGEMENT

#### Get All Users
```http
GET /admin/users?role=doctor&status=active&page=1&limit=50
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- role: doctor, patient, lab, pharmacy, admin
- status: active, inactive, suspended, pending
- search: Search by name/email
- page: Page number (default: 1)
- limit: Items per page (default: 50, max: 500)
- sort: createdAt, name, lastActive

Response (200):
{
  "users": [
    {
      "userId": "user_uuid",
      "name": "Dr. Smith",
      "email": "dr.smith@example.com",
      "phone": "+1234567890",
      "role": "doctor",
      "status": "active",
      "speciality": "Cardiology",
      "createdAt": "2025-01-15T10:00:00Z",
      "lastActive": "2026-04-02T10:30:00Z",
      "appointmentsCount": 320,
      "rating": 4.85
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 12,
    "totalItems": 550,
    "itemsPerPage": 50
  }
}
```

#### Get User by ID
```http
GET /admin/users/{userId}
Authorization: Bearer {token}
X-Admin-Required: true

Response (200):
{
  "user": {
    "userId": "user_uuid",
    "name": "Dr. Smith",
    "email": "dr.smith@example.com",
    "phone": "+1234567890",
    "role": "doctor",
    "status": "active",
    "createdAt": "2025-01-15T10:00:00Z",
    "lastActive": "2026-04-02T10:30:00Z"
  },
  "details": {
    "speciality": "Cardiology",
    "hospital": "City Hospital",
    "license": "MD-12345",
    "experience": "15",
    "appointmentsTotal": 320,
    "rating": 4.85
  }
}
```

#### Update User Status
```http
PUT /admin/users/{userId}/status
Content-Type: application/json
Authorization: Bearer {token}
X-Admin-Required: true

Request Body:
{
  "status": "suspended",
  "reason": "Violation of platform policies",
  "suspensionDuration": 30
}

Response (200):
{
  "userId": "user_uuid",
  "status": "suspended",
  "suspendedUntil": "2026-05-02T10:35:45Z"
}
```

#### Delete User
```http
DELETE /admin/users/{userId}
Authorization: Bearer {token}
X-Admin-Required: true

Query Parameters:
- purgeData: true/false (completely remove all data)

Response (200):
{
  "message": "User deleted successfully",
  "userId": "user_uuid",
  "deleteDate": "2026-04-02T10:35:45Z"
}
```

#### Assign Roles to User
```http
POST /admin/users/{userId}/roles
Content-Type: application/json
Authorization: Bearer {token}
X-Admin-Required: true

Request Body:
{
  "roles": ["admin", "doctor"]
}

Response (200):
{
  "userId": "user_uuid",
  "roles": ["admin", "doctor"],
  "updatedAt": "2026-04-02T10:35:45Z"
}
```

## Service Integration Examples

### In React Component (Module 11 - Dashboard Example)
```javascript
import { adminService } from '../modules/11-admin-dashboard/services/adminService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dashboard stats
        const statsData = await adminService.getDashboardStats();
        setStats(statsData.stats);

        // Fetch real-time metrics
        const metricsData = await adminService.getRealTimeMetrics();
        setRealTimeMetrics(metricsData.metrics);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh real-time metrics every 30 seconds
    const interval = setInterval(() => {
      adminService.getRealTimeMetrics()
        .then(data => setRealTimeMetrics(data.metrics))
        .catch(err => console.error('Error refreshing metrics:', err));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = async () => {
    try {
      const report = await adminService.generateReport({
        reportType: 'comprehensive',
        title: 'Monthly Report',
        filters: {
          startDate: '2026-03-02',
          endDate: '2026-04-02'
        }
      });
      console.log('Report generated:', report);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Dashboard content */}
    </div>
  );
};

export default Dashboard;
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "UNAUTHORIZED_ADMIN",
    "message": "Admin access required",
    "details": {
      "requiredRole": "admin"
    },
    "timestamp": "2026-04-02T10:45:00Z"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED_ADMIN` (403): User doesn't have admin role
- `INVALID_FILTERS` (400): Invalid filter parameters
- `REPORT_GENERATING` (202): Report is still being generated
- `NOT_FOUND` (404): Resource not found
- `SERVER_ERROR` (500): Internal server error

## Rate Limiting
```
Dashboard Stats: 10/minute
Reports: 5/day per user
User List: 30/minute
System Metrics: 60/minute
```

## Best Practices

1. **Role Verification**: Always verify admin role before accessing sensitive data
2. **Pagination**: Use pagination for large datasets
3. **Filtering**: Use specific filters to reduce data transfer
4. **Caching**: Cache dashboard stats for 5 minutes
5. **Monitoring**: Set up alerts for critical performance thresholds
6. **Audit Trail**: All admin actions are logged
7. **Export Safety**: Implement security questions for sensitive exports
8. **Real-time Updates**: Use WebSockets for real-time metrics

## Webhook Events

Admin actions can trigger webhooks:
```
- admin.report.generated
- admin.user.status.changed
- admin.system.alert
- admin.error.detected
```
