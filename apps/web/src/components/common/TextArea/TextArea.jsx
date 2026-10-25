import React from 'react';
import './TextArea.css';

const TextArea = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  error, 
  required = false,
  rows = 4,
  name,
  disabled = false,
  maxLength,
  className = ''
}) => {
  return (
    <div className={`textarea-group ${className}`}>
      {label && (
        <label className="textarea-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <textarea 
        name={name}
        className={`textarea-field ${error ? 'textarea-error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
      />
      {error && <span className="error-message">{error}</span>}
      {maxLength && (
        <span className="char-count">
          {value?.length || 0} / {maxLength}
        </span>
      )}
    </div>
  );
};

export default TextArea;
