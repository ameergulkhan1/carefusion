import React, { useState } from 'react';
import './ChatConsultation.css';

const ChatConsultation = () => {
  const [messages, setMessages] = useState([
    { sender: 'doctor', text: 'Hello! How can I help you today?', time: '10:00 AM' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { sender: 'patient', text: input, time: new Date().toLocaleTimeString() }]);
      setInput('');
    }
  };

  return (
    <div className="chat-consultation">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message message-${msg.sender}`}>
            <p>{msg.text}</p>
            <span className="message-time">{msg.time}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatConsultation;