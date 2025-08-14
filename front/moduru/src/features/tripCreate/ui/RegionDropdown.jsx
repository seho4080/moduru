// src/features/tripCreate/ui/RegionDropdown.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setMapCenter } from '../../../redux/slices/mapSlice';
import { fetchTopRegions, fetchChildRegions } from '../lib/regionApi';
import './regionDropdown.css';

const CASCADE_FROM_ID = 8; // (경기도부터 하위 있음)

export default function RegionDropdown({ value, onChange }) {
  const dispatch = useDispatch();

  // UI 상태
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // 데이터
  const [topRegions, setTopRegions] = useState([]);
  const [childRegions, setChildRegions] = useState([]);

  // 선택/활성 상태
  const [activeTop, setActiveTop] = useState(null); // 좌측 hover/active
  const [selectedName, setSelectedName] = useState(''); // 헤더 표시용 문자열

  // 로딩
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingChild, setLoadingChild] = useState(false);

  // 최상위(시·도) 로딩
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTop(true);
      try {
        const list = await fetchTopRegions();
        if (!cancelled) setTopRegions(Array.isArray(list) ? list : []);
      } finally {
        if (!cancelled) setLoadingTop(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 빠른 조회용 맵
  const topById = useMemo(() => {
    const m = new Map();
    topRegions.forEach(r => m.set(String(r.id), r));
    return m;
  }, [topRegions]);

  // 외부 value(문자열 지역명) → 헤더 표시 동기화 + 적당히 패널 초기화
  useEffect(() => {
    const name = (value ?? '').trim();
    setSelectedName(name || '');
  }, [value]);

  // 외부 클릭 시 패널 닫기
  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // 좌측(시·도) 클릭
  const handleTopClick = async (region) => {
    setActiveTop(region);
    if (region.id >= CASCADE_FROM_ID) {
      setLoadingChild(true);
      try {
        const children = await fetchChildRegions(Number(region.id));
        setChildRegions(Array.isArray(children) ? children : []);
      } finally {
        setLoadingChild(false);
      }
    } else {
      // 하위 없음 → 즉시 선택
      finalize(region.name, region.lat, region.lng);
    }
  };

  // 우측(시·군) 클릭
  const handleChildClick = (child) => {
    finalize(child.name, child.lat, child.lng);
  };

  // 선택 확정 공통
  const finalize = (name, lat, lng) => {
    setSelectedName(name);
    onChange?.(name);
    // 지도 이동
    const y = Number(lat), x = Number(lng);
    if (Number.isFinite(y) && Number.isFinite(x)) {
      dispatch(setMapCenter({ lat: y, lng: x }));
    }
    setOpen(false);
  };

  return (
    <div className="region-dropdown-container" ref={wrapRef}>
      <label className="region-label">여행지</label>

      {/* 헤더 */}
      <div
        className={`rd-header ${open ? 'is-open' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
      >
        <span className={`rd-text ${selectedName ? '' : 'placeholder'}`}>
          {selectedName || (loadingTop ? '불러오는 중…' : '선택해주세요')}
        </span>
        <span className="rd-arrow" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 20 20">
            {open ? (
              <polyline points="6 12 10 8 14 12" fill="none" stroke="#007aff" strokeWidth="2" />
            ) : (
              <polyline points="6 8 10 12 14 8" fill="none" stroke="#007aff" strokeWidth="2" />
            )}
          </svg>
        </span>
      </div>

      {/* 패널 */}
      {open && (
        <div className="rd-panel">
          {/* 좌측: 시·도 */}
          <ul className="rd-col left">
            {topRegions.map((r) => {
              const active = activeTop?.id === r.id;
              return (
                <li
                  key={r.id ?? r.name}
                  className={`rd-item ${active ? 'active' : ''}`}
                  onClick={() => handleTopClick(r)}
                >
                  <span className="label">{r.name}</span>
                  {r.id >= CASCADE_FROM_ID && <span className="chevron">▶</span>}
                </li>
              );
            })}
          </ul>

          {/* 우측: 시·군 (활성 시·도의 하위가 있을 때만) */}
          {activeTop?.id >= CASCADE_FROM_ID && (
            <ul className="rd-col right">
              {loadingChild ? (
                <li className="rd-item disabled">불러오는 중…</li>
              ) : childRegions.length === 0 ? (
                <li className="rd-item disabled">세부 지역 없음</li>
              ) : (
                childRegions.map((c) => (
                  <li
                    key={c.id ?? c.name}
                    className="rd-item"
                    onClick={() => handleChildClick(c)}
                  >
                    <span className="label">{c.name}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
