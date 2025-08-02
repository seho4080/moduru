import './TripNameInput.css';

export default function TripNameInput({ value, onChange }) {
  return (
    <div className="trip-name-input-container">
      <label className="trip-name-label">여행방 이름</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="여행 제목을 입력하세요"
        className="trip-name-input"
      />
    </div>
  );
}
