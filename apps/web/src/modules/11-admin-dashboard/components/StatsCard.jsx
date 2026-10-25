import React from 'react';
import Card from '../../../components/common/Card/Card';

const StatsCard = ({ title, value, icon, trend, color = '#4A90E2' }) => {
  return (
    <Card className="stats-card">
      <div className="stats-header">
        <span className="stats-icon" style={{ color }}>{icon}</span>
        <span className="stats-trend">{trend}</span>
      </div>
      <h3 className="stats-value">{value}</h3>
      <p className="stats-title">{title}</p>
    </Card>
  );
};

export default StatsCard;