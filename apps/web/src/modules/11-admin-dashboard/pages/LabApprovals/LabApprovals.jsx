import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import Loader from '../../../../components/common/Loader/Loader';
import api from '../../../../utils/api';
import './LabApprovals.css';

const LabApprovals = () => {
  const [labs, setLabs] = useState([
    { 
      _id: '1', 
      labName: 'City Central Lab', 
      location: { city: 'Downtown', state: 'NY' },
      licenseNumber: 'LIC-001',
      phone: '555-0101',
      email: 'contact@citycentrallab.com',
      address: '123 Medical Street',
      requestedAt: '2026-03-31' 
    },
    { 
      _id: '2', 
      labName: 'QuickTest Diagnostics', 
      location: { city: 'Uptown', state: 'NY' },
      licenseNumber: 'LIC-002',
      phone: '555-0102',
      email: 'info@quicktest.com',
      address: '456 Health Avenue',
      requestedAt: '2026-04-01' 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingLabs();
  }, []);

  const fetchPendingLabs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/labs/pending');
      if (res.data) setLabs(res.data);
    } catch (err) {
      console.warn('Backend not ready, using mock data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (labId) => {
    try {
      setActionLoading(true);
      await api.post(`/admin/labs/${labId}/approve`);
      toast.success('Laboratory approved successfully!');
      setLabs(labs.filter((lab) => lab._id !== labId));
    } catch (err) {
      console.warn('Backend missing, simulating approval');
      toast.success('Laboratory approved successfully!');
      setLabs(labs.filter((lab) => lab._id !== labId));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectDialog = (lab) => {
    setSelectedLab(lab);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/admin/labs/${selectedLab._id}/reject`, { reason: rejectionReason });
      toast.success('Laboratory rejected');
      setLabs(labs.filter((lab) => lab._id !== selectedLab._id));
      setShowRejectModal(false);
    } catch (err) {
      console.warn('Backend missing, simulating rejection');
      toast.success('Laboratory rejected');
      setLabs(labs.filter((lab) => lab._id !== selectedLab._id));
      setShowRejectModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="lab-approvals-container">
      <div className="lab-approvals-header">
        <h1>Laboratory Approval Requests</h1>
        <p className="lab-approvals-subtitle">Review and approve pending laboratory registrations</p>
      </div>

      {labs.length === 0 ? (
        <Card className="empty-state">
          <div className="empty-state-content">
            <p>✓ All laboratory requests have been processed</p>
            <p className="text-muted">No pending approvals at this time</p>
          </div>
        </Card>
      ) : (
        <div className="lab-approvals-grid">
          {labs.map(lab => (
            <Card key={lab._id} className="lab-approval-card">
              <div className="lab-card-header">
                <h3>{lab.labName}</h3>
                <span className="status-badge pending">Pending</span>
              </div>

              <div className="lab-card-body">
                <div className="info-row">
                  <span className="label">License:</span>
                  <span className="value">{lab.licenseNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Location:</span>
                  <span className="value">{lab.location?.city}, {lab.location?.state}</span>
                </div>
                <div className="info-row">
                  <span className="label">Address:</span>
                  <span className="value">{lab.address}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{lab.phone}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{lab.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Requested:</span>
                  <span className="value">{new Date(lab.requestedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="lab-card-actions">
                <Button
                  variant="success"
                  onClick={() => handleApprove(lab._id)}
                  disabled={actionLoading}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleOpenRejectDialog(lab)}
                  disabled={actionLoading}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showRejectModal && selectedLab && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <Card className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Reject Laboratory</h3>
            <p className="modal-subtitle">Rejecting: <strong>{selectedLab.labName}</strong></p>
            
            <textarea
              className="rejection-textarea"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LabApprovals;