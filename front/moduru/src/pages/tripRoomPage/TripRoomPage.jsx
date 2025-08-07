// src/pages/TripRoomPage.jsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { setSelectedPlace } from "../../redux/slices/mapSlice";
import { setTripRoom } from "../../redux/slices/tripRoomSlice";

import SidebarContainer from "../../widgets/sidebar/SidebarContainer";
import Controls from "../../features/map/ui/MapControls";
import KakaoMap from "../../features/map/ui/KakaoMap";
import TripCreateForm from "../../features/tripCreate/ui/TripCreateForm";
import RegionOnlyModal from "../../features/tripCreate/ui/RegionOnlyModal";
import InviteButtonWithPopover from "../../features/invite/ui/InviteButtonWithPopover";
import TestAddPin from "../../features/map/dev/TestAddPin";
import PlaceDetailModal from "../../widgets/sidebar/PlaceDetailModal";

import { updateTripRoomRegion } from "../../features/tripCreate/lib/tripRoomApi";

export default function TripRoomPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const {
    travelRoomId,
    title,
    region: initialRegion,
    startDate,
    endDate,
  } = location.state || {};

  const fromInvite =
    location.state?.from === "invite" || searchParams.get("from") === "invite";
  const inviteRegion = searchParams.get("region"); // 초대 링크의 지역

  const [mode, setMode] = useState("marker");
  const [zoomable, setZoomable] = useState(true);
  const [region, setRegion] = useState(inviteRegion || initialRegion || "");
  const [removeMode, setRemoveMode] = useState(false);
  const [toRemove, setToRemove] = useState(new Set());

  const [activeTab, setActiveTab] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(
    !initialRegion && !inviteRegion && !fromInvite
  ); // ✅ 모달 조건

  const [tripName, setTripName] = useState("");
  const [tripRegion, setTripRegion] = useState(
    inviteRegion || initialRegion || ""
  );
  const [tripDates, setTripDates] = useState([null, null]);

  const mapRef = useRef();

  const selectedPlace = useSelector((state) => state.map.selectedPlace);
  const roomMembers = useSelector(
    (state) => state.tripMember.membersByRoomId[travelRoomId] || []
  );
  const friendList = useSelector((state) => state.friend.list);

  useEffect(() => {
    dispatch(
      setTripRoom({
        roomId: travelRoomId,
        title: title || "",
        region: inviteRegion || initialRegion || "",
        startDate: startDate || "",
        endDate: endDate || "",
      })
    );

    setTripName(title || "");
    setTripRegion(inviteRegion || initialRegion || "");
    setTripDates(
      startDate && endDate
        ? [new Date(startDate), new Date(endDate)]
        : [null, null]
    );
  }, [
    travelRoomId,
    title,
    initialRegion,
    inviteRegion,
    startDate,
    endDate,
    dispatch,
  ]);

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

  const handleMarkerSelect = useCallback((markerSet) => {
    setToRemove(new Set(markerSet));
  }, []);

  const handleTabChange = (tab) => {
    dispatch(setSelectedPlace(null));
    if (tab === "openTripModal") return setShowTripModal(true);
    if (tab === "exit") return console.log("나가기");
    setActiveTab(tab);
  };

  const handleTripSave = async () => {
    try {
      const res = await updateTripRoomRegion(travelRoomId, {
        title: tripName,
        region: tripRegion,
        startDate: tripDates[0]?.toISOString().split("T")[0],
        endDate: tripDates[1]?.toISOString().split("T")[0],
      });
      console.log("[여행방 수정 성공]", res);
      setRegion(tripRegion);
      setShowTripModal(false);
    } catch (err) {
      alert(`저장 실패: ${err.message}`);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
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

        <TestAddPin roomId={travelRoomId} />

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

        {selectedPlace && <PlaceDetailModal place={selectedPlace} />}

        {showRegionModal && (
          <RegionOnlyModal
            roomId={travelRoomId}
            title={title}
            onRegionSet={(region) => {
              setTripRegion(region);
              setRegion(region);
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
