// src/features/map/ui/SearchResultList.jsx
import React from "react";

/**
 * 검색 결과 리스트 전용 컴포넌트
 * @param {Object} props
 * @param {Array<{id:string,title:string,subtitle?:string,_raw?:any}>} props.results
 * @param {boolean} props.loading
 * @param {boolean} props.hasSearched
 * @param {string|number} [props.height]  // 필요 시 고정 높이
 * @param {(item:any)=>void} [props.onItemClick]
 * @param {string} [props.emptyHint]      // 최초 힌트 문구
 */
export default function SearchResultList({
  results = [],
  loading = false,
  hasSearched = false,
  height,
  onItemClick,
  emptyHint = "검색어를 입력해 주세요.",
}) {
  const noResult = hasSearched && results.length === 0;

  return (
    <div className="sbx-results" style={height ? { height } : undefined}>
      {loading && <div className="sbx-hint">검색 중…</div>}

      {!loading && results.length > 0 && (
        <ul className="sbx-list" role="listbox" aria-label="검색 결과">
          {results.map((item) => (
            <li
              key={item.id}
              className="sbx-item"
              role="option"
              tabIndex={0}
              onClick={() => onItemClick?.(item)}
            >
              <div className="sbx-title">{item.title}</div>
              {item.subtitle && <div className="sbx-sub">{item.subtitle}</div>}
            </li>
          ))}
        </ul>
      )}

      {!loading && !hasSearched && <div className="sbx-hint">{emptyHint}</div>}

      {/* 결과 0건일 때의 별도 모달은 부모에서 처리 */}
      {!loading && noResult && null}
    </div>
  );
}
