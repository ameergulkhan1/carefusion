import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import './SystemMonitoring.css';

const SystemMonitoring = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('api');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const loadSystemData = async () => {
      try {
        setLoading(true);

        const [healthRes, perfRes, alertsRes, logsRes] = await Promise.all([
          adminService.getSystemHealth(),
          adminService.getPerformanceMetrics(),
          adminService.getSystemAlerts(),
          adminService.getServerLogs()
        ]);

        setSystemHealth(healthRes?.data || healthRes);
        setPerformance(perfRes?.data || perfRes);
        
        const alertsList = Array.isArray(alertsRes?.data) ? alertsRes.data : 
                          alertsRes?.alerts ? alertsRes.alerts : [];
        setAlerts(alertsList);

        const logsList = Array.isArray(logsRes?.data) ? logsRes.data : 
                        logsRes?.logs ? logsRes.logs : [];
        setLogs(logsList);

        setError(null);
      } catch (err) {
        console.error('Failed to load system data:', err);
        setError('Failed to load system monitoring data');
      } finally {
        setLoading(false);
      }
    };

    loadSystemData();

    // Auto-refresh every 30 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadSystemData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleResolveAlert = async (alertId) => {
    try {
      await adminService.resolveAlert(alertId);
      setAlerts(alerts.filter(alert => 
        (alert._id || alert.id) !== alertId && alert.status !== 'resolved'
      ));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      setError('Failed to resolve alert');
    }
  };

  const getHealthStatus = () => {
    const score = systemHealth?.healthScore || 95;
    if (score >= 90) return { status: 'healthy', color: '#059669', icon: '✓' };
    if (score >= 70) return { status: 'warning', color: '#f59e0b', icon: '⚠' };
    return { status: 'critical', color: '#ef4444', icon: '✕' };
  };

  const health = getHealthStatus();

  const getMetricData = () => {
    const metrics = {
      api: performance?.apiMetrics || { avgResponseTime: 145, requestsPerSecond: 1250, errorRate: 0.2 },
      database: performance?.dbMetrics || { avgQueryTime: 28, queriesPerSecond: 850, slowQueries: 3 },
      server: performance?.serverMetrics || { cpuUsage: 42, memoryUsage: 68, diskUsage: 55 },
      cache: performance?.cacheMetrics || { hitRate: 87.5, missRate: 12.5, size: '2.3GB' }
    };
    return metrics[selectedMetric];
  };

  const metric = getMetricData();

  return (
    <div className="system-monitoring-container">
      <div className="monitoring-header">
        <h2>System Monitoring & Performance</h2>
        <label className="auto-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span>Auto-refresh</span>
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading system data...</div>
      ) : (
        <>
          {/* System Health */}
          <div className="health-overview">
            <div className="health-score">
              <div className="score-circle" style={{ borderColor: health.color }}>
                <p className="score-value">{systemHealth?.healthScore || 95}%</p>
                <p className="score-label">System Health</p>
              </div>
              <div className="health-details">
                <h3 style={{ color: health.color }}>
                  {health.icon} System Status: <strong>{health.status.toUpperCase()}</strong>
                </h3>
                <div className="health-items">
                  <div className="health-item">
                    <span>API Response Time</span>
                    <span className="value">{systemHealth?.apiResponseTime || 145}ms</span>
                  </div>
                  <div className="health-item">
                    <span>Database Query Time</span>
                    <span className="value">{systemHealth?.dbQueryTime || 28}ms</span>
                  </div>
                  <div className="health-item">
                    <span>Uptime</span>
                    <span className="value">{systemHealth?.uptime || '99.9'}%</span>
                  </div>
                  <div className="health-item">
                    <span>Last Check</span>
                    <span className="value">Just now</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat">
                <span className="stat-icon">⚙️</span>
                <span className="stat-label">CPU Usage</span>
                <span className="stat-value">{systemHealth?.cpuUsage || 42}%</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${systemHealth?.cpuUsage || 42}%` }} />
                </div>
              </div>

              <div className="stat">
                <span className="stat-icon">💾</span>
                <span className="stat-label">Memory Usage</span>
                <span className="stat-value">{systemHealth?.memoryUsage || 68}%</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${systemHealth?.memoryUsage || 68}%` }} />
                </div>
              </div>

              <div className="stat">
                <span className="stat-icon">💿</span>
                <span className="stat-label">Disk Usage</span>
                <span className="stat-value">{systemHealth?.diskUsage || 55}%</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${systemHealth?.diskUsage || 55}%` }} />
                </div>
              </div>

              <div className="stat">
                <span className="stat-icon">🌐</span>
                <span className="stat-label">Error Rate</span>
                <span className="stat-value">{systemHealth?.errorRate || 0.2}%</span>
                <div className="progress-bar">
                  <div className="progress-fill error" style={{ width: `${systemHealth?.errorRate || 0.2}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="metrics-section">
            <div className="metrics-selector">
              <button
                className={`metric-btn ${selectedMetric === 'api' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('api')}
              >
                API Performance
              </button>
              <button
                className={`metric-btn ${selectedMetric === 'database' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('database')}
              >
                Database
              </button>
              <button
                className={`metric-btn ${selectedMetric === 'server' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('server')}
              >
                Server Resources
              </button>
              <button
                className={`metric-btn ${selectedMetric === 'cache' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('cache')}
              >
                Cache
              </button>
            </div>

            <div className="metrics-display">
              <h3>{selectedMetric === 'api' && 'API Performance Metrics'}
                  {selectedMetric === 'database' && 'Database Metrics'}
                  {selectedMetric === 'server' && 'Server Resource Metrics'}
                  {selectedMetric === 'cache' && 'Cache Performance'}</h3>

              {selectedMetric === 'api' && (
                <div className="metric-cards">
                  <div className="metric-card">
                    <p className="metric-name">Average Response Time</p>
                    <p className="metric-value">{metric.avgResponseTime}ms</p>
                    <p className="metric-desc">Target: &lt;100ms</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-name">Requests per Second</p>
                    <p className="metric-value">{metric.requestsPerSecond}</p>
                    <p className="metric-desc">Peak: 2000 RPS</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-name">Error Rate</p>
                    <p className="metric-value">{metric.errorRate}%</p>
                    <p className="metric-desc">Acceptable: &lt; 0.5%</p>
                  </div>
                </div>
              )}

              {selectedMetric === 'database' && (
                <div className="metric-cards">
                  <div className="metric-card">
                    <p className="metric-name">Average Query Time</p>
                    <p className="metric-value">{metric.avgQueryTime}ms</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-name">Queries per Second</p>
                    <p className="metric-value">{metric.queriesPerSecond}</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-name">Slow Queries</p>
                    <p className="metric-value">{metric.slowQueries}</p>
                    <p className="metric-desc">Queries &gt; 1000ms</p>
                  </div>
                </div>
              )}

              {selectedMetric === 'server' && (
                <div className="metric-cards">
                  <div className="metric-card">
                    <p className="metric-name">CPU Usage</p>
                    <p className="metric-value">{metric.cpuUsage}%</p>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${metric.cpuUsage}%` }} />
                    </div>
                  </div>
                  <div className="metric-card">
                    <p className="metric-name">Memory Usage</p>
                    <p className="metric-value">{metric.memoryUsage}%</p>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${metric.memoryUsage}%` }} />
                    </div>
                  </div>
                  <div className="metric-card">
                    <p className="metric-name">Disk Usage</p>
                    <p className="metric-value">{metric.diskUsage}%</p>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${metric.diskUsage}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'cache' && (
                <div className="metric-cards">
                  <div className="metric-card">
                    <p className="metric-name">Cache Hit Rate</p>
                    <p className="metric-value">{metric.hitRate}%</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-name">Cache Miss Rate</p>
                    <p className="metric-value">{metric.missRate}%</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-name">Cache Size</p>
                    <p className="metric-value">{metric.size}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="alerts-section">
            <h3>System Alerts</h3>
            {alerts.length === 0 ? (
              <p className="no-alerts">All systems operating normally</p>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert, index) => (
                  <div key={index} className={`alert-item alert-${alert.severity}`}>
                    <div className="alert-content">
                      <p className="alert-message">{alert.message}</p>
                      <small className="alert-time">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                      </small>
                    </div>
                    <button
                      onClick={() => handleResolveAlert(alert._id || alert.id)}
                      className="btn-resolve"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Logs */}
          <div className="logs-section">
            <h3>Recent System Logs</h3>
            <div className="logs-list">
              {logs.slice(0, 5).map((log, index) => (
                <div key={index} className={`log-item ${log.level}`}>
                  <span className={`log-level level-${log.level}`}>{log.level}</span>
                  <span className="log-message">{log.message}</span>
                  <small>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}</small>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemMonitoring;
