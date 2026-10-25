import React from 'react';
import Card from '../../../components/common/Card/Card';

const ProfileCard = ({ patient }) => {
  return (
    <Card className="profile-card">
      <div className="profile-header">
        <img src={patient.avatar || '/assets/images/patient-placeholder.png'} alt="Profile" />
        <div>
          <h2>{patient.fullName}</h2>
          <p>{patient.email}</p>
          <p>Blood Group: {patient.bloodGroup}</p>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;