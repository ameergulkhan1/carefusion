import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import laboratoryService from '../../services/laboratoryService';
import { formatPKRSimple } from '../../../../utils/currencyFormatter';
import Loader from '../../../../components/common/Loader/Loader';
import './LabOrderDetails.css';

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TEST_STATUS_LABELS = {
  pending: 'Pending',
  'sample-collected': 'Sample Collected',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const LabOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast.error('Missing order ID');
      navigate('/laboratory/orders');
      return;
    }
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await laboratoryService.getOrderById(orderId);

      // Handle both `{ success, data }` and raw order shapes
      const orderData = response?.data?.data || response?.data || response;
      if (!orderData || !orderData._id) {
        toast.error('Order not found');
        navigate('/laboratory/orders');
        return;
      }
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error(error?.message || 'Failed to load order details');
      navigate('/laboratory/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!order?._id) return;
    try {
      setUpdating(true);
      await laboratoryService.updateOrderStatus(order._id, { status: newStatus });
      toast.success(`Order marked as ${STATUS_LABELS[newStatus] || newStatus}`);
      fetchOrder();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loader />;
  if (!order) return null;

  const patientName = order.patient?.user?.fullName || order.patient?.firstName || 'Unknown Patient';
  const patientPhone = order.patient?.user?.phone || order.patient?.phone || 'N/A';
  const patientEmail = order.patient?.user?.email || order.patient?.email || 'N/A';

  return (
    <div className="lab-order-details-page">
      <button className="btn-back" onClick={() => navigate('/laboratory/orders')}>
        ← Back to Orders
      </button>

      <div className="details-header">
        <div>
          <h1>Order #{order.orderNumber || 'N/A'}</h1>
          <p>
            Placed on{' '}
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="header-actions">
          <span className={`status-badge ${order.orderStatus || 'scheduled'}`}>
            {STATUS_LABELS[order.orderStatus] || order.orderStatus}
          </span>
          <select
            className="status-select"
            value={order.orderStatus || 'scheduled'}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
          >
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-card">
          <h3>Patient Information</h3>
          <p><strong>Name:</strong> {patientName}</p>
          <p><strong>Phone:</strong> {patientPhone}</p>
          <p><strong>Email:</strong> {patientEmail}</p>
        </div>

        <div className="detail-card">
          <h3>Collection Details</h3>
          <p>
            <strong>Type:</strong>{' '}
            {order.sampleCollectionType
              ? order.sampleCollectionType.replace('-', ' ')
              : 'N/A'}
          </p>
          <p>
            <strong>Appointment:</strong>{' '}
            {order.appointmentDate
              ? new Date(order.appointmentDate).toLocaleString()
              : 'N/A'}
          </p>
          {order.sampleCollectionType === 'home-collection' && order.homeCollectionAddress && (
            <p>
              <strong>Address:</strong>{' '}
              {[
                order.homeCollectionAddress.street,
                order.homeCollectionAddress.city,
                order.homeCollectionAddress.state,
                order.homeCollectionAddress.zipCode,
              ]
                .filter(Boolean)
                .join(', ') || 'N/A'}
            </p>
          )}
          {order.specialInstructions && (
            <p><strong>Instructions:</strong> {order.specialInstructions}</p>
          )}
        </div>
      </div>

      <div className="detail-card">
        <h3>Tests Requested ({order.tests?.length || 0})</h3>
        {order.tests && order.tests.length > 0 ? (
          <table className="tests-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Code</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {order.tests.map((test, idx) => {
                const testId = test.testId?._id || test.testId || `test-${idx}`;
                const testName = test.testName || test.testId?.testName || 'Unknown Test';
                const testCode = test.testCode || test.testId?.testCode || 'N/A';
                const testStatus = test.status || 'pending';

                return (
                  <tr key={testId}>
                    <td><strong>{testName}</strong></td>
                    <td>{testCode}</td>
                    <td>{formatPKRSimple(test.price || 0)}</td>
                    <td>
                      <span className={`test-status ${testStatus}`}>
                        {TEST_STATUS_LABELS[testStatus] || testStatus}
                      </span>
                    </td>
                    <td>
                      {testStatus === 'completed' ? (
                        <span className="text-success">✓ Published</span>
                      ) : (
                        <button
                          className="btn-publish"
                          onClick={() =>
                            navigate(`/laboratory/results?orderId=${order._id}&testId=${testId}`)
                          }
                        >
                          Publish Result
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty-tests">No tests listed for this order.</p>
        )}
      </div>

      <div className="detail-card total-card">
        <div><span>Subtotal:</span> <span>{formatPKRSimple(order.totalAmount || 0)}</span></div>
        <div className="grand-total">
          <span>Total:</span>
          <strong>{formatPKRSimple(order.totalAmount || 0)}</strong>
        </div>
      </div>
    </div>
  );
};

export default LabOrderDetails;