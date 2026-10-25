import React from 'react';
import Button from '../../../components/common/Button/Button';
import './NoteCard.css';

const NoteCard = ({ note, onView, onEdit, onDelete, onDownload }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'status-draft' },
      completed: { label: 'Completed', className: 'status-completed' },
      reviewed: { label: 'Reviewed', className: 'status-reviewed' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="note-card">
      <div className="note-card-header">
        <div className="note-patient-info">
          <h3>{note.patient?.name || 'Unknown Patient'}</h3>
          <span className="note-patient-id">ID: {note.patient?.id || note.patient?._id}</span>
        </div>
        {getStatusBadge(note.status)}
      </div>

      <div className="note-card-body">
        <div className="note-meta-row">
          <span className="meta-label">Date:</span>
          <span className="meta-value">{formatDate(note.visitDate || note.createdAt)}</span>
        </div>

        <div className="note-meta-row">
          <span className="meta-label">Visit Type:</span>
          <span className="meta-value visit-type">{note.visitType?.replace('_', ' ') || 'N/A'}</span>
        </div>

        <div className="note-meta-row">
          <span className="meta-label">Chief Complaint:</span>
          <span className="meta-value complaint">{note.subjective?.chiefComplaint || 'Not specified'}</span>
        </div>

        {note.assessment?.primaryDiagnosis?.description && (
          <div className="note-meta-row">
            <span className="meta-label">Diagnosis:</span>
            <span className="meta-value diagnosis">
              {note.assessment.primaryDiagnosis.description}
              {note.assessment.primaryDiagnosis.code && ` (${note.assessment.primaryDiagnosis.code})`}
            </span>
          </div>
        )}

        {note.isAIGenerated && (
          <div className="ai-badge">
            🤖 AI-Assisted
          </div>
        )}
      </div>

      <div className="note-card-footer">
        <div className="note-actions">
          <Button size="small" variant="ghost" icon="eye" onClick={onView} title="View">
            View
          </Button>
          {note.status === 'draft' && (
            <Button size="small" variant="ghost" icon="edit" onClick={onEdit} title="Edit">
              Edit
            </Button>
          )}
          <Button size="small" variant="ghost" icon="download" onClick={onDownload} title="Download PDF">
            PDF
          </Button>
          {note.status === 'draft' && (
            <Button size="small" variant="ghost" icon="delete" onClick={onDelete} title="Delete" className="btn-delete">
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
