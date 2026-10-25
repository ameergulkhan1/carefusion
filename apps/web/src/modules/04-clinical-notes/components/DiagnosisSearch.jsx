import React, { useState, useEffect } from 'react';
import clinicalNotesService from '../services/clinicalNotesService';
import './DiagnosisSearch.css';

const DiagnosisSearch = ({ value, onChange, error }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value?.code || value?.description) {
      setSearchQuery(`${value.code || ''}${value.code && value.description ? ' - ' : ''}${value.description || ''}`);
    }
  }, [value?.code, value?.description]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const response = await clinicalNotesService.suggestICD10(searchQuery);
      const suggestions = Array.isArray(response?.data) ? response.data : [];

      const normalized = suggestions.map((item) => ({
        code: item.code,
        description: item.description
      }));

      setResults(normalized.slice(0, 10));
      setShowDropdown(true);
    } catch (err) {
      console.error('Error searching ICD-10 suggestions:', err);
      setResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (diagnosis) => {
    onChange(diagnosis);
    setSearchQuery(`${diagnosis.code} - ${diagnosis.description}`);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (!value.code) {
      // Clear selection if user types
      onChange({ code: '', description: '' });
    }
  };

  return (
    <div className="diagnosis-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search ICD-10 codes or diagnoses..."
          value={value.code ? `${value.code} - ${value.description}` : searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
          className={`diagnosis-input ${error ? 'error' : ''}`}
        />
        {loading && <span className="loading-indicator">🔄</span>}
      </div>

      {error && <div className="error-text">{error}</div>}

      {showDropdown && results.length > 0 && (
        <div className="diagnosis-dropdown">
          {results.map((diagnosis, index) => (
            <div
              key={index}
              className="diagnosis-option"
              onClick={() => handleSelect(diagnosis)}
            >
              <span className="diagnosis-code">{diagnosis.code}</span>
              <span className="diagnosis-description">{diagnosis.description}</span>
            </div>
          ))}
        </div>
      )}

      {showDropdown && results.length === 0 && !loading && (
        <div className="diagnosis-dropdown">
          <div className="no-results">No diagnoses found</div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisSearch;
