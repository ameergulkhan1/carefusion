import React from 'react';

const MedicineSelector = ({ onSelect, medicines = [] }) => {
  const mockMedicines = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Pain Relief' },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotic' },
    { id: 3, name: 'Ibuprofen 400mg', category: 'Anti-inflammatory' }
  ];

  return (
    <div className="medicine-selector">
      <h3>Select Medicine</h3>
      <input type="text" placeholder="Search medicines..." />
      <div className="medicine-list">
        {mockMedicines.map(med => (
          <div key={med.id} className="medicine-option" onClick={() => onSelect(med)}>
            <strong>{med.name}</strong>
            <span>{med.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicineSelector;