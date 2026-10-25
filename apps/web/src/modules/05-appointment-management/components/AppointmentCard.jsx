import React from 'react';
import Card from '../../../components/common/Card/Card';

const AppointmentCard = ({ appointment }) => {
  return (
    <Card className="appointment-card">
      <div className="appointment-header">
        <h3>{appointment.doctorName}</h3>
        <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
          {appointment.status}
        </span>
      </div>
      <div className="appointment-details">
        <p>📅 {appointment.date}</p>
        <p>🕒 {appointment.time}</p>
        <p>📍 {appointment.location}</p>
      </div>
      <div className="appointment-actions">
        <button className="btn-reschedule">Reschedule</button>
        <button className="btn-cancel">Cancel</button>
      </div>
    </Card>
  );
};

export default AppointmentCard;