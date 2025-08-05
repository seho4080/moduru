import './tripNameInput.css';

export default function TripNameInput({ value, onChange }) {
  // NOTE: 사용자가 여행방 이름을 입력할 수 있도록 텍스트 입력 필드를 제공함
  return (
    <div className="trip-name-input-container">
      <label className="trip-name-label">여행방 이름</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="여행 제목을 입력하세요"
        className="trip-name-input"
      />
    </div>
  );
}
