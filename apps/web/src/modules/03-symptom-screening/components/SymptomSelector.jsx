import React from 'react';

const SymptomSelector = ({ symptoms, selectedSymptoms, onToggle }) => {
  return (
    <div className="symptom-selector">
      {symptoms.map(symptom => (
        <label key={symptom.id} className="symptom-checkbox">
          <input 
            type="checkbox" 
            checked={selectedSymptoms.includes(symptom.id)}
            onChange={() => onToggle(symptom.id)}
          />
          <span>{symptom.label || symptom.name || symptom.id}</span>
        </label>
      ))}
    </div>
  );
};

export default SymptomSelector;