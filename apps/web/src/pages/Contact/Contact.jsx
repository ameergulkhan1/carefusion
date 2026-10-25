import React, { useState } from 'react';
import './Contact.css';
import heroVideo from '../../assets/7195645-uhd_2160_4096_25fps.mp4';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    { icon: '📧', title: 'Email', value: 'support@clinixsol.com', link: 'mailto:support@clinixsol.com' },
    { icon: '📞', title: 'Phone', value: '1-800-CLINIX (254649)', link: 'tel:1800254649' },
    { icon: '📍', title: 'Address', value: '123 Health Street, Medical City, MC 12345', link: null },
    { icon: '🕐', title: 'Support Hours', value: '24/7 Available', link: null }
  ];

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="container">
          <h1>Get In Touch</h1>
          <p className="contact-subtitle">We're here to help you with all your healthcare needs</p>
        </div>
      </section>

      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info-section">
              <h2>Contact Information</h2>
              <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              
              <div className="contact-info-cards">
                {contactInfo.map((info, idx) => (
                  <div key={idx} className="contact-info-card">
                    <div className="contact-icon">{info.icon}</div>
                    <div>
                      <h3>{info.title}</h3>
                      {info.link ? (
                        <a href={info.link}>{info.value}</a>
                      ) : (
                        <p>{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="social-links">
                <h3>Follow Us</h3>
                <div className="social-icons">
                  <a href="#">📘 Facebook</a>
                  <a href="#">🐦 Twitter</a>
                  <a href="#">📷 Instagram</a>
                  <a href="#">💼 LinkedIn</a>
                </div>
              </div>
            </div>

            <div className="contact-form-section">
              <h2>Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                  />
                </div>
                
                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>
                
                <button type="submit" className="btn btn-primary btn-block">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <p className="faq-intro">Quick answers to common questions. Can't find what you're looking for? Contact us!</p>
          <div className="faq-grid">
            <div className="faq-card">
              <h3>How do I book an appointment?</h3>
              <p>Sign up for free, browse available doctors, select a time slot, and confirm your booking.</p>
            </div>
            <div className="faq-card">
              <h3>Is the AI symptom checker accurate?</h3>
              <p>Our AI has 95% accuracy and is trained on extensive medical data. However, always consult a doctor for diagnosis.</p>
            </div>
            <div className="faq-card">
              <h3>How secure is my data?</h3>
              <p>We use bank-level encryption and are fully HIPAA compliant to protect your medical information.</p>
            </div>
            <div className="faq-card">
              <h3>Do you accept insurance?</h3>
              <p>We work with major insurance providers. Contact us to verify your specific plan coverage.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
