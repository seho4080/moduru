import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTripRoom } from "../../../redux/slices/tripRoomSlice";
import { getLatLngFromRegion } from "../../../features/map/lib/regionUtils";
import {
  updateTripRoomRegion,
  getTripRoomInfo,
} from "../../../features/tripCreate/lib/tripRoomApi";
import useSharedPlaceList from "../../../features/sharedPlace/model/useSharedPlaceList";
import useSharedPlaceSocket from "../../../features/sharedPlace/model/useSharedPlaceSocket";

const EMPTY_ARRAY = []; // 변경 불가능한 빈 배열 (selector 기본값)

/**
 * useTripRoomMeta
 * - 여행방 메타데이터(제목, 지역, 기간)와 모달/탭 상태를 관리한다.
 * - 최초 진입 시 roomIdFromParam 또는 location.state로 초기화한다.
 * - 지도 중심 이동, Redux 동기화 등 부수효과를 내부에서 수행한다.
 */
export function useTripRoomMeta({
  roomIdFromParam, // 라우트 파라미터의 방 ID
  location, // react-router location 객체
  searchParams, // URLSearchParams
  initialState, // location.state로 전달된 초기 상태
  mapRef, // KakaoMap 제어용 ref
}) {
  const dispatch = useDispatch();

  // 언마운트 가드: 비동기 로딩 중 컴포넌트가 사라지는 경우 setState 방지
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  // 초기 데이터 로딩 상태
  const [tripRoomData, setTripRoomData] = useState(initialState); // 서버에서 가져온 방 정보 전체
  const [region, setRegion] = useState(initialState?.region || ""); // 현재 지도에 반영된 지역 문자열
  const [hasShownRegionModal, setHasShownRegionModal] = useState(false); // 지역 모달 최초 1회 제어

  // 방 정보가 없고 roomId가 있을 때 서버에서 조회
  useEffect(() => {
    if (tripRoomData || !roomIdFromParam) return;

    let canceled = false;
    (async () => {
      try {
        const data = await getTripRoomInfo(roomIdFromParam);
        if (canceled || !mountedRef.current) return;
        setTripRoomData(data);
        setRegion(data?.region || "");
      } catch (e) {
        // TODO: 에러 로깅 또는 사용자 알림 처리
      }
    })();

    return () => {
      canceled = true;
    };
  }, [roomIdFromParam, tripRoomData]);

  // tripRoomData에서 필요한 필드만 구조분해
  const {
    travelRoomId = roomIdFromParam,
    title = "",
    region: initialRegion = "",
    startDate = "",
    endDate = "",
  } = tripRoomData || {};

  // 초대 진입 여부 및 URL로 전달된 지역
  const fromInvite =
    location.state?.from === "invite" || searchParams.get("from") === "invite";
  const inviteRegion = searchParams.get("region");

  /**
   * 공유장소 훅 주의:
   * - 이 훅이 Provider 내부에서도 호출된다면 중복 구독/요청이 발생할 수 있다.
   * - 한 곳에서만 호출되도록 설계하거나, 내부에서 중복 연결 방지 로직을 둔다.
   */
  useSharedPlaceList(travelRoomId);
  useSharedPlaceSocket(travelRoomId);

  // 로컬 UI 상태들
  const [activeTab, setActiveTab] = useState(null); // 사이드바 활성 탭
  const [showTripModal, setShowTripModal] = useState(false); // 여행 생성/수정 모달
  const [showRegionModal, setShowRegionModal] = useState(false); // 지역 설정 모달

  // 수정 가능한 메타 상태
  const [tripName, setTripName] = useState(title); // 사용자 편집 제목
  const [tripRegion, setTripRegion] = useState(
    inviteRegion || initialRegion || ""
  ); // 사용자 편집 지역
  const [tripDates, setTripDates] = useState(
    startDate && endDate
      ? [new Date(startDate), new Date(endDate)]
      : [null, null]
  ); // 사용자 편집 기간([Date|null, Date|null])

  // Redux selectors (외부 전역 상태 참조)
  const isRouteModalOpen = useSelector((s) => s.ui.isRouteModalOpen);
  const selectedPlace = useSelector((s) => s.map.selectedPlace);
  const roomMembers = useSelector(
    (s) => s.tripMember.membersByRoomId[travelRoomId] ?? EMPTY_ARRAY
  );
  const friendList = useSelector((s) => s.friend.list ?? EMPTY_ARRAY);

  // Redux 메타 저장: 화면에서 편집 중인 값을 전역에도 반영
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

  // region 변경 시 지도 중심 이동
  useEffect(() => {
    const coords = getLatLngFromRegion(region); // { lat, lng } 또는 null
    if (coords && mapRef.current?.setCenter) {
      mapRef.current.setCenter(coords);
    }
  }, [region, mapRef]);

  // 지역 모달 최초 1회 노출 로직
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

  // 사이드바 탭 변경 처리
  const onTabChange = useCallback((tab) => {
    if (tab === "openTripModal") {
      setShowTripModal(true);
      return;
    }
    if (tab === "exit") {
      // TODO: 필요 시 라우팅 처리 또는 정리 로직 추가
      return;
    }
    setActiveTab(tab);
  }, []);

  // 여행방 저장: 서버에 제목/지역/기간 반영 후 지역 상태 동기화
  const onTripSave = useCallback(async () => {
    try {
      await updateTripRoomRegion(travelRoomId, {
        title: tripName,
        region: tripRegion,
        startDate: tripDates[0]?.toISOString().split("T")[0],
        endDate: tripDates[1]?.toISOString().split("T")[0],
      });
      setRegion(tripRegion); // 서버 반영 성공 시 현재 지도 기준 region도 갱신
      setShowTripModal(false);
    } catch (e) {
      // TODO: 실패 시 사용자에게 안내
    }
  }, [travelRoomId, tripName, tripRegion, tripDates]);

  return {
    // 식별자/읽기 전용 메타
    travelRoomId,
    title,

    // 지도 중심에 사용하는 현재 지역 문자열
    region,
    setRegion,

    // 편집 가능한 메타 값들
    tripRegion,
    setTripRegion,
    tripName,
    setTripName,
    tripDates,
    setTripDates,

    // 모달 상태
    showRegionModal,
    setShowRegionModal,
    showTripModal,
    setShowTripModal,

    // 사이드바 탭
    activeTab,
    setActiveTab,
    onTabChange,
    onTripSave,

    // 외부 전역 상태
    selectedPlace,
    isRouteModalOpen,
    roomMembers,
    friendList,
  };
}
