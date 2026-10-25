import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <span className="footer-logo-icon" aria-hidden="true">🏥</span>
              <h3>CareFusion</h3>
            </div>
            <p>Your AI-powered healthcare platform for modern living. Access quality healthcare anytime, anywhere.</p>
            <div className="footer-social">
              <a href="#">📘</a>
              <a href="#">🐦</a>
              <a href="#">📷</a>
              <a href="#">💼</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/symptoms">AI Symptom Checker</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><Link to="/register">Book Appointment</Link></li>
              <li><Link to="/register">Telemedicine</Link></li>
              <li><Link to="/register">Online Pharmacy</Link></li>
              <li><Link to="/register">Lab Tests</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">HIPAA Compliance</Link></li>
              <li><Link to="/contact">Support</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <ul>
              <li>📧 support@clinixsol.com</li>
              <li>📞 1-800-CLINIX</li>
              <li>📍 123 Health St, Medical City</li>
              <li>🕐 24/7 Available</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 CareFusion. All rights reserved.</p>
          <p>Made with ❤️ for better healthcare</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;