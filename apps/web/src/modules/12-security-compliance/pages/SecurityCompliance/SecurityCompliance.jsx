import React, { useState, useEffect } from 'react';
import { complianceService } from '../../services/complianceService';
import ComplianceReport from '../../components/ComplianceReport';
import ViolationsList from '../../components/ViolationsList';
import './SecurityCompliance.css';

const SecurityCompliance = () => {
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [activeStandard, setActiveStandard] = useState('hipaa');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState({});
  const [violations, setViolations] = useState([]);
  const [showViolationForm, setShowViolationForm] = useState(false);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  useEffect(() => {
    fetchStandardReport(activeStandard);
  }, [activeStandard]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const [statusData, violationsData] = await Promise.all([
        complianceService.getComplianceStatus(),
        complianceService.getComplianceViolations()
      ]);

      setComplianceStatus(statusData.status);
      setViolations(violationsData.violations || []);
      setError(null);
    } catch (err) {
      setError('Failed to load compliance data');
      console.error('Error fetching compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStandardReport = async (standard) => {
    try {
      let reportData;
      switch (standard) {
        case 'hipaa':
          reportData = await complianceService.getHIPAAReport();
          break;
        case 'gdpr':
          reportData = await complianceService.getGDPRReport();
          break;
        case 'hitech':
          reportData = await complianceService.getHITECHReport();
          break;
        default:
          return;
      }
      setReports(prev => ({
        ...prev,
        [standard]: reportData.report
      }));
    } catch (err) {
      console.error(`Error fetching ${standard} report:`, err);
    }
  };

  const getComplianceScore = (standard) => {
    const report = reports[standard];
    if (!report) return 0;
    return report.score || 0;
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  return (
    <div className="security-compliance-container">
      <div className="compliance-header">
        <h1>Security & Compliance Management</h1>
        <p>Monitor healthcare regulations compliance and security standards</p>
      </div>

      {error && (
        <div className="error-alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading compliance data...</div>
      ) : (
        <>
          <div className="compliance-overview">
            <h2>Compliance Standards Overview</h2>
            <div className="compliance-scores">
              {['hipaa', 'gdpr', 'hitech'].map(standard => {
                const score = getComplianceScore(standard);
                const color = getComplianceColor(score);
                return (
                  <div
                    key={standard}
                    className={`compliance-card standard-${standard} ${color}`}
                    onClick={() => setActiveStandard(standard)}
                  >
                    <h3>{standard.toUpperCase()}</h3>
                    <div className="score">{score}%</div>
                    <p className="status">
                      {score >= 90 ? 'Compliant' : score >= 70 ? 'Partial' : 'Non-Compliant'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="compliance-detail-section">
            <ComplianceReport standard={activeStandard} report={reports[activeStandard]} />
          </div>

          <div className="violations-section">
            <div className="violations-header">
              <h2>Compliance Violations</h2>
              <button
                className="report-btn"
                onClick={() => setShowViolationForm(!showViolationForm)}
              >
                {showViolationForm ? 'Cancel' : 'Report Violation'}
              </button>
            </div>

            {showViolationForm && (
              <div className="violation-form">
                <h3>Report New Violation</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Handle form submission
                }}>
                  <div className="form-group">
                    <label>Violation Type</label>
                    <select required>
                      <option value="">Select type</option>
                      <option value="unauthorized_access">Unauthorized Access</option>
                      <option value="data_breach">Data Breach</option>
                      <option value="inadequate_encryption">Inadequate Encryption</option>
                      <option value="policy_violation">Policy Violation</option>
                      <option value="audit_failure">Audit Failure</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Affected Standard</label>
                    <select required>
                      <option value="">Select standard</option>
                      <option value="HIPAA">HIPAA</option>
                      <option value="GDPR">GDPR</option>
                      <option value="HITECH">HITECH Act</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Severity</label>
                    <select required>
                      <option value="">Select severity</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea placeholder="Describe the violation" required />
                  </div>
                  <button type="submit" className="submit-btn">Submit Report</button>
                </form>
              </div>
            )}

            <ViolationsList violations={violations} />
          </div>

          {complianceStatus && (
            <div className="compliance-status-section">
              <h2>System Compliance Status</h2>
              <div className="status-grid">
                <div className="status-item">
                  <h4>Data Encryption</h4>
                  <span className={`status-badge ${complianceStatus.dataEncryption}`}>
                    {complianceStatus.dataEncryption}
                  </span>
                </div>
                <div className="status-item">
                  <h4>Access Control</h4>
                  <span className={`status-badge ${complianceStatus.accessControl}`}>
                    {complianceStatus.accessControl}
                  </span>
                </div>
                <div className="status-item">
                  <h4>Audit Logging</h4>
                  <span className={`status-badge ${complianceStatus.auditLogging}`}>
                    {complianceStatus.auditLogging}
                  </span>
                </div>
                <div className="status-item">
                  <h4>Backup & Recovery</h4>
                  <span className={`status-badge ${complianceStatus.backupRecovery}`}>
                    {complianceStatus.backupRecovery}
                  </span>
                </div>
                <div className="status-item">
                  <h4>Incident Response</h4>
                  <span className={`status-badge ${complianceStatus.incidentResponse}`}>
                    {complianceStatus.incidentResponse}
                  </span>
                </div>
                <div className="status-item">
                  <h4>Staff Training</h4>
                  <span className={`status-badge ${complianceStatus.staffTraining}`}>
                    {complianceStatus.staffTraining}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SecurityCompliance;
