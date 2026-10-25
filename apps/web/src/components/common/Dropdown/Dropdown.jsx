import React, { useState } from 'react';
import './Dropdown.css';

const Dropdown = ({ label, options = [], value, onChange, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="dropdown">
      {label && <label className="dropdown-label">{label}</label>}
      <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
        {value || placeholder}
      </div>
      {isOpen && (
        <ul className="dropdown-list">
          {options.map((option, index) => (
            <li key={index} onClick={() => handleSelect(option)} className="dropdown-item">
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;