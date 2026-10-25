import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './DoctorCard.css';

const DoctorCard = ({ doctor, onBookAppointment }) => {
  const navigate = useNavigate();
  
  const {
    _id,
    firstName,
    lastName,
    specialization,
    qualification,
    experience,
    rating: ratingProp,
    reviewCount,
    consultationFee,
    availableToday,
    profileImage,
    languages,
    hospitalName
  } = doctor;

  // Handle both number and object format for rating
  const rating = typeof ratingProp === 'object' ? ratingProp?.average : ratingProp;
  const reviews = reviewCount || (typeof ratingProp === 'object' ? ratingProp?.count : 0);

  const fullName = `Dr. ${firstName} ${lastName}`;

  const handleViewProfile = () => {
    navigate(`/doctors/${_id}`);
  };
  
  return (
    <div className="doctor-card">
      <div className="doctor-card-header">
        <div className="doctor-image">
          {profileImage ? (
            <img src={profileImage} alt={fullName} />
          ) : (
            <div className="doctor-avatar">
              {firstName?.charAt(0)}{lastName?.charAt(0)}
            </div>
          )}
        </div>
        <div className="doctor-info">
          <h3 className="doctor-name">{fullName}</h3>
          <p className="doctor-specialization">{specialization}</p>
          {qualification && (
            <p className="doctor-qualification">{qualification}</p>
          )}
        </div>
      </div>

      <div className="doctor-card-body">
        <div className="doctor-stats">
          {experience && (
            <div className="stat-item">
              <span className="stat-icon">💼</span>
              <span className="stat-text">{experience}</span>
            </div>
          )}
          {rating && (
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <span className="stat-text">
                {rating} ({reviews} reviews)
              </span>
            </div>
          )}
          {consultationFee && (
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-text">${consultationFee}</span>
            </div>
          )}
        </div>

        {hospitalName && (
          <div className="doctor-hospital">
            <span className="hospital-icon">🏥</span>
            <span className="hospital-name">{hospitalName}</span>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div className="doctor-languages">
            <span className="languages-label">Languages:</span>
            <span className="languages-text">{languages.join(', ')}</span>
          </div>
        )}

        {availableToday && (
          <div className="availability-badge">
            <span className="availability-dot"></span>
            Available Today
          </div>
        )}
      </div>

      <div className="doctor-card-footer">
        <button 
          className="book-button"
          onClick={() => onBookAppointment(doctor)}
        >
          Book Appointment
        </button>
        <button 
          className="view-profile-button"
          onClick={handleViewProfile}
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

DoctorCard.propTypes = {
  doctor: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    specialization: PropTypes.string.isRequired,
    qualification: PropTypes.string,
    experience: PropTypes.string,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    consultationFee: PropTypes.number,
    availableToday: PropTypes.bool,
    profileImage: PropTypes.string,
    languages: PropTypes.arrayOf(PropTypes.string),
    hospitalName: PropTypes.string
  }).isRequired,
  onBookAppointment: PropTypes.func.isRequired
};

export default DoctorCard;
