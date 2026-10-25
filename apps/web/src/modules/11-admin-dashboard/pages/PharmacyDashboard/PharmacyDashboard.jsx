import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import pharmacyService from '../../../../modules/09-pharmacy/services/pharmacyService';
import { formatPKRSimple } from '../../../../utils/currencyFormatter';
import './PharmacyDashboard.css';

const PharmacyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    lowStockItems: 0,
    todayOrders: 0,
    monthlyRevenue: 0
  });
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);

        // Fetch all data in parallel
        const [statsResponse, prescriptionsResponse, lowStockResponse, ordersResponse] = await Promise.allSettled([
          pharmacyService.getDashboardStats(),
          pharmacyService.getPrescriptions({ status: 'pending,processing,ready', limit: 5 }),
          pharmacyService.getLowStockItems(),
          pharmacyService.getOrders({ limit: 10, sortBy: '-createdAt' }).catch(() => ({ success: false, data: [] }))
        ]);

        if (!isMounted) return;

        // Handle stats
        if (statsResponse.status === 'fulfilled' && statsResponse.value?.success) {
          const data = statsResponse.value.data;
          setStats({
            pendingPrescriptions: data?.prescriptions?.pending || 0,
            lowStockItems: data?.inventory?.lowStock || 0,
            todayOrders: data?.orders?.pending || 0,
            monthlyRevenue: data?.revenue?.monthly || 0
          });
        }

        // Handle prescriptions
        if (prescriptionsResponse.status === 'fulfilled' && prescriptionsResponse.value?.success) {
          const prescriptions = Array.isArray(prescriptionsResponse.value.data) 
            ? prescriptionsResponse.value.data 
            : prescriptionsResponse.value.data?.prescriptions || [];
          setPendingPrescriptions(prescriptions.slice(0, 5));
        }

        // Handle low stock items
        if (lowStockResponse.status === 'fulfilled' && lowStockResponse.value?.success) {
          const items = Array.isArray(lowStockResponse.value.data) 
            ? lowStockResponse.value.data 
            : lowStockResponse.value.data?.items || [];
          setLowStockAlerts(items.slice(0, 5));
        }

        // Handle orders/activity
        if (ordersResponse.status === 'fulfilled' && ordersResponse.value?.success) {
          const orders = Array.isArray(ordersResponse.value.data) 
            ? ordersResponse.value.data 
            : ordersResponse.value.data?.orders || [];
          setRecentActivity(orders.slice(0, 10));
        } else {
          setRecentActivity([]);
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
          toast.error('Failed to load dashboard data. Please check your connection.');
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

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const handleProcessPrescription = async (prescriptionId) => {
    try {
      const response = await pharmacyService.updatePrescriptionStatus(prescriptionId, 'processing');
      if (response.success) {
        toast.success('Prescription processing started');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      toast.error('Failed to process prescription');
    }
  };

  const handleReorder = async (_itemId) => {
    toast.info('Auto-reorder workflow is not enabled. Please update stock directly from inventory management.');
  };

  const formatCurrency = (amount) => {
    return formatPKRSimple(amount);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="pharmacy-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pharmacy-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>Welcome back, {user?.firstName || 'Pharmacist'} 👋</h1>
            <p className="dashboard-subtitle">Manage prescriptions, inventory, and orders efficiently</p>
          </div>
          <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={refreshing ? 'spinning' : ''}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="quick-actions">
          <Link to="/pharmacy/prescriptions" className="btn-primary">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Prescriptions
          </Link>
          <Link to="/pharmacy/inventory" className="btn-secondary">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Manage Inventory
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card warning">
          <div className="stat-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.pendingPrescriptions}</h3>
            <p>Pending Prescriptions</p>
            {stats.pendingPrescriptions > 0 && (
              <span className="stat-badge">Requires Action</span>
            )}
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.lowStockItems}</h3>
            <p>Low Stock Items</p>
            {stats.lowStockItems > 0 && (
              <span className="stat-badge">Reorder Now</span>
            )}
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.todayOrders}</h3>
            <p>Orders Today</p>
          </div>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.monthlyRevenue)}</h3>
            <p>Monthly Revenue</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Pending Prescriptions */}
        <div className="dashboard-section prescriptions-section">
          <div className="section-header">
            <h2>Pending Prescriptions</h2>
            <Link to="/pharmacy/prescriptions" className="view-all-link">View All →</Link>
          </div>
          <div className="prescriptions-list">
            {pendingPrescriptions.length === 0 ? (
              <div className="empty-state">
                <p>No pending prescriptions</p>
              </div>
            ) : (
              pendingPrescriptions.map(prescription => (
                <div key={prescription._id || prescription.id} className="prescription-card">
                  <div className="prescription-header">
                    <div className="prescription-info">
                      <h4>{prescription.prescriptionNo || prescription.prescriptionNumber || 'N/A'}</h4>
                      <p className="prescription-time">
                        {formatTime(prescription.createdAt || prescription.updatedAt)}
                      </p>
                    </div>
                    <span className={`prescription-status status-${prescription.status}`}>
                      {prescription.status}
                    </span>
                  </div>
                  <div className="prescription-details">
                    <div className="detail-item">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>
                        {prescription.patientId 
                          ? `${prescription.patientId.firstName} ${prescription.patientId.lastName}`
                          : prescription.patient || 'Unknown Patient'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>
                        {prescription.doctorId 
                          ? `Dr. ${prescription.doctorId.firstName} ${prescription.doctorId.lastName}`
                          : prescription.doctor || 'Unknown Doctor'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>
                        {prescription.medications?.length || 0} medication{prescription.medications?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="prescription-actions">
                    <Link 
                      to={`/pharmacy/prescriptions/${prescription._id || prescription.id}`} 
                      className="btn-view"
                    >
                      View Details
                    </Link>
                    {prescription.status === 'pending' && (
                      <button 
                        className="btn-process"
                        onClick={() => handleProcessPrescription(prescription._id || prescription.id)}
                      >
                        Process Now
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="dashboard-section alerts-section">
          <div className="section-header">
            <h2>Low Stock Alerts</h2>
            <Link to="/pharmacy/inventory" className="view-all-link">View Inventory →</Link>
          </div>
          <div className="alerts-list">
            {lowStockAlerts.length === 0 ? (
              <div className="empty-state">
                <p>No low stock items</p>
              </div>
            ) : (
              lowStockAlerts.map(item => (
                <div key={item._id || item.id} className="alert-card">
                  <div className="alert-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <h4>{item.medicineName || item.medication || item.name}</h4>
                    <p className="alert-category">
                      {item.category || item.medicineCategory || 'Medicine'}
                    </p>
                    <div className="stock-info">
                      <span className="current-stock">
                        Current: {item.currentStock || item.stock || 0}
                      </span>
                      <span className="reorder-level">
                        Reorder: {item.reorderLevel || item.minimumStock || 0}
                      </span>
                    </div>
                    <div className="stock-bar">
                      <div 
                        className="stock-progress" 
                        style={{ 
                          width: `${Math.min(100, ((item.currentStock || item.stock || 0) / (item.reorderLevel || item.minimumStock || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <button 
                    className="btn-reorder"
                    onClick={() => handleReorder(item._id || item.id)}
                  >
                    Reorder
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="dashboard-section activity-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <Link to="/pharmacy/orders" className="view-all-link">View All Orders →</Link>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={activity._id || activity.id || index} className="activity-item">
                <div className="activity-icon">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="activity-content">
                  <p className="activity-title">
                    {activity.orderNumber || activity.prescriptionNo || `Order #${activity.id || index + 1}`}
                  </p>
                  <p className="activity-details">
                    {activity.patientName || (activity.patientId ? `${activity.patientId.firstName} ${activity.patientId.lastName}` : 'Customer')}
                    {activity.totalAmount && ` - ${formatCurrency(activity.totalAmount)}`}
                  </p>
                </div>
                <div className="activity-meta">
                  <span className={`activity-status status-${activity.status}`}>
                    {activity.status || 'pending'}
                  </span>
                  <span className="activity-time">{formatTime(activity.createdAt || activity.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="quick-stat">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="quick-stat-value">
              {stats.processedToday || stats.completedToday || 0}
            </span>
            <span className="quick-stat-label">Processed Today</span>
          </div>
        </div>
        <div className="quick-stat">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="quick-stat-value">
              {stats.avgProcessingTime || 'N/A'}
            </span>
            <span className="quick-stat-label">Avg. Processing Time</span>
          </div>
        </div>
        <div className="quick-stat">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <div>
            <span className="quick-stat-value">
              {stats.totalInventoryItems || stats.totalItems || 0}
            </span>
            <span className="quick-stat-label">Total Items</span>
          </div>
        </div>
        <div className="quick-stat">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div>
            <span className="quick-stat-value">
              {formatCurrency(stats.todayRevenue || stats.dailyRevenue || 0)}
            </span>
            <span className="quick-stat-label">Today's Revenue</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
