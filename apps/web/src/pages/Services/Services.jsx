import React from 'react';
import { Link } from 'react-router-dom';
import './Services.css';
import heroVideo from '../../assets/5998395-hd_1080_1920_30fps.mp4';

const Services = () => {
  const services = [
    {
      icon: '🤖',
      title: 'AI Symptom Checker',
      description: 'Get instant health insights powered by advanced AI technology. Our intelligent system analyzes your symptoms and suggests appropriate specialists.',
      features: ['95% Accuracy Rate', 'Instant Analysis', 'Specialist Recommendations', 'Available 24/7'],
      link: '/symptoms'
    },
    {
      icon: '📅',
      title: 'Appointment Booking',
      description: 'Book appointments with top doctors instantly. Choose from 1,000+ verified healthcare professionals across all specialties.',
      features: ['Instant Booking', '1,000+ Doctors', 'All Specialties', 'Flexible Scheduling'],
      link: '/register'
    },
    {
      icon: '💬',
      title: 'Telemedicine',
      description: 'Consult with doctors via video or chat from the comfort of your home. Get prescriptions, advice, and follow-ups online.',
      features: ['Video Consultations', 'Chat Support', 'Digital Prescriptions', 'Follow-up Care'],
      link: '/register'
    },
    {
      icon: '💊',
      title: 'Online Pharmacy',
      description: 'Order medicines online and get doorstep delivery. Upload prescriptions, order medicines, and track your delivery in real-time.',
      features: ['Verified Medicines', 'Home Delivery', 'Prescription Upload', 'Real-time Tracking'],
      link: '/register'
    },
    {
      icon: '🔬',
      title: 'Laboratory Services',
      description: 'Book lab tests and get reports online. Home sample collection available with digital report delivery.',
      features: ['100+ Lab Tests', 'Home Collection', 'Digital Reports', 'Quick Results'],
      link: '/register'
    },
    {
      icon: '📱',
      title: 'Digital Health Records',
      description: 'Access your complete medical history anytime, anywhere. Securely store and share your health records with doctors.',
      features: ['Secure Storage', 'Easy Access', 'Share with Doctors', 'Lifetime Records'],
      link: '/register'
    }
  ];

  return (
    <div className="services-page">
      <section className="services-hero">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="container">
          <h1>Our Services</h1>
          <p className="services-subtitle">Comprehensive Healthcare Solutions at Your Fingertips</p>
        </div>
      </section>

      <section className="services-content">
        <div className="container">
          {services.map((service, idx) => (
            <div key={idx} className={`service-detail ${idx % 2 === 1 ? 'reverse' : ''}`}>
              <div className="service-icon-large">{service.icon}</div>
              <div className="service-info">
                <h2>{service.title}</h2>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
                <Link to={service.link} className="btn btn-primary">Get Started</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="services-cta">
        <div className="container">
          <h2>Ready to Experience Better Healthcare?</h2>
          <p>Join thousands of satisfied users who trust ClinixSol</p>
          <Link to="/register" className="btn btn-primary btn-large">Sign Up Free</Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
