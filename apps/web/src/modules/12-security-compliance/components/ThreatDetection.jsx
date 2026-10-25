import React, { useState, useEffect } from 'react';
import { threatDetectionService } from '../../services/threatDetectionService';
import ThreatAlert from './ThreatAlert';
import '../styles/ThreatDetection.css';

const ThreatDetection = () => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [showBlockList, setShowBlockList] = useState(false);
  const [blockedItems, setBlockedItems] = useState([]);

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchThreats = async () => {
    try {
      setLoading(true);
      const response = await threatDetectionService.getDetectedThreats({
        severity: 'high',
        limit: 20
      });
      setThreats(response.threats || []);
      setError(null);
    } catch (err) {
      setError('Failed to load threats');
      console.error('Error fetching threats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedItems = async () => {
    try {
      const response = await threatDetectionService.getBlockedIdentifiers();
      setBlockedItems(response.blocked || []);
    } catch (err) {
      console.error('Error fetching blocked items:', err);
    }
  };

  const handleThreatResponse = async (threatId, action) => {
    try {
      await threatDetectionService.respondToThreat(threatId, {
        action,
        notes: 'Threat addressed',
        respondedBy: 'admin'
      });
      // Refresh threats
      fetchThreats();
    } catch (err) {
      setError('Failed to respond to threat');
      console.error('Error responding to threat:', err);
    }
  };

  const handleBlockIdentifier = async (identifierType, identifier) => {
    try {
      await threatDetectionService.blockIdentifier(identifierType, identifier);
      // Refresh threats
      fetchThreats();
    } catch (err) {
      setError('Failed to block identifier');
      console.error('Error blocking identifier:', err);
    }
  };

  const threatsByType = threats.reduce((acc, threat) => {
    acc[threat.type] = (acc[threat.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="threat-detection-container">
      <div className="threat-header">
        <h2>Threat Detection & Response</h2>
        <button 
          className="block-list-btn"
          onClick={() => {
            setShowBlockList(!showBlockList);
            if (!showBlockList) fetchBlockedItems();
          }}
        >
          View Block List ({blockedItems.length})
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showBlockList && (
        <div className="block-list">
          <h3>Blocked IPs and Users</h3>
          <div className="blocked-items">
            {blockedItems && blockedItems.length > 0 ? (
              blockedItems.map((item) => (
                <div key={item.id} className="blocked-item">
                  <span className="identifier">{item.identifier}</span>
                  <span className="type">{item.type}</span>
                  <span className="blocked-date">
                    {new Date(item.blockedAt).toLocaleString()}
                  </span>
                  <button
                    className="unblock-btn"
                    onClick={() =>
                      threatDetectionService.unblockIdentifier(item.id).then(() =>
                        fetchBlockedItems()
                      )
                    }
                  >
                    Unblock
                  </button>
                </div>
              ))
            ) : (
              <p>No blocked identifiers</p>
            )}
          </div>
        </div>
      )}

      <div className="threat-stats">
        <div className="stat-card">
          <h4>Active Threats</h4>
          <p className="stat-number">{threats.length}</p>
        </div>
        <div className="stat-card">
          <h4>Critical</h4>
          <p className="stat-number" style={{ color: '#d32f2f' }}>
            {threats.filter(t => t.severity === 'critical').length}
          </p>
        </div>
        <div className="stat-card">
          <h4>High</h4>
          <p className="stat-number" style={{ color: '#f57c00' }}>
            {threats.filter(t => t.severity === 'high').length}
          </p>
        </div>
      </div>

      <div className="threat-types-breakdown">
        <h3>Threats by Type</h3>
        <div className="types-list">
          {Object.entries(threatsByType).map(([type, count]) => (
            <div key={type} className="type-item">
              <span className="type-name">{type}</span>
              <span className="type-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading threats...</div>
      ) : (
        <div className="threats-list">
          <h3>Detected Threats</h3>
          {threats && threats.length > 0 ? (
            threats.map((threat) => (
              <ThreatAlert
                key={threat.id}
                threat={threat}
                onRespond={handleThreatResponse}
                onBlock={handleBlockIdentifier}
                isSelected={selectedThreat?.id === threat.id}
                onSelect={() => setSelectedThreat(threat)}
              />
            ))
          ) : (
            <div className="no-threats">
              <p>✓ No threats detected</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreatDetection;
