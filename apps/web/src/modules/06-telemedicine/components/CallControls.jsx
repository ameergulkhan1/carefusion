import React, { useState } from 'react';

const CallControls = ({ onEndCall }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  return (
    <div className="call-controls">
      <button 
        className={`control-btn ${isMuted ? 'active' : ''}`}
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? '🎤❌' : '🎤'}
      </button>
      <button 
        className={`control-btn ${isVideoOff ? 'active' : ''}`}
        onClick={() => setIsVideoOff(!isVideoOff)}
      >
        {isVideoOff ? '📹❌' : '📹'}
      </button>
      <button className="control-btn end-call" onClick={onEndCall}>
        📞 End
      </button>
    </div>
  );
};

export default CallControls;