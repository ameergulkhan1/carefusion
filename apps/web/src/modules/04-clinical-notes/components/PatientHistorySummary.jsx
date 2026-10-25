import React, { useState, useEffect } from 'react';
import clinicalNotesService from '../services/clinicalNotesService';
import './PatientHistorySummary.css';

const PatientHistorySummary = ({ patientId, onImportNote }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await clinicalNotesService.getPatientHistory(patientId);
      setHistory(response.data.slice(0, 5)); // Last 5 visits
    } catch (err) {
      console.error('Error fetching patient history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!patientId) return null;

  return (
    <div className="patient-history-summary">
      <div className="history-header" onClick={() => setExpanded(!expanded)}>
        <h4>📋 Patient History</h4>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="history-content">
          {loading ? (
            <div className="loading">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="empty">No previous visits</div>
          ) : (
            <div className="history-list">
              {history.map((visit) => (
                <div key={visit._id} className="history-item">
                  <div className="visit-date">{formatDate(visit.visitDate)}</div>
                  <div className="visit-info">
                    <div className="chief-complaint">{visit.subjective?.chiefComplaint || 'N/A'}</div>
                    {visit.assessment?.primaryDiagnosis?.description && (
                      <div className="diagnosis">
                        Dx: {visit.assessment.primaryDiagnosis.description}
                      </div>
                    )}
                  </div>
                  <button 
                    className="import-btn"
                    onClick={() => onImportNote(visit._id)}
                    title="Import data from this visit"
                  >
                    Import
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientHistorySummary;
