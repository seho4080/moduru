// src/features/tripCreate/RegionSelectModal.jsx
import { useState, useRef, useEffect } from 'react';
import { REGIONS } from '../lib/regionName'; // ✅ 지역 상수 import
import { updateTripRoomRegion } from '../model/tripRoomApi'; // ✅ API 함수 import
import './TripCreateForm.css';

export default function RegionSelectModal({ roomId, onRegionSet }) {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleClose = () => {
    if (!selectedRegion) {
      alert('여행지를 선택해주세요.');
      return;
    }
    onRegionSet(selectedRegion);
  };

  const handleConfirm = async () => {
    if (!selectedRegion) {
      alert('여행지를 선택해주세요.');
      return;
    }
    try {
      const data = await updateTripRoomRegion(roomId, selectedRegion);
      console.log('✅ 여행 방 지역 업데이트 성공:', data);
      onRegionSet(selectedRegion);
    } catch (err) {
      console.error(err);
      alert('서버 오류로 인해 지역 설정에 실패했습니다.');
    }
  };

  return (
    <>
      <div className="trip-modal-backdrop" />
      <div className="trip-modal">
        <button className="close-btn" onClick={handleClose}>×</button>

        <h3 className="region-title">여행지를 선택해주세요</h3>

        <div className="dropdown-container" ref={dropdownRef}>
          <div
            className="dropdown-header"
            onClick={() => setDropdownOpen(prev => !prev)}
          >
            {selectedRegion || '여행지'}
            <span className="arrow">
              {dropdownOpen ? (
                <svg width="16" height="16" viewBox="0 0 20 20"><polyline points="6 12 10 8 14 12" fill="none" stroke="#007aff" strokeWidth="2" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 20 20"><polyline points="6 8 10 12 14 8" fill="none" stroke="#007aff" strokeWidth="2" /></svg>
              )}
            </span>
          </div>

          {dropdownOpen && (
            <div className="dropdown-list">
              {REGIONS.map((r, i) => (
                <div
                  key={i}
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedRegion(r.name);
                    setDropdownOpen(false);
                  }}
                >
                  {r.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="submit-btn" onClick={handleConfirm}>선택 완료</button>
      </div>
    </>
  );
}
