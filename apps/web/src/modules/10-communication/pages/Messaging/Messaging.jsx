import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import communicationService from '../../services/communicationService';
import './Messaging.css';

const Messaging = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationData, setNewConversationData] = useState({ participantIds: [], title: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const response = await communicationService.getConversations();
        const conversationsList = Array.isArray(response?.data) ? response.data : 
                                 response?.conversations ? response.conversations : [];
        setConversations(conversationsList);
        setError(null);
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setError('Failed to load conversations. Please try again.');
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadConversations();
      // Poll for new conversations every 30 seconds
      const interval = setInterval(loadConversations, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;

      try {
        setMessageLoading(true);
        const response = await communicationService.getConversation(selectedConversation._id || selectedConversation.id);
        const messagesList = Array.isArray(response?.data) ? response.data : 
                            response?.messages ? response.messages : [];
        setMessages(messagesList);
        setError(null);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load messages. Please try again.');
        setMessages([]);
      } finally {
        setMessageLoading(false);
      }
    };

    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        conversationId: selectedConversation._id || selectedConversation.id,
        content: newMessage,
        senderId: user?._id || user?.id
      };

      const response = await communicationService.sendMessage(messageData);
      
      // Add new message to display
      if (response?.data) {
        setMessages([...messages, response.data]);
      }
      
      setNewMessage('');
      setSuccess('Message sent successfully');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleCreateConversation = async () => {
    if (!newConversationData.participantIds.length) {
      setError('Please select at least one participant');
      return;
    }

    try {
      const response = await communicationService.createConversation(
        newConversationData.participantIds,
        newConversationData.title
      );

      const newConv = response?.data || response;
      setConversations([...conversations, newConv]);
      setShowNewConversation(false);
      setNewConversationData({ participantIds: [], title: '' });
      setSuccess('Conversation created successfully');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to create conversation. Please try again.');
    }
  };

  const handleSearchMessages = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      const conversationId = selectedConversation?._id || selectedConversation?.id;
      const response = await communicationService.searchMessages(searchTerm, conversationId);
      const searchResults = Array.isArray(response?.data) ? response.data : response?.results || [];
      setMessages(searchResults);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOwnMessage = (message) => {
    return (message.senderId?._id || message.senderId?.id || message.senderId) === (user?._id || user?.id);
  };

  return (
    <div className="messaging-container">
      <div className="messaging-header">
        <h2>Secure Provider Communication</h2>
        <button 
          className="btn-new-conversation"
          onClick={() => setShowNewConversation(!showNewConversation)}
        >
          + New Conversation
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="messaging-layout">
        {/* Conversations List */}
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <input 
              type="text"
              placeholder="Search conversations..."
              className="search-input"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-state">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet</p>
              <p className="text-muted">Start a new conversation to communicate with other providers</p>
            </div>
          ) : (
            <div className="conversations-list">
              {conversations
                .filter(conv => 
                  conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  conv.participants?.some(p => 
                    (p.name || p.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
                  )
                )
                .map(conversation => (
                  <div
                    key={conversation._id || conversation.id}
                    className={`conversation-item ${selectedConversation?._id === conversation._id || selectedConversation?.id === conversation.id ? 'active' : ''}`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="conversation-info">
                      <h4>{conversation.title || conversation.participants?.map(p => p.name || p.fullName).join(', ')}</h4>
                      <p className="last-message">{conversation.lastMessage || 'No messages yet'}</p>
                    </div>
                    <div className="conversation-meta">
                      {conversation.unreadCount > 0 && (
                        <span className="unread-badge">{conversation.unreadCount}</span>
                      )}
                      <small>{formatTime(conversation.lastMessageTime || conversation.createdAt)}</small>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="messages-panel">
          {showNewConversation && (
            <div className="new-conversation-modal">
              <div className="modal-content">
                <h3>Start New Conversation</h3>
                <input
                  type="text"
                  placeholder="Conversation Title (optional)"
                  value={newConversationData.title}
                  onChange={(e) => setNewConversationData({ ...newConversationData, title: e.target.value })}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Add participants (doctor IDs, comma-separated)"
                  onChange={(e) => setNewConversationData({ 
                    ...newConversationData, 
                    participantIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                  })}
                  className="form-input"
                />
                <div className="modal-buttons">
                  <button className="btn-primary" onClick={handleCreateConversation}>Create</button>
                  <button className="btn-secondary" onClick={() => setShowNewConversation(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {selectedConversation ? (
            <>
              <div className="messages-header">
                <h3>{selectedConversation.title || selectedConversation.participants?.map(p => p.name || p.fullName).join(', ')}</h3>
                <div className="search-messages">
                  <input
                    type="text"
                    placeholder="Search in this conversation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                  />
                  <button onClick={handleSearchMessages} className="btn-search">Search</button>
                </div>
              </div>

              <div className="messages-list">
                {messageLoading ? (
                  <div className="loading-state">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages yet</p>
                    <p className="text-muted">Start the conversation by sending a message</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message._id || message.id || index}
                      className={`message ${isOwnMessage(message) ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p className="message-sender">
                          {!isOwnMessage(message) && (message.sender?.name || message.senderId?.name || 'Unknown')}
                        </p>
                        <p className="message-text">{message.content || message.text}</p>
                      </div>
                      <small className="message-time">{formatTime(message.createdAt || message.timestamp)}</small>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-area">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message... (Ctrl+Enter to send)"
                  className="message-input"
                  rows="3"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="btn-send"
                >
                  Send Message
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-state">
                <p>Select a conversation to start messaging</p>
                <p className="text-muted">Or create a new one to communicate with other healthcare providers</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;