import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../common/Navbar/Navbar';
import Sidebar from '../../common/Sidebar/Sidebar';
import Footer from '../../common/Footer/Footer';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-main">
        <Sidebar />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;