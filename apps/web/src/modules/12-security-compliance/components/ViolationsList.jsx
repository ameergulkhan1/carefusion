import React from 'react';
import './styles/ViolationsList.css';

const ViolationsList = ({ violations }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '⛔';
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="violations-list-container">
      {violations && violations.length > 0 ? (
        <div className="violations-grid">
          {violations.map((violation) => (
            <div
              key={violation.id}
              className={`violation-card severity-${getSeverityColor(violation.severity)}`}
            >
              <div className="violation-header">
                <h3>
                  <span className="severity-icon">
                    {getSeverityIcon(violation.severity)}
                  </span>
                  {violation.type}
                </h3>
                <span className={`standard-badge ${violation.standard?.toLowerCase()}`}>
                  {violation.standard}
                </span>
              </div>

              <p className="violation-description">{violation.description}</p>

              <div className="violation-details">
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`value status-${violation.status}`}>
                    {violation.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Discovered:</span>
                  <span className="value">
                    {new Date(violation.discoveredDate).toLocaleDateString()}
                  </span>
                </div>
                {violation.affectedRecords && (
                  <div className="detail-item">
                    <span className="label">Affected Records:</span>
                    <span className="value">{violation.affectedRecords}</span>
                  </div>
                )}
              </div>

              {violation.status === 'pending' && (
                <div className="violation-actions">
                  <button className="remediation-btn">Start Remediation</button>
                </div>
              )}

              {violation.remediationSteps && (
                <div className="remediation-info">
                  <h4>Remediation Plan:</h4>
                  <ol>
                    {violation.remediationSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-violations">
          <p>✓ No compliance violations detected!</p>
        </div>
      )}
    </div>
  );
};

export default ViolationsList;
