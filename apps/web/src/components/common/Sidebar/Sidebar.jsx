import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || 'patient';

  const navigationLinks = {
    patient: [
      { path: '/patient/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/profile', label: 'My Profile', icon: '👤' },
      { path: '/patient/book-appointment', label: 'Book Appointment', icon: '📅' },
      { path: '/appointments', label: 'My Appointments', icon: '📋' },
      { path: '/telemedicine', label: 'Consultations', icon: '🎥' },
      { path: '/prescriptions', label: 'Prescriptions', icon: '💊' },
      { path: '/patient/order-medicine', label: 'Order Medicine', icon: '🛒' },
      { path: '/laboratory/book-test', label: 'Book Lab Tests', icon: '🔬' },
      { path: '/medical-records', label: 'Medical Records', icon: '📄' },
      { path: '/medical-history', label: 'Medical History', icon: '📜' },
      { path: '/symptoms', label: 'Symptom Checker', icon: '🩺' },
    ],
    doctor: [
      { path: '/doctor/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/doctor/patients', label: 'My Patients', icon: '👥' },
      { path: '/doctor/appointments', label: 'Appointments', icon: '📅' },
      { path: '/doctor/consultations', label: 'Consultations', icon: '🩺' },
      { path: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
      { path: '/doctor/clinical-notes', label: 'Clinical Notes', icon: '📝' },
      { path: '/doctor/schedule', label: 'My Schedule', icon: '🕐' },
      { path: '/doctor/profile', label: 'My Profile', icon: '👨‍⚕️' },
    ],
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/admin/users', label: 'User Management', icon: '👥' },
      { path: '/admin/doctors', label: 'Doctors', icon: '👨‍⚕️' },
      { path: '/admin/patients', label: 'Patients', icon: '🤒' },
      { path: '/admin/appointments', label: 'Appointments', icon: '📅' },
      { path: '/admin/pharmacy', label: 'Pharmacy', icon: '💊' },
      { path: '/admin/laboratory', label: 'Laboratory', icon: '🔬' },
      { path: '/admin/lab-approvals', label: 'Lab Approvals', icon: '✔' },
      { path: '/admin/reports', label: 'Reports & Analytics', icon: '📈' },
      { path: '/admin/settings', label: 'System Settings', icon: '⚙️' },
    ],
    pharmacy: [
      { path: '/pharmacy/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/pharmacy/prescriptions', label: 'Prescriptions', icon: '💊' },
      { path: '/pharmacy/inventory', label: 'Inventory', icon: '📦' },
      { path: '/pharmacy/orders', label: 'Orders', icon: '🛒' },
      { path: '/pharmacy/patients', label: 'Patient Records', icon: '👥' },
      { path: '/pharmacy/reports', label: 'Reports', icon: '📈' },
      { path: '/pharmacy/settings', label: 'Settings', icon: '⚙️' },
    ],
    lab: [
      { path: '/laboratory/dashboard', label: 'Operations Dashboard', icon: '📊' },
      { path: '/laboratory/catalog', label: 'Manage Tests Catalog', icon: '📝' },
      { path: '/laboratory/orders', label: 'Patient Orders', icon: '📋' },
      { path: '/laboratory/patient-records', label: 'Patient Records', icon: '📄' },
    ],
    laboratory: [
      { path: '/laboratory/dashboard', label: 'Operations Dashboard', icon: '📊' },
      { path: '/laboratory/catalog', label: 'Manage Tests Catalog', icon: '📝' },
      { path: '/laboratory/orders', label: 'Patient Orders', icon: '📋' },
      { path: '/laboratory/patient-records', label: 'Patient Records', icon: '📄' },
    ],
  };

  const links = navigationLinks[role] || navigationLinks.patient;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">
          {role === 'doctor' && '👨‍⚕️ Doctor Portal'}
          {role === 'admin' && '🔐 Admin Panel'}
          {role === 'pharmacy' && '💊 Pharmacy System'}
          {(role === 'lab' || role === 'laboratory') && '🔬 Lab Dashboard'}
          {role === 'patient' && '🏥 Patient Portal'}
        </h3>
      </div>
      <nav className="sidebar-menu">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`sidebar-item ${location.pathname === link.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span className="sidebar-label">{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;