import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../../components/common/Card/Card';
import laboratoryService from '../../../08-laboratory/services/laboratoryService';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Users', value: '1,234', icon: '👥', color: '#4A90E2', change: '+12%' },
    { title: 'Active Doctors', value: '89', icon: '👨‍⚕️', color: '#10b981', change: '+5%' },
    { title: 'Total Patients', value: '1,045', icon: '🤒', color: '#f59e0b', change: '+18%' },
    { title: 'Appointments Today', value: '156', icon: '📅', color: '#8b5cf6', change: '+8%' },
    { title: 'Revenue (Month)', value: '$245.6K', icon: '💰', color: '#27AE60', change: '+22%' },
    { title: 'Prescriptions', value: '437', icon: '💊', color: '#ef4444', change: '+15%' },
    { title: 'Lab Tests Pending', value: '23', icon: '🔬', color: '#ec4899', change: '-5%' },
    { title: 'System Health', value: '99.8%', icon: '🟢', color: '#06b6d4', change: '0%' }
  ]);

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, action: 'New patient registered', user: 'Emily Johnson', time: '5 mins ago', type: 'success' },
    { id: 2, action: 'Appointment scheduled', user: 'Dr. Sarah Smith', time: '12 mins ago', type: 'info' },
    { id: 3, action: 'Prescription approved', user: 'Dr. Michael Brown', time: '25 mins ago', type: 'warning' },
    { id: 4, action: 'Lab results uploaded', user: 'Lab Technician', time: '1 hour ago', type: 'info' },
    { id: 5, action: 'User account updated', user: 'James Wilson', time: '2 hours ago', type: 'success' }
  ]);

  const [systemAlerts] = useState([
    { id: 1, message: 'Server backup completed successfully', severity: 'success' },
    { id: 2, message: '3 doctors pending verification', severity: 'warning' },
    { id: 3, message: 'System maintenance scheduled for Sunday 2 AM', severity: 'info' }
  ]);

  useEffect(() => {
    const loadLaboratorySnapshot = async () => {
      try {
        const [metricsRes, ordersRes] = await Promise.all([
          laboratoryService.getLaboratoryMetrics(),
          laboratoryService.getLabOrders()
        ]);

        if (metricsRes?.success) {
          const pending = Number(metricsRes.data?.pendingOrders || 0);
          setStats((prev) =>
            prev.map((item) => (
              item.title === 'Lab Tests Pending'
                ? { ...item, value: String(pending), change: pending === 0 ? '0%' : `${pending} open` }
                : item
            ))
          );
        }

        if (ordersRes?.success) {
          const completed = (ordersRes.data || []).filter((order) => order.orderStatus === 'completed').length;
          const queueCount = (ordersRes.data || []).filter((order) => ['scheduled', 'in-progress'].includes(order.orderStatus)).length;

          setRecentActivities((prev) => [
            {
              id: 'lab-live',
              action: `Lab queue updated (${queueCount} pending)` ,
              user: 'Laboratory Module',
              time: 'Just now',
              type: 'info'
            },
            {
              id: 'lab-completed',
              action: `Lab reports completed: ${completed}`,
              user: 'Laboratory Module',
              time: 'Just now',
              type: 'success'
            },
            ...prev.filter((activity) => !String(activity.id).startsWith('lab-')).slice(0, 3)
          ]);
        }
      } catch (error) {
        console.warn('Unable to load laboratory snapshot for admin dashboard:', error?.message || error);
      }
    };

    loadLaboratorySnapshot();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">System overview and management</p>
        </div>
        <div className="quick-actions">
          <Link to="/admin/users/add" className="btn-primary">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </Link>
          <Link to="/admin/reports" className="btn-secondary">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Reports
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <Card key={index} className="stat-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
            <div className="stat-icon" style={{ background: `${stat.color}20` }}>
              <span style={{ fontSize: '2rem' }}>{stat.icon}</span>
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
              <span className={`stat-change ${stat.change.includes('+') ? 'positive' : 'negative'}`}>
                {stat.change}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activities</h2>
            <Link to="/admin/activity-log" className="view-all-link">View All →</Link>
          </div>
          <div className="activities-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-indicator ${activity.type}`}></div>
                <div className="activity-content">
                  <p className="activity-action">{activity.action}</p>
                  <p className="activity-details">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-time">{activity.time}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>System Alerts</h2>
          </div>
          <div className="alerts-list">
            {systemAlerts.map(alert => (
              <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {alert.severity === 'success' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                  {alert.severity === 'warning' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  )}
                  {alert.severity === 'info' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
          <div className="quick-links">
            <Link to="/admin/users">👥 Manage Users</Link>
            <Link to="/admin/doctors">👨‍⚕️ Manage Doctors</Link>
            <Link to="/admin/settings">⚙️ System Settings</Link>
            <Link to="/admin/reports">📈 Analytics</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;