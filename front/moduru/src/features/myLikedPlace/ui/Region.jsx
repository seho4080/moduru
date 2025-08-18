// src/features/myLikedPlace/ui/Region.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { fetchTopRegions, fetchChildRegions } from "../../tripCreate/lib/regionApi";
import "../css/region.css";

const CASCADE_FROM_ID = 8;
const ALL_ID = "__ALL__";

export default function Region({
  onSuccess,
  onChange,
  currentRegion = "",
  defaultOpen = false,
  includeAllTop = false,
  allTopLabel = "전체",
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [topRegions, setTopRegions] = useState([]);
  const [childRegions, setChildRegions] = useState([]);
  const [activeTop, setActiveTop] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(
    includeAllTop && !currentRegion ? allTopLabel : (currentRegion || "여행지")
  );
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingChild, setLoadingChild] = useState(false);
  const wrapRef = useRef(null);
  const didInitRef = useRef(false);

  // 첫 진입: includeAllTop && currentRegion 없음 → 전체 기본선택
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (includeAllTop && !currentRegion) {
      const allObj = { id: ALL_ID, name: allTopLabel, isAll: true };
      setSelectedLabel(allTopLabel);
      const payload = { regionName: allTopLabel, regionId: null, regionObj: allObj };
      onSuccess?.(payload);
      onChange?.(payload.regionId);
    }
  }, [includeAllTop, allTopLabel, currentRegion, onSuccess, onChange]);

  // 외부 클릭/ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 최상위 지역
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

  // 상위 목록 + "전체"
  const topRegionsView = useMemo(() => {
    if (!includeAllTop) return topRegions;
    const allItem = { id: ALL_ID, name: allTopLabel, isAll: true };
    return [allItem, ...topRegions];
  }, [includeAllTop, allTopLabel, topRegions]);

  const handleTopClick = async (region) => {
    setActiveTop(region);
    setChildRegions([]);

    // 전체 클릭 → 즉시 확정
    if (region?.isAll || region?.id === ALL_ID) {
      commitSelect(region);
      return;
    }

    if (region.id >= CASCADE_FROM_ID) {
      setLoadingChild(true);
      try {
        const children = await fetchChildRegions(region.id);
        setChildRegions(Array.isArray(children) ? children : []);
      } finally {
        setLoadingChild(false);
      }
    } else {
      commitSelect(region);
    }
  };

  const handleChildClick = (child) => {
    commitSelect(child);
  };

  // 공통 확정
  const commitSelect = (obj) => {
    const name = obj?.name ?? null;
    const regionId = (obj?.isAll || obj?.id === ALL_ID) ? null : obj?.id ?? null;
    if (name) setSelectedLabel(name);
    setOpen(false);
    const payload = { regionName: name, regionId, regionObj: obj };
    onSuccess?.(payload);
    onChange?.(payload.regionId);
  };

  return (
    <div className="region-select-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`region-select-control ${open ? "open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span className={`region-select-label ${selectedLabel !== "여행지" ? "has-value" : ""}`}>
          {selectedLabel}
        </span>
        <svg className="region-caret-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="region-dropdown" role="listbox">
          <ul className="region-col left">
            {loadingTop ? (
              <li className="region-item disabled">불러오는 중…</li>
            ) : topRegionsView.length === 0 ? (
              <li className="region-item disabled">목록을 불러오지 못했습니다</li>
            ) : (
              topRegionsView.map((r) => (
                <li
                  key={r.id ?? r.name}
                  className={`region-item ${activeTop?.id === r.id ? "active" : ""} ${r.isAll ? "all" : ""}`}
                  onClick={() => handleTopClick(r)}
                >
                  <span className="label">{r.name}</span>
                </li>
              ))
            )}
          </ul>

          {/* 오른쪽 컬럼: 활성 상위(region)일 때만 렌더 */}
            <ul className="region-col right">
            {activeTop?.id >= CASCADE_FROM_ID && (
                <>
                {loadingChild ? (
                    <li className="region-item disabled">불러오는 중…</li>
                ) : childRegions.length === 0 ? (
                    <li className="region-item disabled">세부 지역 없음</li>
                ) : (
                    childRegions.map((c) => (
                    <li
                        key={c.id ?? c.name}
                        className="region-item"
                        onClick={() => handleChildClick(c)}
                    >
                        <span className="label">{c.name}</span>
                    </li>
                    ))
                )}
                </>
            )}
            </ul>

        </div>
      )}
    </div>
  );
}
