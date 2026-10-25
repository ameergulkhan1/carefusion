import React from 'react';
import './ReviewOfSystems.css';

const ReviewOfSystems = ({ data, onChange }) => {
  const systems = {
    constitutional: ['Fever', 'Fatigue', 'Weight loss', 'Night sweats'],
    cardiovascular: ['Chest pain', 'Palpitations', 'Edema', 'Orthopnea'],
    respiratory: ['Cough', 'Shortness of breath', 'Wheezing', 'Hemoptysis'],
    gastrointestinal: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Constipation'],
    genitourinary: ['Dysuria', 'Frequency', 'Hematuria', 'Incontinence'],
    musculoskeletal: ['Joint pain', 'Muscle pain', 'Back pain', 'Stiffness'],
    neurological: ['Headache', 'Dizziness', 'Numbness', 'Weakness', 'Seizures'],
    psychiatric: ['Anxiety', 'Depression', 'Sleep disturbance', 'Memory loss'],
    skin: ['Rash', 'Itching', 'Lesions', 'Color changes']
  };

  const handleToggle = (system, symptom) => {
    const currentSymptoms = data[system] || [];
    const isSelected = currentSymptoms.includes(symptom);

    let updatedSymptoms;
    if (isSelected) {
      updatedSymptoms = currentSymptoms.filter(s => s !== symptom);
    } else {
      updatedSymptoms = [...currentSymptoms, symptom];
    }

    onChange({
      ...data,
      [system]: updatedSymptoms
    });
  };

  return (
    <div className="review-of-systems">
      {Object.entries(systems).map(([systemName, symptoms]) => (
        <div key={systemName} className="system-section">
          <h4 className="system-title">
            {systemName.charAt(0).toUpperCase() + systemName.slice(1)}
          </h4>
          <div className="symptoms-grid">
            {symptoms.map((symptom) => (
              <label key={symptom} className="symptom-checkbox">
                <input
                  type="checkbox"
                  checked={(data[systemName] || []).includes(symptom)}
                  onChange={() => handleToggle(systemName, symptom)}
                />
                <span>{symptom}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewOfSystems;
