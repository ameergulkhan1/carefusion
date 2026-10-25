import React from 'react';
import './Select.css';

const Select = ({ 
  label, 
  options = [], 
  value, 
  onChange, 
  error, 
  required = false,
  placeholder = 'Select an option',
  name,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`select-group ${className}`}>
      {label && (
        <label className="select-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <select 
        name={name}
        className={`select-field ${error ? 'select-error' : ''}`}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option 
            key={option.value || index} 
            value={option.value || option}
          >
            {option.label || option}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default Select;
