import React from 'react';
import './VitalSigns.css';

const VitalSigns = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  // Auto-calculate BMI if height and weight are provided
  React.useEffect(() => {
    if (data.height && data.weight) {
      const heightInMeters = data.height / 100;
      const bmi = (data.weight / (heightInMeters * heightInMeters)).toFixed(1);
      if (data.bmi !== bmi) {
        handleChange('bmi', bmi);
      }
    }
  }, [data.height, data.weight]);

  return (
    <div className="vital-signs">
      <div className="vitals-grid">
        <div className="vital-input">
          <label>Blood Pressure</label>
          <input
            type="text"
            placeholder="120/80"
            value={data.bloodPressure || ''}
            onChange={(e) => handleChange('bloodPressure', e.target.value)}
          />
          <span className="unit">mmHg</span>
        </div>

        <div className="vital-input">
          <label>Heart Rate</label>
          <input
            type="number"
            placeholder="72"
            value={data.heartRate || ''}
            onChange={(e) => handleChange('heartRate', e.target.value)}
          />
          <span className="unit">bpm</span>
        </div>

        <div className="vital-input">
          <label>Temperature</label>
          <input
            type="number"
            step="0.1"
            placeholder="98.6"
            value={data.temperature || ''}
            onChange={(e) => handleChange('temperature', e.target.value)}
          />
          <span className="unit">°F</span>
        </div>

        <div className="vital-input">
          <label>Respiratory Rate</label>
          <input
            type="number"
            placeholder="16"
            value={data.respiratoryRate || ''}
            onChange={(e) => handleChange('respiratoryRate', e.target.value)}
          />
          <span className="unit">/min</span>
        </div>

        <div className="vital-input">
          <label>SpO2</label>
          <input
            type="number"
            placeholder="98"
            value={data.oxygenSaturation || ''}
            onChange={(e) => handleChange('oxygenSaturation', e.target.value)}
          />
          <span className="unit">%</span>
        </div>

        <div className="vital-input">
          <label>Weight</label>
          <input
            type="number"
            step="0.1"
            placeholder="70"
            value={data.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
          />
          <span className="unit">kg</span>
        </div>

        <div className="vital-input">
          <label>Height</label>
          <input
            type="number"
            placeholder="170"
            value={data.height || ''}
            onChange={(e) => handleChange('height', e.target.value)}
          />
          <span className="unit">cm</span>
        </div>

        <div className="vital-input">
          <label>BMI</label>
          <input
            type="number"
            step="0.1"
            placeholder="Auto"
            value={data.bmi || ''}
            readOnly
            disabled
          />
          <span className="unit">kg/m²</span>
        </div>
      </div>
    </div>
  );
};

export default VitalSigns;
