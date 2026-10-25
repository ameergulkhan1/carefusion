import React from 'react';
import './Privacy.css';

const Privacy = () => {
  return (
    <div className="privacy-page">
      <section className="privacy-hero">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p className="privacy-subtitle">Last Updated: February 17, 2026</p>
        </div>
      </section>

      <section className="privacy-content">
        <div className="container">
          <div className="privacy-text">
            <h2>1. Introduction</h2>
            <p>ClinixSol ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare platform.</p>

            <h2>2. Information We Collect</h2>
            <h3>Personal Information</h3>
            <ul>
              <li>Name, email address, phone number, and date of birth</li>
              <li>Medical history and health records</li>
              <li>Insurance information</li>
              <li>Payment and billing information</li>
            </ul>

            <h3>Health Information</h3>
            <ul>
              <li>Symptoms and medical conditions</li>
              <li>Prescriptions and medications</li>
              <li>Lab test results</li>
              <li>Consultation notes and records</li>
            </ul>

            <h3>Technical Information</h3>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage data and analytics</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <ul>
              <li><strong>Healthcare Services:</strong> To provide medical consultations, prescriptions, and health monitoring</li>
              <li><strong>AI Analysis:</strong> To improve our symptom checker and provide personalized health insights</li>
              <li><strong>Communication:</strong> To send appointment reminders, test results, and health updates</li>
              <li><strong>Payment Processing:</strong> To process transactions and manage billing</li>
              <li><strong>Platform Improvement:</strong> To enhance user experience and develop new features</li>
            </ul>

            <h2>4. HIPAA Compliance</h2>
            <p>ClinixSol is fully compliant with the Health Insurance Portability and Accountability Act (HIPAA). We implement strict administrative, physical, and technical safeguards to protect your Protected Health Information (PHI):</p>
            <ul>
              <li>End-to-end encryption for all data transmission</li>
              <li>Regular security audits and risk assessments</li>
              <li>Access controls and authentication measures</li>
              <li>Business Associate Agreements with all partners</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>We employ industry-leading security measures:</p>
            <ul>
              <li><strong>Encryption:</strong> All data is encrypted using AES-256 encryption</li>
              <li><strong>Secure Servers:</strong> Data stored on HIPAA-compliant cloud servers</li>
              <li><strong>Access Control:</strong> Role-based access with multi-factor authentication</li>
              <li><strong>Regular Audits:</strong> Third-party security assessments</li>
            </ul>

            <h2>6. Information Sharing</h2>
            <p>We never sell your personal or health information. We only share information:</p>
            <ul>
              <li>With your explicit consent</li>
              <li>With healthcare providers involved in your care</li>
              <li>With authorized family members (with your permission)</li>
              <li>When required by law or legal process</li>
              <li>With service providers under strict confidentiality agreements</li>
            </ul>

            <h2>7. Your Rights</h2>
            <ul>
              <li><strong>Access:</strong> Request copies of your personal and health information</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
            </ul>

            <h2>8. Cookies and Tracking</h2>
            <p>We use cookies to enhance your experience. You can control cookie preferences through your browser settings.</p>

            <h2>9. Children's Privacy</h2>
            <p>Our services are not intended for children under 13. Parents or guardians must provide consent for minors aged 13-17.</p>

            <h2>10. International Users</h2>
            <p>If you access our platform from outside the United States, your information may be transferred to and processed in the U.S.</p>

            <h2>11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification.</p>

            <h2>12. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <ul>
              <li>Email: privacy@clinixsol.com</li>
              <li>Phone: 1-800-CLINIX</li>
              <li>Mail: ClinixSol Privacy Office, 123 Health Street, Medical City, MC 12345</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
