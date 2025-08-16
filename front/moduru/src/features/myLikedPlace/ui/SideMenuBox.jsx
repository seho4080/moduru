// src/pages/myLikePlacePage/SideMenuBox.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../css/myLikedPlaceCard.css";
import Region from "./Region";
import { fetchMyLikedPlacesApi } from "../lib/likedPlaceApi";
import MyLikedPlaceList from "./MyLikedPlaceList";

export default function SideMenuBox() {
  const [places, setPlaces] = useState([]);
  const [regionId, setRegionId] = useState(null);
  const [page, setPage] = useState(1);

  // 화면 비율에 따라 동적으로 계산할 상태
  const [pageSize, setPageSize] = useState(7);

  // 레이아웃 측정용 ref들
  const boxRef = useRef(null);
  const headerRef = useRef(null);   // Region 영역
  const listRef = useRef(null);     // 리스트 영역
  const pagerRef = useRef(null);    // 페이지네이션 영역

  // 항목 한 개의 예상 높이(px)
  const EST_ITEM_HEIGHT = 92;

  const loadPlaces = async (regionIdParam = null) => {
    const list = await fetchMyLikedPlacesApi({
      region: regionIdParam == null ? undefined : Number(regionIdParam),
      useToken: true,
    });
    setPlaces(list);
    setPage(1); // 지역 바꾸면 1페이지로
  };

  const handleRegionSuccess = ({ regionId: rid }) => {
    setRegionId(rid);
    loadPlaces(rid);
  };

  // 화면/컨테이너 크기에 따라 pageSize 자동 계산
  useEffect(() => {
    if (!boxRef.current) return;

    const ro = new ResizeObserver(() => {
      const boxH = boxRef.current?.clientHeight ?? 0;
      const headerH = headerRef.current?.clientHeight ?? 0;
      const pagerH = pagerRef.current?.clientHeight ?? 0;

      // 내부 수직 패딩/간격 여유값
      const INTERNAL_GAP = 24;

      // 리스트에 실제로 할당 가능한 높이
      const available = Math.max(0, boxH - headerH - pagerH - INTERNAL_GAP);

      // 화면에 꽉 차게 보일 수 있는 항목 수 계산(최소 3개, 최대 12개로 클램프)
      const computed = Math.min(
        12,
        Math.max(3, Math.floor(available / EST_ITEM_HEIGHT))
      );

      setPageSize((prev) => (prev !== computed ? computed : prev));
    });

    ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  // 페이지네이션 계산
  const pageCount = Math.max(1, Math.ceil(places.length / pageSize));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [pageSize, pageCount, page]);

  const start = (page - 1) * pageSize;
  const viewItems = useMemo(
    () => places.slice(start, start + pageSize),
    [places, start, pageSize]
  );

  const go = (p) => setPage(Math.min(Math.max(1, p), pageCount));

  // ===== 숫자 버튼 2개 윈도우 계산 (현재 페이지부터 시작) =====
  const WINDOW = 2;
  let winStart = Math.max(1, Math.min(page, pageCount - WINDOW + 1));
  let winEnd = Math.min(pageCount, winStart + WINDOW - 1);

  const pages = [];
  for (let i = winStart; i <= winEnd; i += 1) {
    pages.push(i);
  }

  const hasItems = viewItems.length > 0;

  return (
    <div className="side-menu-box" ref={boxRef}>
      {/* 상단: 지역 선택 */}
      <div ref={headerRef}>
        <Region includeAllTop allTopLabel="전체" onSuccess={handleRegionSuccess} />
      </div>

      {/* 중단: 리스트 */}
      <div className="side-menu-box__section">
        <div className="liked-list-viewport" ref={listRef} role="region" aria-label="liked-list">
          {hasItems ? (
            <MyLikedPlaceList items={viewItems} />
          ) : (
            <div className="liked-list-empty" aria-live="polite">
              항목이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 하단: 페이지네이션 */}
      <div className="side-pagination" ref={pagerRef}>
        <button className="pg-btn" onClick={() => go(1)} disabled={page === 1} aria-label="첫 페이지">
          «
        </button>
        <button className="pg-btn" onClick={() => go(page - 1)} disabled={page === 1} aria-label="이전">
          ‹
        </button>

        {pages.map((p) => (
          <button
            key={p}
            className={`pg-btn ${p === page ? "is-active" : ""}`}
            onClick={() => go(p)}
          >
            {p}
          </button>
        ))}

        <button className="pg-btn" onClick={() => go(page + 1)} disabled={page === pageCount} aria-label="다음">
          ›
        </button>
        <button className="pg-btn" onClick={() => go(pageCount)} disabled={page === pageCount} aria-label="끝 페이지">
          »
        </button>
      </div>
    </div>
  );
}
