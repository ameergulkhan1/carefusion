import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import laboratoryService from '../../services/laboratoryService';
import { formatPKRSimple } from '../../../../utils/currencyFormatter';
import Loader from '../../../../components/common/Loader/Loader';
import './LabOrders.css';

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  scheduled: { bg: '#eff6ff', color: '#2563eb' },
  'in-progress': { bg: '#fffbeb', color: '#d97706' },
  completed: { bg: '#ecfdf5', color: '#059669' },
  cancelled: { bg: '#fef2f2', color: '#dc2626' },
};

const LabOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await laboratoryService.getLabOrders(
        statusFilter ? { status: statusFilter } : {}
      );
      if (response.success) {
        setOrders(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load lab orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await laboratoryService.updateOrderStatus(orderId, { status });
      toast.success(`Order marked as ${STATUS_LABELS[status]}`);
      fetchOrders();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update order status');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="lab-orders-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lab Orders</h1>
          <p className="page-subtitle">Manage incoming test bookings and process results</p>
        </div>
      </div>

      <div className="filter-bar">
        {['', 'scheduled', 'in-progress', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s ? STATUS_LABELS[s] : 'All Orders'}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>New lab bookings from patients will appear here.</p>
        </div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Patient</th>
                <th>Tests</th>
                <th>Collection</th>
                <th>Appointment</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td><strong>{order.orderNumber}</strong></td>
                  <td>
                    {order.patient?.user?.fullName || 'Unknown'}
                    <div className="cell-sub">{order.patient?.user?.phone || ''}</div>
                  </td>
                  <td>
                    {order.tests?.length || 0} test{(order.tests?.length || 0) !== 1 ? 's' : ''}
                    <div className="cell-sub">
                      {order.tests?.map((t) => t.testName).slice(0, 2).join(', ')}
                      {order.tests?.length > 2 ? '...' : ''}
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {order.sampleCollectionType?.replace('-', ' ') || 'N/A'}
                  </td>
                  <td>{new Date(order.appointmentDate).toLocaleDateString()}</td>
                  <td>{formatPKRSimple(order.totalAmount || 0)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background: STATUS_COLORS[order.orderStatus]?.bg || '#f3f4f6',
                        color: STATUS_COLORS[order.orderStatus]?.color || '#6b7280',
                      }}
                    >
                      {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {order.orderStatus === 'scheduled' && (
                        <button
                          className="btn-action"
                          onClick={() => handleUpdateStatus(order._id, 'in-progress')}
                        >
                          Start
                        </button>
                      )}
                      {order.orderStatus === 'in-progress' && (
                        <button
                          className="btn-action primary"
                          onClick={() => navigate(`/laboratory/orders/${order._id}/result`)}
                        >
                          Publish Result
                        </button>
                      )}
                      <button
                        className="btn-action"
                        onClick={() => navigate(`/laboratory/orders/${order._id}`)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LabOrders;