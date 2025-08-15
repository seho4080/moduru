// src/pages/myLikePlacePage/SideMenuBox.jsx
import React, { useState } from "react";
import "./myLikePlacePage.css";
import Region from "../../features/myLikedPlace/ui/Region";
import { fetchMyLikedPlacesApi } from "../../features/myLikedPlace/lib/likedPlaceApi";
import MyLikedPlaceList from "../../features/myLikedPlace/ui/MyLikedPlaceList";

const PAGE_SIZE = 7;

export default function SideMenuBox() {
  const [places, setPlaces] = useState([]);
  const [regionId, setRegionId] = useState(null);
  const [page, setPage] = useState(1);

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

  const pageCount = Math.max(1, Math.ceil(places.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const viewItems = places.slice(start, start + PAGE_SIZE);

  const go = (p) => setPage(Math.min(Math.max(1, p), pageCount));

  // ===== 숫자 버튼 3개 윈도우 계산 =====
  const WINDOW = 3;
  let winStart = Math.max(1, page - Math.floor(WINDOW / 2));
  let winEnd = winStart + WINDOW - 1;
  if (winEnd > pageCount) {
    winEnd = pageCount;
    winStart = Math.max(1, winEnd - WINDOW + 1);
  }
  const pages = [];
  for (let i = winStart; i <= winEnd; i += 1) pages.push(i);

  return (
    <div className="side-menu-box">
      <Region includeAllTop allTopLabel="전체" onSuccess={handleRegionSuccess} />

      <div className="side-menu-box__section">
        <MyLikedPlaceList items={viewItems} />

        {/* 하단 중앙 페이지네이션 (숫자 버튼 3개 고정) */}
        <div className="side-pagination">
          <button className="pg-btn" onClick={() => go(1)} disabled={page === 1} aria-label="첫 페이지">
            «
          </button>
          <button className="pg-btn" onClick={() => go(page - 1)} disabled={page === 1} aria-label="이전">
            ‹
          </button>

          {/* 앞쪽 앵커: 윈도우 시작이 3 이상일 때만 노출 => 1 … */}
          {winStart > 2 && (
            <>
              <button className="pg-btn" onClick={() => go(1)}>1</button>
              <span className="pg-ellipsis">…</span>
            </>
          )}

          {/* 중앙 윈도우: 항상 3개(또는 pageCount<3일 땐 그만큼) */}
          {pages.map((p) => (
            <button
              key={p}
              className={`pg-btn ${p === page ? "is-active" : ""}`}
              onClick={() => go(p)}
            >
              {p}
            </button>
          ))}

          {/* 뒤쪽 앵커: 윈도우 끝이 마지막-1 이하일 때만 노출 => … 마지막 */}
          {winEnd < pageCount - 1 && (
            <>
              <span className="pg-ellipsis">…</span>
              <button className="pg-btn" onClick={() => go(pageCount)}>{pageCount}</button>
            </>
          )}

          <button className="pg-btn" onClick={() => go(page + 1)} disabled={page === pageCount} aria-label="다음">
            ›
          </button>
          <button className="pg-btn" onClick={() => go(pageCount)} disabled={page === pageCount} aria-label="끝 페이지">
            »
          </button>
        </div>
      </div>
    </div>
  );
}
