// src/features/sharedPlace/model/useSharedPlaceList.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import api from "../../../lib/axios";
import {
  setSharedPlaces,
  resetSharedPlaces,
} from "../../../redux/slices/sharedPlaceSlice";

// 디버그 로그 토글 (원하면 false로 꺼도 됨)
const DEBUG_VOTE = true;

function pickArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const k of ["sharedPlaces", "data", "content", "items", "list", "results"]) {
    if (Array.isArray(data[k])) return data[k];
  }
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
        // axios 인스턴스가 /api baseURL이면 아래처럼 /rooms/... 만 써도 됨
        const url = `/rooms/${rid}/wants`;
        console.log("[useSharedPlaceList] GET", url);
        const res = await api.get(url);
        console.log("[useSharedPlaceList] res.status", res.status, "res.data:", res.data);

        const list = pickArray(res.data);
        console.log("[useSharedPlaceList] parsed list length =", list.length, list);

        if (DEBUG_VOTE) {
          list.forEach((item, index) => {
            console.log(`[useSharedPlaceList] item ${index}:`, {
              wantId: item?.wantId,
              placeName: item?.placeName,
              isVoted: item?.isVoted,
              voteCnt: item?.voteCnt,
              raw: item,
            });
          });
        }

        if (!cancelled) {
          dispatch(setSharedPlaces(list));
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