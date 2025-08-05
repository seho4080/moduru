import TripNameInput from './TripNameInput';
import RegionDropdown from './RegionDropdown';
import TripDatePicker from './TripDatePicker';
import './tripCreateForm.css';

export default function TripCreateForm({
  tripName, setTripName,
  region, setRegion,
  dates, setDates,
  onClose, onSubmit
}) {
  // NOTE: 여행 생성 모달 내 입력 폼을 구성하며, 저장 시 onSubmit 핸들러 호출
  return (
    <>
      <div className="trip-modal-backdrop" onClick={onClose} />
      <div className="trip-modal">
        <TripNameInput value={tripName} onChange={setTripName} />
        <RegionDropdown value={region} onChange={setRegion} />
        <TripDatePicker value={dates} onChange={setDates} />
        <button onClick={onSubmit} className="submit-btn">저장</button>
      </div>
    </>
  );
}
