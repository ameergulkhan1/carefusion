import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import communicationService from '../../services/communicationService';
import './PatientRecordsSharing.css';

const PatientRecordsSharing = () => {
  const { user } = useAuth();
  const [patientRecords, setPatientRecords] = useState([]);
  const [sharedRecords, setSharedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [recordTypes, setRecordTypes] = useState([]);

  useEffect(() => {
    const loadSharedRecords = async () => {
      try {
        setLoading(true);
        const response = await communicationService.getSharedRecords();
        const records = Array.isArray(response?.data) ? response.data : 
                       response?.records ? response.records : [];
        setSharedRecords(records);
        setError(null);
      } catch (err) {
        console.error('Failed to load shared records:', err);
        setError('Failed to load shared records');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSharedRecords();
    }
  }, [user]);

  // For doctors: Load patients they can share records for
  // This would typically come from the patient module or API
  const loadAvailablePatients = async () => {
    // Mock data - would be replaced with actual API call
    setPatientRecords([
      {
        id: '1',
        name: 'John Doe',
        recordTypes: [
          { id: 'clinical-notes', label: 'Clinical Notes', icon: '📋' },
          { id: 'lab-results', label: 'Lab Results', icon: '🧪' },
          { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
          { id: 'imaging', label: 'Imaging Reports', icon: '🖼️' }
        ]
      },
      {
        id: '2',
        name: 'Jane Smith',
        recordTypes: [
          { id: 'clinical-notes', label: 'Clinical Notes', icon: '📋' },
          { id: 'lab-results', label: 'Lab Results', icon: '🧪' },
          { id: 'vital-signs', label: 'Vital Signs', icon: '❤️' }
        ]
      }
    ]);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setRecordTypes(patient.recordTypes);
    setShowShareModal(true);
  };

  const handleShareRecords = async () => {
    if (!selectedPatient || selectedDoctors.length === 0 || recordTypes.length === 0) {
      setError('Please select patient, doctors, and record types');
      return;
    }

    try {
      const shareData = {
        patientId: selectedPatient.id,
        recipientDoctorIds: selectedDoctors,
        recordTypes: recordTypes.map(rt => rt.id),
        accessLevel: 'read-only',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      const response = await communicationService.sharePatientRecords(shareData);
      
      // Add to shared records list
      if (response?.data) {
        setSharedRecords([...sharedRecords, response.data]);
      }

      setShowShareModal(false);
      setSelectedPatient(null);
      setSelectedDoctors([]);
      setSuccess('Patient records shared successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to share records:', err);
      setError('Failed to share records. Please try again.');
    }
  };

  const handleRevokeAccess = async (shareId) => {
    try {
      await communicationService.revokeRecordShare(shareId);
      setSharedRecords(sharedRecords.filter(r => (r._id || r.id) !== shareId));
      setSuccess('Access revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to revoke access:', err);
      setError('Failed to revoke access');
    }
  };

  const toggleDoctorSelection = (doctorId) => {
    setSelectedDoctors(prev =>
      prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const toggleRecordType = (recordType) => {
    setRecordTypes(prev =>
      prev.some(rt => rt.id === recordType.id)
        ? prev.filter(rt => rt.id !== recordType.id)
        : [...prev, recordType]
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    loadAvailablePatients();
  }, []);

  return (
    <div className="patient-records-sharing">
      <div className="sharing-header">
        <h2>Patient Records Sharing</h2>
        <p className="subtitle">Securely share patient medical records with other healthcare providers</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="sharing-container">
        {/* Share New Records */}
        <div className="share-section">
          <h3>Share New Records</h3>
          {loading ? (
            <div className="loading-state">Loading your patients...</div>
          ) : patientRecords.length === 0 ? (
            <div className="empty-state">
              <p>No patients to share records for</p>
            </div>
          ) : (
            <div className="patients-grid">
              {patientRecords.map(patient => (
                <div key={patient.id} className="patient-card">
                  <div className="patient-header">
                    <h4>{patient.name}</h4>
                    <span className="record-count">{patient.recordTypes.length} record types</span>
                  </div>
                  <div className="record-types-preview">
                    {patient.recordTypes.map(rt => (
                      <span key={rt.id} className="type-badge">{rt.icon} {rt.label}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSelectPatient(patient)}
                    className="btn-share"
                  >
                    Share Records
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Already Shared Records */}
        <div className="shared-section">
          <h3>Currently Shared Records</h3>
          {loading ? (
            <div className="loading-state">Loading shared records...</div>
          ) : sharedRecords.length === 0 ? (
            <div className="empty-state">
              <p>No records shared yet</p>
            </div>
          ) : (
            <div className="shared-list">
              {sharedRecords.map(record => (
                <div key={record._id || record.id} className="shared-record-item">
                  <div className="record-info">
                    <h4>{record.patientName || record.patient?.name}</h4>
                    <p className="shared-with">
                      Shared with: <strong>{record.recipientDoctors?.map(d => d.name).join(', ')}</strong>
                    </p>
                    <p className="record-types">
                      Types: {record.recordTypes?.join(', ')}
                    </p>
                    <p className="access-level">
                      Access: <span className={`badge access-${record.accessLevel}`}>{record.accessLevel}</span>
                    </p>
                    <p className="expiry-date">
                      Expires: {formatDate(record.expiryDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeAccess(record._id || record.id)}
                    className="btn-revoke"
                  >
                    Revoke Access
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Share Records for {selectedPatient.name}</h3>
              <button
                className="close-btn"
                onClick={() => setShowShareModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Record Types Selection */}
              <div className="selection-section">
                <h4>Select Record Types to Share</h4>
                <div className="record-types-list">
                  {selectedPatient.recordTypes.map(rt => (
                    <label key={rt.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={recordTypes.some(r => r.id === rt.id)}
                        onChange={() => toggleRecordType(rt)}
                      />
                      <span>{rt.icon} {rt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Doctor Selection */}
              <div className="selection-section">
                <h4>Select Doctors to Share With</h4>
                <div className="doctors-input">
                  <input
                    type="text"
                    placeholder="Enter doctor IDs (comma-separated) or search..."
                    onChange={(e) => {
                      // This would trigger a search API call
                      const ids = e.target.value.split(',').map(id => id.trim()).filter(Boolean);
                      setSelectedDoctors(ids);
                    }}
                    className="form-input"
                  />
                </div>
                {selectedDoctors.length > 0 && (
                  <div className="selected-doctors">
                    {selectedDoctors.map(doctorId => (
                      <span key={doctorId} className="doctor-tag">
                        {doctorId}
                        <button
                          onClick={() => toggleDoctorSelection(doctorId)}
                          className="remove-btn"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Access Level */}
              <div className="selection-section">
                <h4>Access Level</h4>
                <div className="access-options">
                  <label className="radio-item">
                    <input type="radio" name="access" defaultChecked />
                    <span>Read-Only (Recommended)</span>
                  </label>
                  <label className="radio-item">
                    <input type="radio" name="access" />
                    <span>Read & Comment</span>
                  </label>
                </div>
              </div>

              {/* Expiry */}
              <div className="selection-section">
                <h4>Access Expiry</h4>
                <input type="date" className="form-input" />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={handleShareRecords}
                className="btn-primary"
              >
                Share Records
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordsSharing;
