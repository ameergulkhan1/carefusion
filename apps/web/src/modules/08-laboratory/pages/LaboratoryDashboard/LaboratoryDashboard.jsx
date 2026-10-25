import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import laboratoryService from '../../services/laboratoryService';
import Loader from '../../../../components/common/Loader/Loader';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { useAuth } from '../../../../context/AuthContext';
import './LaboratoryDashboard.css';

const LaboratoryDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const normalizedRole = String(user?.role || '').trim().toLowerCase();
  const isLabUser = normalizedRole === 'lab' || normalizedRole === 'laboratory';

  useEffect(() => {
    if (!isLabUser) {
      navigate('/laboratory/book-test');
    } else {
      fetchDashboardData();
    }
  }, [isLabUser, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const ordersRes = await laboratoryService.getLabOrders();
      const list = ordersRes?.success ? ordersRes.data || [] : [];
      setOrders(list);
      if (list.length > 0 && !selectedOrder) {
        setSelectedOrder(list[0]);
      }
    } catch (error) {
      console.error('Laboratory Dashboard error:', error);
      if (error?.status !== 404 && error?.status !== 501) {
        toast.error(error?.message || 'Failed to load laboratory data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'in-progress': 'status-inprogress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-default';
  };

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;
    return orders.filter((order) => order.orderStatus === filterStatus);
  }, [orders, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      scheduled: orders.filter(o => o.orderStatus === 'scheduled').length,
      inProgress: orders.filter(o => o.orderStatus === 'in-progress').length,
      completed: orders.filter(o => o.orderStatus === 'completed').length,
      cancelled: orders.filter(o => o.orderStatus === 'cancelled').length
    };
  }, [orders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      await laboratoryService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.success(`Order status updated to ${newStatus}`);
      const updatedOrders = orders.map(o => 
        o._id === orderId ? { ...o, orderStatus: newStatus } : o
      );
      setOrders(updatedOrders);
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="laboratory-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Laboratory Operations Dashboard</h1>
          <p className="header-subtitle">Manage test orders and results</p>
        </div>
        <Link to="/laboratory/catalog" style={{ textDecoration: 'none' }}>
          <Button variant="primary">Manage Test Catalog</Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon total">📋</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Orders</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon scheduled">⏱️</div>
          <div className="stat-content">
            <h3>{stats.scheduled}</h3>
            <p>Scheduled</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon inprogress">⚙️</div>
          <div className="stat-content">
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon completed">✅</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Orders List */}
        <div className="orders-section">
          <div className="section-header">
            <h2>Test Orders</h2>
            <div className="filter-tabs">
              {['all', 'scheduled', 'in-progress', 'completed'].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <Card className="empty-orders">
              <p>No orders found</p>
            </Card>
          ) : (
            <div className="orders-list">
              {filteredOrders.map(order => (
                <div
                  key={order._id}
                  className={`order-item ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-info">
                    <h4>Order #{order.orderId || order._id.slice(-6).toUpperCase()}</h4>
                    <p className="order-patient">{order.patientName || 'Patient'}</p>
                    <p className="order-time">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`order-status ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Details */}
        {selectedOrder && (
          <div className="order-details-section">
            <h2>Order Details</h2>
            <Card className="order-details-card">
              {/* Patient Info */}
              <div className="details-section">
                <h3>Patient Information</h3>
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{selectedOrder.patientName || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Age:</span>
                  <span className="value">{selectedOrder.patientAge || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Contact:</span>
                  <span className="value">{selectedOrder.patientPhone || 'Not provided'}</span>
                </div>
              </div>

              {/* Order Info */}
              <div className="details-section">
                <h3>Order Information</h3>
                <div className="detail-row">
                  <span className="label">Order ID:</span>
                  <span className="value">{selectedOrder.orderId || selectedOrder._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${getStatusColor(selectedOrder.orderStatus)}`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Ordered Date:</span>
                  <span className="value">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Collection Type:</span>
                  <span className="value">{selectedOrder.collectionType || 'Walk-in'}</span>
                </div>
              </div>

              {/* Tests */}
              {selectedOrder.tests && selectedOrder.tests.length > 0 && (
                <div className="details-section">
                  <h3>Tests Ordered</h3>
                  <div className="tests-list">
                    {selectedOrder.tests.map((test, idx) => (
                      <div key={idx} className="test-item">
                        <span className="test-name">{test.name || test}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Updates */}
              <div className="details-section">
                <h3>Update Status</h3>
                <div className="status-actions">
                  {['scheduled', 'in-progress', 'completed'].map(status => (
                    <Button
                      key={status}
                      variant={selectedOrder.orderStatus === status ? 'primary' : 'secondary'}
                      onClick={() => updateOrderStatus(selectedOrder._id, status)}
                      disabled={actionLoading}
                    >
                      {status === 'in-progress' ? 'Mark In Progress' : `Mark ${status}`}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaboratoryDashboard;
