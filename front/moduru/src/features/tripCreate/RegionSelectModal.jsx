// src/features/tripCreate/RegionSelectModal.jsx
import { useState, useRef, useEffect } from 'react';
import './TripCreateForm.css';

const REGIONS = [
  { name: '서울' }, { name: '부산' }, { name: '대구' }, { name: '인천' }, { name: '광주' },
  { name: '대전' }, { name: '울산' }, { name: '세종' }, { name: '수원' }, { name: '고양' },
  { name: '용인' }, { name: '창원' }, { name: '김해' }, { name: '양산' }, { name: '진주' },
  { name: '통영' }, { name: '사천' }, { name: '밀양' }, { name: '거제' }, { name: '남해' },
  { name: '하동' }, { name: '산청' }, { name: '함양' }, { name: '거창' }, { name: '합천' },
  { name: '의령' }, { name: '함안' }, { name: '창녕' }, { name: '포항' }, { name: '구미' },
  { name: '경산' }, { name: '청주' }, { name: '충주' }, { name: '제천' }, { name: '전주' },
  { name: '군산' }, { name: '익산' }, { name: '목포' }, { name: '여수' }, { name: '순천' },
  { name: '천안' }, { name: '아산' }, { name: '서산' }, { name: '춘천' }, { name: '원주' },
  { name: '강릉' }, { name: '제주' }, { name: '서귀포' }
];

export default function RegionSelectModal({ roomId, onRegionSet }) {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
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
    const response = await fetch(`http://localhost:8080/rooms/${roomId}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ region: selectedRegion }),
    });
    if (!response.ok) throw new Error('지역 업데이트 실패');

    const data = await response.json(); // ✅ 응답 데이터 파싱
    console.log('✅ 여행 방 업데이트 성공:', data); // ✅ 콘솔 출력

    onRegionSet(selectedRegion); // 이후 처리
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
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {selectedRegion || '여행지'}
            <span className="arrow" aria-hidden>
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

        <button className="submit-btn" onClick={handleConfirm}>
          선택 완료
        </button>
      </div>
    </>
  );
}
