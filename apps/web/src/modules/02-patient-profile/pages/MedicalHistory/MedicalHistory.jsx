import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { patientService } from '../../services/patientService';
import './MedicalHistory.css';

const MedicalHistory = () => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await patientService.getMedicalHistory();
      if (response.success && response.data) {
        setHistoryData(response.data);
      } else {
        setHistoryData(null);
      }
    } catch (error) {
      console.error('History fetch error:', error);
      toast.error(error.message || 'Failed to load medical history');
      setHistoryData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = (type) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const serviceMap = {
        history: patientService.addMedicalHistory,
        condition: patientService.addChronicCondition,
        allergy: patientService.addAllergy,
        surgery: patientService.addSurgery,
        vaccination: patientService.addVaccination
      };

      await serviceMap[modalType](formData);
      toast.success(`${modalType} added successfully`);
      setShowModal(false);
      fetchHistory();
    } catch (error) {
      toast.error(error.message || 'Failed to add entry');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      if (type === 'history') {
        await patientService.deleteMedicalHistory(id);
      }
      toast.success('Entry deleted successfully');
      fetchHistory();
    } catch (error) {
      toast.error(error.message || 'Failed to delete entry');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="medical-history">
      <div className="page-header">
        <h1 className="page-title">Medical History</h1>
        <p className="page-subtitle">Track your health journey over time</p>
      </div>

      <div className="history-tabs">
        <button
          className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button
          className={`tab-button ${activeTab === 'conditions' ? 'active' : ''}`}
          onClick={() => setActiveTab('conditions')}
        >
          Chronic Conditions
        </button>
        <button
          className={`tab-button ${activeTab === 'allergies' ? 'active' : ''}`}
          onClick={() => setActiveTab('allergies')}
        >
          Allergies
        </button>
        <button
          className={`tab-button ${activeTab === 'surgeries' ? 'active' : ''}`}
          onClick={() => setActiveTab('surgeries')}
        >
          Surgeries
        </button>
        <button
          className={`tab-button ${activeTab === 'vaccinations' ? 'active' : ''}`}
          onClick={() => setActiveTab('vaccinations')}
        >
          Vaccinations
        </button>
      </div>

      {/* Timeline View */}
      {activeTab === 'timeline' && (
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">Medical Timeline</h3>
            <button className="btn-add" onClick={() => handleAddEntry('history')}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Entry
            </button>
          </div>

          {historyData?.medicalHistory && historyData.medicalHistory.length > 0 ? (
            <div className="timeline">
              {historyData.medicalHistory.map((entry) => (
                <div key={entry._id} className="timeline-item">
                  <div className="timeline-card">
                    <div className="timeline-header">
                      <div className="timeline-event">
                        <span className={`event-type type-${entry.eventType}`}>
                          {entry.eventType}
                        </span>
                        <h4 className="event-title">{entry.condition}</h4>
                        <p className="event-date">{formatDate(entry.diagnosedDate)}</p>
                      </div>
                      <div className="event-actions">
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(entry._id, 'history')}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="timeline-body">
                      {entry.doctor && (
                        <div className="event-detail">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Doctor: {entry.doctor}</span>
                        </div>
                      )}
                      {entry.hospital && (
                        <div className="event-detail">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>Hospital: {entry.hospital}</span>
                        </div>
                      )}
                      {entry.notes && (
                        <div className="event-detail">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{entry.notes}</span>
                        </div>
                      )}
                      {entry.status && (
                        <span className={`status-badge status-${entry.status}`}>
                          {entry.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3 className="empty-title">No medical history entries</h3>
              <p className="empty-text">Start adding your medical history to track your health journey</p>
            </div>
          )}
        </div>
      )}

      {/* Chronic Conditions */}
      {activeTab === 'conditions' && (
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">Chronic Conditions</h3>
            <button className="btn-add" onClick={() => handleAddEntry('condition')}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Condition
            </button>
          </div>

          {historyData?.chronicConditions && historyData.chronicConditions.length > 0 ? (
            <div className="cards-grid">
              {historyData.chronicConditions.map((condition, index) => (
                <div key={index} className="condition-card">
                  <div className="card-header">
                    <h4 className="card-title">{condition.condition}</h4>
                  </div>
                  <div className="card-body">
                    {condition.currentMedication && (
                      <p><strong>Medication:</strong> {condition.currentMedication}</p>
                    )}
                    {condition.notes && <p>{condition.notes}</p>}
                  </div>
                  <div className="card-meta">
                    {condition.diagnosedDate && (
                      <div className="meta-item">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Diagnosed: {formatDate(condition.diagnosedDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🩺</div>
              <h3 className="empty-title">No chronic conditions recorded</h3>
            </div>
          )}
        </div>
      )}

      {/* Allergies */}
      {activeTab === 'allergies' && (
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">Allergies</h3>
            <button className="btn-add" onClick={() => handleAddEntry('allergy')}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Allergy
            </button>
          </div>

          {historyData?.allergies && historyData.allergies.length > 0 ? (
            <div className="cards-grid">
              {historyData.allergies.map((allergy, index) => (
                <div key={index} className="allergy-card">
                  <div className="card-header">
                    <h4 className="card-title">{allergy.allergen}</h4>
                    <span className={`severity-badge severity-${allergy.severity}`}>
                      {allergy.severity}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Type:</strong> {allergy.allergyType}</p>
                    {allergy.reaction && <p><strong>Reaction:</strong> {allergy.reaction}</p>}
                  </div>
                  <div className="card-meta">
                    {allergy.diagnosedDate && (
                      <div className="meta-item">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Diagnosed: {formatDate(allergy.diagnosedDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <h3 className="empty-title">No allergies recorded</h3>
            </div>
          )}
        </div>
      )}

      {/* Surgeries */}
      {activeTab === 'surgeries' && (
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">Surgeries</h3>
            <button className="btn-add" onClick={() => handleAddEntry('surgery')}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Surgery
            </button>
          </div>

          {historyData?.surgeries && historyData.surgeries.length > 0 ? (
            <div className="cards-grid">
              {historyData.surgeries.map((surgery, index) => (
                <div key={index} className="surgery-card">
                  <div className="card-header">
                    <h4 className="card-title">{surgery.procedureName}</h4>
                  </div>
                  <div className="card-body">
                    {surgery.surgeon && <p><strong>Surgeon:</strong> {surgery.surgeon}</p>}
                    {surgery.hospital && <p><strong>Hospital:</strong> {surgery.hospital}</p>}
                    {surgery.notes && <p>{surgery.notes}</p>}
                  </div>
                  <div className="card-meta">
                    <div className="meta-item">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Date: {formatDate(surgery.surgeryDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔪</div>
              <h3 className="empty-title">No surgeries recorded</h3>
            </div>
          )}
        </div>
      )}

      {/* Vaccinations */}
      {activeTab === 'vaccinations' && (
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">Vaccinations</h3>
            <button className="btn-add" onClick={() => handleAddEntry('vaccination')}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Vaccination
            </button>
          </div>

          {historyData?.vaccinations && historyData.vaccinations.length > 0 ? (
            <div className="cards-grid">
              {historyData.vaccinations.map((vaccination, index) => (
                <div key={index} className="vaccination-card">
                  <div className="card-header">
                    <h4 className="card-title">{vaccination.vaccineName}</h4>
                  </div>
                  <div className="card-body">
                    {vaccination.administeredBy && <p><strong>Administered by:</strong> {vaccination.administeredBy}</p>}
                  </div>
                  <div className="card-meta">
                    <div className="meta-item">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Date: {formatDate(vaccination.dateAdministered)}</span>
                    </div>
                    {vaccination.nextDueDate && (
                      <div className="meta-item">
                        <span>Next due: {formatDate(vaccination.nextDueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💉</div>
              <h3 className="empty-title">No vaccinations recorded</h3>
            </div>
          )}
        </div>
      )}

      {/* Add Entry Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Add {modalType === 'history' ? 'Medical History Entry' : modalType}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                {modalType === 'history' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Event Type *</label>
                      <select
                        className="form-select"
                        value={formData.eventType || ''}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      >
                        <option value="">Select type</option>
                        <option value="diagnosis">Diagnosis</option>
                        <option value="surgery">Surgery</option>
                        <option value="allergy">Allergy</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="medication">Medication</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Condition/Procedure *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.condition || ''}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.diagnosedDate || ''}
                        onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.status || ''}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="">Select status</option>
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="chronic">Chronic</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Doctor</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.doctor || ''}
                        onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hospital</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.hospital || ''}
                        onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-textarea"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {modalType === 'allergy' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Allergen *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.allergen || ''}
                        onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type *</label>
                      <select
                        className="form-select"
                        value={formData.allergyType || ''}
                        onChange={(e) => setFormData({ ...formData, allergyType: e.target.value })}
                      >
                        <option value="">Select type</option>
                        <option value="medication">Medication</option>
                        <option value="food">Food</option>
                        <option value="environmental">Environmental</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Severity</label>
                      <select
                        className="form-select"
                        value={formData.severity || ''}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      >
                        <option value="">Select severity</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Diagnosed Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.diagnosedDate || ''}
                        onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label className="form-label">Reaction</label>
                      <textarea
                        className="form-textarea"
                        value={formData.reaction || ''}
                        onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleSubmit}>
                Add {modalType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;