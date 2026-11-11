import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../../../../components/common/Card/Card';
import Button from '../../../../components/common/Button/Button';
import Loader from '../../../../components/common/Loader/Loader';
import Alert from '../../../../components/common/Alert/Alert';
import laboratoryService from '../../services/laboratoryService';
import './TestResults.css';

const TestResults = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const publishOrderId = searchParams.get('orderId');
  const publishTestId = searchParams.get('testId');
  const isPublishMode = Boolean(publishOrderId && publishTestId);

  const [loading, setLoading] = useState(!isPublishMode);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [error, setError] = useState('');

  // Publish form state
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [overallResult, setOverallResult] = useState('normal');
  const [remarks, setRemarks] = useState('');
  const [orderPreview, setOrderPreview] = useState(null);

  useEffect(() => {
    if (isPublishMode) {
      loadOrderPreview();
    } else {
      fetchResults();
    }
    
  }, [resultId, publishOrderId, publishTestId]);

  const loadOrderPreview = async () => {
    try {
      setLoading(true);
      const response = await laboratoryService.getOrderById(publishOrderId);
      const orderData = response?.data?.data || response?.data || response;
      setOrderPreview(orderData);
    } catch (err) {
      setError(err?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const listResponse = await laboratoryService.getPatientResults();
      const list = listResponse?.success && Array.isArray(listResponse.data) ? listResponse.data : [];
      setResults(list);
      if (resultId) {
        const detailResponse = await laboratoryService.getResultById(resultId);
        if (detailResponse?.success) setSelectedResult(detailResponse.data);
      } else if (list.length > 0) {
        setSelectedResult(list[0]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Prepends backend URL so PDF opens from port 5000
  const downloadReport = async (id) => {
    try {
      const response = await laboratoryService.downloadReport(id);
      if (!response?.success || !response?.data?.url) {
        throw new Error(response?.message || 'Report download URL unavailable');
      }

      const BACKEND_URL = 'http://localhost:5000';
      const fileUrl = response.data.url.startsWith('http')
        ? response.data.url
        : `${BACKEND_URL}${response.data.url}`;

      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err?.message || 'Unable to download report');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        file,
        overallResult,
        remarks,
        markReported: true
      };

      const res = await laboratoryService.publishResult(publishOrderId, publishTestId, payload);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to publish result');
      }

      toast.success('Report uploaded and patient notified!');
      navigate(`/laboratory/orders/${publishOrderId}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to upload report');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPublish = () => {
    navigate(`/laboratory/orders/${publishOrderId}`);
  };

  // ============ LAB PUBLISH MODE ============
  if (isPublishMode) {
    if (loading) return <Loader message="Loading order..." />;
    const order = orderPreview;
    const testEntry = order?.tests?.find((t) => String(t.testId?._id || t.testId) === String(publishTestId));
    const testName = testEntry?.testName || 'Lab Test';

    return (
      <div className="test-results">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2>Upload Lab Report</h2>
            <div className="page-subtitle">{testName} • Order #{order?.orderNumber}</div>
          </div>
          <Button variant="secondary" onClick={cancelPublish}>← Back</Button>
        </div>

        {error ? <Alert type="error" message={error} onClose={() => setError('')} /> : null}

        <Card className="result-card" style={{ padding: '24px' }}>
          <form onSubmit={handlePublish} className="publish-form">
            <div className="form-section" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Upload Report File (PDF / Image) *
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                style={{ display: 'block', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}
              />
            </div>

            <div className="form-section" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Overall Result *</label>
              <select
                className="form-input"
                value={overallResult}
                onChange={(e) => setOverallResult(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              >
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-section" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Remarks / Notes (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any notes for the patient..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="secondary" onClick={cancelPublish} disabled={submitting}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Uploading...' : 'Upload & Notify Patient'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // ============ PATIENT VIEW ============
  return (
    <div className="test-results">
      <div className="page-header">
        <h2>Lab Test Results</h2>
        <div className="page-subtitle">{results.length} report(s) available</div>
      </div>

      {error ? <Alert type="error" message={error} onClose={() => setError('')} /> : null}

      {results.length === 0 ? (
        <Card className="result-card">
          <h3>No reports available</h3>
          <p>Your lab reports will appear here once your tests are processed.</p>
          <Link to="/laboratory/book-test" className="btn-primary">Book a Lab Test</Link>
        </Card>
      ) : (
        <div className="results-layout">
          <div className="results-list">
            {results.map((result) => (
              <Card
                key={result._id}
                className={`result-card ${selectedResult?._id === result._id ? 'active' : ''}`}
                onClick={() => setSelectedResult(result)}
                style={{ cursor: 'pointer', marginBottom: '10px' }}
              >
                <h3>{result.testName || result.test?.testName || 'Lab Result'}</h3>
                <p><strong>Reported:</strong> {formatDate(result.reportedAt || result.createdAt)}</p>
                <p><strong>Order:</strong> {result.order?.orderNumber || 'N/A'}</p>
                <span className={`status-badge status-${(result.overallResult || 'normal').toLowerCase()}`}>
                  {result.overallResult || 'normal'}
                </span>
              </Card>
            ))}
          </div>

          <div className="result-detail">
            {selectedResult ? (
              <Card className="result-card" style={{ padding: '24px' }}>
                <h3>{selectedResult.testName || selectedResult.test?.testName || 'Result Details'}</h3>
                <p><strong>Test Code:</strong> {selectedResult.testCode || selectedResult.test?.testCode || 'N/A'}</p>
                <p><strong>Status:</strong> {(selectedResult.overallResult || 'normal').toUpperCase()}</p>
                <p><strong>Reported On:</strong> {formatDate(selectedResult.reportedAt || selectedResult.createdAt)}</p>
                <p><strong>Remarks:</strong> {selectedResult.remarks || 'N/A'}</p>

                <div className="result-actions" style={{ marginTop: '20px' }}>
                  {selectedResult.reportDocument?.url ? (
                    <Button variant="primary" onClick={() => downloadReport(selectedResult._id)}>
                      Download Report File
                    </Button>
                  ) : (
                    <p style={{ color: '#dc2626' }}>No file uploaded for this result.</p>
                  )}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;