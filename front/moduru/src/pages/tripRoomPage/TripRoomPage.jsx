import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedPlace } from '../../redux/slices/mapSlice';

import SidebarContainer from '../../widgets/sidebar/SidebarContainer';
import Controls from '../../features/map/ui/MapControls';
import KakaoMap from '../../features/map/ui/KakaoMap';
import TripCreateForm from '../../features/tripCreate/ui/TripCreateForm';
import RegionOnlyModal from '../../features/tripCreate/ui/RegionOnlyModal';
import InviteButton from '../../features/invite/ui/InviteButton';
import TestAddPin from '../../features/map/dev/TestAddPin';
import PlaceDetailModal from '../../widgets/sidebar/PlaceDetailModal';

export default function TripRoomPage() {
  const location = useLocation();
  const dispatch = useDispatch();

  const {
    travelRoomId,
    title,
    region: initialRegion,
    startDate,
    endDate,
  } = location.state || {};

  const [mode, setMode] = useState('marker');
  const [zoomable, setZoomable] = useState(true);
  const [region, setRegion] = useState('');
  const [removeMode, setRemoveMode] = useState(false);
  const [toRemove, setToRemove] = useState(new Set());

  const [activeTab, setActiveTab] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(!initialRegion);

  const [tripName, setTripName] = useState('');
  const [tripRegion, setTripRegion] = useState('');
  const [tripDates, setTripDates] = useState([null, null]);

  const mapRef = useRef();
  const selectedPlace = useSelector((state) => state.map.selectedPlace);

  useEffect(() => {
    setTripName(title || '');
    setTripRegion(initialRegion || '');
    setTripDates(startDate && endDate ? [new Date(startDate), new Date(endDate)] : [null, null]);
  }, [title, initialRegion, startDate, endDate]);

  const handleDeleteConfirm = () => {
    if (toRemove.size === 0) {
      alert('삭제할 핀을 먼저 선택하세요.');
      return;
    }

    if (!window.confirm('삭제하시겠습니까?')) return;

    toRemove.forEach((marker) => marker.setMap(null));
    setToRemove(new Set());
    setRemoveMode(false);
    setMode('marker');
  };

  const handleMarkerSelect = useCallback((markerSet) => {
    setToRemove(new Set(markerSet));
  }, []);

  const handleTabChange = (tab) => {
    // NOTE: 탭 변경 시 상세 모달 닫음
    dispatch(setSelectedPlace(null));

    if (tab === 'openTripModal') {
      setShowTripModal(true);
      return;
    }

    if (tab === 'exit') {
      console.log('나가기');
      return;
    }

    setActiveTab(tab);
  };

  const handleTripSave = () => {
    // NOTE: 여행방 정보 저장 후 설정 모달 닫기
    console.log('[여행방 정보]', {
      travelRoomId,
      tripName,
      tripRegion,
      tripDates,
    });
    setShowTripModal(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarContainer
        activeTab={activeTab}
        onTabChange={handleTabChange}
        roomId={travelRoomId}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}>
          <InviteButton onClick={() => alert('초대 링크 복사')} />
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
            onRegionSet={(region) => {
              setTripRegion(region);
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
          onClick={() => setActiveTab('exit')}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: '#ffffff',
            color: '#007aff',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f0f7ff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#ffffff';
          }}
        >
          나가기
        </button>
      </div>
    </div>
  );
}
