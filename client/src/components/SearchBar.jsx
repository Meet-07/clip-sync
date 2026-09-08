import React from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <Search size={17} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search 500 copied texts..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {value && (
          <button className="search-clear-btn" onClick={onClear} aria-label="Clear search">
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
