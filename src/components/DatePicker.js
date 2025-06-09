import React, { useState } from 'react';

const DatePicker = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1);

  return (
    <div>
      <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <span> - </span>
      <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
        {months.map((m) => (
          <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
        ))}
      </select>
      <span> - </span>
      <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
        {days.map((d) => (
          <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>
        ))}
      </select>
    </div>
  );
};

export default DatePicker; 