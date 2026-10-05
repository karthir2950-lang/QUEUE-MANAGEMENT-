import React, { useState, useEffect } from 'react';

const DateFilter = ({ onChange }) => {
  const [filterType, setFilterType] = useState('Today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    handleFilterChange(filterType);
  }, []);

  const handleFilterChange = (type) => {
    setFilterType(type);
    
    const today = new Date();
    let from = new Date();
    let to = new Date();

    if (type === 'Today') {
      // already today
    } else if (type === 'Yesterday') {
      from.setDate(today.getDate() - 1);
      to.setDate(today.getDate() - 1);
    } else if (type === 'Last 7 Days') {
      from.setDate(today.getDate() - 7);
    } else if (type === 'Last 30 Days') {
      from.setDate(today.getDate() - 30);
    } else if (type === 'This Month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (type === 'Custom Range') {
      // Don't auto-trigger onChange until custom dates are valid
      if (dateFrom && dateTo) {
        onChange({ date_from: dateFrom, date_to: dateTo });
      }
      return;
    }

    const formatDate = (d) => d.toISOString().split('T')[0];
    
    if (type !== 'Custom Range') {
      setDateFrom(formatDate(from));
      setDateTo(formatDate(to));
      onChange({ date_from: formatDate(from), date_to: formatDate(to) });
    }
  };

  const handleCustomDateChange = () => {
    if (filterType === 'Custom Range' && dateFrom && dateTo) {
      onChange({ date_from: dateFrom, date_to: dateTo });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select 
        value={filterType} 
        onChange={(e) => handleFilterChange(e.target.value)}
        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="Today">Today</option>
        <option value="Yesterday">Yesterday</option>
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
        <option value="This Month">This Month</option>
        <option value="Custom Range">Custom Range</option>
      </select>

      {filterType === 'Custom Range' && (
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            onBlur={handleCustomDateChange}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <span className="text-slate-400">to</span>
          <input 
            type="date" 
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            onBlur={handleCustomDateChange}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default DateFilter;
