import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../common/Navbar/Navbar';
import Footer from '../../common/Footer/Footer';
import './PublicLayout.css';

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="public-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;