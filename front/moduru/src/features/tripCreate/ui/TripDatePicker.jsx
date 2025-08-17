import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './tripDatePicker.css';

export default function TripDatePicker({ value, onChange }) {
  const [range, setRange] = useState(value || [null, null]);

  // NOTE: 외부에서 날짜 값이 바뀔 경우 내부 상태를 동기화함
  useEffect(() => {
    setRange(value);
  }, [value]);

  // NOTE: 날짜 선택 시 내부 상태를 업데이트하고 상위 컴포넌트에 변경을 전달함
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
