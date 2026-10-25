import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../../../../components/common/Card/Card';
import Button from '../../../../components/common/Button/Button';
import Loader from '../../../../components/common/Loader/Loader';
import Alert from '../../../../components/common/Alert/Alert';
import laboratoryService from '../../services/laboratoryService';
import './TestResults.css';

const TestResults = () => {
  const { resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, [resultId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');

      const listResponse = await laboratoryService.getPatientResults();
      const list = listResponse?.success && Array.isArray(listResponse.data) ? listResponse.data : [];
      setResults(list);

      if (resultId) {
        const detailResponse = await laboratoryService.getResultById(resultId);
        if (detailResponse?.success) {
          setSelectedResult(detailResponse.data);
        }
      } else if (list.length > 0) {
        setSelectedResult(list[0]);
      }
    } catch (err) {
      console.error('Failed to load lab results:', err);
      setError(err?.message || 'Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (id) => {
    try {
      const response = await laboratoryService.downloadReport(id);
      if (!response?.success || !response?.data?.url) {
        throw new Error(response?.message || 'Report download URL unavailable');
      }
      window.open(response.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err?.message || 'Unable to download report');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const abnormalCount = useMemo(
    () => results.filter((item) => item.overallResult && item.overallResult !== 'normal').length,
    [results]
  );

  if (loading) {
    return <Loader message="Loading lab results..." />;
  }

  return (
    <div className="test-results">
      <div className="page-header">
        <h2>Lab Test Results</h2>
        <div className="page-subtitle">
          {results.length} report(s) available, {abnormalCount} abnormal/critical
        </div>
      </div>

      {error ? <Alert type="error" message={error} onClose={() => setError('')} /> : null}

      {results.length === 0 ? (
        <Card className="result-card">
          <h3>No reports available</h3>
          <p>Your lab reports will appear here once your tests are processed.</p>
          <Link to="/laboratory/book-test">Book a lab test</Link>
        </Card>
      ) : (
        <div className="results-layout">
          <div className="results-list">
            {results.map((result) => (
              <Card
                key={result._id}
                className={`result-card ${selectedResult?._id === result._id ? 'active' : ''}`}
                onClick={() => setSelectedResult(result)}
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
              <Card className="result-card">
                <h3>{selectedResult.testName || selectedResult.test?.testName || 'Result Details'}</h3>
                <p><strong>Test Code:</strong> {selectedResult.testCode || selectedResult.test?.testCode || 'N/A'}</p>
                <p><strong>Status:</strong> {(selectedResult.overallResult || 'normal').toUpperCase()}</p>
                <p><strong>Sample Collected:</strong> {formatDate(selectedResult.sampleCollectedAt)}</p>
                <p><strong>Processed:</strong> {formatDate(selectedResult.processedAt)}</p>
                <p><strong>Reported:</strong> {formatDate(selectedResult.reportedAt || selectedResult.createdAt)}</p>
                <p><strong>Interpretation:</strong> {selectedResult.interpretation || 'N/A'}</p>
                <p><strong>Remarks:</strong> {selectedResult.remarks || 'N/A'}</p>

                {(selectedResult.parameters || []).length > 0 ? (
                  <div className="parameters-section">
                    <h4>Parameters</h4>
                    {(selectedResult.parameters || []).map((parameter, index) => (
                      <div key={`param-${index}`} className="parameter-row">
                        <span>{parameter.name}</span>
                        <span>{parameter.value} {parameter.unit || ''}</span>
                        <span>{parameter.normalRange?.description || ''}</span>
                        <span className={`status-${(parameter.status || 'normal').toLowerCase()}`}>
                          {parameter.status || 'normal'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="result-actions">
                  <Button variant="primary" onClick={() => downloadReport(selectedResult._id)}>
                    Download Report
                  </Button>
                  <Link to="/laboratory/orders">Track Orders</Link>
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
