import api from '../../../utils/api';

export const communicationService = {
  /* ===================== MESSAGING - Secure Doctor-to-Doctor Communication ===================== */
  
  // Send message to another provider
  sendMessage: async (messageData) => {
    const response = await api.post('/communication/messages', messageData);
    return response.data;
  },

  // Get conversation between two doctors
  getConversation: async (conversationId, limit = 50, offset = 0) => {
    const response = await api.get(`/communication/conversations/${conversationId}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Get all conversations for logged-in user
  getConversations: async () => {
    const response = await api.get('/communication/conversations');
    return response.data;
  },

  // Create new conversation
  createConversation: async (participantIds, title = '') => {
    const response = await api.post('/communication/conversations', { participantIds, title });
    return response.data;
  },

  // Search messages
  searchMessages: async (query, conversationId = null) => {
    const params = new URLSearchParams();
    params.append('query', query);
    if (conversationId) params.append('conversationId', conversationId);
    const response = await api.get(`/communication/messages/search?${params}`);
    return response.data;
  },

  /* ===================== PATIENT RECORD SHARING ===================== */

  // Share patient records with another doctor
  sharePatientRecords: async (recordData) => {
    const response = await api.post('/communication/share-records', recordData);
    return response.data;
  },

  // Get shared records with current user
  getSharedRecords: async () => {
    const response = await api.get('/communication/shared-records');
    return response.data;
  },

  // Get doctors shared with specific patient
  getSharedDoctors: async (patientId) => {
    const response = await api.get(`/communication/shared-doctors/${patientId}`);
    return response.data;
  },

  // Revoke record sharing
  revokeRecordShare: async (shareId) => {
    const response = await api.delete(`/communication/shared-records/${shareId}`);
    return response.data;
  },

  /* ===================== COLLABORATION & TREATMENT PLANS ===================== */

  // Create collaboration on treatment plan
  createCollaboration: async (collaborationData) => {
    const response = await api.post('/communication/collaborations', collaborationData);
    return response.data;
  },

  // Get collaborations for a patient
  getPatientCollaborations: async (patientId) => {
    const response = await api.get(`/communication/collaborations?patientId=${patientId}`);
    return response.data;
  },

  // Update treatment plan with collaborators
  updateTreatmentPlan: async (collaborationId, planData) => {
    const response = await api.put(`/communication/collaborations/${collaborationId}/plan`, planData);
    return response.data;
  },

  // Add comment to treatment plan
  addPlanComment: async (collaborationId, comment) => {
    const response = await api.post(`/communication/collaborations/${collaborationId}/comments`, { comment });
    return response.data;
  },

  // Get all comments on treatment plan
  getPlanComments: async (collaborationId) => {
    const response = await api.get(`/communication/collaborations/${collaborationId}/comments`);
    return response.data;
  },

  /* ===================== COMMUNICATION HISTORY ===================== */

  // Get complete communication history
  getCommunicationHistory: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/communication/history?${params}`);
    return response.data;
  },

  // Export communication history (for compliance)
  exportCommunicationHistory: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/communication/history/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /* ===================== GROUP DISCUSSIONS & FORUMS ===================== */

  // Create group discussion
  createGroupDiscussion: async (discussionData) => {
    const response = await api.post('/communication/group-discussions', discussionData);
    return response.data;
  },

  // Get group discussions for specialty/department
  getGroupDiscussions: async (specialty, page = 1) => {
    const response = await api.get(`/communication/group-discussions?specialty=${specialty}&page=${page}`);
    return response.data;
  },

  // Post to group discussion
  postToDiscussion: async (discussionId, postData) => {
    const response = await api.post(`/communication/group-discussions/${discussionId}/posts`, postData);
    return response.data;
  },

  // Get discussion posts
  getDiscussionPosts: async (discussionId, page = 1) => {
    const response = await api.get(`/communication/group-discussions/${discussionId}/posts?page=${page}`);
    return response.data;
  },

  // Like/React to post
  reactToPost: async (postId, reaction) => {
    const response = await api.post(`/communication/posts/${postId}/react`, { reaction });
    return response.data;
  },

  /* ===================== NOTIFICATIONS ===================== */

  // Get notifications
  getNotifications: async (limit = 20) => {
    const response = await api.get(`/communication/notifications?limit=${limit}`);
    return response.data;
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    const response = await api.put(`/communication/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    const response = await api.put('/communication/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/communication/notifications/${notificationId}`);
    return response.data;
  },

  /* ===================== CALL HISTORY & LOGS ===================== */

  // Get call history between providers
  getCallHistory: async (conversationId) => {
    const response = await api.get(`/communication/calls/${conversationId}`);
    return response.data;
  },

  // Log a call
  logCall: async (callData) => {
    const response = await api.post('/communication/calls', callData);
    return response.data;
  }
};

export default communicationService;