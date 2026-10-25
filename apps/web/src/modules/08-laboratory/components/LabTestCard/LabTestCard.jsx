import React from 'react';
import { formatPKRSimple } from '../../../../utils/currencyFormatter';
import './LabTestCard.css';

const LabTestCard = ({ test, isSelected, onSelect }) => {
  // ✅ Handle both field name conventions (old vs current schema)
  const turnaround = test.turnaroundTime
    ? `${test.turnaroundTime.value} ${test.turnaroundTime.unit}`
    : test.processingTime || '24 hours';

  const requiresFasting = test.requiresFasting ?? test.fastingRequired ?? false;

  return (
    <div className={`lab-test-card ${isSelected ? 'selected' : ''}`}>
      <div className="test-header">
        <h3 className="test-title">{test.testName}</h3>
        <span className="test-code">{test.testCode}</span>
      </div>

      {test.description && (
        <p className="test-description">{test.description}</p>
      )}

      <div className="test-details">
        {test.category && (
          <div className="detail-item">
            <span className="detail-label">Category:</span>
            <span className="detail-value">{test.category}</span>
          </div>
        )}

        {test.sampleType && (
          <div className="detail-item">
            <span className="detail-label">Sample:</span>
            <span className="detail-value">{test.sampleType}</span>
          </div>
        )}

        <div className="detail-item">
          <span className="detail-label">Report in:</span>
          <span className="detail-value">{turnaround}</span>
        </div>

        {requiresFasting && (
          <div className="detail-item fasting-required">
            ⚠️ Fasting Required
          </div>
        )}
      </div>

      {test.preparationInstructions && (
        <p className="test-prep">
          <strong>Prep:</strong> {test.preparationInstructions}
        </p>
      )}

      <div className="test-footer">
        <span className="test-price">{formatPKRSimple(test.price)}</span>
        <button
          type="button"
          className={`btn-select ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(test)}
        >
          {isSelected ? '✓ Selected' : 'Select'}
        </button>
      </div>
    </div>
  );
};

export default LabTestCard;