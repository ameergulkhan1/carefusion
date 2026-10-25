import React from 'react';
import '../styles/ThreatAlert.css';

const ThreatAlert = ({ threat, onRespond, onBlock, isSelected, onSelect }) => {
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return { color: '#d32f2f', backgroundColor: '#ffcdd2' };
      case 'high':
        return { color: '#f57c00', backgroundColor: '#ffe0b2' };
      case 'medium':
        return { color: '#fbc02d', backgroundColor: '#fff9c4' };
      case 'low':
        return { color: '#388e3c', backgroundColor: '#c8e6c9' };
      default:
        return { color: '#666', backgroundColor: '#f5f5f5' };
    }
  };

  return (
    <div
      className={`threat-alert-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{ borderLeftColor: getSeverityStyle(threat.severity).color }}
    >
      <div className="threat-header">
        <h4>{threat.type}</h4>
        <span
          className="severity-badge"
          style={getSeverityStyle(threat.severity)}
        >
          {threat.severity?.toUpperCase()}
        </span>
        <span className="threat-id">ID: {threat.id}</span>
      </div>

      <p className="threat-description">{threat.description}</p>

      <div className="threat-details">
        <div className="detail">
          <span className="label">Detection Time:</span>
          <span className="value">
            {new Date(threat.detectedAt).toLocaleString()}
          </span>
        </div>
        {threat.userId && (
          <div className="detail">
            <span className="label">Associated User:</span>
            <span className="value">{threat.userId}</span>
          </div>
        )}
        {threat.ipAddress && (
          <div className="detail">
            <span className="label">IP Address:</span>
            <span className="value">{threat.ipAddress}</span>
          </div>
        )}
        <div className="detail">
          <span className="label">Status:</span>
          <span className={`value status-${threat.status}`}>{threat.status}</span>
        </div>
      </div>

      {threat.evidence && (
        <div className="threat-evidence">
          <h5>Evidence:</h5>
          <pre>{JSON.stringify(threat.evidence, null, 2)}</pre>
        </div>
      )}

      <div className="threat-actions">
        <button
          className="action-btn investigate"
          onClick={() => onRespond(threat.id, 'investigate')}
        >
          Investigate
        </button>
        <button
          className="action-btn notify"
          onClick={() => onRespond(threat.id, 'notify')}
        >
          Notify Admin
        </button>
        {threat.ipAddress && (
          <button
            className="action-btn block"
            onClick={() => onBlock('ip', threat.ipAddress)}
          >
            Block IP
          </button>
        )}
        {threat.userId && (
          <button
            className="action-btn block"
            onClick={() => onBlock('user', threat.userId)}
          >
            Block User
          </button>
        )}
        <button
          className="action-btn resolve"
          onClick={() => onRespond(threat.id, 'resolve')}
        >
          Resolve
        </button>
      </div>
    </div>
  );
};

export default ThreatAlert;
