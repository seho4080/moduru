// features/tripCreate/TripCreateForm.js
import TripNameInput from './TripNameInput';
import RegionDropdown from './RegionDropdown';
import TripDatePicker from './TripDatePicker';
import './TripCreateForm.css';

export default function TripCreateForm({
  tripName, setTripName,
  region, setRegion,
  dates, setDates,
  onClose, onSubmit
}) {
  return (
    <>
      <div className="trip-modal-backdrop" onClick={onClose}></div>
      <div className="trip-modal">
        <TripNameInput value={tripName} onChange={setTripName} />
        <RegionDropdown value={region} onChange={setRegion} />
        <TripDatePicker value={dates} onChange={setDates} />
        <button onClick={onSubmit} className="submit-btn">저장</button>
      </div>
    </>
  );
}
