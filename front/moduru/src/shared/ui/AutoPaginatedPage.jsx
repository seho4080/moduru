// src/shared/ui/AutoPaginatedPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import useAutoPageSize from "../hooks/useAutoPageSize";

/**
 * 페이지 전체 대신 "현재 페이지의 items 조각"을 렌더링하는 콜백을 넘기는 형태.
 * - renderPage(slice) 로 잘린 items만 전달 → 기존 리스트 컴포넌트를 그대로 재사용 가능
 * - 항목 DOM에 itemSelector에 해당하는 클래스가 있어야 높이 측정이 가능
 */
export default function AutoPaginatedPage({
  items = [],
  renderPage,                 // (sliceItems) => ReactNode
  itemSelector = ".auto-item",// 예: ".room-item"
  minItems = 5,
  maxItems = 50,
  gapPx = 12,
  className = "",
}) {
  const [page, setPage] = useState(1);
  const scrollRef = useRef(null);
  const paginationRef = useRef(null);

  const itemsPerPage = useAutoPageSize({
    scrollRef,
    paginationRef,
    itemSelector,
    minItems,
    maxItems,
    gapPx,
  });

  const totalPages = Math.max(1, Math.ceil(items.length / Math.max(itemsPerPage, 1)));

  const pageItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [items, page, itemsPerPage]);

  // itemsPerPage 변동/데이터 변동 시 페이지 보정
  useEffect(() => {
    const next = Math.max(1, Math.ceil(items.length / Math.max(itemsPerPage, 1)));
    if (page > next) setPage(next);
  }, [items.length, itemsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`auto-pager-root ${className}`} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div ref={scrollRef} className="main-scroll">
        {renderPage(pageItems)}
      </div>

      <div ref={paginationRef} className="pagination-bar" role="navigation" aria-label="페이지네이션">
        <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="첫 페이지">«</button>
        <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="이전 페이지">‹</button>

        {/* 간단 축약(많을 때는 양옆+근처만 노출) */}
        {Array.from({ length: totalPages }).map((_, i) => {
          const n = i + 1;
          if (totalPages > 7) {
            const near = Math.abs(n - page) <= 1 || n === 1 || n === totalPages;
            if (!near) return null;
          }
          return (
            <button
              key={n}
              className={`page-btn ${n === page ? "active" : ""}`}
              onClick={() => setPage(n)}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </button>
          );
        })}

        <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="다음 페이지">›</button>
        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="마지막 페이지">»</button>
      </div>
    </div>
  );
}
