import React, { useState, useEffect } from 'react';
import clinicalNotesService from '../services/clinicalNotesService';
import Button from '../../../components/common/Button/Button';
import './AINoteSuggestions.css';

const AINoteSuggestions = ({ onApply, onClose, patientId, noteData }) => {
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateSuggestions();
  }, []);

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      const payload = {
        patient: patientId,
        rawTranscript: `${noteData.subjective.chiefComplaint} ${noteData.subjective.historyPresentIllness}`,
        patientHistory: {
          pastConditions: noteData.subjective.pastMedicalHistory || [],
          currentMedications: noteData.subjective.currentMedications || [],
          allergies: noteData.subjective.allergies || []
        }
      };

      const response = await clinicalNotesService.generateAINote(payload);
      const generatedNote = response?.generatedNote || response?.data?.generatedNote || null;
      const warnings = response?.warnings || response?.data?.warnings || [];

      setAiSuggestions({
        ...(generatedNote || {}),
        warnings
      });
      setError(null);
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
      setError('Failed to generate AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-suggestions-panel loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>AI is analyzing the information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-suggestions-panel error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
        <div className="panel-actions">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={generateSuggestions}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-suggestions-panel">
      <div className="panel-header">
        <div className="header-title">
          <span className="ai-icon">🤖</span>
          <h3>AI Suggestions</h3>
        </div>
        <div className="confidence-badge">
          Confidence: {((aiSuggestions?.confidence || 0) * 100).toFixed(0)}%
        </div>
      </div>

      <div className="suggestions-content">
        {aiSuggestions?.chiefComplaint && (
          <div className="suggestion-section">
            <h4>Chief Complaint</h4>
            <p>{aiSuggestions.chiefComplaint}</p>
          </div>
        )}

        {aiSuggestions?.HPI && (
          <div className="suggestion-section">
            <h4>History of Present Illness</h4>
            <p>{aiSuggestions.HPI}</p>
          </div>
        )}

        {aiSuggestions?.assessment && (
          <div className="suggestion-section">
            <h4>Assessment</h4>
            {aiSuggestions.assessment.diagnosis && (
              <div className="diagnosis">
                <strong>Diagnosis:</strong> {aiSuggestions.assessment.diagnosis}
                {aiSuggestions.assessment.icd10 && (
                  <span className="icd-code"> ({aiSuggestions.assessment.icd10})</span>
                )}
              </div>
            )}
            {aiSuggestions.assessment.differentialDiagnoses && aiSuggestions.assessment.differentialDiagnoses.length > 0 && (
              <div className="differential">
                <strong>Differential Diagnoses:</strong>
                <ul>
                  {aiSuggestions.assessment.differentialDiagnoses.map((dx, idx) => (
                    <li key={idx}>{dx}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {aiSuggestions?.plan && (
          <div className="suggestion-section">
            <h4>Plan</h4>
            {aiSuggestions.plan.medications && aiSuggestions.plan.medications.length > 0 && (
              <div className="plan-item">
                <strong>Medications:</strong>
                <ul>
                  {aiSuggestions.plan.medications.map((med, idx) => (
                    <li key={idx}>{med}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSuggestions.plan.nonPharmacologic && aiSuggestions.plan.nonPharmacologic.length > 0 && (
              <div className="plan-item">
                <strong>Non-Pharmacologic:</strong>
                <ul>
                  {aiSuggestions.plan.nonPharmacologic.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSuggestions.plan.followUp && (
              <div className="plan-item">
                <strong>Follow-up:</strong> {aiSuggestions.plan.followUp}
              </div>
            )}
            {aiSuggestions.plan.education && aiSuggestions.plan.education.length > 0 && (
              <div className="plan-item">
                <strong>Patient Education:</strong>
                <ul>
                  {aiSuggestions.plan.education.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {aiSuggestions?.warnings && aiSuggestions.warnings.length > 0 && (
          <div className="warnings-section">
            <h4>⚠️ Warnings</h4>
            <ul>
              {aiSuggestions.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {aiSuggestions?.suggestions && aiSuggestions.suggestions.length > 0 && (
          <div className="additional-suggestions">
            <h4>💡 Additional Suggestions</h4>
            <ul>
              {aiSuggestions.suggestions.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="panel-actions">
        <Button variant="secondary" onClick={onClose}>
          Dismiss
        </Button>
        <Button variant="primary" onClick={() => onApply(aiSuggestions || {})}>
          Apply Suggestions
        </Button>
      </div>
    </div>
  );
};

export default AINoteSuggestions;