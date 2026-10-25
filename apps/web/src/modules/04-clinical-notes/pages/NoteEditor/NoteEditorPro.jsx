import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import clinicalNotesService from '../../services/clinicalNotesService';
import Button from '../../../../components/common/Button/Button';
import Input from '../../../../components/common/Input/Input';
import TextArea from '../../../../components/common/TextArea/TextArea';
import Select from '../../../../components/common/Select/Select';
import VoiceToText from '../../components/VoiceToText';
import AINoteSuggestions from '../../components/AINoteSuggestions';
import PatientHistorySummary from '../../components/PatientHistorySummary';
import DiagnosisSearch from '../../components/DiagnosisSearch';
import VitalSigns from '../../components/VitalSigns';
import ReviewOfSystems from '../../components/ReviewOfSystems';
import './NoteEditorPro.css';

const NoteEditorPro = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const autoSaveInterval = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(location.state?.patient || null);
  const [noteData, setNoteData] = useState({
    patient: '',
    appointment: '',
    visitType: 'in_person',
    subjective: {
      chiefComplaint: '',
      historyPresentIllness: '',
      reviewOfSystems: {}
    },
    objective: {
      vitalSigns: {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: '',
        bmi: ''
      },
      generalAppearance: '',
      physicalExamination: {}
    },
    assessment: {
      primaryDiagnosis: { code: '', description: '' },
      secondaryDiagnoses: [],
      differentialDiagnoses: [],
      clinicalImpression: ''
    },
    plan: {
      treatment: '',
      medications: [],
      labTests: [],
      imagingStudies: [],
      procedures: [],
      referrals: [],
      followUp: '',
      patientEducation: '',
      restrictions: ''
    },
    status: 'draft'
  });

  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [activeSection, setActiveSection] = useState('subjective');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (noteId) {
      fetchNote();
    } else if (patient) {
      initializeNewNote();
    }

    // Auto-save every 2 minutes
    autoSaveInterval.current = setInterval(() => {
      if (noteData.status === 'draft') {
        handleSaveDraft(true);
      }
    }, 120000);

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [noteId, patient]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await clinicalNotesService.getNoteById(noteId);
      const note = response?.data || response;
      setNoteData(note);
      setPatient(note?.patient || null);
    } catch (err) {
      console.error('Error fetching note:', err);
      alert('Failed to load note');
      navigate('/doctor/clinical-notes');
    } finally {
      setLoading(false);
    }
  };

  const initializeNewNote = async () => {
    try {
      setLoading(true);
      // Fetch patient data to auto-populate
      const patientData = await clinicalNotesService.getPatientData(patient._id);
      const profile = patientData?.data || patientData || {};
      
      setNoteData(prev => ({
        ...prev,
        patient: patient._id,
        subjective: {
          ...prev.subjective,
          pastMedicalHistory: profile.medicalHistory || [],
          currentMedications: profile.currentMedications || [],
          allergies: profile.allergies || []
        }
      }));
    } catch (err) {
      console.error('Error initializing note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setNoteData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section, subsection, field, value) => {
    setNoteData(prev => ({
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

  const handleArrayAdd = (section, field, item) => {
    setNoteData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section][field] || []), item]
      }
    }));
  };

  const handleArrayRemove = (section, field, index) => {
    setNoteData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }));
  };

  const validateNote = () => {
    const newErrors = {};

    if (!noteData.subjective.chiefComplaint) {
      newErrors.chiefComplaint = 'Chief complaint is required';
    }

    if (!noteData.assessment.primaryDiagnosis.code) {
      newErrors.primaryDiagnosis = 'Primary diagnosis is required';
    }

    if (!noteData.plan.followUp) {
      newErrors.followUp = 'Follow-up plan is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async (autoSave = false) => {
    try {
      if (!autoSave) setSaving(true);

      const providerId = user?._id || user?.id || user?.userId;
      const payload = {
        ...noteData,
        status: 'draft',
        doctor: providerId
      };

      let response;
      if (noteId) {
        response = await clinicalNotesService.updateNote(noteId, payload);
      } else {
        response = await clinicalNotesService.createNote(payload);
        const createdId = response?.data?._id || response?._id;
        if (createdId) {
          navigate(`/doctor/clinical-notes/${createdId}`, { replace: true });
        }
      }

      if (!autoSave) {
        alert('Draft saved successfully');
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      if (!autoSave) {
        alert('Failed to save draft');
      }
    } finally {
      if (!autoSave) setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    setShowAISuggestions(true);
  };

  const handleApplyAISuggestions = (aiNote) => {
    setNoteData(prev => ({
      ...prev,
      subjective: {
        ...prev.subjective,
        chiefComplaint: aiNote.chiefComplaint || prev.subjective.chiefComplaint,
        historyPresentIllness: aiNote.HPI || aiNote.historyPresentIllness || prev.subjective.historyPresentIllness
      },
      assessment: {
        ...prev.assessment,
        ...aiNote.assessment,
        primaryDiagnosis: {
          ...prev.assessment.primaryDiagnosis,
          code: aiNote?.assessment?.icd10 || prev.assessment.primaryDiagnosis.code,
          description: aiNote?.assessment?.diagnosis || prev.assessment.primaryDiagnosis.description
        }
      },
      plan: {
        ...prev.plan,
        treatment: aiNote?.plan?.nonPharmacologic?.join('; ') || prev.plan.treatment,
        followUp: aiNote?.plan?.followUp || prev.plan.followUp,
        patientEducation: aiNote?.plan?.education?.join('; ') || prev.plan.patientEducation,
        ...aiNote.plan
      }
    }));
    setShowAISuggestions(false);
    alert('AI suggestions applied successfully');
  };

  const handleFinalizeNote = async () => {
    if (!validateNote()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!window.confirm('Are you sure you want to finalize this note? It cannot be edited after finalization.')) {
      return;
    }

    try {
      setSaving(true);
      let noteIdentifier = noteId || noteData._id;

      if (!noteIdentifier) {
        const providerId = user?._id || user?.id || user?.userId;
        const createResponse = await clinicalNotesService.createNote({
          ...noteData,
          status: 'draft',
          doctor: providerId
        });
        noteIdentifier = createResponse?.data?._id || createResponse?._id;
      }

      await clinicalNotesService.finalizeNote(noteIdentifier);
      alert('Note finalized successfully');
      navigate('/doctor/clinical-notes');
    } catch (err) {
      console.error('Error finalizing note:', err);
      alert('Failed to finalize note');
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceInsert = (text, section) => {
    if (section === 'chiefComplaint') {
      handleInputChange('subjective', 'chiefComplaint', noteData.subjective.chiefComplaint + ' ' + text);
    } else if (section === 'hpi') {
      handleInputChange('subjective', 'historyPresentIllness', noteData.subjective.historyPresentIllness + ' ' + text);
    }
  };

  const handleImportPreviousNote = async (previousNoteId) => {
    try {
      const response = await clinicalNotesService.getNoteById(previousNoteId);
      const previousNote = response?.data || response;

      setNoteData(prev => ({
        ...prev,
        subjective: {
          ...prev.subjective,
          pastMedicalHistory: previousNote.subjective.pastMedicalHistory,
          currentMedications: previousNote.subjective.currentMedications,
          allergies: previousNote.subjective.allergies
        }
      }));

      alert('Previous note data imported successfully');
    } catch (err) {
      console.error('Error importing previous note:', err);
      alert('Failed to import previous note');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading note editor...</div>;
  }

  return (
    <div className="note-editor-pro">
      <div className="editor-header">
        <div className="header-left">
          <h1>{noteId ? 'Edit Clinical Note' : 'New Clinical Note'}</h1>
          {patient && (
            <div className="patient-info-badge">
              <span className="patient-name">{patient.name}</span>
              <span className="patient-id">ID: {patient.id}</span>
              <span className="patient-meta">{patient.age}y, {patient.gender}</span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => navigate('/doctor/clinical-notes')}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleSaveDraft()} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            variant="primary" 
            icon="sparkles"
            onClick={handleGenerateAI}
            disabled={!noteData.subjective.chiefComplaint}
          >
            AI Suggestions
          </Button>
          <Button 
            variant="success" 
            onClick={handleFinalizeNote}
            disabled={saving || noteData.status === 'completed'}
          >
            Finalize Note
          </Button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-panel left-panel">
          <div className="panel-tabs">
            <button 
              className={`tab ${activeSection === 'subjective' ? 'active' : ''}`}
              onClick={() => setActiveSection('subjective')}
            >
              Subjective
            </button>
            <button 
              className={`tab ${activeSection === 'objective' ? 'active' : ''}`}
              onClick={() => setActiveSection('objective')}
            >
              Objective
            </button>
            <button 
              className={`tab ${activeSection === 'assessment' ? 'active' : ''}`}
              onClick={() => setActiveSection('assessment')}
            >
              Assessment
            </button>
            <button 
              className={`tab ${activeSection === 'plan' ? 'active' : ''}`}
              onClick={() => setActiveSection('plan')}
            >
              Plan
            </button>
          </div>

          <div className="panel-content">
            {activeSection === 'subjective' && (
              <div className="section-content">
                <h2>Subjective</h2>

                <div className="form-group">
                  <label>Visit Type *</label>
                  <Select
                    value={noteData.visitType}
                    onChange={(e) => setNoteData({ ...noteData, visitType: e.target.value })}
                    options={[
                      { value: 'in_person', label: 'In-Person' },
                      { value: 'telemedicine', label: 'Telemedicine' },
                      { value: 'follow_up', label: 'Follow-up' },
                      { value: 'emergency', label: 'Emergency' }
                    ]}
                  />
                </div>

                <div className="form-group">
                  <div className="label-with-action">
                    <label>Chief Complaint *</label>
                    <Button 
                      size="small" 
                      variant="ghost" 
                      icon="microphone"
                      onClick={() => setShowVoiceInput(!showVoiceInput)}
                    >
                      Voice
                    </Button>
                  </div>
                  <TextArea
                    value={noteData.subjective.chiefComplaint}
                    onChange={(e) => handleInputChange('subjective', 'chiefComplaint', e.target.value)}
                    placeholder="Patient presents with..."
                    rows={3}
                    error={errors.chiefComplaint}
                  />
                  {showVoiceInput && (
                    <VoiceToText
                      onTranscript={(text) => handleVoiceInsert(text, 'chiefComplaint')}
                      onClose={() => setShowVoiceInput(false)}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>History of Present Illness</label>
                  <TextArea
                    value={noteData.subjective.historyPresentIllness}
                    onChange={(e) => handleInputChange('subjective', 'historyPresentIllness', e.target.value)}
                    placeholder="Detailed symptom description, duration, onset, severity..."
                    rows={6}
                  />
                </div>

                <div className="form-group">
                  <label>Review of Systems</label>
                  <ReviewOfSystems
                    data={noteData.subjective.reviewOfSystems}
                    onChange={(ros) => handleInputChange('subjective', 'reviewOfSystems', ros)}
                  />
                </div>
              </div>
            )}

            {activeSection === 'objective' && (
              <div className="section-content">
                <h2>Objective</h2>

                <div className="form-group">
                  <label>Vital Signs</label>
                  <VitalSigns
                    data={noteData.objective.vitalSigns}
                    onChange={(vitals) => handleInputChange('objective', 'vitalSigns', vitals)}
                  />
                </div>

                <div className="form-group">
                  <label>General Appearance</label>
                  <TextArea
                    value={noteData.objective.generalAppearance}
                    onChange={(e) => handleInputChange('objective', 'generalAppearance', e.target.value)}
                    placeholder="Alert and oriented, well-nourished..."
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Physical Examination Findings</label>
                  <TextArea
                    value={noteData.objective.physicalExamination.findings || ''}
                    onChange={(e) => handleNestedChange('objective', 'physicalExamination', 'findings', e.target.value)}
                    placeholder="Cardiovascular, respiratory, abdominal, neurological findings..."
                    rows={6}
                  />
                </div>
              </div>
            )}

            {activeSection === 'assessment' && (
              <div className="section-content">
                <h2>Assessment</h2>

                <div className="form-group">
                  <label>Primary Diagnosis *</label>
                  <DiagnosisSearch
                    value={noteData.assessment.primaryDiagnosis}
                    onChange={(diagnosis) => handleInputChange('assessment', 'primaryDiagnosis', diagnosis)}
                    error={errors.primaryDiagnosis}
                  />
                </div>

                <div className="form-group">
                  <label>Clinical Impression</label>
                  <TextArea
                    value={noteData.assessment.clinicalImpression}
                    onChange={(e) => handleInputChange('assessment', 'clinicalImpression', e.target.value)}
                    placeholder="Overall clinical assessment and reasoning..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {activeSection === 'plan' && (
              <div className="section-content">
                <h2>Plan</h2>

                <div className="form-group">
                  <label>Treatment Plan</label>
                  <TextArea
                    value={noteData.plan.treatment}
                    onChange={(e) => handleInputChange('plan', 'treatment', e.target.value)}
                    placeholder="Medications, procedures, therapies..."
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label>Follow-up *</label>
                  <Input
                    value={noteData.plan.followUp}
                    onChange={(e) => handleInputChange('plan', 'followUp', e.target.value)}
                    placeholder="e.g., 1 week, 2 weeks, PRN"
                    error={errors.followUp}
                  />
                </div>

                <div className="form-group">
                  <label>Patient Education</label>
                  <TextArea
                    value={noteData.plan.patientEducation}
                    onChange={(e) => handleInputChange('plan', 'patientEducation', e.target.value)}
                    placeholder="Instructions and education provided to patient..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="editor-panel right-panel">
          <div className="panel-header">
            <h3>AI Assistant</h3>
          </div>

          {showAISuggestions && (
            <AINoteSuggestions
              onApply={handleApplyAISuggestions}
              onClose={() => setShowAISuggestions(false)}
              patientId={patient?._id}
              noteData={noteData}
            />
          )}

          <PatientHistorySummary
            patientId={patient?._id}
            onImportNote={handleImportPreviousNote}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteEditorPro;
