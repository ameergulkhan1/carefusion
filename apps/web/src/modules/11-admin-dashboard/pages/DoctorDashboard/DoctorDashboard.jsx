import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import doctorService from '../../../../services/doctorService';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingConsultations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);

        const statsResponse = await doctorService.getDashboardStats();

        if (!isMounted) return;

        if (statsResponse?.success) {
          setStats({
            todayAppointments: statsResponse.data?.todayAppointments || 0,
            totalPatients: statsResponse.data?.totalPatients || 0,
            pendingConsultations: statsResponse.data?.pendingConsultations || 0
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to fetch dashboard data:', error);
        
        if (error.name === 'AbortError') {
          return;
        }
        
        if (error.response?.status === 429) {
          toast.error('Too many requests. Please wait a moment and refresh the page.');
        } else if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
        } else if (!error.response) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error('Failed to load dashboard data. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="doctor-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, Dr. {user?.lastName || 'Doctor'}</h1>
          <p className="dashboard-subtitle">Quick access to your main doctor actions</p>
        </div>
      </div>

      <div className="compact-summary">
        <div className="summary-item">
          <span className="summary-value">{stats.todayAppointments}</span>
          <span className="summary-label">Today</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{stats.totalPatients}</span>
          <span className="summary-label">Patients</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{stats.pendingConsultations}</span>
          <span className="summary-label">Pending</span>
        </div>
      </div>

      <div className="options-grid">
        <Link to="/doctor/appointments" className="option-card">
          <h2>Appointments</h2>
          <p>Manage today and upcoming appointments</p>
        </Link>

        <Link to="/doctor/patients" className="option-card">
          <h2>Patients</h2>
          <p>Open patient list and patient profiles</p>
        </Link>

        <Link to="/doctor/clinical-notes" className="option-card">
          <h2>Clinical Notes</h2>
          <p>Create and review clinical notes</p>
        </Link>
      </div>

      <div className="options-footer">
        <Link to="/doctor/profile" className="footer-link">My Profile</Link>
        <Link to="/doctor/prescriptions" className="footer-link">Prescriptions</Link>
        <Link to="/doctor/consultations" className="footer-link">Consultations</Link>
      </div>
    </div>
  );
};

export default DoctorDashboard;
