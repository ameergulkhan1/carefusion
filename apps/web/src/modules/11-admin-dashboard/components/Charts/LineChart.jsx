import React from 'react';

const LineChart = ({ data, width = 600, height = 300 }) => {
  return (
    <div className="line-chart">
      <svg width={width} height={height}>
        <text x="50%" y="50%" textAnchor="middle">
          Chart placeholder - integrate Chart.js or Recharts
        </text>
      </svg>
    </div>
  );
};

export default LineChart;