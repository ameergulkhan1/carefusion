import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import './Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('appointments');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));

        const response = await adminService.getAnalytics(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        const data = response?.data || response;
        setAnalyticsData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  // Mock data for chart visualization
  const generateChartData = () => {
    const data = {
      appointments: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [45, 52, 48, 61, 55, 67, 72]
      },
      users: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [120, 145, 165, 189, 215, 243]
      },
      consultations: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [89, 102, 118, 135]
      },
      revenue: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [4200, 5100, 6300, 7200]
      }
    };
    return data[selectedChart] || data.appointments;
  };

  const chartData = generateChartData();

  // Simple bar chart component
  const BarChart = ({ data, label }) => {
    const maxValue = Math.max(...data.values);
    const barHeight = 200;

    return (
      <div className="bar-chart">
        <div className="chart-container">
          <div className="y-axis">
            <div className="axis-label">0</div>
            <div className="axis-label" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
              {Math.round(maxValue / 2)}
            </div>
            <div className="axis-label">{maxValue}</div>
          </div>
          <div className="bars">
            {data.values.map((value, index) => {
              const height = (value / maxValue) * barHeight;
              return (
                <div key={index} className="bar-wrapper">
                  <div
                    className="bar"
                    style={{ height: `${height}px` }}
                    title={`${data.labels[index]}: ${value}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="x-axis">
          {data.labels.map((label, index) => (
            <div key={index} className="axis-label">{label}</div>
          ))}
        </div>
      </div>
    );
  };

  // Simple line chart component
  const LineChart = ({ data }) => {
    const maxValue = Math.max(...data.values);
    const chartHeight = 200;
    const chartWidth = 600;
    const pointSpacing = chartWidth / (data.values.length - 1);

    // Create SVG path for line
    let pathD = '';
    data.values.forEach((value, index) => {
      const x = index * pointSpacing;
      const y = chartHeight - (value / maxValue) * chartHeight;
      pathD += `${index === 0 ? 'M' : 'L'} ${x} ${y} `;
    });

    return (
      <div className="line-chart">
        <svg width={chartWidth} height={chartHeight + 20} className="chart-svg">
          <path
            d={pathD}
            fill="none"
            stroke="#4A90E2"
            strokeWidth="2"
            className="line"
          />
          {data.values.map((value, index) => {
            const x = index * pointSpacing;
            const y = chartHeight - (value / maxValue) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#4A90E2"
                className="point"
              />
            );
          })}
        </svg>
        <div className="chart-labels">
          {data.labels.map((label, index) => (
            <div key={index} className="label">{label}</div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Analytics & Reports</h2>
        <div className="time-range-selector">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-select"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">📅</div>
              <div className="metric-content">
                <h3>Total Appointments</h3>
                <p className="metric-value">{analyticsData?.totalAppointments || '2,456'}</p>
                <p className="metric-change">+12% from last period</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">👥</div>
              <div className="metric-content">
                <h3>Active Users</h3>
                <p className="metric-value">{analyticsData?.activeUsers || '1,234'}</p>
                <p className="metric-change">+8% from last period</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <h3>Total Revenue</h3>
                <p className="metric-value">${analyticsData?.totalRevenue || '245.6K'}</p>
                <p className="metric-change">+18% from last period</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">⭐</div>
              <div className="metric-content">
                <h3>Satisfaction Rate</h3>
                <p className="metric-value">{analyticsData?.satisfactionRate || '4.8'}/5</p>
                <p className="metric-change">↑ Improved</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-selector">
              <button
                className={`chart-btn ${selectedChart === 'appointments' ? 'active' : ''}`}
                onClick={() => setSelectedChart('appointments')}
              >
                Appointments
              </button>
              <button
                className={`chart-btn ${selectedChart === 'users' ? 'active' : ''}`}
                onClick={() => setSelectedChart('users')}
              >
                User Growth
              </button>
              <button
                className={`chart-btn ${selectedChart === 'consultations' ? 'active' : ''}`}
                onClick={() => setSelectedChart('consultations')}
              >
                Consultations
              </button>
              <button
                className={`chart-btn ${selectedChart === 'revenue' ? 'active' : ''}`}
                onClick={() => setSelectedChart('revenue')}
              >
                Revenue
              </button>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">
                {selectedChart === 'appointments' && 'Appointments Trend'}
                {selectedChart === 'users' && 'User Growth Trend'}
                {selectedChart === 'consultations' && 'Consultations Trend'}
                {selectedChart === 'revenue' && 'Revenue Trend'}
              </h3>
              {selectedChart === 'users' ? (
                <LineChart data={chartData} />
              ) : (
                <BarChart data={chartData} label={selectedChart} />
              )}
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="detailed-stats">
            <div className="stat-card">
              <h3>Doctor Performance</h3>
              <div className="stat-list">
                <div className="stat-item">
                  <span className="stat-label">Top Doctor (Appointments)</span>
                  <span className="stat-value">Dr. Smith - 156 appts</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Highest Rating</span>
                  <span className="stat-value">Dr. Johnson - 4.9/5</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Most Consultations</span>
                  <span className="stat-value">Dr. Williams - 48 consults</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <h3>Platform Usage</h3>
              <div className="stat-list">
                <div className="stat-item">
                  <span className="stat-label">Peak Usage Hour</span>
                  <span className="stat-value">2:00 PM - 3:00 PM</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Busiest Day</span>
                  <span className="stat-value">Friday (24% of weekly traffic)</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg. Session Duration</span>
                  <span className="stat-value">18 minutes</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <h3>Top Services</h3>
              <div className="stat-list">
                <div className="stat-item">
                  <span className="stat-label">Telemedicine</span>
                  <span className="stat-value">35% of consultations</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Lab Tests</span>
                  <span className="stat-value">28% of services</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Prescriptions</span>
                  <span className="stat-value">37% of interactions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="export-section">
            <h3>Export Reports</h3>
            <div className="export-buttons">
              <button className="btn-export">
                📄 Export as PDF
              </button>
              <button className="btn-export">
                📊 Export as Excel
              </button>
              <button className="btn-export">
                📋 Export as CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
