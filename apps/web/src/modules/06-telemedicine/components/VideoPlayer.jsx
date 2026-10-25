import React from 'react';

const VideoPlayer = ({ stream, isMuted = false }) => {
  return (
    <div className="video-player">
      <video 
        autoPlay 
        playsInline 
        muted={isMuted}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      >
        Your browser does not support video
      </video>
    </div>
  );
};

export default VideoPlayer;