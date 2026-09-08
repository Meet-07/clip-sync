import React from 'react';
import { Layers, Star, Link, Code, FileText, AtSign } from 'lucide-react';

export function CategoryFilters({ currentFilter, onSelectFilter, counts }) {
  const categories = [
    { id: 'all', label: 'All', icon: Layers, count: counts.all },
    { id: 'pinned', label: 'Pinned', icon: Star, count: counts.pinned },
    { id: 'url', label: 'Links', icon: Link, count: counts.url },
    { id: 'code', label: 'Code', icon: Code, count: counts.code },
    { id: 'text', label: 'Text', icon: FileText, count: counts.text },
    { id: 'email', label: 'Emails', icon: AtSign, count: counts.email },
  ];

  return (
    <div className="filter-scroll-wrapper">
      <div className="filter-chips">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = currentFilter === cat.id;
          return (
            <button
              key={cat.id}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectFilter(cat.id)}
            >
              <Icon size={14} className="chip-icon" />
              <span>{cat.label}</span>
              {cat.count > 0 && <span className="chip-badge">{cat.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
