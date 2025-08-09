// src/features/sharedPlace/model/useSharedPlaceList.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import api from "../../../lib/axios";
import {
  setSharedPlaces,
  resetSharedPlaces,
} from "../../../redux/slices/sharedPlaceSlice";

function pickArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  // 흔한 케이스 순회
  for (const k of [
    "sharedPlaces",
    "data",
    "content",
    "items",
    "list",
    "results",
  ]) {
    if (Array.isArray(data[k])) return data[k];
  }
  // 객체 안의 첫 번째 배열 아무거나
  for (const v of Object.values(data)) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

export default function useSharedPlaceList(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    const rid = Number(
      typeof roomId === "object" && roomId !== null
        ? roomId.id ?? roomId.roomId
        : roomId
    );
    if (!Number.isFinite(rid)) {
      console.warn("[useSharedPlaceList] invalid roomId:", roomId);
      return;
    }

    console.log("[useSharedPlaceList] rid =", rid);

    dispatch(resetSharedPlaces());

    let cancelled = false;

    (async () => {
      try {
        // 프록시 쓰면 `/api/rooms/${rid}/wants`
        const url = `/rooms/${rid}/wants`;
        console.log("[useSharedPlaceList] GET", url);
        const res = await api.get(url);
        console.log(
          "[useSharedPlaceList] res.status",
          res.status,
          "res.data:",
          res.data
        );

        const list = pickArray(res.data);
        console.log(
          "[useSharedPlaceList] parsed list length =",
          list.length,
          list
        );

        if (!cancelled) {
          dispatch(setSharedPlaces(list)); // 비어도 그대로 넣음(초기 상태 유지 목적이면 이대로 OK)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("공유된 장소 초기 로딩 실패:", err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, dispatch]);
}
