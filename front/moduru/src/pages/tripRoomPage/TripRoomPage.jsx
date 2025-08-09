// src/pages/TripRoomPage.jsx

// builtin
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useSearchParams, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

// redux actions
import { setSelectedPlace } from "../../redux/slices/mapSlice";
import { setTripRoom } from "../../redux/slices/tripRoomSlice";
import { closeRouteModal } from "../../redux/slices/uiSlice";

// ui components
import SidebarContainer from "../../widgets/sidebar/SidebarContainer";
import Controls from "../../features/map/ui/MapControls";
import KakaoMap from "../../features/map/ui/KakaoMap";
import { getLatLngFromRegion } from "../../features/map/lib/regionUtils";
import TripCreateForm from "../../features/tripCreate/ui/TripCreateForm";
import RegionOnlyModal from "../../features/tripCreate/ui/RegionOnlyModal";
import InviteButtonWithPopover from "../../features/invite/ui/InviteButtonWithPopover";
// import TestAddPin from "../../features/map/dev/TestAddPin";
import PlaceDetailModal from "../../features/placeDetail/ui/PlaceDetailModal";
import RouteModal from "../../features/tripPlanOptimize/ui/RouteModal";

// api
import {
  updateTripRoomRegion,
  getTripRoomInfo,
} from "../../features/tripCreate/lib/tripRoomApi";

// hooks - pins & wish
//import useInitPins from "../../features/map/hooks/useInitPins";
//import useWishPlaceList from "../../features/wishPlace/model/useWishPlaceList";

// hooks - shared (리스트 + 소켓)
import useSharedPlaceList from "../../features/sharedPlace/model/useSharedPlaceList";
import useSharedPlaceSocket from "../../features/sharedPlace/model/useSharedPlaceSocket";

// ── 공용 상수 ────────────────────────────────────────────────────────────────
const EMPTY_ARRAY = [];

/**
 * TripRoomPage
 * - location.state 또는 /trip-room/:id 로 진입 모두 지원
 * - state 미존재 시 roomId로 API 조회
 * - 핀 초기화 + 희망장소 목록 + 공유장소 목록 + 공유장소 소켓 모두 실행 (중복 허용)
 * - 지역 모달은 최초 1회만 노출
 */
export default function TripRoomPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id: roomIdFromParam } = useParams();
  const dispatch = useDispatch();

  // 초기 진입 데이터
  const initialState = location.state || null;
  const [tripRoomData, setTripRoomData] = useState(initialState);
  const [region, setRegion] = useState(initialState?.region || "");
  const [hasShownRegionModal, setHasShownRegionModal] = useState(false);

  // state 없고 URL 파라미터만 있을 때 API 조회
  useEffect(() => {
    if (!tripRoomData && roomIdFromParam) {
      getTripRoomInfo(roomIdFromParam).then((data) => {
        setTripRoomData(data);
        setRegion(data.region || "");
      });
    }
  }, [roomIdFromParam, tripRoomData]);

  const {
    travelRoomId = roomIdFromParam,
    title = "",
    region: initialRegion = "",
    startDate = "",
    endDate = "",
  } = tripRoomData || {};

  // 초대 링크 여부 / 지역
  const fromInvite =
    location.state?.from === "invite" || searchParams.get("from") === "invite";
  const inviteRegion = searchParams.get("region");

  // --- 중복 실행 요청: 핀/희망장소 + 공유장소(리스트/소켓) 모두 호출 ---
  // 각 훅 내부에서 roomId falsy 체크 & 중복연결 방지(예: window.stompClient?.connected)되어 있어야 안전.
  //useInitPins(travelRoomId);
  //useWishPlaceList(travelRoomId);
  useSharedPlaceList(travelRoomId);
  useSharedPlaceSocket(travelRoomId);

  // 로컬 상태
  const [mode, setMode] = useState("marker");
  const [zoomable, setZoomable] = useState(true);
  const [removeMode, setRemoveMode] = useState(false);
  const [toRemove, setToRemove] = useState(new Set());
  const [activeTab, setActiveTab] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  const [tripName, setTripName] = useState(title);
  const [tripRegion, setTripRegion] = useState(
    inviteRegion || initialRegion || ""
  );
  const [tripDates, setTripDates] = useState(
    startDate && endDate
      ? [new Date(startDate), new Date(endDate)]
      : [null, null]
  );

  // Redux selectors
  const isRouteModalOpen = useSelector((state) => state.ui.isRouteModalOpen);
  const selectedPlace = useSelector((state) => state.map.selectedPlace);
  const roomMembers = useSelector(
    (state) => state.tripMember.membersByRoomId[travelRoomId] ?? EMPTY_ARRAY
  );
  const friendList = useSelector((state) => state.friend.list ?? EMPTY_ARRAY);

  const mapRef = useRef();

  // Redux 메타 저장
  useEffect(() => {
    if (!travelRoomId) return;
    dispatch(
      setTripRoom({
        roomId: travelRoomId,
        title: tripName || "",
        region: tripRegion || "",
        startDate: startDate || "",
        endDate: endDate || "",
      })
    );
  }, [dispatch, travelRoomId, tripName, tripRegion, startDate, endDate]);

  // region 변경 시 지도 이동
  useEffect(() => {
    const coords = getLatLngFromRegion(region);
    if (coords && mapRef.current?.setCenter) {
      mapRef.current.setCenter(coords);
    }
  }, [region]);

  // 지역 모달 최초 1회
  useEffect(() => {
    if (
      !hasShownRegionModal &&
      !initialRegion &&
      !inviteRegion &&
      !fromInvite
    ) {
      setShowRegionModal(true);
      setHasShownRegionModal(true);
    }
  }, [hasShownRegionModal, initialRegion, inviteRegion, fromInvite]);

  // 핀 삭제
  const handleDeleteConfirm = () => {
    if (toRemove.size === 0) {
      alert("삭제할 핀을 먼저 선택하세요.");
      return;
    }
    if (!window.confirm("삭제하시겠습니까?")) return;

    toRemove.forEach((marker) => marker.setMap(null));
    setToRemove(new Set());
    setRemoveMode(false);
    setMode("marker");
  };

  // 마커 선택 모드 콜백
  const handleMarkerSelect = useCallback((markerSet) => {
    setToRemove(new Set(markerSet));
  }, []);

  // 사이드바 탭 변경
  const handleTabChange = (tab) => {
    dispatch(setSelectedPlace(null));
    if (tab === "openTripModal") return setShowTripModal(true);
    if (tab === "exit") {
      console.log("나가기");
      return;
    }
    setActiveTab(tab);
  };

  // 여행방 저장
  const handleTripSave = async () => {
    try {
      await updateTripRoomRegion(travelRoomId, {
        title: tripName,
        region: tripRegion,
        startDate: tripDates[0]?.toISOString().split("T")[0],
        endDate: tripDates[1]?.toISOString().split("T")[0],
      });
      setRegion(tripRegion);
      setShowTripModal(false);
    } catch (err) {
      alert(`저장 실패: ${err.message}`);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {isRouteModalOpen && (
        <RouteModal onClose={() => dispatch(closeRouteModal())} />
      )}

      <SidebarContainer
        activeTab={activeTab}
        onTabChange={handleTabChange}
        roomId={travelRoomId}
        region={region}
      />

      <div style={{ flex: 1, position: "relative" }}>
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
          <InviteButtonWithPopover
            roomMembers={roomMembers}
            friendList={friendList}
          />
        </div>

        <Controls
          mode={mode}
          setMode={setMode}
          zoomable={zoomable}
          setZoomable={setZoomable}
          zoomIn={() => mapRef.current?.zoomIn?.()}
          zoomOut={() => mapRef.current?.zoomOut?.()}
          region={region}
          setRegion={setRegion}
          removeMode={removeMode}
          setRemoveMode={setRemoveMode}
          onDeleteConfirm={handleDeleteConfirm}
        />

        {/* <TestAddPin roomId={travelRoomId} /> */}

        <KakaoMap
          ref={mapRef}
          mode={mode}
          zoomable={zoomable}
          region={tripRegion}
          removeMode={removeMode}
          onSelectMarker={handleMarkerSelect}
          pinCoords={
            selectedPlace
              ? { lat: selectedPlace.latitude, lng: selectedPlace.longitude }
              : null
          }
        />

        {selectedPlace && (
          <PlaceDetailModal
            place={selectedPlace}
            roomId={travelRoomId} 
          />
        )}

        {showRegionModal && (
          <RegionOnlyModal
            roomId={travelRoomId}
            title={title}
            onRegionSet={(newRegion) => {
              const coords = getLatLngFromRegion(newRegion);
              if (coords && mapRef.current?.setCenter) {
                mapRef.current.setCenter(coords);
              }
              setTripRegion(newRegion);
              setRegion(newRegion);
              setShowRegionModal(false);
            }}
          />
        )}

        {showTripModal && (
          <TripCreateForm
            tripName={tripName}
            setTripName={setTripName}
            region={tripRegion}
            setRegion={setTripRegion}
            dates={tripDates}
            setDates={setTripDates}
            onClose={() => setShowTripModal(false)}
            onSubmit={handleTripSave}
          />
        )}

        <button
          onClick={() => setActiveTab("exit")}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: "#ffffff",
            color: "#007aff",
            fontWeight: "bold",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f0f7ff";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#ffffff";
          }}
        >
          나가기
        </button>
      </div>
    </div>
  );
}
