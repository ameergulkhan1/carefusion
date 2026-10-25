import React, { useState, useEffect, useCallback } from 'react';
import { auditService } from '../../services/auditService';
import AuditLogTable from '../../components/AuditLogTable';
import AuditDashboard from '../../components/AuditDashboard';
import './AuditLogs.css';

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    action: '',
    resourceType: '',
    userId: '',
    status: ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'dashboard'
  const [summary, setSummary] = useState(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await auditService.getAuditLogs(filters);
      setAuditLogs(response.logs || []);
      setError(null);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await auditService.getAuditSummary({
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupBy: 'date'
      });
      setSummary(response.summary || null);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, [filters]);

  const fetchSuspiciousActivities = useCallback(async () => {
    try {
      const response = await auditService.getSuspiciousActivities({
        startDate: filters.startDate,
        endDate: filters.endDate,
        severity: 'high'
      });
      setSuspiciousActivities(response.activities || []);
    } catch (err) {
      console.error('Error fetching suspicious activities:', err);
    }
  }, [filters]);

  useEffect(() => {
    fetchAuditLogs();
    fetchSummary();
    fetchSuspiciousActivities();
  }, [fetchAuditLogs, fetchSummary, fetchSuspiciousActivities]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const data = await auditService.exportAuditLogs(filters, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().getTime()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      setError(null);
    } catch (err) {
      setError('Failed to export logs');
      console.error('Error exporting logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      action: '',
      resourceType: '',
      userId: '',
      status: ''
    });
  };

  return (
    <div className="audit-logs-container">
      <div className="audit-logs-header">
        <h1>Audit Logs & Compliance Tracking</h1>
        <p>Monitor all system activities, user actions, and data access</p>
      </div>

      {error && (
        <div className="error-alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="audit-logs-controls">
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button
            className={`view-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={() => setViewMode('dashboard')}
          >
            Dashboard View
          </button>
        </div>

        <div className="export-actions">
          <button className="export-btn" onClick={() => handleExport('csv')}>
            Export CSV
          </button>
          <button className="export-btn" onClick={() => handleExport('pdf')}>
            Export PDF
          </button>
          <button className="export-btn" onClick={() => handleExport('json')}>
            Export JSON
          </button>
        </div>
      </div>

      <div className="audit-logs-filters">
        <h3>Filters</h3>
        <div className="filter-grid">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Action Type</label>
            <select name="action" value={filters.action} onChange={handleFilterChange}>
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="read">Read</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="export">Export</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Resource Type</label>
            <select name="resourceType" value={filters.resourceType} onChange={handleFilterChange}>
              <option value="">All Resources</option>
              <option value="patient_record">Patient Record</option>
              <option value="medical_record">Medical Record</option>
              <option value="appointment">Appointment</option>
              <option value="prescription">Prescription</option>
              <option value="user_account">User Account</option>
            </select>
          </div>
          <div className="filter-group">
            <label>User ID</label>
            <input
              type="text"
              name="userId"
              placeholder="Filter by user"
              value={filters.userId}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>
        <button className="reset-btn" onClick={handleResetFilters}>Reset Filters</button>
      </div>

      {suspiciousActivities.length > 0 && (
        <div className="suspicious-activities-alert">
          <h3>⚠️ Suspicious Activities Detected</h3>
          <div className="suspicious-list">
            {suspiciousActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className={`suspicious-item severity-${activity.severity}`}>
                <span className="activity-type">{activity.type}</span>
                <span className="activity-detail">{activity.description}</span>
                <span className="activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading audit logs...</div>
      ) : viewMode === 'table' ? (
        <AuditLogTable logs={auditLogs} />
      ) : (
        <AuditDashboard logs={auditLogs} summary={summary} />
      )}

      {auditLogs.length === 0 && !loading && (
        <div className="empty-state">
          <p>No audit logs found matching the selected filters.</p>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;