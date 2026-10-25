import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import clinicalNotesService from '../../services/clinicalNotesService';
import StatCard from '../../components/StatCard';
import NoteCard from '../../components/NoteCard';
import SearchBar from '../../../../components/common/SearchBar/SearchBar';
import Button from '../../../../components/common/Button/Button';
import Modal from '../../../../components/common/Modal/Modal';
import PatientSelector from '../../components/PatientSelector';
import './ClinicalNotesDashboard.css';

const ClinicalNotesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const doctorId = user?._id || user?.id || user?.userId;
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [statistics, setStatistics] = useState({
    totalNotes: 0,
    pendingReviews: 0,
    aiGeneratedNotes: 0,
    avgTimeSaved: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotes();
    fetchStatistics();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [notes, searchQuery, filterType]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await clinicalNotesService.getNotesByDoctor(doctorId);
      const noteList = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setNotes(noteList);
      setError(null);
    } catch (err) {
      setError('Failed to fetch clinical notes');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await clinicalNotesService.getStatistics(doctorId);
      const normalizedStats = stats?.data || stats || {};
      setStatistics({
        totalNotes: normalizedStats.totalNotes || 0,
        pendingReviews: normalizedStats.pendingReviews || 0,
        aiGeneratedNotes: normalizedStats.aiGeneratedNotes || 0,
        avgTimeSaved: normalizedStats.avgTimeSaved || 0
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...notes];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.patient?.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subjective?.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.assessment?.primaryDiagnosis?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    switch (filterType) {
      case 'today':
        filtered = filtered.filter(note => new Date(note.visitDate) >= todayStart);
        break;
      case 'week':
        filtered = filtered.filter(note => new Date(note.visitDate) >= weekStart);
        break;
      case 'draft':
        filtered = filtered.filter(note => note.status === 'draft');
        break;
      case 'completed':
        filtered = filtered.filter(note => note.status === 'completed');
        break;
      default:
        break;
    }

    setFilteredNotes(filtered);
  };

  const handleNewNote = (patient) => {
    navigate('/doctor/clinical-notes/new', { state: { patient } });
    setShowPatientModal(false);
  };

  const handleViewNote = (noteId) => {
    navigate(`/doctor/clinical-notes/${noteId}`);
  };

  const handleEditNote = (noteId) => {
    navigate(`/doctor/clinical-notes/${noteId}`);
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await clinicalNotesService.deleteNote(noteId);
        fetchNotes();
        fetchStatistics();
      } catch (err) {
        alert('Failed to delete note');
        console.error('Error deleting note:', err);
      }
    }
  };

  const handleDownloadPDF = async (noteId) => {
    try {
      await clinicalNotesService.downloadPDF(noteId);
    } catch (err) {
      alert('Failed to download PDF');
      console.error('Error downloading PDF:', err);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading clinical notes...</div>;
  }

  return (
    <div className="clinical-notes-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>Clinical Notes</h1>
          <Button 
            variant="primary" 
            icon="plus"
            onClick={() => setShowPatientModal(true)}
          >
            New Note
          </Button>
        </div>

        <div className="dashboard-controls">
          <SearchBar
            placeholder="Search by patient name, ID, diagnosis..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="notes-search"
          />
          
          <div className="filter-group">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-dropdown"
            >
              <option value="all">All Notes</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="draft">Drafts</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="statistics-section">
        <StatCard
          title="Total Notes"
          value={statistics.totalNotes}
          subtitle="This week"
          icon="document"
          color="blue"
        />
        <StatCard
          title="Pending Reviews"
          value={statistics.pendingReviews}
          subtitle="Require attention"
          icon="clock"
          color="orange"
        />
        <StatCard
          title="AI Generated"
          value={statistics.aiGeneratedNotes}
          subtitle="Using AI assistance"
          icon="robot"
          color="purple"
        />
        <StatCard
          title="Avg. Time Saved"
          value={`${statistics.avgTimeSaved} min`}
          subtitle="Per note with AI"
          icon="timer"
          color="green"
        />
      </div>

      <div className="notes-section">
        <div className="section-header">
          <h2>Recent Notes</h2>
          <span className="notes-count">{filteredNotes.length} notes</span>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No clinical notes found</h3>
            <p>Start creating notes by clicking the "New Note" button</p>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map(note => (
              <NoteCard
                key={note._id}
                note={note}
                onView={() => handleViewNote(note._id)}
                onEdit={() => handleEditNote(note._id)}
                onDelete={() => handleDeleteNote(note._id)}
                onDownload={() => handleDownloadPDF(note._id)}
              />
            ))}
          </div>
        )}
      </div>

      {showPatientModal && (
        <Modal
          title="Select Patient"
          onClose={() => setShowPatientModal(false)}
          size="medium"
        >
          <PatientSelector
            onSelect={handleNewNote}
            onCancel={() => setShowPatientModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ClinicalNotesDashboard;
