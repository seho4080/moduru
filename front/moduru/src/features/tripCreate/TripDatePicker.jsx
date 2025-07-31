import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TripDatePicker.css';

export default function TripDatePicker({ value, onChange }) {
  const [range, setRange] = useState(value || [null, null]);

  const handleChange = (dates) => {
    setRange(dates);
    onChange(dates);
  };

  return (
    <div className="trip-date-picker-container">
      <label className="trip-date-label">여행 날짜</label>
      <Calendar
        selectRange
        value={range}
        onChange={handleChange}
        calendarType="gregory"
      />
    </div>
  );
}
