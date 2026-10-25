import React from 'react';
import Button from '../../../components/common/Button/Button';

const SpecialistRecommendation = ({ specialist, reason }) => {
  return (
    <div className="specialist-recommendation">
      <h3>Recommended Specialist</h3>
      <div className="specialist-info">
        <h4>{specialist.name}</h4>
        <p>{specialist.specialization}</p>
        <p className="reason">{reason}</p>
      </div>
      <Button>Book Appointment</Button>
    </div>
  );
};

export default SpecialistRecommendation;