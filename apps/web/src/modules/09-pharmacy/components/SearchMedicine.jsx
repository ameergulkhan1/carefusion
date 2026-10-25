import React, { useState } from 'react';

const SearchMedicine = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="search-medicine">
      <form onSubmit={handleSearch}>
        <input 
          type="text" 
          placeholder="Search for medicines..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">🔍 Search</button>
      </form>
    </div>
  );
};

export default SearchMedicine;