import React from 'react';
import './Terms.css';

const Terms = () => {
  return (
    <div className="terms-page">
      <section className="terms-hero">
        <div className="container">
          <h1>Terms of Service</h1>
          <p className="terms-subtitle">Last Updated: February 17, 2026</p>
        </div>
      </section>

      <section className="terms-content">
        <div className="container">
          <div className="terms-text">
            <h2>1. Agreement to Terms</h2>
            <p>By accessing or using ClinixSol, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.</p>

            <h2>2. Description of Service</h2>
            <p>ClinixSol provides an AI-powered healthcare platform that connects patients with healthcare providers for:</p>
            <ul>
              <li>Medical consultations (in-person and telemedicine)</li>
              <li>AI-powered symptom analysis</li>
              <li>Prescription management</li>
              <li>Laboratory test booking and results</li>
              <li>Online pharmacy services</li>
              <li>Digital health records</li>
            </ul>

            <h2>3. User Accounts</h2>
            <h3>Registration</h3>
            <ul>
              <li>You must be at least 18 years old to register</li>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h3>Account Responsibilities</h3>
            <ul>
              <li>You are responsible for all activities under your account</li>
              <li>Do not share your account with others</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
            </ul>

            <h2>4. Medical Disclaimer</h2>
            <p><strong>Important:</strong> ClinixSol is a platform connecting patients with healthcare providers. We do not practice medicine or provide medical advice.</p>
            <ul>
              <li>AI symptom checker results are for informational purposes only</li>
              <li>Always consult a qualified healthcare professional for medical advice</li>
              <li>In case of emergency, call 911 or go to the nearest emergency room</li>
              <li>We are not responsible for medical decisions made by healthcare providers</li>
            </ul>

            <h2>5. Telemedicine Services</h2>
            <ul>
              <li>Video consultations are not suitable for all medical conditions</li>
              <li>Healthcare providers determine if telemedicine is appropriate</li>
              <li>Patients must provide accurate medical history</li>
              <li>Technical issues may affect service quality</li>
            </ul>

            <h2>6. Prescriptions and Pharmacy</h2>
            <ul>
              <li>Prescriptions issued by licensed healthcare providers</li>
              <li>Prescription validity subject to state and federal laws</li>
              <li>Controlled substances may require in-person consultation</li>
              <li>We verify prescriptions before dispensing medications</li>
            </ul>

            <h2>7. Payment Terms</h2>
            <ul>
              <li>All fees are clearly displayed before confirmation</li>
              <li>Payment is required before service delivery</li>
              <li>Refunds subject to our refund policy</li>
              <li>Insurance claims processed according to your plan</li>
            </ul>

            <h2>8. User Conduct</h2>
            <p>Users agree NOT to:</p>
            <ul>
              <li>Provide false or misleading information</li>
              <li>Impersonate others or misrepresent affiliations</li>
              <li>Harass, abuse, or harm healthcare providers or staff</li>
              <li>Attempt to gain unauthorized access to the platform</li>
              <li>Use the service for illegal purposes</li>
              <li>Share prescription medications with others</li>
            </ul>

            <h2>9. Intellectual Property</h2>
            <ul>
              <li>ClinixSol and its content are protected by copyright and trademarks</li>
              <li>Users retain ownership of their personal health information</li>
              <li>AI algorithms and software are proprietary to ClinixSol</li>
              <li>Unauthorized reproduction or distribution is prohibited</li>
            </ul>

            <h2>10. Privacy and Data Protection</h2>
            <p>Your privacy is important to us. Please review our Privacy Policy for detailed information on how we collect, use, and protect your data.</p>

            <h2>11. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law:</p>
            <ul>
              <li>ClinixSol is provided "as is" without warranties</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Our liability is limited to the amount you paid for services</li>
              <li>Healthcare providers are independent contractors</li>
            </ul>

            <h2>12. Indemnification</h2>
            <p>You agree to indemnify ClinixSol from claims arising from your use of the service, violation of these terms, or infringement of third-party rights.</p>

            <h2>13. Service Modifications</h2>
            <ul>
              <li>We reserve the right to modify or discontinue services</li>
              <li>Features may change without notice</li>
              <li>Prices subject to change with advance notification</li>
            </ul>

            <h2>14. Termination</h2>
            <p>We may terminate or suspend your account for:</p>
            <ul>
              <li>Violation of these Terms of Service</li>
              <li>Fraudulent activity</li>
              <li>Extended period of inactivity</li>
              <li>User request</li>
            </ul>

            <h2>15. Dispute Resolution</h2>
            <ul>
              <li>Disputes resolved through binding arbitration</li>
              <li>Arbitration governed by American Arbitration Association rules</li>
              <li>Class action waiver applies</li>
              <li>Governing law: State of [Your State]</li>
            </ul>

            <h2>16. Changes to Terms</h2>
            <p>We may update these Terms of Service. Continued use after changes constitutes acceptance of new terms.</p>

            <h2>17. Contact Information</h2>
            <p>Questions about these Terms? Contact us:</p>
            <ul>
              <li>Email: legal@clinixsol.com</li>
              <li>Phone: 1-800-CLINIX</li>
              <li>Mail: ClinixSol Legal Department, 123 Health Street, Medical City, MC 12345</li>
            </ul>

            <div className="terms-acceptance">
              <p><strong>By using ClinixSol, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
