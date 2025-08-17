import { useState, useEffect } from 'react';
import TripNameInput from './TripNameInput';
import RegionDropdown from './RegionDropdown';
import TripDatePicker from './TripDatePicker';
import { updateTripRoomRegion, getTripRoomInfoForModal } from '../lib/tripRoomApi';
import './tripCreateForm.css';

/* 로컬 타임존 기준 YYYY-MM-DD */
function toYmd(date) {
  const d = date instanceof Date ? date : new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/* 오늘 날짜 문자열 */
function todayYmd() {
  return toYmd(new Date());
}

/* 제목은 날짜(YYYY-MM-DD)까지만 유지 */
function stripTitleToYmd(s) {
  if (typeof s !== 'string') return s ?? '';
  const m = s.match(/\d{4}-\d{2}-\d{2}/);
  if (!m) return s.trim();
  return s.slice(0, s.indexOf(m[0]) + m[0].length).trim();
}

export default function TripCreateForm({
  roomId,               // 업데이트 대상 방 id (필수)
  fallbackTitle,        // 기존 방 제목. 입력이 비었을 때 대체 사용
  tripName, setTripName,
  region, setRegion,
  dates, setDates,      // [startDate: Date|null, endDate: Date|null]
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 모달이 열릴 때마다 최신 방 정보를 조회하여 상태 업데이트
  useEffect(() => {
    if (!roomId) return;

    const fetchLatestRoomInfo = async () => {
      setIsLoadingData(true);
      try {
        const roomInfo = await getTripRoomInfoForModal(roomId);
        
        // 제목 업데이트
        if (roomInfo.title) {
          setTripName(roomInfo.title);
        }
        
        // 지역 업데이트
        if (roomInfo.region) {
          setRegion(roomInfo.region);
        }
        
        // 날짜 업데이트
        if (roomInfo.startDate && roomInfo.endDate) {
          const startDate = new Date(roomInfo.startDate);
          const endDate = new Date(roomInfo.endDate);
          setDates([startDate, endDate]);
        }
      } catch (error) {
        console.error('방 정보 조회 실패:', error);
        setErrorText('방 정보를 불러오는데 실패했습니다.');
        // 에러가 발생해도 기존 값들을 유지
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchLatestRoomInfo();
  }, [roomId, setTripName, setRegion, setDates]);

  /* ===== 표시/입력용 제목은 항상 YYYY-MM-DD까지만 ===== */
  const displayTitle = useMemo(
    () => stripTitleToYmd(tripName ?? fallbackTitle ?? ''),
    [tripName, fallbackTitle]
  );

  const emitDirty = useCallback(() => {
    if (!roomId) return;
    window.dispatchEvent(new CustomEvent('schedule:dirty', { detail: { roomId } }));
    window.dispatchEvent(new CustomEvent('schedule:state', { detail: { roomId, state: 'editing' } }));
  }, [roomId]);

  const handleTitleChange = useCallback(
    (v) => {
      setTripName(stripTitleToYmd(v ?? ''));
      emitDirty();
    },
    [setTripName, emitDirty]
  );

  const handleRegionChange = useCallback(
    (v) => { setRegion(v); emitDirty(); },
    [setRegion, emitDirty]
  );

  const handleDatesChange = useCallback(
    (v) => { setDates(v); emitDirty(); },
    [setDates, emitDirty]
  );

  const handleSave = async () => {
    if (!region || !region.trim()) {
      setErrorText('지역을 선택하세요.');
      return;
    }

    const hasStart = dates?.[0] instanceof Date;
    const hasEnd   = dates?.[1] instanceof Date;

    if (hasStart && hasEnd && dates[0] > dates[1]) {
      setErrorText('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }

    setLoading(true);
    setErrorText('');

    const rawTitle = (displayTitle && displayTitle.trim().length > 0)
      ? displayTitle.trim()
      : (fallbackTitle || '');
    const titleToSend = stripTitleToYmd(rawTitle); // 안전빵

    const start = hasStart ? toYmd(dates[0]) : todayYmd();
    const end   = hasEnd   ? toYmd(dates[1]) : todayYmd();

    const payload = { title: titleToSend, region: region.trim(), startDate: start, endDate: end };

    try {
      const updated = await updateTripRoomRegion(roomId, payload);
      // 서버가 응답 객체를 주지 않으면 우리가 보낸 payload로 대체
      const normalized = updated && Object.keys(updated).length ? updated : { ...payload };

      // 저장 성공 브로드캐스트 (상태공유/재매핑 훅과 연동)
      window.dispatchEvent(new CustomEvent('schedule:commit:ok', { detail: { roomId } }));
      window.dispatchEvent(new CustomEvent('trip:dates:changed', {
        detail: { roomId, newDates: [payload.startDate, payload.endDate], ok: true }
      }));
      window.dispatchEvent(new CustomEvent('schedule:state', { detail: { roomId, state: 'idle' } }));

      onSuccess?.(normalized);
      // 여기서는 닫지 않음 (Host가 onSuccess에서 닫음)
      // onClose?.();
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
        {/* 우상단 닫기(X) */}
        <button className="close-btn" onClick={onClose} aria-label="닫기">×</button>

        {isLoadingData ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
              방 정보를 불러오는 중...
            </div>
          </div>
        ) : (
          <>
            {/* 여행방 이름 */}
            <TripNameInput value={tripName ?? ''} onChange={setTripName} />

            {/* 지역(필수) */}
            <RegionDropdown value={region} onChange={setRegion} />

            {/* 날짜: 미선택 시 오늘로 자동 대체 */}
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
          </>
        )}
      </div>
    </>
  );
}
