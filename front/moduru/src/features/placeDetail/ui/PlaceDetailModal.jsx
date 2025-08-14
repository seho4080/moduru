// src/shared/ui/PlaceDetailModal.jsx
import "./placeDetailModal.css";
import { FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux"; // 리덕스 미사용이면 제거해도 됨
import { clearSelectedPlace } from "../../../redux/slices/mapSlice"; // 리덕스 미사용이면 닫기 콜백으로 대체
import { useRef, useEffect, useState, useMemo } from "react";

import { getPlaceDetail } from "../../../features/placeDetail/lib/placeDetailApi";
import RestaurantDetail from "./RestaurantDetail";
import SpotDetail from "./SpotDetail";
import FestivalDetail from "./FestivalDetail";

/* NOTE: 사용자가 모달을 이동할 수 있어야 하므로 직접 좌표를 갱신하는 드래그 방식을 사용한다. */
function useDraggable(modalRef) {
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    const onMouseDown = (e) => {
      isDragging = true;
      offsetX = e.clientX - modal.getBoundingClientRect().left;
      offsetY = e.clientY - modal.getBoundingClientRect().top;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      modal.style.left = `${e.clientX - offsetX}px`;
      modal.style.top = `${e.clientY - offsetY}px`;
      modal.style.transform = "none";
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    modal.addEventListener("mousedown", onMouseDown);
    return () => modal.removeEventListener("mousedown", onMouseDown);
  }, [modalRef]);
}

export default function PlaceDetailModal({ place, roomId }) {
  const dispatch = useDispatch();
  const modalRef = useRef(null);
  useDraggable(modalRef);

  const [placeDetail, setPlaceDetail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  /* NOTE: 상세 전환 시 이전 이미지 오류 상태가 누적되지 않도록 초기화한다. */
  const [imgError, setImgError] = useState(false);

  const { placeName, placeImg, placeId, category: categoryFromProp } = place;

  const handleCloseModal = () => {
    // 리덕스 미사용이면 상위에서 onClose를 내려받아 호출하도록 변경 가능
    dispatch(clearSelectedPlace());
  };

  /* NOTE: placeId/roomId 변경에 따라 상세를 재조회한다. (값 준비 시에만 호출) */
  useEffect(() => {
    if (!roomId || !placeId) {
      setError(null);      // 불필요한 에러 표시 방지
      setPlaceDetail(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setImgError(false);
        const data = await getPlaceDetail(roomId, placeId);
        if (alive) setPlaceDetail(data);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [roomId, placeId]);

  /* NOTE: 카테고리 상세는 스키마가 달라 조건 분기로 컴포넌트를 선택한다. address는 루트 값으로 보강해 전달한다. */
  const detailComponent = useMemo(() => {
    if (!placeDetail) return null;
    const { categoryDetail } = placeDetail;
    if (!categoryDetail) return null;

    const address =
      categoryDetail.address ??
      placeDetail.address ??
      place.address ??
      "";

    if ("menus" in categoryDetail) {
      return <RestaurantDetail data={categoryDetail} address={address} />;
    }
    if ("infoCenter" in categoryDetail && "price" in categoryDetail) {
      return <SpotDetail data={categoryDetail} address={address} />;
    }
    if ("organizer" in categoryDetail && "period" in categoryDetail) {
      return <FestivalDetail data={categoryDetail} address={address} />;
    }
    return <p>지원되지 않는 카테고리입니다.</p>;
  }, [placeDetail, place.address]);

  /* NOTE: 상세 이미지가 있으면 우선 사용하고, 없으면 기본 이미지를 사용한다. */
  const imgUrl = useMemo(() => {
    const arr = placeDetail?.placeImages;
    if (Array.isArray(arr) && arr.length > 0) {
      const first = arr[0];
      if (typeof first === "string") return first;
      return first?.url || first?.imageUrl || "";
    }
    return placeImg || "";
  }, [placeDetail?.placeImages, placeImg]);

  /* NOTE: 카테고리는 상세 값을 우선 사용한다. */
  const categoryText = useMemo(() => {
    const raw = placeDetail?.category ?? categoryFromProp;
    if (!raw) return "";
    return Array.isArray(raw) ? raw.filter(Boolean).join(", ") : String(raw);
  }, [placeDetail?.category, categoryFromProp]);

  /* NOTE: 핵심 요약 정보는 헤더 상단에서 먼저 노출한다. */
  const descriptionShort = placeDetail?.categoryDetail?.descriptionShort;

  return (
    <div ref={modalRef} className="place-detail-modal">
      <button
        className="place-detail-modal-close"
        onClick={handleCloseModal}
        aria-label="닫기"
      >
        <FaTimes />
      </button>

      {(!imgUrl || imgError) ? (
        <div className="place-detail-modal-img-empty">이미지 없음</div>
      ) : (
        <img
          src={imgUrl}
          alt={placeName}
          className="place-detail-modal-img"
          onError={() => setImgError(true)}
        />
      )}

      <div className="place-detail-header" style={{ paddingBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
          <h1 className="place-detail-title" style={{ margin: 0 }}>{placeName}</h1>
          {categoryText && (
            <span
              style={{ fontSize: 14, color: "#64748b", fontWeight: 500, lineHeight: 1.2 }}
              title={categoryText}
            >
              {categoryText}
            </span>
          )}
        </div>

        {descriptionShort && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 14,
              color: "#475569",
              lineHeight: 1.5,
            }}
          >
            {descriptionShort}
          </p>
        )}
      </div>

      <div className="place-detail-modal-body">
        {error && <p>에러: {error}</p>}
        {loading && <p>불러오는 중...</p>}
        {!loading && !error && detailComponent}
      </div>
    </div>
  );
}
