import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './tripDatePicker.css';
// 날짜를 정규화하는 함수 (시간 정보 제거)
function normalizeDate(date) {
  if (!date) return null;
  const d = new Date(date);
  // UTC 기준으로 날짜 생성 (시간대 영향 없음)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export default function TripDatePicker({ value, onChange }) {
  const [range, setRange] = useState(value || [null, null]);
  
  // NOTE: 외부에서 날짜 값이 바뀔 경우 내부 상태를 동기화함
  useEffect(() => {
    setRange(value);
  }, [value]);

  // NOTE: 날짜 선택 시 내부 상태를 업데이트하고 상위 컴포넌트에 변경을 전달함
  const handleChange = (dates) => {
    // 날짜를 정규화 (시간 정보 제거)
    const normalizedDates = dates ? [
      normalizeDate(dates[0]),
      normalizeDate(dates[1])
    ] : [null, null];
    
    setRange(normalizedDates);
    onChange(normalizedDates);

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
