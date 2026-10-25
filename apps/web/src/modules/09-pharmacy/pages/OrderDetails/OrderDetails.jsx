import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { pharmacyService } from '../../services/pharmacyService';
import { formatPKRSimple } from '../../../../utils/currencyFormatter';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      toast.error('Missing order id');
      navigate('/pharmacy/orders');
      return;
    }
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getOrderById(id);
      const orderData = response?.data || response;
      if (!orderData || !orderData._id) {
        toast.error('Order not found');
        navigate('/pharmacy/orders');
        return;
      }
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Order not found');
      navigate('/pharmacy/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await pharmacyService.updateOrderStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchOrder();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="order-details-page"><p>Loading...</p></div>;
  if (!order) return null;

  return (
    <div className="order-details-page">
      <button className="back-btn" onClick={() => navigate('/pharmacy/orders')}>
        ← Back to Orders
      </button>

      <div className="details-header">
        <div>
          <h1>Order {order.orderNumber}</h1>
          <p>Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="status-select"
        >
          {['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="details-grid">
        <div className="details-card">
          <h3>Customer</h3>
          <p><strong>{order.patient?.user?.fullName || 'Deleted User'}</strong></p>
          <p>{order.patient?.user?.email || 'N/A'}</p>
          <p>{order.contactPhone || 'N/A'}</p>
        </div>

        <div className="details-card">
          <h3>Delivery Address</h3>
          <p>{order.deliveryAddress?.street}</p>
          <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}</p>
          <p>{order.deliveryAddress?.country}</p>
        </div>
      </div>

      <div className="details-card">
        <h3>Items</h3>
        <table className="items-table">
          <thead>
            <tr><th>Medicine</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx}>
                <td>{item.medicine?.name || item.name || 'Deleted Medicine'}</td>
                <td>{item.quantity}</td>
                <td>{formatPKRSimple(item.price || 0)}</td>
                <td>{formatPKRSimple(item.subtotal || item.price * item.quantity || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="details-card total-card">
        <div><span>Subtotal:</span> <span>{formatPKRSimple(order.subtotal || 0)}</span></div>
        <div><span>Delivery:</span> <span>{formatPKRSimple(order.deliveryCharge || 0)}</span></div>
        <div className="grand-total"><span>Total:</span> <strong>{formatPKRSimple(order.total || 0)}</strong></div>
      </div>
    </div>
  );
};

export default OrderDetails;