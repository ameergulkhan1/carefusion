import React, { useState, useEffect } from 'react';
import './Reports.css';
import { useAuth } from '../../../../hooks/useAuth';
import { pharmacyService } from '../../services/pharmacyService';
import { formatPKRSimple } from '../../../../utils/currencyFormatter';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReports();
  }, [filterType, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getReports({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      // ✅ FIXED: Map backend data to the UI card format
      if (response?.success && response?.data) {
        const { sales = [], inventory = {} } = response.data;
        const formattedReports = [];

        // 1. Calculate and add Sales Report
        const totalSales = sales.reduce((sum, item) => sum + (item.totalSales || 0), 0);
        const totalTransactions = sales.reduce((sum, item) => sum + (item.orderCount || 0), 0);
        formattedReports.push({
          id: 'report_sales',
          type: 'sales',
          title: 'Sales Summary',
          date: dateRange.endDate,
          amount: totalSales,
          transactions: totalTransactions,
          status: 'completed'
        });

        // 2. Add Inventory Report
        if (inventory && Object.keys(inventory).length > 0) {
          formattedReports.push({
            id: 'report_inventory',
            type: 'inventory',
            title: 'Inventory Summary',
            date: dateRange.endDate,
            items: inventory.totalItems || 0,
            lowStock: inventory.lowStockItems || 0,
            status: 'completed'
          });
        }

        // 3. Placeholder for Prescription Report (backend needs a route for this)
        formattedReports.push({
          id: 'report_prescription',
          type: 'prescription',
          title: 'Prescription Fulfillment',
          date: dateRange.endDate,
          total: 0,
          fulfilled: 0,
          pending: 0,
          status: 'completed'
        });

        // 4. Add Financial Report
        formattedReports.push({
          id: 'report_financial',
          type: 'financial',
          title: 'Financial Summary',
          date: dateRange.endDate,
          revenue: totalSales,
          expenses: totalSales * 0.4, // Example calculation
          profit: totalSales * 0.6,   // Example calculation
          status: 'completed'
        });

        setReports(formattedReports);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]); // ✅ Safe fallback to stop infinite loop
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (reportId, format = 'pdf') => {
    console.log(`Exporting report ${reportId} as ${format}`);
    // TODO: Implement actual export functionality
  };

  const filteredReports = filterType === 'all' 
    ? reports 
    : reports.filter(r => r.type === filterType);

  return (
    <div className="pharmacy-reports-container">
      <div className="reports-header">
        <h1>📊 Pharmacy Reports</h1>
        <p>View and analyze your pharmacy performance and operations</p>
      </div>

      {/* Filters Section */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>Report Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Reports</option>
            <option value="sales">Sales Reports</option>
            <option value="inventory">Inventory Reports</option>
            <option value="prescription">Prescription Reports</option>
            <option value="financial">Financial Reports</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Start Date:</label>
          <input 
            type="date" 
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </div>

        <div className="filter-group">
          <label>End Date:</label>
          <input 
            type="date" 
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>

        <button className="btn-refresh" onClick={fetchReports}>
          🔄 Refresh
        </button>
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <h3>{report.title}</h3>
                <span className="report-badge">{report.type}</span>
              </div>

              <div className="report-content">
                {report.type === 'sales' && (
                  <>
                    <div className="metric">
                      <span className="label">Total Sales</span>
                      <span className="value">{formatPKRSimple(report.amount)}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Transactions</span>
                      <span className="value">{report.transactions}</span>
                    </div>
                  </>
                )}

                {report.type === 'inventory' && (
                  <>
                    <div className="metric">
                      <span className="label">Total Items</span>
                      <span className="value">{report.items}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Low Stock Items</span>
                      <span className="value warning">{report.lowStock}</span>
                    </div>
                  </>
                )}

                {report.type === 'prescription' && (
                  <>
                    <div className="metric">
                      <span className="label">Total Prescriptions</span>
                      <span className="value">{report.total}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Fulfilled</span>
                      <span className="value success">{report.fulfilled}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Pending</span>
                      <span className="value warning">{report.pending}</span>
                    </div>
                  </>
                )}

                {report.type === 'financial' && (
                  <>
                    <div className="metric">
                      <span className="label">Revenue</span>
                      <span className="value">{formatPKRSimple(report.revenue)}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Expenses</span>
                      <span className="value">{formatPKRSimple(report.expenses)}</span>
                    </div>
                    <div className="metric">
                      <span className="label">Profit</span>
                      <span className="value success">{formatPKRSimple(report.profit)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="report-date">
                {new Date(report.date).toLocaleDateString()}
              </div>

              <div className="report-actions">
                <button 
                  className="btn-download" 
                  onClick={() => handleExport(report.id, 'pdf')}
                  title="Download as PDF"
                >
                  📥 PDF
                </button>
                <button 
                  className="btn-download" 
                  onClick={() => handleExport(report.id, 'excel')}
                  title="Download as Excel"
                >
                  📊 Excel
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-reports">No reports found for the selected filters.</div>
        )}
      </div>
    </div>
  );
};

export default Reports;