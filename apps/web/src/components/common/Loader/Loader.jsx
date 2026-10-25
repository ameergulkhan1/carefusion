import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', fullScreen = false }) => {
  const loaderComponent = (
    <div className={`loader loader-${size}`}>
      <div className="spinner"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        {loaderComponent}
      </div>
    );
  }

  return loaderComponent;
};

export default Loader;