import { useState, useEffect, useMemo, useCallback } from 'react';
import TripNameInput from './TripNameInput';
import RegionDropdown from './RegionDropdown';
import TripDatePicker from './TripDatePicker';
import { updateTripRoomRegion, getTripRoomInfoForModal } from '../lib/tripRoomApi';
import './tripCreateForm.css';

/* 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 무시) */
function toYmd(date) {
  const d = date instanceof Date ? date : new Date(date);
  
  // 디버깅 로그
  console.log('🔍 toYmd 디버깅:', {
    inputDate: date,
    parsedDate: d,
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    timezoneOffset: d.getTimezoneOffset()
  });
  
  // 직접 년-월-일 추출 (시간대 영향 없음)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* 오늘 날짜 문자열 */
function todayYmd() {
  return toYmd(new Date());
}

/* 문자열 날짜를 Date 객체로 변환 (시간대 무시) */
function parseYmdToDate(dateString) {
  if (!dateString) return null;
  // YYYY-MM-DD 형식인지 정확히 확인
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  
  const [, year, month, day] = match;
  // UTC 기준으로 날짜 생성 (시간대 영향 없음)
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
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
  fallbackTitle,        // 기존 방 제목 (표시용 대체)
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

        // 날짜 업데이트 (시간대 무시하고 파싱)
        if (roomInfo.startDate && roomInfo.endDate) {
          const startDate = parseYmdToDate(roomInfo.startDate);
          const endDate = parseYmdToDate(roomInfo.endDate);
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
    (v) => { 
      // 날짜를 정규화 (시간 정보 제거, UTC 기준)
      const normalizedDates = v ? [
        v[0] ? new Date(Date.UTC(v[0].getFullYear(), v[0].getMonth(), v[0].getDate())) : null,
        v[1] ? new Date(Date.UTC(v[1].getFullYear(), v[1].getMonth(), v[1].getDate())) : null
      ] : [null, null];
      setDates(normalizedDates); 
      emitDirty(); 
    },
    [setDates, emitDirty]
  );

  const handleSave = async () => {
    // 제목 검증: 공백/빈값 금지
    const rawTitle = (displayTitle ?? '').trim();
    if (!rawTitle) {
      setErrorText('방 이름은 1자 이상 입력해주세요.');
      return;
    }

    // 지역 검증
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
      // 닫기는 Host가 onSuccess에서 처리
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
            {/* 여행방 이름 (YYYY-MM-DD까지만 표시/유지) */}
            <TripNameInput value={displayTitle} onChange={handleTitleChange} />

            {/* 지역(필수) */}
            <RegionDropdown value={region ?? ''} onChange={handleRegionChange} />

            {/* 날짜: 미선택 시 오늘로 자동 대체 */}
            <TripDatePicker value={dates} onChange={handleDatesChange} />

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
