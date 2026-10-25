import React from 'react';
import './styles/AuditDashboard.css';

const AuditDashboard = ({ logs, summary }) => {
  const calculateStats = () => {
    if (!logs || logs.length === 0) {
      return {
        totalActions: 0,
        successRate: 0,
        failedActions: 0,
        warningCount: 0
      };
    }

    const successCount = logs.filter(l => l.status === 'success').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;
    const warningCount = logs.filter(l => l.status === 'warning').length;

    return {
      totalActions: logs.length,
      successRate: Math.round((successCount / logs.length) * 100),
      failedActions: failedCount,
      warningCount: warningCount
    };
  };

  const stats = calculateStats();

  const getActionCounts = () => {
    if (!logs || logs.length === 0) return {};

    return logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});
  };

  const actionCounts = getActionCounts();

  return (
    <div className="audit-dashboard">
      <div className="dashboard-stats">
        <div className="stat-card">
          <h4>Total Actions</h4>
          <p className="stat-value">{stats.totalActions}</p>
        </div>
        <div className="stat-card success">
          <h4>Success Rate</h4>
          <p className="stat-value">{stats.successRate}%</p>
        </div>
        <div className="stat-card error">
          <h4>Failed Actions</h4>
          <p className="stat-value">{stats.failedActions}</p>
        </div>
        <div className="stat-card warning">
          <h4>Warnings</h4>
          <p className="stat-value">{stats.warningCount}</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Actions Breakdown</h3>
          <div className="action-breakdown">
            {Object.entries(actionCounts).map(([action, count]) => (
              <div key={action} className="action-bar">
                <label>{action}</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{
                      width: `${(count / stats.totalActions) * 100}%`
                    }}
                  />
                </div>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {summary && (
          <div className="chart-container">
            <h3>Compliance Summary</h3>
            <div className="summary-stats">
              <div className="summary-item">
                <span>Daily Average</span>
                <strong>{Math.round(stats.totalActions / 30)}</strong> actions/day
              </div>
              <div className="summary-item">
                <span>Peak Activity</span>
                <strong>10:30 AM</strong>
              </div>
               <div className="summary-item">
                <span>Most Active User</span>
                <strong>admin@example.com</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="recent-critical-activities">
        <h3>Recent Critical Activities</h3>
        <div className="activities-list">
          {logs && logs.length > 0 ? (
            logs
              .filter(l => l.status === 'failed' || l.status === 'warning')
              .slice(0, 10)
              .map((log) => (
                <div key={log.id} className={`activity-item status-${log.status}`}>
                  <div className="activity-header">
                    <span className="timestamp">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="badge">{log.status}</span>
                  </div>
                  <p className="activity-details">
                    {log.userId} - {log.action} on {log.resourceType}
                  </p>
                </div>
              ))
          ) : (
            <p className="no-data">No critical activities</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;
