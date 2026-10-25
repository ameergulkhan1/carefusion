import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Card from '../../../../components/common/Card/Card';
import Button from '../../../../components/common/Button/Button';
import Loader from '../../../../components/common/Loader/Loader';
import Alert from '../../../../components/common/Alert/Alert';
import symptomService from '../../services/symptomService';
import './SymptomResults.css';

const SymptomResults = () => {
  const { checkId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [checkData, setCheckData] = useState(location.state?.checkData || null);
  const [loading, setLoading] = useState(!checkData);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const resolveCurrentCheckId = () => {
    return checkId || checkData?.checkId || checkData?._id || checkData?.localCheckId;
  };

  useEffect(() => {
    if (checkData) {
      const cachedResult = symptomService.cacheSymptomResult(checkData);
      if ((checkData?.checkId || checkData?._id || checkData?.localCheckId) !== cachedResult.checkId) {
        setCheckData(cachedResult);
      }
      setLoading(false);
      return;
    }

    if (checkId) {
      fetchCheckData();
      return;
    }

    const latestResult = symptomService.getLatestCachedResult();
    if (latestResult) {
      setCheckData(latestResult);
      setLoading(false);
    } else {
      setError('No symptom result found. Please run a new symptom check.');
      setLoading(false);
    }
  }, [checkId, checkData]);

  const fetchCheckData = async () => {
    try {
      setLoading(true);
      const response = await symptomService.getSymptomCheckById(checkId);
      
      if (response.success) {
        setCheckData(symptomService.cacheSymptomResult(response.data));
      } else {
        throw new Error(response.message || 'Failed to load results');
      }
    } catch (err) {
      console.error('Error fetching check data:', err);

      const cachedResult = symptomService.getCachedResultById(checkId);
      if (cachedResult) {
        setCheckData(cachedResult);
        setError('Showing your locally saved result because server data was unavailable.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load results');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToRecords = async () => {
    const id = resolveCurrentCheckId();

    try {
      setSaving(true);

      if (!id || id === 'anonymous' || String(id).startsWith('local-')) {
        const updated = symptomService.markCachedResultAsSaved(checkData);
        setCheckData(updated);
        setSuccessMessage('Results saved locally on this device successfully!');
        setError(null);
      } else {
        const response = await symptomService.saveCheckToRecords(id);

        if (!response.success) {
          throw new Error(response.message || 'Failed to save results');
        }

        const updated = symptomService.markCachedResultAsSaved({ ...checkData, checkId: id });
        setCheckData(updated);
        setSuccessMessage('Results saved to medical records successfully!');
        setError(null);
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving results:', err);

      const updated = symptomService.markCachedResultAsSaved(checkData);
      setCheckData(updated);
      setSuccessMessage('Server save failed. Results were saved locally on this device.');
      setError(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const id = resolveCurrentCheckId();

    if (!checkData) {
      setError('No result data available to download.');
      return;
    }

    try {
      if (id && id !== 'anonymous' && !String(id).startsWith('local-')) {
        const pdfBlob = await symptomService.generatePDFReport(id);

        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `symptom-check-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const filename = `symptom-check-${id || 'local'}.pdf`;
        symptomService.downloadPDFReportFromData(checkData, filename);
      }

      setSuccessMessage('PDF downloaded successfully!');
      setError(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error downloading PDF:', err);

      try {
        const fallbackFilename = `symptom-check-${id || 'local'}.pdf`;
        symptomService.downloadPDFReportFromData(checkData, fallbackFilename);
        setSuccessMessage('Server PDF unavailable. Downloaded local PDF instead.');
        setError(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (pdfError) {
        console.error('Fallback PDF generation failed:', pdfError);
        setError('Failed to generate PDF report. Please try again.');
      }
    }
  };

  const getUrgencyClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'urgency-critical';
      case 'high':
        return 'urgency-high';
      case 'medium':
        return 'urgency-medium';
      default:
        return 'urgency-low';
    }
  };

  const getConfidenceClass = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return 'confidence-high';
      case 'medium':
        return 'confidence-medium';
      default:
        return 'confidence-low';
    }
  };

  if (loading) {
    return (
      <div className="symptom-results-container">
        <Loader message="Loading results..." />
      </div>
    );
  }

  if (error && !checkData) {
    return (
      <div className="symptom-results-container">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/symptoms/checker')}>
          ← Back to Symptom Checker
        </Button>
      </div>
    );
  }

  const {
    symptoms = [],
    predictions = [],
    urgencyLevel,
    urgencyMessage,
    recommendations = [],
    recommendedSpecialist,
    recommendedTests = [],
    patientInfo = {},
    createdAt,
    checkId: dataCheckId
  } = checkData || {};
  
  // Display checkId for debugging
  const displayCheckId = checkId || dataCheckId || 'anonymous';

  return (
    <div className="symptom-results-container">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      <div className="results-header">
        <div>
          <h1>🩺 Symptom Check Results</h1>
          <p className="results-timestamp">
            Generated: {createdAt ? new Date(createdAt).toLocaleString() : 'Just now'}
          </p>
        </div>
        <div className="results-actions">
          <Button
            variant="secondary"
            onClick={() => navigate('/symptoms/history')}
          >
            View History
          </Button>
          <Button onClick={() => navigate('/symptoms/checker')}>
            New Check
          </Button>
        </div>
      </div>

      {/* Urgency Alert */}
      <Card className={`urgency-card ${getUrgencyClass(urgencyLevel)}`}>
        <div className="urgency-content">
          <div className="urgency-icon">
            {urgencyLevel === 'critical' && '🚨'}
            {urgencyLevel === 'high' && '⚠️'}
            {urgencyLevel === 'medium' && '⚡'}
            {urgencyLevel === 'low' && 'ℹ️'}
          </div>
          <div className="urgency-text">
            <h3>Urgency Level: {urgencyLevel?.toUpperCase()}</h3>
            <p>{urgencyMessage}</p>
          </div>
        </div>
      </Card>

      <div className="results-content">
        {/* Left Column */}
        <div className="results-left-column">
          {/* Your Symptoms */}
          <Card className="symptoms-card">
            <h3>📋 Your Symptoms ({symptoms.length})</h3>
            <div className="symptoms-list">
              {symptoms.map((symptom, index) => (
                <div key={index} className="symptom-chip">
                  {symptom.label || symptom}
                </div>
              ))}
            </div>

            {patientInfo && Object.keys(patientInfo).length > 0 && (
              <div className="additional-patient-info">
                <h4>Additional Information</h4>
                <div className="info-grid">
                  {patientInfo.age && (
                    <div className="info-item">
                      <span className="info-label">Age:</span>
                      <span className="info-value">{patientInfo.age} years</span>
                    </div>
                  )}
                  {patientInfo.gender && (
                    <div className="info-item">
                      <span className="info-label">Gender:</span>
                      <span className="info-value">{patientInfo.gender}</span>
                    </div>
                  )}
                  {patientInfo.duration && (
                    <div className="info-item">
                      <span className="info-label">Duration:</span>
                      <span className="info-value">{patientInfo.duration}</span>
                    </div>
                  )}
                  {patientInfo.temperature && (
                    <div className="info-item">
                      <span className="info-label">Temperature:</span>
                      <span className="info-value">{patientInfo.temperature}°C</span>
                    </div>
                  )}
                </div>
                {patientInfo.additionalNotes && (
                  <div className="notes-section">
                    <h5>Notes:</h5>
                    <p>{patientInfo.additionalNotes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Recommended Specialist */}
          {recommendedSpecialist && (
            <Card className="specialist-card">
              <h3>👨‍⚕️ Recommended Specialist</h3>
              <div className="specialist-info">
                <div className="specialist-icon">🩺</div>
                <div className="specialist-details">
                  <h4>{recommendedSpecialist}</h4>
                  <p>Based on your symptoms, this specialist can provide the most appropriate care</p>
                </div>
              </div>
              <Button className="book-appointment-btn" onClick={() => navigate('/patient/book-appointment')}>
                Book Appointment
              </Button>
            </Card>
          )}

          {/* Recommended Tests */}
          {recommendedTests && recommendedTests.length > 0 && (
            <Card className="tests-card">
              <h3>🧪 Recommended Tests</h3>
              <div className="tests-list">
                {recommendedTests.map((test, index) => (
                  <div key={index} className="test-item">
                    <span className="test-icon">🔬</span>
                    <span className="test-name">{test}</span>
                  </div>
                ))}
              </div>
              <Button className="book-test-btn" onClick={() => navigate('/laboratory/book-test')}>
                Book Lab Tests
              </Button>
            </Card>
          )}
          
          {/* Recommendations from Backend */}
          {recommendations && recommendations.length > 0 && (
            <Card className="recommendations-card">
              <h3>💡 Recommendations</h3>
              <div className="recommendations-list">
                {recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation-item recommendation-${rec.type}`}>
                    <span className="rec-icon">
                      {rec.type === 'urgent' && '🚨'}
                      {rec.type === 'important' && '⚠️'}
                      {rec.type === 'tests' && '🧪'}
                      {rec.type === 'self-care' && '💊'}
                      {rec.type === 'normal' && 'ℹ️'}
                    </span>
                    <span className="rec-message">{rec.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Predictions */}
        <div className="results-right-column">
          <h2>🎯 AI Analysis Results</h2>

          {predictions.length === 0 ? (
            <Card className="no-predictions-card">
              <p>No predictions available. Please consult a healthcare professional.</p>
            </Card>
          ) : (
            predictions.map((prediction, index) => (
              <Card key={index} className="prediction-card">
                <div className="prediction-header">
                  <div>
                    <h3>{prediction.disease}</h3>
                    <span className={`confidence-badge ${getConfidenceClass(prediction.confidence)}`}>
                      {prediction.confidence} confidence
                    </span>
                  </div>
                  <div className="probability-circle">
                    <svg viewBox="0 0 36 36" className="probability-svg">
                      <path
                        className="probability-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="probability-fill"
                        strokeDasharray={`${prediction.probability * 100}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="probability-text">
                      {Math.round(prediction.probability * 100)}%
                    </div>
                  </div>
                </div>

                {prediction.description && (
                  <div className="prediction-description">
                    <h4>📖 Description</h4>
                    <p>{prediction.description}</p>
                  </div>
                )}

                {prediction.precautions && prediction.precautions.length > 0 && (
                  <div className="prediction-precautions">
                    <h4>🛡️ Precautions</h4>
                    <ul>
                      {prediction.precautions.map((precaution, idx) => (
                        <li key={idx}>{precaution}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="actions-card">
        <div className="action-buttons">
          <Button
            onClick={handleSaveToRecords}
            disabled={saving || checkData?.savedToRecords}
            className={checkData?.savedToRecords ? 'saved' : ''}
          >
            {saving ? 'Saving...' : checkData?.savedToRecords ? '✓ Saved to Records' : '💾 Save to Medical Records'}
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF}>
            📄 Download PDF Report
          </Button>
          <Button variant="outline" onClick={() => navigate('/symptoms/checker')}>
            🔄 New Symptom Check
          </Button>
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="disclaimer-card">
        <h4>⚠️ Important Disclaimer</h4>
        <p>
          This AI-powered symptom checker provides informational insights based on machine learning analysis.
          It is NOT a substitute for professional medical diagnosis or treatment. Always consult with qualified
          healthcare professionals for accurate diagnosis and appropriate medical care.
        </p>
      </Card>
    </div>
  );
};

export default SymptomResults;