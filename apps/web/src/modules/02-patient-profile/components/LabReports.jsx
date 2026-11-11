import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import laboratoryService from '../../../modules/08-laboratory/services/laboratoryService';import Loader from '../../../../src/components/common/Loader/Loader';
import './LabReports.css';

const LabReports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all'); // all | normal | abnormal | critical
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchReports();

  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.getPatientResults();
      if (res?.success) {
        setReports(Array.isArray(res.data) ? res.data : []);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
      toast.error('Failed to load lab reports');
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (filter === 'all') return true;
    return r.overallResult === filter;
  });

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  const getResultBadgeClass = (result) => {
    switch (result) {
      case 'normal': return 'badge-normal';
      case 'abnormal': return 'badge-abnormal';
      case 'critical': return 'badge-critical';
      default: return 'badge-default';
    }
  };

  // ✅ FIXED: Prepends backend URL so PDF opens from port 5000
  const handleDownload = async (resultId) => {
    try {
      const res = await laboratoryService.downloadReport(resultId);
      if (res?.success && res.data?.url) {
        const BACKEND_URL = 'http://localhost:5000';
        const fileUrl = res.data.url.startsWith('http')
          ? res.data.url
          : `${BACKEND_URL}${res.data.url}`;
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Report file not available');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download report');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="lab-reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lab Test Reports</h1>
          <p className="page-subtitle">View all your finalized laboratory results</p>
        </div>
        <button className="btn-refresh" onClick={fetchReports}>↻ Refresh</button>
      </div>

      <div className="filter-tabs">
        {['all', 'normal', 'abnormal', 'critical'].map((f) => (
          <button
            key={f}
            className={`tab-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="tab-count">
                {reports.filter((r) => r.overallResult === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No lab reports found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
          <Link to="/laboratory/book-test" className="btn-primary">
            Book a Lab Test
          </Link>
        </div>
      ) : (
        <div className="reports-list">
          {filtered.map((report) => {
            const isExpanded = expandedId === report._id;
            return (
              <div key={report._id} className="report-card">
                <div
                  className="report-header"
                  onClick={() => setExpandedId(isExpanded ? null : report._id)}
                >
                  <div className="report-main">
                    <h3 className="report-test-name">
                      {report.testName || report.test?.testName}
                    </h3>
                    <div className="report-meta">
                      <span className="report-code">
                        {report.testCode || report.test?.testCode}
                      </span>
                      <span className="report-date">
                        Reported: {formatDate(report.reportedAt)}
                      </span>
                      {report.order?.orderNumber && (
                        <span className="report-order">
                          Order #{report.order.orderNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="report-side">
                    <span className={`result-badge ${getResultBadgeClass(report.overallResult)}`}>
                      {report.overallResult?.toUpperCase() || 'PENDING'}
                    </span>
                    <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="report-body">
                    {report.parameters?.length > 0 && (
                      <div className="parameters-table-wrapper">
                        <table className="parameters-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Result</th>
                              <th>Unit</th>
                              <th>Reference Range</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.parameters.map((p, i) => (
                              <tr key={i} className={p.isAbnormal ? 'row-abnormal' : ''}>
                                <td>{p.name}</td>
                                <td><strong>{p.value}</strong></td>
                                <td>{p.unit || '—'}</td>
                                <td>{p.referenceRange || '—'}</td>
                                <td>
                                  <span className={`param-status ${p.isAbnormal ? 'abnormal' : 'normal'}`}>
                                    {p.isAbnormal ? 'Abnormal' : 'Normal'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {report.interpretation && (
                      <div className="report-section">
                        <h4>Interpretation</h4>
                        <p>{report.interpretation}</p>
                      </div>
                    )}

                    {report.remarks && (
                      <div className="report-section">
                        <h4>Remarks</h4>
                        <p>{report.remarks}</p>
                      </div>
                    )}

                    <div className="report-actions">
                      {report.reportDocument?.url && (
                        <button
                          className="btn-download"
                          onClick={() => handleDownload(report._id)}
                        >
                          ⬇ Download Report
                        </button>
                      )}
                      {report.order?._id && (
                        <Link
                          to={`/laboratory/orders/${report.order._id}`}
                          className="btn-secondary"
                        >
                          View Order
                        </Link>
                      )}
                    </div>

                    <div className="report-footer">
                      <small>
                        Performed by: {report.performedBy?.name || 'Lab Staff'} •{' '}
                        Sample collected: {formatDate(report.sampleCollectedAt)}
                      </small>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LabReports;