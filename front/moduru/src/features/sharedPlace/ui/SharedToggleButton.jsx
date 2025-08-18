// src/features/sharedPlace/ui/SharedToggleButton.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { sendSocketMessage } from "../../webSocket/coreSocket";

// placeId 정규화 함수
const normalizePlaceId = (placeId) =>
  placeId && typeof placeId === "object" ? placeId.placeId : placeId;

export default function SharedToggleButton({
  roomId,
  placeId,
  placeName,
  className = "",
}) {
  // 공유 장소 리스트(Redux)
  const sharedPlaces = useSelector(
    (state) => state.sharedPlace?.sharedPlaces || []
  );

  // placeId 정규화 + 숫자 변환
  const normalizedPlaceId = useMemo(() => {
    if (!placeId) return null;
    const id = normalizePlaceId(placeId);
    return id != null ? Number(id) : null;
  }, [placeId]);

  // 공유 여부 판단
  const isSharedInStore = useMemo(() => {
    if (!Array.isArray(sharedPlaces) || normalizedPlaceId == null) return false;
    return sharedPlaces.some((p) => Number(p.placeId) === normalizedPlaceId);
  }, [sharedPlaces, normalizedPlaceId]);

  // 낙관적 UI 상태 및 요청 상태
  const [optimisticShared, setOptimisticShared] = useState(isSharedInStore);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Redux 상태와 동기화 (요청 중이 아닐 때만)
  useEffect(() => {
    if (!pending) setOptimisticShared(isSharedInStore);
  }, [isSharedInStore, pending]);

  // 버튼 클릭 처리
  const handleClick = () => {
    setErrorMsg("");

    if (!roomId) {
      setErrorMsg("roomId가 없습니다.");
      return;
    }
    if (normalizedPlaceId == null) {
      setErrorMsg("유효하지 않은 placeId입니다.");
      return;
    }
    if (pending) return;

    const nextSharedState = !optimisticShared;

    try {
      setPending(true);
      setOptimisticShared(nextSharedState);

      if (nextSharedState) {
        // 공유 추가 요청 전송
        sendSocketMessage({
          roomId,
          handler: "place-want",
          action: "add",
          type: "place",
          id: normalizedPlaceId,
        });
      } else {
        // 공유 취소 요청 전송 위해 wantId 찾기
        const matched = sharedPlaces.find(
          (p) => p?.placeId && Number(p.placeId) === normalizedPlaceId
        );
        if (!matched?.wantId) {
          throw new Error("wantId가 없어 공유 취소를 할 수 없습니다.");
        }
        sendSocketMessage({
          roomId,
          handler: "place-want",
          action: "remove",
          wantId: Number(matched.wantId),
        });
      }

      // 서버 반영까지 짧은 딜레이 주기 (ACK 구현시 변경 권장)
      setTimeout(() => setPending(false), 400);
    } catch (error) {
      // 실패시 상태 롤백
      setOptimisticShared(!nextSharedState);
      setPending(false);
      setErrorMsg(error.message || "요청 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`wish-add-btn ${pending ? "disabled" : ""} ${optimisticShared ? "shared" : ""}`}
      >
        {pending ? "처리 중..." : optimisticShared ? "삭제" : "공유"}
      </button>

      {errorMsg && <p style={{ fontSize: 12, color: "red" }}>{errorMsg}</p>}
    </div>
  );
}
