import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../../components/common/Card/Card';
import Button from '../../../../components/common/Button/Button';
import Alert from '../../../../components/common/Alert/Alert';
import Loader from '../../../../components/common/Loader/Loader';
import { patientService } from '../../../02-patient-profile/services/patientService';
import './TrackOrder.css';

const TrackOrder = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) {
      setError('Missing order id');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await patientService.getMedicineOrderById(orderId);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to load order');
      }
      setOrder(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load order status');
    } finally {
      setLoading(false);
    }
  };

  const timeline = useMemo(() => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];
    const currentStatus = order?.status || 'pending';
    const currentIndex = statusOrder.indexOf(currentStatus);

    const historyMap = new Map(
      (order?.statusHistory || []).map((entry) => [entry.status, entry.timestamp])
    );

    return statusOrder.map((status, index) => ({
      stage: status.charAt(0).toUpperCase() + status.slice(1),
      completed: index <= currentIndex,
      date: historyMap.get(status) || null,
      isCurrent: index === currentIndex
    }));
  }, [order]);

  if (loading) {
    return (
      <div className="track-order">
        <Loader message="Loading order status..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-order">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <Button onClick={() => navigate('/patient/order-medicine')}>Back to Medicine Store</Button>
      </div>
    );
  }

  return (
    <div className="track-order">
      <Card title="Track Your Order">
        <div className="order-meta">
          <p><strong>Order Number:</strong> {order?.orderNumber || order?._id}</p>
          <p><strong>Status:</strong> {order?.status}</p>
          {order?.trackingNumber ? <p><strong>Tracking Number:</strong> {order.trackingNumber}</p> : null}
          {order?.estimatedDelivery ? <p><strong>Estimated Delivery:</strong> {new Date(order.estimatedDelivery).toLocaleString()}</p> : null}
        </div>

        <div className="order-timeline">
          {timeline.map((status, index) => (
            <div key={index} className={`timeline-stage ${status.completed ? 'completed' : ''} ${status.isCurrent ? 'current' : ''}`}>
              <div className="stage-icon">{status.completed ? '✓' : '○'}</div>
              <div className="stage-info">
                <h4>{status.stage}</h4>
                {status.date && <p>{new Date(status.date).toLocaleString()}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="order-actions">
          <Button variant="secondary" onClick={() => navigate('/patient/order-medicine')}>
            Order More Medicines
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TrackOrder;