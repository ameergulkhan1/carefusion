import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import { patientService } from '../../services/patientService';
import appointmentService from '../../../05-appointment-management/services/appointmentService';
import laboratoryService from '../../../08-laboratory/services/laboratoryService';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [pendingLabTests, setPendingLabTests] = useState([]);
  const [labReports, setLabReports] = useState([]);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);

        // Fetch all data in parallel to reduce total loading time
        const [statsResponse, appointmentsResponse, prescriptionsResponse, labTestsResponse, labOrdersResponse] = await Promise.allSettled([
          patientService.getStats(),
          appointmentService.getAppointments({
            status: 'scheduled',
            startDate: new Date().toISOString()
          }),
          patientService.getPrescriptions({ limit: 3 }),
          laboratoryService.getPatientResults().catch(() => ({ success: false, data: [] })),
          laboratoryService.getPatientOrders().catch(() => ({ success: false, data: [] }))
        ]);

        if (!isMounted) return;

        // Handle stats
        if (statsResponse.status === 'fulfilled' && statsResponse.value?.success) {
          setStats(statsResponse.value.data);
        }

        // Handle appointments
        if (appointmentsResponse.status === 'fulfilled' && appointmentsResponse.value?.success) {
          const appointments = Array.isArray(appointmentsResponse.value.data)
            ? appointmentsResponse.value.data
            : appointmentsResponse.value.data?.appointments || [];
          setUpcomingAppointments(appointments.slice(0, 3));
        }

        // Handle prescriptions
        if (prescriptionsResponse.status === 'fulfilled' && prescriptionsResponse.value?.success) {
          const prescriptions = Array.isArray(prescriptionsResponse.value.data)
            ? prescriptionsResponse.value.data
            : prescriptionsResponse.value.data?.prescriptions || [];
          setRecentPrescriptions(prescriptions);
        }

        // Handle lab test results
        if (labTestsResponse.status === 'fulfilled' && labTestsResponse.value?.success) {
          const results = Array.isArray(labTestsResponse.value.data)
            ? labTestsResponse.value.data
            : labTestsResponse.value.data?.results || [];
          setLabReports(results.slice(0, 3));
        }

        // Handle lab orders (pending tests)
        if (labOrdersResponse.status === 'fulfilled' && labOrdersResponse.value?.success) {
          const orders = Array.isArray(labOrdersResponse.value.data)
            ? labOrdersResponse.value.data
            : labOrdersResponse.value.data?.orders || [];
          setPendingLabTests(
            orders
              .filter(order => order.orderStatus === 'scheduled' || order.orderStatus === 'in-progress')
              .slice(0, 3)
          );
        }

      } catch (error) {
        if (!isMounted) return;
        console.error('Dashboard fetch error:', error);

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

  const quickActions = [
    {
      id: 'book-appointment',
      title: 'Book Appointment',
      description: 'Schedule a consultation with a doctor',
      path: '/patient/book-appointment'
    },
    {
      id: 'consult-doctor',
      title: 'Consult Doctor',
      description: 'Start video or chat consultation',
      path: '/telemedicine'
    },
    {
      id: 'order-medicine',
      title: 'Order Medicine',
      description: 'Order medicines from pharmacy',
      path: '/patient/order-medicine'
    },
    {
      id: 'book-lab-test',
      title: 'Book Lab Test',
      description: 'Schedule laboratory tests',
      path: '/laboratory/book-test'
    },
    {
      id: 'view-records',
      title: 'Medical Records',
      description: 'Access your medical history',
      path: '/medical-records'
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions',
      description: 'View your prescriptions',
      path: '/prescriptions'
    }
  ];

  const getResultBadgeClass = (result) => {
    switch (result) {
      case 'normal': return 'mini-badge normal';
      case 'abnormal': return 'mini-badge abnormal';
      case 'critical': return 'mini-badge critical';
      default: return 'mini-badge default';
    }
  };

  if (loading) {
    return (
      <div className="patient-dashboard loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-dashboard">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Welcome, {user?.fullName?.split(' ')[0] || 'Patient'}</h1>
        <span className="status-badge">Active</span>
      </div>

      {/* Key Metrics - Horizontal Row */}
      <div className="metrics-section">
        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.totalAppointments || 0}</div>
            <div className="metric-label">Total Appointments</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.totalMedicalRecords || 0}</div>
            <div className="metric-label">Medical Records</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💊</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.totalPrescriptions || 0}</div>
            <div className="metric-label">Prescriptions</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🧪</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.totalLabReports || 0}</div>
            <div className="metric-label">Lab Reports</div>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="options-grid">
          {quickActions.slice(0, 4).map(action => (
            <Link
              key={action.id}
              to={action.path}
              className="option-card"
            >
              <h3 className="action-title">{action.title}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Lab Reports Section */}
      <div className="lab-reports-section">
        <div className="section-header">
          <h2 className="section-title">Recent Lab Reports</h2>
          <Link to="/patient/lab-reports" className="view-all-link">
            View All →
          </Link>
        </div>

        {labReports.length === 0 ? (
          <div className="no-reports-card">
            <p>No lab reports available yet.</p>
            <Link to="/laboratory/book-test" className="btn-action">
              Book a Lab Test
            </Link>
          </div>
        ) : (
          <div className="reports-grid">
            {labReports.map((report) => (
              <div key={report._id} className="report-mini-card">
                <div className="report-mini-header">
                  <h3>{report.testName || report.test?.testName || 'Lab Test'}</h3>
                  <span className={getResultBadgeClass(report.overallResult)}>
                    {report.overallResult?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <p className="report-mini-code">
                  {report.testCode || report.test?.testCode || '—'}
                </p>
                <p className="report-mini-date">
                  {report.reportedAt
                    ? new Date(report.reportedAt).toLocaleDateString()
                    : '—'}
                </p>
                <div className="report-mini-actions">
                  <Link to="/patient/lab-reports" className="btn-view-detail">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Lab Tests Section */}
      {pendingLabTests.length > 0 && (
        <div className="pending-lab-section">
          <div className="section-header">
            <h2 className="section-title">Pending Lab Tests</h2>
            <Link to="/patient/lab-reports" className="view-all-link">
              View All →
            </Link>
          </div>
          <div className="pending-list">
            {pendingLabTests.map((order) => (
              <div key={order._id} className="pending-card">
                <div>
                  <p className="pending-order">Order #{order.orderNumber}</p>
                  <p className="pending-status">
                    Status: {order.orderStatus?.replace('-', ' ') || 'scheduled'}
                  </p>
                  <p className="pending-date">
                    Appt: {order.appointmentDate
                      ? new Date(order.appointmentDate).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <Link
                  to={`/laboratory/orders/${order._id}`}
                  className="btn-track"
                >
                  Track
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;