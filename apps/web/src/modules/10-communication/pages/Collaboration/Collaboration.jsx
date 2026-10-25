import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import communicationService from '../../services/communicationService';
import './Collaboration.css';

const Collaboration = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewCollaboration, setShowNewCollaboration] = useState(false);
  const [newCollaborationData, setNewCollaborationData] = useState({
    patientId: '',
    collaboratingDoctorIds: [],
    diagnosis: '',
    initialPlan: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load collaborations on mount
  useEffect(() => {
    const loadCollaborations = async () => {
      try {
        setLoading(true);
        const response = await communicationService.getPatientCollaborations('');
        const colls = Array.isArray(response?.data) ? response.data : 
                     response?.collaborations ? response.collaborations : [];
        setCollaborations(colls);
        setError(null);
      } catch (err) {
        console.error('Failed to load collaborations:', err);
        setError('Failed to load collaborations');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadCollaborations();
    }
  }, [user]);

  // Load treatment plan and comments when collaboration is selected
  useEffect(() => {
    const loadCollaborationDetails = async () => {
      if (!selectedCollaboration) return;

      try {
        const planResponse = await communicationService.updateTreatmentPlan(
          selectedCollaboration._id || selectedCollaboration.id,
          {}
        );
        setTreatmentPlan(planResponse?.data || planResponse);

        const commentsResponse = await communicationService.getPlanComments(
          selectedCollaboration._id || selectedCollaboration.id
        );
        const commentsList = Array.isArray(commentsResponse?.data) ? commentsResponse.data : 
                            commentsResponse?.comments ? commentsResponse.comments : [];
        setComments(commentsList);
      } catch (err) {
        console.error('Failed to load details:', err);
        setError('Failed to load collaboration details');
      }
    };

    loadCollaborationDetails();
  }, [selectedCollaboration]);

  const handleCreateCollaboration = async () => {
    if (!newCollaborationData.patientId || !newCollaborationData.collaboratingDoctorIds.length) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await communicationService.createCollaboration({
        patientId: newCollaborationData.patientId,
        collaboratingDoctors: newCollaborationData.collaboratingDoctorIds,
        diagnosis: newCollaborationData.diagnosis,
        initialTreatmentPlan: newCollaborationData.initialPlan
      });

      const newCollab = response?.data || response;
      setCollaborations([...collaborations, newCollab]);
      setShowNewCollaboration(false);
      setNewCollaborationData({
        patientId: '',
        collaboratingDoctorIds: [],
        diagnosis: '',
        initialPlan: ''
      });
      setSuccess('Collaboration created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create collaboration:', err);
      setError('Failed to create collaboration');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedCollaboration) return;

    try {
      const response = await communicationService.addPlanComment(
        selectedCollaboration._id || selectedCollaboration.id,
        newComment
      );

      const newCommentObj = response?.data || {
        text: newComment,
        author: user?.name || user?.fullName,
        createdAt: new Date(),
        authorId: user?._id || user?.id
      };

      setComments([...comments, newCommentObj]);
      setNewComment('');
      setSuccess('Comment added successfully');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
    }
  };

  const updateTreatmentPlan = async (updatedPlan) => {
    if (!selectedCollaboration) return;

    try {
      await communicationService.updateTreatmentPlan(
        selectedCollaboration._id || selectedCollaboration.id,
        updatedPlan
      );

      setTreatmentPlan(updatedPlan);
      setSuccess('Treatment plan updated successfully');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to update plan:', err);
      setError('Failed to update plan');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="collaboration-container">
      <div className="collab-header">
        <h2>Treatment Plan Collaboration</h2>
        <button
          className="btn-new-collab"
          onClick={() => setShowNewCollaboration(!showNewCollaboration)}
        >
          + New Collaboration
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="collab-layout">
        {/* Collaborations List */}
        <div className="collabs-sidebar">
          <div className="collabs-header">
            <h3>Active Collaborations</h3>
            <span className="collab-count">{collaborations.length}</span>
          </div>

          {loading ? (
            <div className="loading-state">Loading collaborations...</div>
          ) : collaborations.length === 0 ? (
            <div className="empty-state">
              <p>No active collaborations</p>
              <p className="text-muted">Start a new collaboration to work with other providers</p>
            </div>
          ) : (
            <div className="collabs-list">
              {collaborations.map(collab => (
                <div
                  key={collab._id || collab.id}
                  className={`collab-item ${selectedCollaboration?._id === collab._id || selectedCollaboration?.id === collab.id ? 'active' : ''}`}
                  onClick={() => setSelectedCollaboration(collab)}
                >
                  <div className="collab-item-header">
                    <h4>{collab.patientName || collab.patient?.name}</h4>
                    <span className={`status-badge status-${collab.status}`}>{collab.status}</span>
                  </div>
                  <p className="diagnosis">{collab.diagnosis}</p>
                  <div className="collaborators">
                    {collab.collaboratingDoctors?.slice(0, 2).map(doc => (
                      <span key={doc._id || doc.id} className="collaborator-badge">
                        {doc.name?.split(' ')[0]}
                      </span>
                    ))}
                    {collab.collaboratingDoctors?.length > 2 && (
                      <span className="more-badge">+{collab.collaboratingDoctors.length - 2}</span>
                    )}
                  </div>
                  <small className="last-updated">
                    Updated {formatDate(collab.updatedAt || collab.createdAt)}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collaboration Details */}
        <div className="collab-details">
          {showNewCollaboration && (
            <div className="new-collab-form">
              <h3>Start New Collaboration</h3>
              <input
                type="text"
                placeholder="Patient ID"
                value={newCollaborationData.patientId}
                onChange={(e) => setNewCollaborationData({ ...newCollaborationData, patientId: e.target.value })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Collaborating Doctors (comma-separated IDs)"
                onChange={(e) => setNewCollaborationData({
                  ...newCollaborationData,
                  collaboratingDoctorIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Diagnosis"
                value={newCollaborationData.diagnosis}
                onChange={(e) => setNewCollaborationData({ ...newCollaborationData, diagnosis: e.target.value })}
                className="form-input"
              />
              <textarea
                placeholder="Initial Treatment Plan"
                value={newCollaborationData.initialPlan}
                onChange={(e) => setNewCollaborationData({ ...newCollaborationData, initialPlan: e.target.value })}
                className="form-input form-textarea"
                rows="5"
              />
              <div className="form-buttons">
                <button onClick={handleCreateCollaboration} className="btn-primary">Create</button>
                <button onClick={() => setShowNewCollaboration(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {selectedCollaboration && !showNewCollaboration && (
            <>
              <div className="details-header">
                <div className="patient-info">
                  <h2>{selectedCollaboration.patientName || selectedCollaboration.patient?.name}</h2>
                  <p className="diagnosis-label">{selectedCollaboration.diagnosis}</p>
                </div>
                <div className="collab-status">
                  <span className={`badge status-${selectedCollaboration.status}`}>
                    {selectedCollaboration.status}
                  </span>
                </div>
              </div>

              {/* Collaborators */}
              <div className="section collaborators-section">
                <h3>Healthcare Team</h3>
                <div className="collaborators-grid">
                  {selectedCollaboration.collaboratingDoctors?.map(doc => (
                    <div key={doc._id || doc.id} className="collaborator-card">
                      <h4>{doc.name}</h4>
                      <p className="specialty">{doc.specialty}</p>
                      <p className="contact">
                        <a href={`mailto:${doc.email}`}>{doc.email}</a>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Treatment Plan */}
              <div className="section treatment-plan-section">
                <div className="section-header">
                  <h3>Treatment Plan</h3>
                  <button className="btn-edit">Edit Plan</button>
                </div>
                <div className="plan-content">
                  {treatmentPlan ? (
                    <div className="plan-text">
                      {treatmentPlan.plan || treatmentPlan.description || selectedCollaboration.initialTreatmentPlan}
                    </div>
                  ) : (
                    <p className="no-plan">No treatment plan yet</p>
                  )}
                </div>
              </div>

              {/* Comments/Discussion */}
              <div className="section comments-section">
                <h3>Team Discussion</h3>
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments">No comments yet. Start the discussion!</p>
                  ) : (
                    comments.map((comment, index) => (
                      <div key={index} className="comment">
                        <div className="comment-header">
                          <strong>{comment.author || comment.authorId}</strong>
                          <small>{formatDate(comment.createdAt)}</small>
                        </div>
                        <p className="comment-text">{comment.text || comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="comment-input">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add your input to the treatment plan..."
                    className="form-input form-textarea"
                    rows="3"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="btn-comment"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </>
          )}

          {!selectedCollaboration && !showNewCollaboration && (
            <div className="no-selection">
              <div className="empty-state">
                <p>Select a collaboration to view details</p>
                <p className="text-muted">Or create a new one to start collaborating</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
