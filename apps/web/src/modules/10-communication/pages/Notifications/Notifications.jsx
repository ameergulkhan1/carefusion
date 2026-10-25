import React, { useState } from 'react';
import Card from '../../../../components/common/Card/Card';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'appointment', message: 'Appointment with Dr. Smith tomorrow', time: '2 hours ago', read: false },
    { id: 2, type: 'prescription', message: 'New prescription available', time: '5 hours ago', read: false },
    { id: 3, type: 'report', message: 'Lab results ready', time: '1 day ago', read: true }
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n));
  };

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      {notifications.map(notif => (
        <Card key={notif.id} className={`notification-card ${notif.read ? 'read' : 'unread'}`}>
          <div className="notification-content">
            <p>{notif.message}</p>
            <span className="notification-time">{notif.time}</span>
          </div>
          {!notif.read && <button onClick={() => markAsRead(notif.id)}>Mark as Read</button>}
        </Card>
      ))}
    </div>
  );
};

export default Notifications;