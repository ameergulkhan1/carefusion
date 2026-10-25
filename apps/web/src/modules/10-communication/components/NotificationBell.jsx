import React, { useState } from 'react';

const NotificationBell = ({ count = 0, onClick }) => {
  return (
    <div className="notification-bell" onClick={onClick}>
      <span className="bell-icon">🔔</span>
      {count > 0 && (
        <span className="notification-badge">{count > 99 ? '99+' : count}</span>
      )}
    </div>
  );
};

export default NotificationBell;