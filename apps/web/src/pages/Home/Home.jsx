import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import heroVideo from '../../assets/4352135-hd_1920_1080_25fps.mp4';

const Home = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    { icon: '🩺', title: 'AI Symptom Checker', desc: 'Get instant health insights powered by AI' },
    { icon: '📅', title: 'Easy Appointments', desc: 'Book appointments with top doctors instantly' },
    { icon: '💬', title: 'Telemedicine', desc: 'Consult doctors via video or chat from home' },
    { icon: '💊', title: 'Online Pharmacy', desc: 'Order medicines and get doorstep delivery' },
    { icon: '🔬', title: 'Lab Tests', desc: 'Book lab tests and get reports online' },
    { icon: '📱', title: 'Digital Records', desc: 'Access your medical records anytime, anywhere' }
  ];

  const steps = [
    { num: '01', title: 'Sign Up', desc: 'Create your account in under 2 minutes' },
    { num: '02', title: 'Choose Service', desc: 'Select from appointments, pharmacy, or lab tests' },
    { num: '03', title: 'Get Care', desc: 'Receive quality healthcare from the comfort of home' }
  ];

  const services = [
    { icon: '👤', role: 'For Patients', features: ['Book Appointments', 'AI Health Assistant', 'Digital Prescriptions', 'Order Medicines', 'Track Medical History'] },
    { icon: '👨‍⚕️', role: 'For Doctors', features: ['Manage Appointments', 'Clinical Notes AI', 'Video Consultations', 'E-Prescriptions', 'Patient Analytics'] },
    { icon: '🔬', role: 'For Labs', features: ['Test Bookings', 'Digital Reports', 'Sample Tracking', 'Payment Integration', 'Analytics Dashboard'] },
    { icon: '💊', role: 'For Pharmacies', features: ['Medicine Orders', 'Inventory Management', 'Delivery Tracking', 'Prescription Verification', 'Sales Reports'] }
  ];

  const stats = [
    { value: '50K+', label: 'Happy Patients' },
    { value: '1,000+', label: 'Expert Doctors' },
    { value: '100+', label: 'Partner Labs' },
    { value: '98%', label: 'Satisfaction Rate' }
  ];

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Patient', text: 'ClinixSol made healthcare so convenient! I can consult doctors from home and get medicines delivered.', rating: 5 },
    { name: 'Dr. Michael Smith', role: 'Doctor', text: 'The AI clinical notes feature saves me hours every day. Best healthcare platform I\'ve used!', rating: 5 },
    { name: 'Emily Davis', role: 'Patient', text: 'The symptom checker is amazing! It helped me understand my condition before seeing a doctor.', rating: 5 }
  ];

  const plans = [
    { name: 'Basic', price: 'Free', features: ['Symptom Checker', 'Book Appointments', 'Digital Records', 'Chat Support'], popular: false },
    { name: 'Pro', price: '$9.99/mo', features: ['All Basic Features', 'Unlimited Video Calls', 'Priority Booking', 'Health Analytics', '24/7 Support'], popular: true },
    { name: 'Family', price: '$24.99/mo', features: ['All Pro Features', 'Up to 5 Members', 'Family Health Dashboard', 'Dedicated Care Manager'], popular: false }
  ];

  const faqs = [
    { q: 'How does the AI symptom checker work?', a: 'Our AI analyzes your symptoms using advanced algorithms trained on medical data to provide possible conditions and suggest appropriate specialists.' },
    { q: 'Is my medical data secure?', a: 'Yes! We use bank-level encryption and comply with HIPAA standards to ensure your data is completely secure and private.' },
    { q: 'Can I get prescriptions online?', a: 'Yes, doctors can issue digital prescriptions during consultations, which you can use to order medicines from our partner pharmacies.' },
    { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, net banking, UPI, and digital wallets for your convenience.' },
    { q: 'How do I book a video consultation?', a: 'Simply select a doctor, choose an available time slot, make payment, and join the video call at the scheduled time.' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Your Health, <span className="highlight">Simplified</span></h1>
          <p className="hero-subtitle">AI-Powered Healthcare Platform for Modern Living</p>
          <p className="hero-description">Book appointments, consult doctors online, order medicines, and manage your health - all in one place</p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Get Started Free</Link>
            <Link to="/symptoms" className="btn btn-secondary">Try AI Symptom Checker</Link>
          </div>
          <div className="hero-badges">
            <span className="badge">✓ HIPAA Compliant</span>
            <span className="badge">✓ 50,000+ Users</span>
            <span className="badge">✓ 24/7 Available</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Everything You Need for Better Health</h2>
          <p className="section-subtitle">Comprehensive healthcare solutions at your fingertips</p>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get started in three simple steps</p>
          <div className="steps-grid">
            {steps.map((step, idx) => (
              <div key={idx} className="step-card">
                <div className="step-number">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <div className="container">
          <h2 className="section-title">Services For Everyone</h2>
          <p className="section-subtitle">Tailored solutions for all healthcare stakeholders</p>
          <div className="services-grid">
            {services.map((service, idx) => (
              <div key={idx} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.role}</h3>
                <ul>
                  {service.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Technology */}
      <section className="ai-technology">
        <div className="container">
          <div className="ai-content">
            <div className="ai-text">
              <h2>Powered by Advanced AI</h2>
              <p className="ai-intro">Our cutting-edge artificial intelligence helps you make better health decisions</p>
              <ul className="ai-features">
                <li><strong>Symptom Analysis:</strong> Intelligent symptom evaluation with 95% accuracy</li>
                <li><strong>Smart Recommendations:</strong> Personalized specialist suggestions</li>
                <li><strong>Clinical Assistant:</strong> AI-powered note-taking for doctors</li>
                <li><strong>Predictive Analytics:</strong> Early detection of potential health issues</li>
                <li><strong>Drug Interactions:</strong> Automatic prescription safety checks</li>
              </ul>
              <Link to="/symptoms" className="btn btn-primary">Try AI Symptom Checker</Link>
            </div>
            <div className="ai-visual">
              <div className="ai-circle">🤖</div>
              <div className="ai-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="statistics">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">What Our Users Say</h2>
          <p className="section-subtitle">Real stories from real people</p>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="testimonial-rating">{'⭐'.repeat(testimonial.rating)}</div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing">
        <div className="container">
          <h2 className="section-title">Choose Your Plan</h2>
          <p className="section-subtitle">Flexible pricing for individuals and families</p>
          <div className="pricing-grid">
            {plans.map((plan, idx) => (
              <div key={idx} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="price">{plan.price}</div>
                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
                <Link to="/register" className="btn btn-outline">Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <button 
                  className={`faq-question ${openFaq === idx ? 'active' : ''}`}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  {faq.q}
                  <span className="faq-icon">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Healthcare Experience?</h2>
          <p>Join thousands of users who trust ClinixSol for their health needs</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary btn-large">Start Free Today</Link>
            <Link to="/login" className="btn btn-secondary btn-large">Sign In</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;