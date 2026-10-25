import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { pharmacyService } from '../../services/pharmacyService';
import { formatPKRSimple } from '../../../../utils/currencyFormatter';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters = { limit: 50 };
      if (statusFilter !== 'all') filters.status = statusFilter;

      const response = await pharmacyService.getOrders(filters);

      // Backend returns: { success: true, data: [...], pagination: {...} }
      const ordersList = Array.isArray(response?.data) ? response.data : [];
      setOrders(ordersList);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    const orderId = order?._id || order?.id;
    if (!orderId) {
      toast.error('Order ID missing. Please refresh.');
      return;
    }
    navigate(`/pharmacy/orders/${orderId}`);
  };

  const statusColors = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#8b5cf6',
    packed: '#6366f1',
    shipped: '#0891b2',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  return (
    <div className="pharmacy-orders-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicine Orders</h1>
          <p className="page-subtitle">Manage and track all customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        {['all', 'pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="loading-state">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders found</h3>
          <p>Orders will appear here once customers start ordering medicines.</p>
        </div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td><strong>{order.orderNumber || 'N/A'}</strong></td>
                  <td>
                    {order.patient?.user?.fullName || 'Deleted User'}
                    <div className="cell-sub">{order.contactPhone || ''}</div>
                  </td>
                  <td>{order.items?.length || 0} items</td>
                  <td>{formatPKRSimple(order.total || 0)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-view" onClick={() => handleViewOrder(order)}>
                      View
                    </button>
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

export default Orders;