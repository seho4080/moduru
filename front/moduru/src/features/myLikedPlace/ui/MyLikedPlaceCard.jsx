// src/features/myLikedPlace/ui/MyLikedPlaceCard.jsx
import React, { useEffect, useRef, useState } from 'react';
import "../css/myLikedPlaceCard.css";

import { useDispatch } from 'react-redux';
import { toggleLike } from '../../../redux/slices/likedPlaceSlice';
import useLikedToggle from '../../likedPlace/model/useLikedToggle';

/* NOTE: 새로고침 없이도 재등장을 막기 위한 세션 억제 리스트 */
const SUPPRESS_KEY = 'LIKED_SUPPRESS_IDS_V1';
function loadSuppressSet() {
  try {
    const arr = JSON.parse(sessionStorage.getItem(SUPPRESS_KEY) || '[]');
    return new Set(arr.map((n) => Number(n)).filter(Number.isFinite));
  } catch {
    return new Set();
  }
}
function addSuppress(id) {
  const set = loadSuppressSet();
  set.add(Number(id));
  sessionStorage.setItem(SUPPRESS_KEY, JSON.stringify(Array.from(set)));
}

function LikedPlaceCard({ place, onDelete }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [removed, setRemoved] = useState(false);   // ← 즉시 숨김 플래그
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const dispatch = useDispatch();
  const { isLiked, toggleLikedPlace } = useLikedToggle();

  // 마운트 시: 억제 목록에 있으면 곧바로 숨김
  useEffect(() => {
    const id = Number(place?.placeId ?? place?.id);
    if (Number.isFinite(id)) {
      const suppressed = loadSuppressSet().has(id);
      if (suppressed) setRemoved(true);
    }
  }, [place]);

  // 지도 포커스(카드 클릭/Enter/Space)
  const focusOnMap = () => {
    window.dispatchEvent(new CustomEvent('liked-place:focus', { detail: place }));
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      focusOnMap();
    }
  };

  // 카테고리 한글 라벨
  const categoryLabel = (() => {
    const map = { restaurant: '음식점', festival: '축제', spot: '명소' };
    const key = String(place?.category || '').toLowerCase();
    return map[key] ?? (place?.category || '');
  })();

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setOpenMenu((v) => !v);
  };

  // 삭제(좋아요 해제) 처리: 서버 토글 + 전역 상태 보정 + 마커 제거 + 카드 즉시 숨김
  const handleDelete = async (e) => {
    e.stopPropagation();
    const id = Number(place?.placeId ?? place?.id);
    if (!Number.isFinite(id)) return;

    const wasLiked = isLiked(id);
    const ok = await toggleLikedPlace(place);      // POST /my-places/{id}
    if (ok) {
      // 전역 마커 제거
      window.dispatchEvent(new CustomEvent('liked-place:remove', { detail: { placeId: id } }));

      // Redux가 초기 동기화 안 돼 있었던 경우 OFF로 보정
      if (!wasLiked) dispatch(toggleLike({ ...place, placeId: id }));

      // 즉시 숨김 + 재등장 방지
      setRemoved(true);
      addSuppress(id);

      if (typeof onDelete === 'function') onDelete(id);
    }
    setOpenMenu(false);
  };

  // 바깥 클릭/ESC 닫기
  useEffect(() => {
    if (!openMenu) return;
    const onDocDown = (evt) => {
      if (btnRef.current?.contains(evt.target)) return;
      if (menuRef.current?.contains(evt.target)) return;
      setOpenMenu(false);
    };
    const onKey = (evt) => {
      if (evt.key === 'Escape') setOpenMenu(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  if (removed) return null; // ← 새로고침 없이 즉시 목록에서 사라짐

  return (
    <div
      className="lp-card"
      role="button"
      tabIndex={0}
      onClick={focusOnMap}
      onKeyDown={handleKeyDown}
    >
      <div className="lp-card__imageWrap">
        {place?.placeImg ? (
          <img src={place.placeImg} alt={place.placeName} className="lp-card__image" />
        ) : (
          <div className="lp-card__imagePlaceholder" />
        )}
      </div>

      <div className="lp-card__content">
        <div className="lp-card__header">
          <span className="lp-card__category">{categoryLabel}</span>

          <button
            ref={btnRef}
            type="button"
            className="lp-card__menuBtn"
            aria-label="더보기"
            onClick={handleToggleMenu}
          >
            <span aria-hidden>⋮</span>
          </button>

          {openMenu && (
            <div ref={menuRef} className="lp-card__menuPopup">
              <button type="button" className="lp-card__deleteBtn" onClick={handleDelete}>
                삭제
              </button>
            </div>
          )}
        </div>

        <div className="lp-card__title" title={place?.placeName || ''}>
          {place?.placeName}
        </div>
      </div>
    </div>
  );
}

LikedPlaceCard.defaultProps = { onDelete: null };
export default LikedPlaceCard;
