import React from 'react';

const ProbabilityChart = ({ data }) => {
  return (
    <div className="probability-chart">
      <h3>Probability Analysis</h3>
      {data.map((item, index) => (
        <div key={index} className="chart-bar">
          <span className="disease-name">{item.name}</span>
          <div className="bar-container">
            <div className="bar-fill" style={{ width: `${item.probability}%` }}></div>
          </div>
          <span className="probability-value">{item.probability}%</span>
        </div>
      ))}
    </div>
  );
};

export default ProbabilityChart;