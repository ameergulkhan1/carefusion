import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import doctorService from '../../../../services/doctorService';
import appointmentService from '../../services/appointmentService';
import DoctorCard from '../../../../components/common/DoctorCard/DoctorCard';
import Modal from '../../../../components/common/Modal/Modal';
import Button from '../../../../components/common/Button/Button';
import './BookAppointment.css';

const BookAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    type: 'in-person',
    reason: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchSpecializations();

    // Check if doctor was pre-selected from profile page
    if (location.state?.selectedDoctor) {
      handleBookAppointment(location.state.selectedDoctor);
    }
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, selectedSpecialization]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getAllDoctors();
      
      if (response.success && response.data) {
        const doctorsList = Array.isArray(response.data) ? response.data : response.data.doctors || [];
        setDoctors(doctorsList);
        setFilteredDoctors(doctorsList);
      } else {
        toast.error('Failed to load doctors');
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await doctorService.getSpecializations();
      if (response.success && response.data) {
        setSpecializations(response.data);
      }
    } catch (error) {
      // If specializations endpoint fails, extract from doctors
      console.log('Unable to fetch specializations, will extract from doctor data');
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doctor => {
        const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
        const specialization = doctor.specialization?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || specialization.includes(search);
      });
    }

    // Filter by specialization
    if (selectedSpecialization && selectedSpecialization !== 'all') {
      filtered = filtered.filter(doctor => 
        doctor.specialization?.toLowerCase() === selectedSpecialization.toLowerCase()
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    setBookingData({
      appointmentDate: '',
      appointmentTime: '',
      type: 'in-person',
      reason: '',
      notes: ''
    });
  };

  const handleDateChange = async (date) => {
    setBookingData({ ...bookingData, appointmentDate: date, appointmentTime: '' });
    
    if (selectedDoctor && date) {
      try {
        const doctorId = selectedDoctor._id || selectedDoctor.id;
        const response = await doctorService.getAvailableSlots(doctorId, date);
        if (response.success && response.data) {
          // response.data is now directly the array of time slots
          const slots = Array.isArray(response.data) ? response.data : (response.data.slots || []);
          setAvailableSlots(slots);
        }
      } catch (error) {
        console.log('Could not fetch available slots');
        // Generate default time slots if API fails
        setAvailableSlots(generateDefaultSlots());
      }
    }
  };

  const generateDefaultSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 17) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingData.appointmentDate || !bookingData.appointmentTime) {
      toast.error('Please select date and time');
      return;
    }

    if (!bookingData.reason) {
      toast.error('Please provide a reason for the appointment');
      return;
    }

    try {
      setBookingLoading(true);
      const doctorId = selectedDoctor._id || selectedDoctor.id;
      
      const appointmentPayload = {
        doctorId,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        type: bookingData.type,
        reason: bookingData.reason,
        notes: bookingData.notes
      };

      const response = await appointmentService.bookAppointment(appointmentPayload);
      
      if (response.success) {
        toast.success('Appointment booked successfully!');
        setShowBookingModal(false);
        setSelectedDoctor(null);
        navigate('/appointments');
      } else {
        toast.error(response.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Extract unique specializations from doctors if API didn't provide
  const getUniqueSpecializations = () => {
    if (specializations.length > 0) {
      return specializations;
    }
    const specs = new Set();
    doctors.forEach(doctor => {
      if (doctor.specialization) {
        specs.add(doctor.specialization);
      }
    });
    return Array.from(specs).sort();
  };

  const uniqueSpecializations = getUniqueSpecializations();

  return (
    <div className="book-appointment">
      <div className="page-header">
        <h1 className="page-title">Book an Appointment</h1>
        <p className="page-subtitle">Find and book appointments with our qualified doctors</p>
      </div>

      {/* Search and Filter Section */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by doctor name or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="specialization-filter">
          <label htmlFor="specialization">Filter by Specialization:</label>
          <select
            id="specialization"
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="specialization-select"
          >
            <option value="all">All Specializations</option>
            {uniqueSpecializations.map(spec => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading doctors...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👨‍⚕️</div>
          <h3>No doctors found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="results-count">
            Showing {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
          </div>
          <div className="doctors-grid">
            {filteredDoctors.map(doctor => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                onBookAppointment={handleBookAppointment}
              />
            ))}
          </div>
        </>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <Modal
          isOpen={showBookingModal}
          title={`Book Appointment with Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDoctor(null);
          }}
        >
          <form onSubmit={handleSubmitBooking} className="booking-form">
            <div className="selected-doctor-info">
              <p className="doctor-spec">{selectedDoctor.specialization}</p>
              {selectedDoctor.consultationFee && (
                <p className="consultation-fee">
                  Consultation Fee: <strong>${selectedDoctor.consultationFee}</strong>
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="appointmentDate">Appointment Date *</label>
              <input
                type="date"
                id="appointmentDate"
                value={bookingData.appointmentDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="form-input"
              />
            </div>

            {bookingData.appointmentDate && (
              <div className="form-group">
                <label htmlFor="appointmentTime">Available Time Slots *</label>
                <select
                  id="appointmentTime"
                  value={bookingData.appointmentTime}
                  onChange={(e) => setBookingData({ ...bookingData, appointmentTime: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value="">Select a time slot</option>
                  {availableSlots.length > 0 ? (
                    availableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  ) : (
                    generateDefaultSlots().map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="appointmentType">Appointment Type</label>
              <select
                id="appointmentType"
                value={bookingData.type}
                onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                className="form-input"
              >
                <option value="in-person">In-person</option>
                <option value="video">Video</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Visit *</label>
              <textarea
                id="reason"
                value={bookingData.reason}
                onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                placeholder="Describe your symptoms or reason for consultation..."
                required
                rows="3"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows="2"
                className="form-input"
              />
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedDoctor(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BookAppointment;