import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import doctorService from '../../../../services/doctorService';
import './DoctorProfile.css';

const DoctorProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await doctorService.getProfile();

        if (!mounted) return;

        if (!response?.success || !response?.data) {
          throw new Error('Invalid profile response');
        }

        setProfile(response.data);
      } catch (error) {
        if (!mounted) return;
        toast.error(error?.message || 'Failed to load doctor profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const doctor = profile?.doctor || profile || {};
  const user = profile?.user || {};
  const qualifications = Array.isArray(doctor.qualifications) ? doctor.qualifications : [];
  const languages = Array.isArray(doctor.languages) ? doctor.languages : [];
  const clinicAddress = doctor.clinicAddress || {};
  const availability = Array.isArray(doctor.availability) ? doctor.availability : [];
  const ratingAverage = doctor.rating?.average ?? 0;
  const ratingCount = doctor.rating?.count ?? 0;

  if (loading) {
    return (
      <div className="doctor-profile-page">
        <div className="doctor-profile-loading">
          <div className="doctor-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="doctor-profile-page">
        <div className="doctor-profile-empty">Unable to load profile data.</div>
      </div>
    );
  }

  return (
    <div className="doctor-profile-page">
      <div className="profile-header-card">
        <div>
          <h1>{user.fullName || 'Doctor Profile'}</h1>
          <p>{doctor.specialization || 'General Practice'}</p>
        </div>
        <div className="profile-badges">
          <span className={doctor.isVerified ? 'badge verified' : 'badge'}>
            {doctor.isVerified ? 'Verified' : 'Unverified'}
          </span>
          <span className="badge">Rating {ratingAverage} ({ratingCount})</span>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <h2>Professional Details</h2>
          <div className="detail-list">
            <div><span>License Number</span><strong>{doctor.licenseNumber || 'N/A'}</strong></div>
            <div><span>Experience</span><strong>{doctor.experience || 0} years</strong></div>
            <div><span>Consultation Fee</span><strong>{doctor.consultationFee || 0}</strong></div>
            <div><span>Email</span><strong>{user.email || 'N/A'}</strong></div>
            <div><span>Phone</span><strong>{user.phone || 'N/A'}</strong></div>
          </div>
        </section>

        <section className="profile-card">
          <h2>Clinic Address</h2>
          <div className="detail-list">
            <div><span>Clinic</span><strong>{clinicAddress.name || 'N/A'}</strong></div>
            <div><span>Street</span><strong>{clinicAddress.street || 'N/A'}</strong></div>
            <div><span>City</span><strong>{clinicAddress.city || 'N/A'}</strong></div>
            <div><span>State</span><strong>{clinicAddress.state || 'N/A'}</strong></div>
            <div><span>Zip</span><strong>{clinicAddress.zipCode || 'N/A'}</strong></div>
          </div>
        </section>

        <section className="profile-card full-width">
          <h2>Biography</h2>
          <p className="bio-text">{doctor.bio || 'No biography added yet.'}</p>
        </section>

        <section className="profile-card">
          <h2>Languages</h2>
          <div className="pill-wrap">
            {languages.length ? languages.map((lang) => (
              <span key={lang} className="pill">{lang}</span>
            )) : <span className="muted">No languages listed</span>}
          </div>
        </section>

        <section className="profile-card">
          <h2>Qualifications</h2>
          <div className="stack-list">
            {qualifications.length ? qualifications.map((item, idx) => (
              <div key={`${item.degree || 'qualification'}-${idx}`} className="stack-item">
                <strong>{item.degree || 'Degree'}</strong>
                <span>{item.institution || 'Institution'}</span>
                <span>{item.year || 'Year N/A'}</span>
              </div>
            )) : <span className="muted">No qualifications listed</span>}
          </div>
        </section>

        <section className="profile-card full-width">
          <h2>Availability</h2>
          <div className="stack-list">
            {availability.length ? availability.map((slot, idx) => (
              <div key={`${slot.day || 'day'}-${idx}`} className="stack-item row-item">
                <strong>{slot.day || 'Day'}</strong>
                <span>
                  {Array.isArray(slot.slots) && slot.slots.length
                    ? slot.slots.map((time) => `${time.startTime || '--'} - ${time.endTime || '--'}`).join(', ')
                    : 'No slots'}
                </span>
              </div>
            )) : <span className="muted">No availability configured</span>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorProfile;
