import React from 'react';
import './styles/ComplianceReport.css';

const ComplianceReport = ({ standard, report }) => {
  if (!report) {
    return (
      <div className="compliance-report">
        <p className="loading">Loading {standard?.toUpperCase()} compliance report...</p>
      </div>
    );
  }

  const getProgressColor = (score) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  return (
    <div className="compliance-report">
      <h2>{standard?.toUpperCase()} Compliance Report</h2>

      <div className="compliance-score">
        <div className={`score-circle ${getProgressColor(report.score)}`}>
          <span className="score-value">{report.score || 0}%</span>
        </div>
        <div className="score-status">
          <h3>{report.status || 'Compliant'}</h3>
          <p>Last Updated: {new Date(report.lastUpdated).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="compliance-sections">
        {report.sections && report.sections.map((section, idx) => (
          <div key={idx} className="compliance-section">
            <h3>{section.name}</h3>
            <p className="section-description">{section.description}</p>
            
            <div className="compliance-items">
              {section.items && section.items.map((item, itemIdx) => (
                <div key={itemIdx} className={`compliance-item status-${item.status}`}>
                  <div className="item-header">
                    <span className="status-indicator">
                      {item.status === 'compliant' ? '✓' : item.status === 'non-compliant' ? '✗' : '⚠️'}
                    </span>
                    <h4>{item.name}</h4>
                  </div>
                  <p className="item-description">{item.description}</p>
                  {item.findings && (
                    <div className="findings">
                      <strong>Findings:</strong>
                      <ul>
                        {item.findings.map((finding, findIdx) => (
                          <li key={findIdx}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {report.recommendations && report.recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Recommendations</h3>
          <ul>
            {report.recommendations.map((rec, idx) => (
              <li key={idx}>
                <strong>{rec.priority}:</strong> {rec.description}
                <p className="action-plan">Action: {rec.actionPlan}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComplianceReport;
