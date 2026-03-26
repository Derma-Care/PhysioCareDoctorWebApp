import React from 'react';

const RecentChips = ({ recent, onSelect }) => {
  return (
    <div className="mt-3">
      <h6>Recent Searches</h6>
      <div className="d-flex flex-wrap gap-2">
        {recent.map((item, idx) => (
          <button
            key={idx}
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onSelect(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentChips;
