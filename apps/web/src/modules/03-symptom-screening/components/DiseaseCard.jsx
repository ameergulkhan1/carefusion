import React from 'react';
import Card from '../../../components/common/Card/Card';

const DiseaseCard = ({ disease, probability, symptoms, specialist }) => {
  return (
    <Card className="disease-card">
      <h3>{disease}</h3>
      <div className="probability">
        <span>Match: {probability}%</span>
      </div>
      <div className="symptoms-matched">
        <h4>Matching Symptoms:</h4>
        <ul>
          {symptoms.map((symptom, index) => (
            <li key={index}>{symptom}</li>
          ))}
        </ul>
      </div>
      <p className="specialist-recommendation">
        Consult: {specialist}
      </p>
    </Card>
  );
};

export default DiseaseCard;