import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          
          {/* Brand Section */}
          <div className="footer-section">
            <div className="footer-brand">
              <span className="footer-logo-icon" aria-hidden="true">🏥</span>
              <h3>CareFusion</h3>
            </div>
            <p>
              Your AI-powered healthcare ecosystem connecting patients, doctors, labs, and pharmacies. 
              Access quality healthcare anytime, anywhere.
            </p>
            {/* Removed fake social icons - added real developer credit */}
            <div className="footer-social">
              <a href="https://github.com/ameergulkhan1/carefusion" target="_blank" rel="noreferrer" aria-label="GitHub">
                💻
              </a>
              <a href="https://www.linkedin.com/in/ameer-gul-61b681378/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                💼
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/symptoms">AI Symptom Checker</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          
          {/* Services */}
          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><Link to="/register">Book Appointment</Link></li>
              <li><Link to="/register">Telemedicine</Link></li>
              <li><Link to="/register">Online Pharmacy</Link></li>
              <li><Link to="/register">Lab Tests</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">HIPAA Compliance</Link></li>
              <li><Link to="/contact">Support</Link></li>
            </ul>
          </div>
          
          {/* Contact - Updated with real project info */}
          <div className="footer-section">
            <h4>Contact</h4>
            <ul>
              <li>📧 support@carefusion.com</li>
              <li>🌐 carefusion-puce.vercel.app</li>
              <li>📍 Islamabad, Pakistan</li>
              <li>🕐 24/7 Available</li>
            </ul>
          </div>
          
        </div>
        
        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} CareFusion. All rights reserved.</p>
          <p>Built by <a href="https://ameer-portfolio.vercel.app" target="_blank" rel="noreferrer" style={{color: "inherit", textDecoration: "underline"}}>Ameer Gul Khan</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;