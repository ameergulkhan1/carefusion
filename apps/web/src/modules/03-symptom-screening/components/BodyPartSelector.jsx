import React, { useState } from 'react';

const BodyPartSelector = ({ onSelect }) => {
  const bodyParts = ['Head', 'Chest', 'Abdomen', 'Arms', 'Legs'];
  const [selected, setSelected] = useState(null);

  const handleSelect = (part) => {
    setSelected(part);
    onSelect(part);
  };

  return (
    <div className="body-part-selector">
      <h3>Select affected body part:</h3>
      <div className="body-diagram">
        {bodyParts.map(part => (
          <button 
            key={part} 
            className={`body-part ${selected === part ? 'selected' : ''}`}
            onClick={() => handleSelect(part)}
          >
            {part}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BodyPartSelector;