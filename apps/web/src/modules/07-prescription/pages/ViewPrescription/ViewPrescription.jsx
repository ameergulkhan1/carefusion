import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../../../../components/common/Card/Card';
import Button from '../../../../components/common/Button/Button';
import Alert from '../../../../components/common/Alert/Alert';
import Loader from '../../../../components/common/Loader/Loader';
import { useAuth } from '../../../../context/AuthContext';
import prescriptionService from '../../services/prescriptionService';
import './ViewPrescription.css';

const ViewPrescription = () => {
  const { prescriptionId } = useParams();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, [filter, prescriptionId]);

  useEffect(() => {
    if (user?.role === 'doctor' || user?.role === 'patient') {
      fetchPharmacies();
    }
  }, [user?.role]);

  useEffect(() => {
    if (!prescriptionId) return;
    const found = prescriptions.find((item) => (item._id || item.id) === prescriptionId);
    if (found) {
      setSelectedPrescription(found);
    }
  }, [prescriptionId, prescriptions]);

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.prescriptions)) return data.prescriptions;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = filter !== 'all' ? { status: filter } : {};
      const response = await prescriptionService.getPrescriptions(filters);
      
      if (response.success) {
        const list = normalizeList(response.data);
        setPrescriptions(list);

        if (prescriptionId) {
          const direct = list.find((item) => (item._id || item.id) === prescriptionId);
          if (direct) {
            setSelectedPrescription(direct);
          } else {
            const detailResponse = await prescriptionService.getPrescriptionById(prescriptionId);
            if (detailResponse?.success && detailResponse.data) {
              setSelectedPrescription(detailResponse.data);
            }
          }
        }
      } else {
        const message = response.message || 'Failed to fetch prescriptions';
        toast.error(message);
        setError(message);
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to load prescriptions';
      toast.error(message);
      setError(message);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const response = await prescriptionService.getAvailablePharmacies();
      if (response?.success) {
        setPharmacies(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.warn('Unable to load pharmacies:', err?.message || err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'green',
      completed: 'blue',
      cancelled: 'red',
      pending: 'gray',
      processing: 'purple',
      ready: 'teal',
      dispensed: 'blue'
    };
    
    return (
      <span className={`status-badge status-${statusColors[status] || 'gray'}`}>
        {status}
      </span>
    );
  };

  const getRoleBasedTitle = () => {
    if (user?.role === 'doctor') return 'Issued Prescriptions';
    if (user?.role === 'pharmacy') return 'Pharmacy Prescriptions';
    return 'My Prescriptions';
  };

  const handleMarkDispensed = async (id) => {
    try {
      setActionLoading(true);
      const response = await prescriptionService.markAsDispensed(id);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to mark as dispensed');
      }

      toast.success('Prescription marked as dispensed');
      await fetchPrescriptions();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToPharmacy = async () => {
    if (!selectedPrescription?._id) return;
    if (!selectedPharmacyId) {
      toast.error('Please select a pharmacy first');
      return;
    }

    try {
      setActionLoading(true);
      const response = await prescriptionService.sendToPharmacy(selectedPrescription._id, {
        pharmacyId: selectedPharmacyId
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to send to pharmacy');
      }

      toast.success('Prescription sent to pharmacy');
      await fetchPrescriptions();
      setSelectedPharmacyId('');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send to pharmacy');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRefill = async () => {
    if (!selectedPrescription?._id) return;
    const notes = window.prompt('Optional refill note for doctor/pharmacy:', '') || '';

    try {
      setActionLoading(true);
      const response = await prescriptionService.requestRefill(selectedPrescription._id, { notes });
      if (!response?.success) {
        throw new Error(response?.message || 'Refill request failed');
      }
      toast.success('Refill requested successfully');
      await fetchPrescriptions();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Refill request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewPrescription = async () => {
    if (!selectedPrescription?._id) return;

    const validUntil = window.prompt('Renew valid until date (YYYY-MM-DD):', '') || '';
    const maxRefills = window.prompt('Set max refills after renewal:', '0');
    const reason = window.prompt('Renewal reason:', 'Doctor renewal') || 'Doctor renewal';

    try {
      setActionLoading(true);
      const response = await prescriptionService.renewPrescription(selectedPrescription._id, {
        validUntil: validUntil || undefined,
        maxRefills: maxRefills !== null && maxRefills !== '' ? Number(maxRefills) : undefined,
        reason
      });
      if (!response?.success) {
        throw new Error(response?.message || 'Renewal failed');
      }
      toast.success('Prescription renewed successfully');
      await fetchPrescriptions();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Renewal failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="view-prescription-page">
      <div className="page-header">
        <h2>{getRoleBasedTitle()}</h2>
      </div>

      <div className="filters">
        <Button 
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'active' ? 'primary' : 'secondary'}
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button 
          variant={filter === 'completed' ? 'primary' : 'secondary'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>

        {(user?.role === 'pharmacy' || user?.role === 'doctor') && (
          <Button
            variant={filter === 'pending,processing,ready' ? 'primary' : 'secondary'}
            onClick={() => setFilter('pending,processing,ready')}
          >
            Pending
          </Button>
        )}
      </div>

      {loading ? (
        <Loader message="Loading prescriptions..." />
      ) : error ? (
        <Alert type="error" message={error} onClose={() => setError('')} />
      ) : prescriptions.length === 0 ? (
        <div className="empty-state">
          <p>No prescriptions found</p>
        </div>
      ) : (
        <div className="prescriptions-grid">
          {prescriptions.map((prescription) => (
            <Card key={prescription._id} className="prescription-card">
              <div className="prescription-header">
                <div>
                  <h3>{prescription.prescriptionId || prescription._id}</h3>
                  <p className="specialization">
                    {user?.role === 'doctor'
                      ? `Patient: ${prescription?.patientId?.user?.fullName || 'Unknown'}`
                      : `Dr. ${prescription.doctor?.name || prescription?.doctorId?.user?.fullName || 'Unknown'}`}
                  </p>
                </div>
                {getStatusBadge(prescription.status)}
              </div>
              
              <div className="prescription-meta">
                <p><strong>Date:</strong> {formatDate(prescription.prescriptionDate)}</p>
                {prescription.diagnosis && (
                  <p><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
                )}
                {prescription.validUntil && (
                  <p><strong>Valid Until:</strong> {formatDate(prescription.validUntil)}</p>
                )}
              </div>

              <div className="medications-section">
                <h4>Medications ({prescription.medications?.length || 0})</h4>
                {prescription.medications && prescription.medications.length > 0 ? (
                  <div className="medications-list">
                    {prescription.medications.map((med, index) => (
                      <div key={index} className="medication-item">
                        <div className="medication-name">{med.medicationName}</div>
                        <div className="medication-details">
                          <span className="dosage">{med.dosage}</span>
                          <span className="frequency">{med.frequency}</span>
                          <span className="duration">{med.duration}</span>
                        </div>
                        {med.instructions && (
                          <p className="instructions">{med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-medications">No medications prescribed</p>
                )}
              </div>

              {prescription.notes && (
                <div className="prescription-notes">
                  <strong>Notes:</strong>
                  <p>{prescription.notes}</p>
                </div>
              )}

              <div className="prescription-actions">
                <Button 
                  variant="primary" 
                  size="small"
                  onClick={() => setSelectedPrescription(prescription)}
                >
                  View Details
                </Button>

                {user?.role === 'pharmacy' && prescription.status !== 'completed' && prescription.status !== 'dispensed' && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleMarkDispensed(prescription._id || prescription.id)}
                  >
                    Mark Dispensed
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedPrescription && (
        <div className="prescription-detail-panel">
          <Card title="Prescription Details">
            <p><strong>Prescription ID:</strong> {selectedPrescription.prescriptionId || selectedPrescription._id}</p>
            <p><strong>Status:</strong> {selectedPrescription.status}</p>
            <p><strong>Diagnosis:</strong> {selectedPrescription.diagnosis || 'N/A'}</p>
            <p><strong>Instructions:</strong> {selectedPrescription.instructions || 'N/A'}</p>
            <p><strong>Notes:</strong> {selectedPrescription.notes || 'N/A'}</p>
            <p>
              <strong>Refills:</strong>{' '}
              {selectedPrescription?.refill
                ? `${selectedPrescription.refill.usedRefills || 0}/${selectedPrescription.refill.maxRefills || 0}`
                : '0/0'}
            </p>
            <p>
              <strong>Renewals:</strong> {selectedPrescription?.renewal?.renewalCount || 0}
            </p>
            <p>
              <strong>Sent To Pharmacy:</strong> {selectedPrescription?.sentToPharmacy?.isSent ? 'Yes' : 'No'}
            </p>

            <h4>Medications</h4>
            <div className="medications-list">
              {(selectedPrescription.medications || []).map((med, index) => (
                <div key={`detail-med-${index}`} className="medication-item">
                  <div className="medication-name">{med.medicationName}</div>
                  <div className="medication-details">
                    <span>{med.dosage}</span>
                    <span>{med.frequency}</span>
                    <span>{med.duration}</span>
                    {med.quantity ? <span>Qty: {med.quantity}</span> : null}
                  </div>
                  {med.instructions ? <p className="instructions">{med.instructions}</p> : null}
                </div>
              ))}
            </div>

            <div className="prescription-actions">
              {(user?.role === 'doctor' || user?.role === 'patient') && (
                <>
                  <select
                    className="pharmacy-select"
                    value={selectedPharmacyId}
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                  >
                    <option value="">Select pharmacy</option>
                    {pharmacies.map((pharmacy) => (
                      <option key={pharmacy._id} value={pharmacy._id}>
                        {`${pharmacy.pharmacyName}${pharmacy.address?.city ? ` - ${pharmacy.address.city}` : ''}${pharmacy.isVerified ? '' : ' (Unverified)'}`}
                      </option>
                    ))}
                  </select>
                  <Button variant="primary" size="small" onClick={handleSendToPharmacy} disabled={actionLoading}>
                    Send to Pharmacy
                  </Button>
                </>
              )}

              {user?.role === 'patient' && (
                <Button variant="secondary" size="small" onClick={handleRequestRefill} disabled={actionLoading}>
                  Request Refill
                </Button>
              )}

              {user?.role === 'doctor' && (
                <Button variant="secondary" size="small" onClick={handleRenewPrescription} disabled={actionLoading}>
                  Renew
                </Button>
              )}

              <Button variant="secondary" size="small" onClick={() => setSelectedPrescription(null)}>
                Close
              </Button>
            </div>

            {(selectedPrescription.auditLogs || []).length > 0 && (
              <div className="audit-log-section">
                <h4>Audit Log</h4>
                <div className="audit-log-list">
                  {selectedPrescription.auditLogs
                    .slice()
                    .reverse()
                    .map((log, index) => (
                      <div key={`audit-${index}`} className="audit-log-item">
                        <span className="audit-action">{log.action}</span>
                        <span className="audit-meta">
                          {log.actorRole || 'system'} · {formatDate(log.createdAt || new Date())}
                        </span>
                        {log.details ? <p>{log.details}</p> : null}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default ViewPrescription;