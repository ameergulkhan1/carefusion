import React from 'react';
import './About.css';
import heroVideo from '../../assets/5722114-uhd_4096_2160_25fps.mp4';

const About = () => {
  const team = [
    { name: 'Dr. Sarah Johnson', role: 'Chief Medical Officer', icon: '👩‍⚕️' },
    { name: 'John Smith', role: 'CEO & Founder', icon: '👨‍💼' },
    { name: 'Dr. Michael Chen', role: 'Head of AI Research', icon: '👨‍⚕️' },
    { name: 'Emily Davis', role: 'CTO', icon: '👩‍💻' }
  ];

  const values = [
    { icon: '🎯', title: 'Patient-First', desc: 'Every decision we make prioritizes patient care and experience' },
    { icon: '🔒', title: 'Privacy & Security', desc: 'Bank-level encryption and HIPAA compliance as standard' },
    { icon: '💡', title: 'Innovation', desc: 'Leveraging AI and technology to revolutionize healthcare' },
    { icon: '🤝', title: 'Trust', desc: 'Building lasting relationships through transparency and quality' }
  ];

  return (
    <div className="about-page">
      <section className="about-hero">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="container">
          <h1>About CareFusion</h1>
          <p className="about-subtitle">Transforming Healthcare Through Technology and Compassion</p>
        </div>
      </section>

      <section className="about-story">
        <div className="container">
          <h2>Our Story</h2>
          <p>Founded in 2024, CareFusion was born from a simple yet powerful vision: making quality healthcare accessible to everyone, everywhere. Our founders, a team of doctors and technologists, recognized the gaps in traditional healthcare delivery and set out to bridge them with cutting-edge AI technology.</p>
          <p>Today, we serve over 50,000 patients, partner with 1,000+ doctors, and continue to innovate at the intersection of healthcare and technology. Our AI-powered platform has helped countless individuals make informed health decisions and access care when they need it most.</p>
        </div>
      </section>

      <section className="about-mission">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-card">
              <h3>🎯 Our Mission</h3>
              <p>To democratize healthcare by providing accessible, affordable, and AI-powered medical services to everyone, regardless of location or background.</p>
            </div>
            <div className="mission-card">
              <h3>👁️ Our Vision</h3>
              <p>A world where quality healthcare is just a click away, where AI assists medical professionals, and where patients are empowered with knowledge.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            {values.map((value, idx) => (
              <div key={idx} className="value-card">
                <div className="value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-team">
        <div className="container">
          <h2>Meet Our Leadership</h2>
          <div className="team-grid">
            {team.map((member, idx) => (
              <div key={idx} className="team-card">
                <div className="team-icon">{member.icon}</div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-stats">
        <div className="container">
          <div className="stats-row">
            <div className="stat-item"><strong>50K+</strong><span>Happy Patients</span></div>
            <div className="stat-item"><strong>1,000+</strong><span>Expert Doctors</span></div>
            <div className="stat-item"><strong>100+</strong><span>Partner Labs</span></div>
            <div className="stat-item"><strong>98%</strong><span>Satisfaction Rate</span></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
