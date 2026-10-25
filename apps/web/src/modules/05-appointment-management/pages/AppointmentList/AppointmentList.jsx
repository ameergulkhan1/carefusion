import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import DataTable from '../../../../components/common/DataTable/DataTable';
import Button from '../../../../components/common/Button/Button';
import Modal from '../../../../components/common/Modal/Modal';
import appointmentService from '../../services/appointmentService';
import doctorService from '../../../../services/doctorService';
import './AppointmentList.css';

const AppointmentList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const filters = filter !== 'all' ? { status: filter } : {};
      
      // Use appropriate service based on user role
      const service = isDoctor ? doctorService : appointmentService;
      const response = await service.getAppointments(filters);
      
      if (response.success) {
        setAppointments(response.data || []);
      } else {
        toast.error(response.message || 'Failed to fetch appointments');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await appointmentService.cancelAppointment(
        selectedAppointment._id,
        cancelReason
      );
      
      if (response.success) {
        toast.success('Appointment cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedAppointment(null);
        fetchAppointments();
      } else {
        toast.error(response.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await doctorService.updateAppointmentStatus(appointmentId, newStatus);
      
      if (response.success) {
        toast.success('Appointment status updated successfully');
        fetchAppointments();
      } else {
        toast.error(response.message || 'Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDoctorDisplayName = (row) => {
    if (row.doctor?.name) return `Dr. ${row.doctor.name}`;

    const doctorObj = row.doctorId;
    if (!doctorObj) return 'N/A';
    if (doctorObj.name) return `Dr. ${doctorObj.name}`;

    const firstName = doctorObj.firstName || '';
    const lastName = doctorObj.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName ? `Dr. ${fullName}` : 'N/A';
  };

  const getPatientDisplayName = (row) => {
    const patientObj = row.patientId;
    if (!patientObj) return 'N/A';

    if (patientObj.user?.fullName) return patientObj.user.fullName;

    const firstName = patientObj.firstName || '';
    const lastName = patientObj.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'N/A';
  };

  const getDoctorSpecialization = (row) => {
    return row.doctor?.specialization || row.doctorId?.specialization || 'N/A';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: 'blue',
      confirmed: 'green',
      'in-progress': 'orange',
      completed: 'gray',
      cancelled: 'red',
      'no-show': 'red'
    };
    
    return (
      <span className={`status-badge status-${statusColors[status] || 'gray'}`}>
        {status}
      </span>
    );
  };

  const isVideoConsultation = (row) => {
    const type = String(row.type || row.appointmentType || '').toLowerCase();
    return type === 'video' || type.includes('video');
  };

  const canJoinConsultation = (row) => {
    return isVideoConsultation(row) && ['scheduled', 'confirmed', 'in-progress'].includes(row.status);
  };

  const handleJoinConsultation = (row) => {
    const appointmentId = row._id || row.id;
    if (!appointmentId) {
      toast.error('Unable to open consultation room for this appointment');
      return;
    }

    const route = isDoctor
      ? `/doctor/consultation/${appointmentId}`
      : `/patient/consultation/${appointmentId}`;

    navigate(route, { state: { appointment: row } });
  };

  const columns = [
    { 
      header: 'Date', 
      accessor: 'appointmentDate',
      render: (value) => formatDate(value)
    },
    { 
      header: 'Time', 
      accessor: 'appointmentTime',
      render: (value, row) => value || row.timeSlot || 'N/A'
    },
    isDoctor ? {
      header: 'Patient',
      accessor: 'patientId',
      render: (_value, row) => getPatientDisplayName(row)
    } : {
      header: 'Doctor', 
      accessor: 'doctorId',
      render: (_value, row) => getDoctorDisplayName(row)
    },
    isDoctor ? null : {
      header: 'Specialization', 
      accessor: 'doctorId',
      render: (_value, row) => getDoctorSpecialization(row)
    },
    { 
      header: 'Type', 
      accessor: 'type',
      render: (value, row) => value || row.appointmentType || 'in-person'
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => getStatusBadge(value)
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="action-buttons">
          {canJoinConsultation(row) && (
            <Button
              variant="primary"
              size="small"
              onClick={() => handleJoinConsultation(row)}
            >
              Join Call
            </Button>
          )}
          {isDoctor ? (
            // Doctor actions
            <>
              {row.status === 'scheduled' && (
                <Button
                  variant="success"
                  size="small"
                  onClick={() => handleStatusUpdate(value, 'confirmed')}
                >
                  Confirm
                </Button>
              )}
              {(row.status === 'scheduled' || row.status === 'confirmed') && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => navigate(`/doctor/appointments/${value}`)}
                >
                  View
                </Button>
              )}
            </>
          ) : (
            // Patient actions
            (row.status === 'scheduled' || row.status === 'confirmed') && (
              <Button
                variant="danger"
                size="small"
                onClick={() => handleCancelClick(row)}
              >
                Cancel
              </Button>
            )
          )}
        </div>
      )
    }
  ].filter(Boolean); // Remove null columns

  return (
    <div className="appointment-list">
      <div className="page-header">
        <h2>{isDoctor ? 'Patient Appointments' : 'My Appointments'}</h2>
        {!isDoctor && (
          <Button variant="primary" onClick={() => window.location.href = '/patient/book-appointment'}>
            Book New Appointment
          </Button>
        )}
      </div>

      <div className="filters">
        <Button 
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'scheduled' ? 'primary' : 'secondary'}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled
        </Button>
        <Button 
          variant={filter === 'completed' ? 'primary' : 'secondary'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
        <Button 
          variant={filter === 'cancelled' ? 'primary' : 'secondary'}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </Button>
      </div>

      {loading ? (
        <div className="loading">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <p>No appointments found</p>
          {!isDoctor && (
            <Button variant="primary" onClick={() => window.location.href = '/patient/book-appointment'}>
              Book Your First Appointment
            </Button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} data={appointments} />
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <Modal
          isOpen={showCancelModal}
          title="Cancel Appointment"
          onClose={() => {
            setShowCancelModal(false);
            setCancelReason('');
            setSelectedAppointment(null);
          }}
        >
          <div className="cancel-modal-content">
            <p>Are you sure you want to cancel this appointment?</p>
            {selectedAppointment && (
              <div className="appointment-details">
                <p><strong>Doctor:</strong> {selectedAppointment.doctorId?.firstName || selectedAppointment.doctor?.name || 'N/A'}</p>
                <p><strong>Date:</strong> {formatDate(selectedAppointment.appointmentDate)}</p>
                <p><strong>Time:</strong> {selectedAppointment.appointmentTime || selectedAppointment.timeSlot}</p>
              </div>
            )}
            <div className="form-group">
              <label>Reason for Cancellation (Optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows="4"
              />
            </div>
            <div className="modal-actions">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedAppointment(null);
                }}
              >
                Keep Appointment
              </Button>
              <Button 
                variant="danger" 
                onClick={handleCancelAppointment}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AppointmentList;