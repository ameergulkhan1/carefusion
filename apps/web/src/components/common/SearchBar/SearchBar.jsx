import React from 'react';
import './SearchBar.css';

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  onSearch,
  className = ''
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
        />
        {value && (
          <button
            className="clear-button"
            onClick={() => onChange({ target: { value: '' } })}
            type="button"
          >
            ✕
          </button>
        )}
      </div>
      {onSearch && (
        <button 
          className="search-button" 
          onClick={() => onSearch(value)}
          type="button"
        >
          Search
        </button>
      )}
    </div>
  );
};

export default SearchBar;
