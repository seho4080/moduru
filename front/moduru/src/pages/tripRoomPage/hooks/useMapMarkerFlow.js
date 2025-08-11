import { useCallback, useState } from "react";

/**
 * useMapMarkerFlow
 * - 지도 모드, 줌 가능 여부, 삭제 모드, 신규 핀 흐름을 관리한다.
 * - 브라우저 alert/confirm 사용 중이며, 프로젝트 모달로 교체 가능.
 */
export function useMapMarkerFlow({
  mapRef,
  travelRoomId,
  defaultName = "새 장소",
}) {
  const [mode, setMode] = useState(""); // 지도 모드("", "marker", "measure" 등)
  const [zoomable, setZoomable] = useState(true); // 확대/축소 가능 여부

  const [removeMode, setRemoveMode] = useState(false); // 삭제 모드 토글
  const [toRemove, setToRemove] = useState(new Set()); // 삭제 대상 마커 집합

  const [confirmData, setConfirmData] = useState({
    open: false,
    name: defaultName,
    lat: 0,
    lng: 0,
    address: "",
  });

  const [pendingPin, setPendingPin] = useState(null); // { marker, lat, lng, address?, name? }

  // 삭제 확정
  const handleDeleteConfirm = useCallback(() => {
    if (toRemove.size === 0) {
      alert("삭제할 핀을 먼저 선택하세요."); // TODO: 프로젝트 모달로 교체 권장
      return;
    }
    if (!window.confirm("삭제하시겠습니까?")) return; // TODO: 프로젝트 모달로 교체 권장

    // TODO: Redux/백엔드 동기화 로직 추가 가능
    toRemove.forEach((marker) => marker.setMap(null));
    setToRemove(new Set());
    setRemoveMode(false);
    setMode("");
  }, [toRemove]);

  // 마커 선택 모드 콜백
  const handleMarkerSelect = useCallback((markerSet) => {
    setToRemove(new Set(markerSet));
  }, []);

  // 지도 클릭 → 임시 핀 & 확인 모달
  const handlePinPlaced = useCallback(
    ({ latLng, marker }) => {
      const lat = latLng.getLat();
      const lng = latLng.getLng();

      setPendingPin({ marker, lat, lng, name: defaultName, address: "" });
      setConfirmData({ open: true, name: defaultName, lat, lng, address: "" });

      // 핀 모드 OFF
      setMode("");
    },
    [defaultName]
  );

  return {
    mode,
    setMode,
    zoomable,
    setZoomable,

    removeMode,
    setRemoveMode,
    toRemove,
    setToRemove,
    handleDeleteConfirm,
    handleMarkerSelect,

    confirmData,
    setConfirmData,
    pendingPin,
    setPendingPin,

    handlePinPlaced,
  };
}
