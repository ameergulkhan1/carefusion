import React from 'react';
import './styles/AuditLogTable.css';

const AuditLogTable = ({ logs }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'failed':
        return 'red';
      case 'warning':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      login: '🔓',
      logout: '🔒',
      create: '➕',
      read: '👁️',
      update: '✏️',
      delete: '🗑️',
      export: '📤'
    };
    return icons[action] || '⚙️';
  };

  return (
    <div className="audit-log-table-container">
      <table className="audit-log-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Resource Type</th>
            <th>Resource ID</th>
            <th>IP Address</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs && logs.length > 0 ? (
            logs.map((log) => (
              <tr key={log.id} className={`status-${getStatusColor(log.status)}`}>
                <td className="timestamp">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="user">{log.userId || log.user || 'Unknown'}</td>
                <td className="action">
                  <span className="action-icon">{getActionIcon(log.action)}</span>
                  {log.action}
                </td>
                <td className="resource-type">{log.resourceType}</td>
                <td className="resource-id">{log.resourceId}</td>
                <td className="ip-address">{log.ipAddress}</td>
                <td className="status">
                  <span className={`status-badge ${log.status}`}>
                    {log.status}
                  </span>
                </td>
                <td className="details">
                  <span title={JSON.stringify(log.details)}>
                    {log.details?.summary || 'View'}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="no-data">No audit logs found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogTable;
