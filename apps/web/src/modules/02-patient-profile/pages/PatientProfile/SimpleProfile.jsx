import React from 'react';

const SimpleProfile = () => {
  return (
    <div style={{
      padding: '2rem',
      background: 'white',
      minHeight: '500px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#2c3e50', fontSize: '2rem', marginBottom: '1rem' }}>
        Simple Profile Page
      </h1>
      <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.6' }}>
        This is a simple test page. If you can see this, the routing is working correctly!
      </p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '6px' }}>
        <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Debug Information:</h3>
        <ul style={{ color: '#555', lineHeight: '1.8' }}>
          <li>✅ DashboardLayout is rendering</li>
          <li>✅ Sidebar is visible on the left</li>
          <li>✅ This component is mounted in the main content area</li>
          <li>✅ CSS styles are being applied</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '6px' }}>
        <h3 style={{ color: '#1976d2', marginBottom: '0.5rem' }}>What this means:</h3>
        <p style={{ color: '#555', lineHeight: '1.6' }}>
          If you see this page, all the routing infrastructure is working. Any blank page issues 
          are likely related to the specific component implementation or data loading.
        </p>
      </div>
    </div>
  );
};

export default SimpleProfile;
