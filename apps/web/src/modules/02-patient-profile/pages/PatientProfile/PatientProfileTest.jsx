import React from 'react';

const PatientProfileTest = () => {
  console.log('PatientProfileTest component rendered');
  
  return (
    <div style={{
      padding: '2rem',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minHeight: '400px'
    }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Patient Profile Test</h1>
      <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
        If you can see this message, the routing and layout are working correctly!
      </p>
      
      <div style={{
        padding: '1.5rem',
        background: '#e3f2fd',
        borderRadius: '6px',
        marginBottom: '1rem'
      }}>
        <h3 style={{ color: '#1976d2', marginBottom: '0.5rem' }}>✅ Layout Rendering</h3>
        <p style={{ color: '#555' }}>The DashboardLayout component is working properly.</p>
      </div>
      
      <div style={{
        padding: '1.5rem',
        background: '#e8f5e9',
        borderRadius: '6px',
        marginBottom: '1rem'
      }}>
        <h3 style={{ color: '#388e3c', marginBottom: '0.5rem' }}>✅ Route Protection</h3>
        <p style={{ color: '#555' }}>PrivateRoute and RoleBasedRoute are functioning correctly.</p>
      </div>
      
      <div style={{
        padding: '1.5rem',
        background: '#fff3e0',
        borderRadius: '6px'
      }}>
        <h3 style={{ color: '#f57c00', marginBottom: '0.5rem' }}>📊 Next Steps</h3>
        <p style={{ color: '#555' }}>
          Open browser DevTools (F12) and check the Console tab for debug logs.
        </p>
      </div>
    </div>
  );
};

export default PatientProfileTest;
