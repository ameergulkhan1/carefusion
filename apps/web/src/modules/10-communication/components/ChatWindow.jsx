import React from 'react';

const ChatWindow = ({ messages, currentUser }) => {
  return (
    <div className="chat-window">
      {messages.map((msg, index) => (
        <div 
          key={index} 
          className={`chat-message ${msg.senderId === currentUser ? 'sent' : 'received'}`}
        >
          <div className="message-content">
            <p>{msg.text}</p>
            <span className="message-timestamp">{msg.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatWindow;