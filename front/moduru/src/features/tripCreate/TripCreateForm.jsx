import { useState } from 'react';
import TripNameInput from './TripNameInput';
import RegionDropdown from './RegionDropdown';
import TripDatePicker from './TripDatePicker';
import './TripCreateForm.css';

export default function TripCreateForm({ onClose }) {
  const [tripName, setTripName] = useState('');
  const [region, setRegion] = useState('');
  const [dates, setDates] = useState([null, null]); // [startDate, endDate]

  const handleSubmit = () => {
    console.log({ tripName, region, dates });
    onClose?.();
  };

  return (
    <>
      <div className="trip-modal-backdrop" onClick={onClose}></div>
      <div className="trip-modal">
        <h2>여행 만들기</h2>
        <TripNameInput value={tripName} onChange={setTripName} />
        <RegionDropdown value={region} onChange={setRegion} />
        <TripDatePicker value={dates} onChange={setDates} />
        <button onClick={handleSubmit} className="submit-btn">저장</button>
      </div>
    </>
  );
}