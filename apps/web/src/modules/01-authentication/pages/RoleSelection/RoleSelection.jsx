import React, { useState } from 'react';
import Card from '../../../../components/common/Card/Card';
import './RoleSelection.css';

const RoleSelection = ({ onSelect }) => {
  const roles = [
    { id: 'patient', name: 'Patient', icon: '🤒', description: 'Book appointments and manage health' },
    { id: 'doctor', name: 'Doctor', icon: '👨‍⚕️', description: 'Provide consultations and care' },
    { id: 'admin', name: 'Admin', icon: '⚙️', description: 'Manage system and users' }
  ];

  return (
    <div className="role-selection-page">
      <h2>Select Your Role</h2>
      <div className="role-grid">
        {roles.map(role => (
          <Card key={role.id} className="role-card" onClick={() => onSelect(role.id)}>
            <div className="role-icon">{role.icon}</div>
            <h3>{role.name}</h3>
            <p>{role.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoleSelection;