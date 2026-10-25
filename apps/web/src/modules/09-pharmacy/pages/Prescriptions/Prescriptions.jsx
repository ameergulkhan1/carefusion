import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import pharmacyService from '../../services/pharmacyService';
import './Prescriptions.css';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, processing, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [filter]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getPrescriptions({ status: filter === 'all' ? undefined : filter });
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.prescriptions)
          ? response.data.prescriptions
          : [];
      setPrescriptions(list);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowModal(true);
  };

  const handleUpdateStatus = async (prescriptionId, newStatus) => {
    try {
      await pharmacyService.updatePrescriptionStatus(prescriptionId, newStatus);
      toast.success(`Prescription ${newStatus} successfully`);
      fetchPrescriptions();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating prescription:', error);
      toast.error('Failed to update prescription status');
    }
  };

  const handleProcessPrescription = async (prescriptionId) => {
    try {
      await pharmacyService.updatePrescriptionStatus(prescriptionId, 'processing');
      toast.success('Prescription processed successfully');
      fetchPrescriptions();
      setShowModal(false);
    } catch (error) {
      console.error('Error processing prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to process prescription');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const searchLower = searchTerm.toLowerCase();
    const prescriptionNo = prescription.prescriptionId || prescription.prescriptionNo || prescription.prescriptionNumber || '';
    const patientName = prescription.patientId 
      ? prescription.patientId?.user?.fullName || 'Unknown Patient'
      : prescription.patient || '';
    const doctorName = prescription.doctorId 
      ? `Dr. ${prescription.doctorId?.user?.fullName || 'Unknown'}`
      : prescription.doctor || '';

    return prescriptionNo.toLowerCase().includes(searchLower) ||
           patientName.toLowerCase().includes(searchLower) ||
           doctorName.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="prescriptions-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prescriptions-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Prescription Management</h1>
          <p className="subtitle">Manage and process prescriptions</p>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-box">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by prescription no, patient, or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {['all', 'pending', 'processing', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="prescriptions-list">
        {filteredPrescriptions.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3>No prescriptions found</h3>
            <p>There are no prescriptions matching your filters</p>
          </div>
        ) : (
          filteredPrescriptions.map(prescription => (
            <div key={prescription._id || prescription.id} className="prescription-card">
              <div className="prescription-main">
                <div className="prescription-header">
                  <div className="prescription-info">
                    <h3>{prescription.prescriptionId || prescription.prescriptionNo || prescription.prescriptionNumber || 'N/A'}</h3>
                    <span className={`status-badge status-${prescription.status}`}>
                      {prescription.status}
                    </span>
                  </div>
                  <div className="prescription-time">
                    {formatTime(prescription.createdAt || prescription.updatedAt)}
                  </div>
                </div>

                <div className="prescription-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <span className="label">Patient:</span>
                        <span className="value">
                          {prescription.patientId 
                            ? prescription.patientId?.user?.fullName || 'Unknown'
                            : prescription.patient || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <span className="label">Doctor:</span>
                        <span className="value">
                          {prescription.doctorId 
                            ? `Dr. ${prescription.doctorId?.user?.fullName || 'Unknown'}`
                            : prescription.doctor || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <div>
                        <span className="label">Medications:</span>
                        <span className="value">{prescription.medications?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="prescription-actions">
                  <button
                    className="btn-view"
                    onClick={() => handleViewDetails(prescription)}
                  >
                    View Details
                  </button>
                  {prescription.status === 'pending' && (
                    <button
                      className="btn-process"
                      onClick={() => handleProcessPrescription(prescription._id || prescription.id)}
                    >
                      Process
                    </button>
                  )}
                  {prescription.status === 'processing' && (
                    <button
                      className="btn-complete"
                      onClick={() => handleUpdateStatus(prescription._id || prescription.id, 'completed')}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedPrescription && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Prescription Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Prescription Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Prescription No:</span>
                    <span className="info-value">{selectedPrescription.prescriptionId || selectedPrescription.prescriptionNo || selectedPrescription.prescriptionNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className={`status-badge status-${selectedPrescription.status}`}>
                      {selectedPrescription.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date:</span>
                    <span className="info-value">
                      {new Date(selectedPrescription.createdAt || selectedPrescription.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Patient Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">
                      {selectedPrescription.patientId 
                        ? selectedPrescription.patientId?.user?.fullName || 'Unknown'
                        : selectedPrescription.patient || 'Unknown'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Contact:</span>
                    <span className="info-value">
                      {selectedPrescription.patientId?.user?.phone || selectedPrescription.patientContact || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Doctor Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">
                      {selectedPrescription.doctorId 
                        ? `Dr. ${selectedPrescription.doctorId?.user?.fullName || 'Unknown'}`
                        : selectedPrescription.doctor || 'Unknown'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Specialization:</span>
                    <span className="info-value">
                      {selectedPrescription.doctorId?.specialization || selectedPrescription.doctor?.specialization || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Medications</h3>
                <div className="medications-list">
                  {selectedPrescription.medications?.map((med, index) => (
                    <div key={index} className="medication-item">
                      <div className="medication-header">
                        <h4>{med.medicationName || med.medicineName || med.name}</h4>
                        <span className="medication-dosage">{med.dosage}</span>
                      </div>
                      <div className="medication-details">
                        <span>Frequency: {med.frequency}</span>
                        <span>Duration: {med.duration}</span>
                        <span>Quantity: {med.quantity}</span>
                      </div>
                      {med.instructions && (
                        <div className="medication-instructions">
                          <strong>Instructions:</strong> {med.instructions}
                        </div>
                      )}
                    </div>
                  )) || <p>No medications listed</p>}
                </div>
              </div>

              {selectedPrescription.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <p className="notes-text">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedPrescription.status === 'pending' && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => handleUpdateStatus(selectedPrescription._id || selectedPrescription.id, 'cancelled')}
                  >
                    Cancel Prescription
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleProcessPrescription(selectedPrescription._id || selectedPrescription.id)}
                  >
                    Process Prescription
                  </button>
                </>
              )}
              {selectedPrescription.status === 'processing' && (
                <button
                  className="btn-primary"
                  onClick={() => handleUpdateStatus(selectedPrescription._id || selectedPrescription.id, 'completed')}
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
