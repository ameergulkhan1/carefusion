import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import doctorService from '../../services/doctorService';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import { formatPKRSimple } from '../../utils/currencyFormatter';
import './DoctorProfile.css';

const DoctorProfile = ({ onBookAppointment }) => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getDoctorById(doctorId);
      
      if (response.success && response.data) {
        setDoctor(response.data);
      } else {
        toast.error('Failed to load doctor details');
        navigate('/patient/book-appointment');
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      toast.error('Failed to load doctor details');
      navigate('/patient/book-appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    if (onBookAppointment) {
      onBookAppointment(doctor);
    } else {
      // Navigate to booking page with doctor pre-selected
      navigate('/patient/book-appointment', { state: { selectedDoctor: doctor } });
    }
  };

  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) {
      return 'No availability information';
    }

    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const sortedAvailability = availability.sort((a, b) => 
      dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase())
    );

    return sortedAvailability;
  };

  const getDayName = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const formatTimeSlots = (slots) => {
    if (!slots || slots.length === 0) return 'Not available';
    
    const availableSlots = slots.filter(slot => slot.isAvailable);
    if (availableSlots.length === 0) return 'Not available';

    // Group consecutive slots
    const firstSlot = availableSlots[0];
    const lastSlot = availableSlots[availableSlots.length - 1];
    
    if (availableSlots.length > 1) {
      return `${firstSlot.startTime} - ${lastSlot.endTime}`;
    }
    return `${firstSlot.startTime} - ${firstSlot.endTime}`;
  };

  if (loading) {
    return (
      <div className="doctor-profile-loading">
        <Loader />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="doctor-profile-error">
        <h2>Doctor not found</h2>
        <Button onClick={() => navigate('/patient/book-appointment')}>
          Back to Doctors List
        </Button>
      </div>
    );
  }

  const {
    firstName,
    lastName,
    specialization,
    qualifications,
    experience,
    bio,
    consultationFee,
    rating,
    reviewCount,
    languages,
    profileImage,
    clinicAddress,
    availability,
    phone,
    email,
    isVerified
  } = doctor;

  return (
    <div className="doctor-profile-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="doctor-profile-card">
        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-image-section">
            {profileImage ? (
              <img src={profileImage} alt={`Dr. ${firstName} ${lastName}`} className="profile-image" />
            ) : (
              <div className="profile-avatar">
                {firstName?.charAt(0)}{lastName?.charAt(0)}
              </div>
            )}
            {isVerified && (
              <div className="verified-badge">
                <span className="verified-icon">✓</span>
                Verified
              </div>
            )}
          </div>

          <div className="profile-info">
            <h1 className="profile-name">Dr. {firstName} {lastName}</h1>
            <p className="profile-specialization">{specialization}</p>
            
            {qualifications && qualifications.length > 0 && (
              <div className="profile-qualifications">
                {qualifications.map((qual, index) => (
                  <span key={index} className="qualification-badge">
                    {qual.degree}
                    {qual.institution && ` - ${qual.institution}`}
                    {qual.year && ` (${qual.year})`}
                  </span>
                ))}
              </div>
            )}

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-icon">💼</span>
                <span className="stat-text">{experience}</span>
              </div>
              {rating > 0 && (
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-text">{rating} ({reviewCount} reviews)</span>
                </div>
              )}
              <div className="stat-item">
                <span className="stat-icon">💰</span>
                <span className="stat-text">{formatPKRSimple(consultationFee)} Consultation Fee</span>
              </div>
            </div>

            {languages && languages.length > 0 && (
              <div className="profile-languages">
                <span className="languages-label">Languages:</span>
                <span className="languages-text">{languages.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {bio && (
          <div className="profile-section">
            <h2 className="section-title">About</h2>
            <p className="bio-text">{bio}</p>
          </div>
        )}

        {/* Clinic Information */}
        {clinicAddress && (
          <div className="profile-section">
            <h2 className="section-title">
              <span className="section-icon">🏥</span>
              Clinic / Hospital Details
            </h2>
            <div className="clinic-info">
              {clinicAddress.name && (
                <div className="info-row">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{clinicAddress.name}</span>
                </div>
              )}
              {clinicAddress.street && (
                <div className="info-row">
                  <span className="info-label">Address:</span>
                  <span className="info-value">
                    {clinicAddress.street}
                    {clinicAddress.city && `, ${clinicAddress.city}`}
                    {clinicAddress.state && `, ${clinicAddress.state}`}
                    {clinicAddress.zipCode && ` - ${clinicAddress.zipCode}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="profile-section">
          <h2 className="section-title">
            <span className="section-icon">📞</span>
            Contact Information
          </h2>
          <div className="contact-info">
            {phone && (
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <div className="contact-details">
                  <span className="contact-label">Phone:</span>
                  <a href={`tel:${phone}`} className="contact-value">{phone}</a>
                </div>
              </div>
            )}
            {email && (
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <div className="contact-details">
                  <span className="contact-label">Email:</span>
                  <a href={`mailto:${email}`} className="contact-value">{email}</a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Availability Schedule */}
        <div className="profile-section">
          <h2 className="section-title">
            <span className="section-icon">🕒</span>
            Clinic Timings & Availability
          </h2>
          <div className="availability-schedule">
            {availability && availability.length > 0 ? (
              <div className="schedule-table">
                {formatAvailability(availability).map((schedule, index) => (
                  <div key={index} className="schedule-row">
                    <div className="schedule-day">{getDayName(schedule.day)}</div>
                    <div className="schedule-time">{formatTimeSlots(schedule.slots)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-availability">Availability schedule not provided. Please contact directly.</p>
            )}
          </div>
        </div>

        {/* Book Appointment Button */}
        <div className="profile-actions">
          <Button 
            variant="primary"
            size="large"
            onClick={handleBookAppointment}
            className="book-appointment-btn"
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
