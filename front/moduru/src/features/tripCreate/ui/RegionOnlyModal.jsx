// src/features/tripCreate/ui/RegionOnlyModal.jsx
import { useEffect, useRef, useState } from "react";
import { updateTripRoomRegion } from "../lib/tripRoomApi";
import { fetchTopRegions, fetchChildRegions } from "../lib/regionApi";
import "./regionSelectDropdown.css";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

const CASCADE_FROM_ID = 8;

export default function RegionOnlyModal({
  roomId,
  title,
  startDate,
  endDate,
  onSuccess,
  onClose,
  currentRegion = "",        // ★ 부모가 내려주는 기존 지역(문자열)
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [topRegions, setTopRegions] = useState([]);
  const [childRegions, setChildRegions] = useState([]);
  const [activeTop, setActiveTop] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null); // {id,name,...} 또는 null
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  // ★ 초기 표시: 이미 저장된 지역이 있다면 헤더에 보여주기(닫기는 여전히 제한)
  useEffect(() => {
    if (currentRegion && !selectedRegion) {
      setSelectedRegion({ id: null, name: currentRegion });
    }
  }, [currentRegion]);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // 최상위 로딩
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchTopRegions();
      if (!cancelled) setTopRegions(Array.isArray(list) ? list : []);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleTopClick = async (region) => {
    setActiveTop(region);
    if (region.id >= CASCADE_FROM_ID) {
      const children = await fetchChildRegions(region.id);
      setChildRegions(Array.isArray(children) ? children : []);
    } else {
      setSelectedRegion(region);
      setChildRegions([]);
      setDropdownOpen(false);
    }
  };

  const handleChildClick = (child) => {
    setSelectedRegion(child);
    setDropdownOpen(false);
  };

  // ★ 닫기 가드: 기존 region 또는 방금 선택한 region 둘 다 없으면 닫기 금지
  const canClose = Boolean(
    (selectedRegion && selectedRegion.name) || (currentRegion && String(currentRegion).trim())
  );

  const handleCancel = () => {
    if (!canClose) {
      alert("여행지를 선택해 주세요.");
      return;
    }
    onClose?.();
  };

  const handleConfirm = async () => {
    if (!roomId) {
      alert("유효하지 않은 방입니다.");
      return;
    }
    // 기존 region이 없고, 선택도 안 했으면 저장 불가
    if (!selectedRegion || !selectedRegion.name) {
      alert("여행지를 선택해 주세요.");
      return;
    }

    const regionName = selectedRegion.name;
    const today = formatDate(new Date());
    const payload = {
      title,
      region: regionName,
      startDate: startDate || today,
      endDate: endDate || today,
    };

    try {
      setSubmitting(true);
      const data = await updateTripRoomRegion(roomId, payload);
      onSuccess?.(data);
    } catch (err) {
      console.error("지역 설정 실패:", err?.response ?? err);
      alert("지역 설정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="trip-modal-backdrop" />
      <div className="trip-modal">
        <button
          className="close-btn"
          onClick={handleCancel}
          aria-label="닫기"
          // ★ 시각적 비활성화 표시(닫히진 않지만 기대감을 줄임)
          style={!canClose ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
        >
          ×
        </button>

        <h3 className="region-title">여행지를 선택해주세요</h3>

        <div className="dropdown-container" ref={dropdownRef}>
          <div
            className="dropdown-header"
            onClick={() => setDropdownOpen(v => !v)}
            role="button"
            tabIndex={0}
          >
            {selectedRegion?.name || "여행지"}
            <span className="arrow">
              {dropdownOpen ? (
                <svg width="16" height="16" viewBox="0 0 20 20">
                  <polyline points="6 12 10 8 14 12" fill="none" stroke="#007aff" strokeWidth="2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 20 20">
                  <polyline points="6 8 10 12 14 8" fill="none" stroke="#007aff" strokeWidth="2" />
                </svg>
              )}
            </span>
          </div>

          {dropdownOpen && (
            <div className="dropdown-panel">
              <ul className="dropdown-col left">
                {topRegions.map((r) => {
                  const isActive = activeTop?.id === r.id;
                  return (
                    <li
                      key={r.id ?? r.name}
                      className={`dropdown-item ${isActive ? "active" : ""}`}
                      onClick={() => handleTopClick(r)}
                    >
                      <span className="label">{r.name}</span>
                      {r.id >= CASCADE_FROM_ID && <span className="chevron">▶</span>}
                    </li>
                  );
                })}
              </ul>

              {activeTop?.id >= CASCADE_FROM_ID && (
                <ul className="dropdown-col right">
                  {childRegions.length === 0 ? (
                    <li className="dropdown-item disabled">세부 지역 없음</li>
                  ) : (
                    childRegions.map((c) => (
                      <li
                        key={c.id ?? c.name}
                        className="dropdown-item"
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

        <button className="submit-btn" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "저장 중…" : "선택 완료"}
        </button>
      </div>
    </>
  );
}
