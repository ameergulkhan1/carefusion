import React, { useState, useEffect } from 'react';
import './DocumentViewer.css';

const DocumentViewer = ({ document }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset states when document changes
    setLoading(true);
    setError(false);
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      if (document?.url || document?.documentUrl) {
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [document]);

  const documentUrl = document?.url || document?.documentUrl;

  return (
    <div className="document-viewer">
      <div className="document-header">
        <h3>{document.name || document.fileName}</h3>
        <span>{document.date || document.documentDate}</span>
      </div>
      <div className="document-content">
        {loading ? (
          <div className="document-loading">
            <div className="spinner"></div>
            <p>Loading document...</p>
          </div>
        ) : error || !documentUrl ? (
          <div className="document-error">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Failed to load document</p>
          </div>
        ) : document.type === 'pdf' || document.mimeType === 'application/pdf' ? (
          <iframe 
            src={documentUrl} 
            type="application/pdf" 
            width="100%" 
            height="500px"
            title={document.name || document.fileName}
          />
        ) : (
          <img 
            src={documentUrl} 
            alt={document.name || document.fileName}
            onError={() => setError(true)}
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;