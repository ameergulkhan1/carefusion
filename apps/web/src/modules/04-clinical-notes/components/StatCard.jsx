import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, subtitle, icon, color = 'blue' }) => {
  const iconMap = {
    document: '📄',
    clock: '⏰',
    robot: '🤖',
    timer: '⏱️',
    checkmark: '✓',
    warning: '⚠️'
  };

  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">
        {iconMap[icon] || '📊'}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        <div className="stat-subtitle">{subtitle}</div>
      </div>
    </div>
  );
};

export default StatCard;
