import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import { patientService } from '../../services/patientService';
import doctorService from '../../../../services/doctorService';
import laboratoryService from '../../../08-laboratory/services/laboratoryService';
import './PatientProfile.css';

const PatientProfile = () => {
  const { patientId } = useParams();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const isViewingPatient = isDoctor && patientId;
  const isViewingOwnDoctorProfile = isDoctor && !patientId;
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [labResults, setLabResults] = useState([]);
  const [loadingLabResults, setLoadingLabResults] = useState(false);
  const [aiSummaries, setAiSummaries] = useState([]);
  const [loadingAiSummaries, setLoadingAiSummaries] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      
      await fetchProfile();

      if (!isViewingOwnDoctorProfile && isMounted) {
        await fetchAiSummaries();
      }
      
      if (!isViewingPatient && !isViewingOwnDoctorProfile && isMounted) {
        // Fetch all additional data in parallel
        await Promise.allSettled([
          fetchStats(),
          fetchMedications(),
          fetchLabResults()
        ]);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [patientId, isViewingPatient, isViewingOwnDoctorProfile]);

  const fetchMedications = async () => {
    try {
      setLoadingMedications(true);
      // Try to fetch prescriptions from patient service
      const response = await patientService.getPrescriptions();
      if (response.success && response.data) {
        const prescriptions = Array.isArray(response.data) 
          ? response.data 
          : response.data.prescriptions || [];
        
        // Extract all medications from all prescriptions
        const allMedications = prescriptions.flatMap(prescription => {
          const meds = prescription.medications || [];
          return meds.map(med => ({
            ...med,
            prescriptionId: prescription._id || prescription.id,
            prescriptionNo: prescription.prescriptionNo || prescription.prescriptionNumber,
            prescribedDate: prescription.createdAt || prescription.prescriptionDate,
            doctor: prescription.doctorId 
              ? `Dr. ${prescription.doctorId.firstName} ${prescription.doctorId.lastName}`
              : prescription.doctor || 'Unknown',
            status: prescription.status
          }));
        });
        
        setMedications(allMedications);
      }
    } catch (error) {
      console.error('Failed to fetch medications:', error);
      // Silently fail - medications section will show empty state
      setMedications([]);
    } finally {
      setLoadingMedications(false);
    }
  };

  const fetchLabResults = async () => {
    try {
      setLoadingLabResults(true);
      const response = await laboratoryService.getPatientResults().catch(() => ({ success: false, data: [] }));
      if (response.success && response.data) {
        setLabResults(response.data);
      } else {
        setLabResults([]);
      }
    } catch (error) {
      console.error('Failed to fetch lab results:', error);
      setLabResults([]);
    } finally {
      setLoadingLabResults(false);
    }
  };

  const fetchAiSummaries = async () => {
    try {
      setLoadingAiSummaries(true);

      const currentPatientId = patientId || user?._id || user?.id || user?.patientId || null;
      const localSummaries = patientService.getClinicalSummariesLocal(currentPatientId) || patientService.getClinicalSummariesLocal();
      const normalizedLocal = localSummaries.map((item) => ({
        id: item.id,
        source: 'local',
        title: 'AI Clinical Notes Summary',
        summaryText: item?.summary?.shortSummary || 'AI-generated summary available',
        createdAt: item.createdAt,
        fileName: item?.sourceFileNames?.join(', ') || 'Uploaded PDF reports',
        downloadUrl: null
      }));

      let remoteSummaries = [];
      const recentRecordsResponse = await patientService.getRecentMedicalRecords(25).catch(() => null);
      const records =
        recentRecordsResponse?.data?.records ||
        recentRecordsResponse?.data?.data?.records ||
        recentRecordsResponse?.records ||
        recentRecordsResponse?.data?.data ||
        recentRecordsResponse?.data ||
        [];

      const normalizeTags = (tagsValue) => {
        if (!tagsValue) return '';
        if (Array.isArray(tagsValue)) {
          return tagsValue.map((item) => String(item || '')).join(',').toLowerCase();
        }
        if (typeof tagsValue === 'object') {
          return Object.values(tagsValue).map((item) => String(item || '')).join(',').toLowerCase();
        }
        return String(tagsValue).toLowerCase();
      };

      if (Array.isArray(records)) {
        remoteSummaries = records
          .filter((record) => {
            const fileName = (record.fileName || '').toLowerCase();
            const tags = normalizeTags(record.tags);
            return fileName.includes('ai-clinical-summary') || tags.includes('ai_clinical_summary');
          })
          .map((record) => ({
            id: record._id || record.id,
            source: 'record',
            title: 'AI Clinical Notes Summary',
            summaryText: record.notes || 'AI-generated clinical summary PDF stored in records.',
            createdAt: record.createdAt || record.documentDate,
            fileName: record.fileName || 'AI Clinical Summary.pdf',
            recordId: record._id || record.id,
            downloadUrl: record.documentUrl || null
          }));
      }

      const merged = [...remoteSummaries, ...normalizedLocal]
        .filter((item, index, arr) => arr.findIndex((other) => other.id === item.id) === index)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setAiSummaries(merged.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch AI summaries:', error);
      setAiSummaries([]);
    } finally {
      setLoadingAiSummaries(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let response;
      
      if (isViewingPatient) {
        // Doctor viewing a patient's profile
        response = await doctorService.getPatientById(patientId);
      } else if (isViewingOwnDoctorProfile) {
        // Doctor viewing own profile
        response = await doctorService.getProfile();
      } else {
        // User viewing their own profile
        response = await patientService.getProfile();
      }
      
      if (response.success && response.data) {
        setProfile(response.data);
        setFormData(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error(error.message || 'Failed to load profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await patientService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Stats are optional, so just log the error
      setStats({
        totalAppointments: 0,
        totalMedicalRecords: 0,
        totalPrescriptions: 0,
        totalLabReports: 0
      });
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (isViewingOwnDoctorProfile) {
        await doctorService.updateProfile(formData);
      } else {
        await patientService.updateProfile(formData);
      }
      toast.success('Profile updated successfully');
      setProfile(formData);
      setEditing(false);
      if (!isViewingOwnDoctorProfile) {
        fetchStats();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
  };

  const handleSummaryDownload = async (summaryItem) => {
    try {
      if (summaryItem.recordId) {
        const response = await patientService.downloadMedicalRecord(summaryItem.recordId);
        if (response?.data?.url) {
          window.open(response.data.url, '_blank');
          return;
        }
      }

      if (summaryItem.downloadUrl) {
        window.open(summaryItem.downloadUrl, '_blank');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to download AI summary PDF');
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length >= 2 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="loading-spinner" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        background: 'white',
        borderRadius: '8px',
        margin: '2rem'
      }}>
        <div>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3182ce',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#666', textAlign: 'center' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || !formData) {
    return (
      <div className="patient-profile" style={{ padding: '2rem' }}>
        <div className="error-message" style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Unable to load profile data</h2>
          <p style={{ color: '#666' }}>Please check the console for more details.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isViewingOwnDoctorProfile) {
    const doctorData = profile?.doctor || profile || {};
    const userData = profile?.user || {};

    return (
      <div className="patient-profile-page">
        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="profile-card">
              <h2 className="profile-name">{userData.fullName || 'Doctor Profile'}</h2>
              <p className="profile-id">Role: Doctor</p>
            </div>
          </div>

          <div className="profile-main">
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">Doctor Information</h3>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={userData.fullName || ''} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="text" className="form-input" value={userData.email || ''} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={userData.phone || ''} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input type="text" className="form-input" value={doctorData.specialization || ''} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input type="text" className="form-input" value={doctorData.licenseNumber || ''} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience</label>
                  <input type="text" className="form-input" value={doctorData.experience || 0} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Consultation Fee</label>
                  <input type="text" className="form-input" value={doctorData.consultationFee || 0} disabled />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-profile">
      <div className="profile-container">
        {/* Hero Section with Profile Info */}
        <div className="profile-hero">
          <div className="hero-left">
            <div className="profile-image-container">
              {profile.user.profileImage ? (
                <img 
                  src={profile.user.profileImage} 
                  alt={profile.user.fullName}
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  {getInitials(profile.user.fullName)}
                </div>
              )}
            </div>
            <div className="hero-info">
              <h2 className="profile-name">{profile.user.fullName}</h2>
              <p className="profile-id">Patient ID: {profile.patient.patientId || 'N/A'}</p>
              <p className="profile-age">Age: {calculateAge(profile.patient.dateOfBirth)} • {profile.patient.gender || 'Not specified'}</p>
            </div>
          </div>
          {!editing && !isViewingPatient && (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {/* Stats Grid - Horizontal */}
        <div className="stats-grid-horizontal">
          <div className="stat-card-large">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalAppointments || 0}</div>
              <div className="stat-label">Appointments</div>
            </div>
          </div>
          <div className="stat-card-large">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalMedicalRecords || 0}</div>
              <div className="stat-label">Medical Records</div>
            </div>
          </div>
          <div className="stat-card-large">
            <div className="stat-icon">💊</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalPrescriptions || 0}</div>
              <div className="stat-label">Prescriptions</div>
            </div>
          </div>
          <div className="stat-card-large">
            <div className="stat-icon">🧪</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalLabReports || 0}</div>
              <div className="stat-label">Lab Reports</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          {/* Personal Information */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">Personal Information</h3>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.user.fullName || ''}
                  onChange={(e) => handleInputChange('user', 'fullName', e.target.value)}
                  disabled={!editing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.user.email || ''}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.user.phone || ''}
                  onChange={(e) => handleInputChange('user', 'phone', e.target.value)}
                  disabled={!editing}
                  placeholder="+92 300 1234567"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.patient.dateOfBirth?.split('T')[0] || ''}
                  onChange={(e) => handleInputChange('patient', 'dateOfBirth', e.target.value)}
                  disabled={!editing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="text"
                  className="form-input"
                  value={calculateAge(formData.patient.dateOfBirth)}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={formData.patient.gender || ''}
                  onChange={(e) => handleInputChange('patient', 'gender', e.target.value)}
                  disabled={!editing}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select
                  className="form-select"
                  value={formData.patient.bloodGroup || ''}
                  onChange={(e) => handleInputChange('patient', 'bloodGroup', e.target.value)}
                  disabled={!editing}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.patient.address?.street || ''}
                  onChange={(e) => handleNestedInputChange('patient', 'address', 'street', e.target.value)}
                  disabled={!editing}
                  placeholder="House #, Street name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.patient.address?.city || ''}
                  onChange={(e) => handleNestedInputChange('patient', 'address', 'city', e.target.value)}
                  disabled={!editing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State/Province</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.patient.address?.state || ''}
                  onChange={(e) => handleNestedInputChange('patient', 'address', 'state', e.target.value)}
                  disabled={!editing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ZIP Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.patient.address?.zipCode || ''}
                  onChange={(e) => handleNestedInputChange('patient', 'address', 'zipCode', e.target.value)}
                  disabled={!editing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.patient.address?.country || 'Pakistan'}
                  onChange={(e) => handleNestedInputChange('patient', 'address', 'country', e.target.value)}
                  disabled={!editing}
                />
              </div>

              {editing && (
                <div className="action-buttons">
                  <button className="btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>



          {/* Current Medications */}
          {!isViewingPatient && (
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">Current Medications</h3>
                <Link to="/patient/prescriptions" className="section-link">
                  View All Prescriptions →
                </Link>
              </div>

              {loadingMedications ? (
                <div className="medications-loading">
                  <div className="spinner-small"></div>
                  <p>Loading medications...</p>
                </div>
              ) : medications.length > 0 ? (
                <div className="medications-grid">
                  {medications.slice(0, 6).map((med, index) => (
                    <div key={`${med.prescriptionId}-${index}`} className="medication-card">
                      <div className="medication-header">
                        <h4 className="medication-name">{med.medicineName || med.name || 'Unknown Medicine'}</h4>
                        <span className={`medication-status status-${med.status}`}>
                          {med.status || 'active'}
                        </span>
                      </div>
                      <div className="medication-details">
                        <div className="detail-row">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="detail-text">{med.dosage || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="detail-text">{med.frequency || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="detail-text">{med.duration || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="medication-footer">
                        <p className="prescribed-by">Prescribed by {med.doctor}</p>
                        <p className="prescribed-date">
                          {med.prescribedDate ? new Date(med.prescribedDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      {med.instructions && (
                        <div className="medication-instructions">
                          <strong>Instructions:</strong> {med.instructions}
                        </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-medications">
                      <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h4>No Medications Found</h4>
                      <p>You don't have any active prescriptions at the moment</p>
                    </div>
                  )}
                </div>
              )}
    
              {/* Lab Test Results */}
          {!isViewingPatient && (
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">Lab Test Results</h3>
                <Link to="/laboratory/results" className="section-link">
                  View All Results →
                </Link>
              </div>

              {loadingLabResults ? (
                <div className="medications-loading">
                  <div className="spinner-small"></div>
                  <p>Loading lab results...</p>
                </div>
              ) : labResults.length > 0 ? (
                <div className="lab-results-grid">
                  {labResults.slice(0, 4).map((result) => (
                    <Link 
                      key={result._id} 
                      to={`/laboratory/results/${result._id}`}
                      className="lab-result-card"
                    >
                      <div className="lab-result-header">
                        <div className="result-icon">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="result-info">
                          <h4 className="result-test-name">{result.testName}</h4>
                          <p className="result-test-code">{result.testCode}</p>
                        </div>
                      </div>
                      
                      <div className="lab-result-body">
                        <div className="result-status-badge">
                          <span className={`status-indicator status-${result.overallResult}`}></span>
                          <span className="status-text">{result.overallResult}</span>
                        </div>
                        <p className="result-date">
                          {result.reportedAt ? new Date(result.reportedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Pending'}
                        </p>
                      </div>

                      {result.isVerified && (
                        <div className="result-verified">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Verified</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-medications">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4>No Lab Results Found</h4>
                  <p>You don't have any lab test results yet</p>
                  <Link to="/laboratory/book-test" className="btn-book-test">
                    Book Lab Test
                  </Link>
                </div>
              )}
            </div>
          )}

          {!isViewingOwnDoctorProfile && (
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">AI Clinical Notes and Documentation</h3>
                <Link to="/medical-records" className="section-link">
                  Manage Records →
                </Link>
              </div>

              {loadingAiSummaries ? (
                <div className="medications-loading">
                  <div className="spinner-small"></div>
                  <p>Loading AI summaries...</p>
                </div>
              ) : aiSummaries.length > 0 ? (
                <div className="medications-grid">
                  {aiSummaries.map((summary) => (
                    <div key={summary.id} className="medication-card">
                      <div className="medication-header">
                        <h4 className="medication-name">{summary.title}</h4>
                        <span className="medication-status status-ready">available</span>
                      </div>
                      <div className="medication-details">
                        <div className="detail-row">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="detail-text">
                            {summary.createdAt ? new Date(summary.createdAt).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <div className="detail-row">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="detail-text">{summary.fileName}</span>
                        </div>
                      </div>
                      <div className="medication-instructions">
                        <strong>Summary:</strong> {summary.summaryText}
                      </div>
                      {(summary.recordId || summary.downloadUrl) && (
                        <div className="medication-footer">
                          <button className="btn-primary" onClick={() => handleSummaryDownload(summary)}>
                            Download PDF
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-medications">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4>No AI Clinical Summaries Yet</h4>
                  <p>Upload PDF reports in Medical Records to auto-generate AI clinical notes.</p>
                </div>
              )}
            </div>
          )}



        </div>
      </div>
    </div>
  );
};

export default PatientProfile;