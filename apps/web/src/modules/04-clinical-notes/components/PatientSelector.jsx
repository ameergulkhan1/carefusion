import React, { useState, useEffect } from 'react';
import clinicalNotesService from '../services/clinicalNotesService';
import Button from '../../../components/common/Button/Button';
import './PatientSelector.css';

const PatientSelector = ({ onSelect, onCancel }) => {
  const [patients, setPatients] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, patientsRes] = await Promise.all([
        clinicalNotesService.getRecentAppointments(),
        clinicalNotesService.getAllPatients()
      ]);
      setRecentAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="patient-selector">
      <div className="selector-tabs">
        <button
          className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Recent Appointments
        </button>
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search Patients
        </button>
      </div>

      {activeTab === 'appointments' && (
        <div className="appointments-list">
          {loading ? (
            <div className="loading">Loading appointments...</div>
          ) : recentAppointments.length === 0 ? (
            <div className="empty-state">No recent appointments</div>
          ) : (
            recentAppointments.map(appointment => (
              <div key={appointment._id} className="appointment-item" onClick={() => onSelect(appointment.patient)}>
                <div className="appointment-patient">
                  <div className="patient-avatar">{appointment.patient.name?.charAt(0) || 'P'}</div>
                  <div className="patient-details">
                    <div className="patient-name">{appointment.patient.name}</div>
                    <div className="patient-meta">
                      {appointment.patient.age}y, {appointment.patient.gender} • ID: {appointment.patient.id}
                    </div>
                  </div>
                </div>
                <div className="appointment-time">
                  {new Date(appointment.scheduledTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="patient-search">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          <div className="patients-list">
            {loading ? (
              <div className="loading">Loading patients...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="empty-state">No patients found</div>
            ) : (
              filteredPatients.map(patient => (
                <div key={patient._id} className="patient-item" onClick={() => onSelect(patient)}>
                  <div className="patient-avatar">{patient.name?.charAt(0) || 'P'}</div>
                  <div className="patient-details">
                    <div className="patient-name">{patient.name}</div>
                    <div className="patient-meta">
                      {patient.age}y, {patient.gender} • ID: {patient.id}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="selector-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PatientSelector;
