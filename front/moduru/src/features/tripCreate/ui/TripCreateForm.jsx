import { useState } from 'react';
import TripNameInput from './TripNameInput';
import RegionDropdown from './RegionDropdown';
import TripDatePicker from './TripDatePicker';
import { updateTripRoomRegion } from '../lib/tripRoomApi';
import './tripCreateForm.css';

/* NOTE: 로컬 타임존 기준 YYYY-MM-DD */
function toYmd(date) {
  const d = date instanceof Date ? date : new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/* NOTE: 오늘 날짜 문자열 반환 */
function todayYmd() {
  return toYmd(new Date());
}

export default function TripCreateForm({
  roomId,               // NOTE: 업데이트 대상 방 id (필수 prop)
  fallbackTitle,        // NOTE: 기존 방 제목. 입력이 비었을 때 대체 사용
  tripName, setTripName,
  region, setRegion,
  dates, setDates,      // [startDate: Date|null, endDate: Date|null]
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSave = async () => {
    if (!region || !region.trim()) {
      setErrorText('지역을 선택하세요.');
      return;
    }

    setLoading(true);
    setErrorText('');

    const titleToSend = (tripName && tripName.trim().length > 0)
      ? tripName.trim()
      : (fallbackTitle || '');

    const hasStart = dates?.[0] instanceof Date;
    const hasEnd   = dates?.[1] instanceof Date;
    const start    = hasStart ? toYmd(dates[0]) : todayYmd();
    const end      = hasEnd   ? toYmd(dates[1]) : todayYmd();

    const payload = { title: titleToSend, region: region.trim(), startDate: start, endDate: end };

    try {
      const updated = await updateTripRoomRegion(roomId, payload);

      // ✅ 성공 시 여기에서 로그
      console.log('여행 방 지역 업데이트 성공:', 
        updated && Object.keys(updated).length ? updated : { travelRoomId: roomId, ...payload }
      );

      onSuccess?.(updated);
      onClose?.();
    } catch (e) {
      setErrorText(e?.message ?? '업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="trip-modal-backdrop" onClick={onClose} />
      <div className="trip-modal">
        {/* NOTE: 여행명은 비워둬도 됨(자동 대체) */}
        <TripNameInput value={tripName} onChange={setTripName} />
        {/* NOTE: 지역은 필수 */}
        <RegionDropdown value={region} onChange={setRegion} />
        {/* NOTE: 날짜 미선택 시 오늘로 자동 대체 */}
        <TripDatePicker value={dates} onChange={setDates} />

        {errorText && (
          <div style={{ color: '#d32f2f', marginTop: 8, fontSize: 13 }}>
            {errorText}
          </div>
        )}

        <button
          onClick={handleSave}
          className="submit-btn"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </>
  );
}
