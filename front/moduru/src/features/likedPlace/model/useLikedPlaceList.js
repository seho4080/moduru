// src/features/likedPlace/model/useLikedPlaceList.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../../lib/axios";
import {
  setLikes,
  selectLikedPlaces,
} from "../../../redux/slices/likedPlaceSlice";

export default function useLikedPlaceList() {
  const dispatch = useDispatch();
  const likedPlaces = useSelector(selectLikedPlaces);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 서버 스펙: GET /my-places → [{...}] 또는 { places: [...] }
        const { data, status } = await api.get("/my-places", {
          withCredentials: true,
        });
        if (status !== 200) return;
        const list = Array.isArray(data?.places)
          ? data.places
          : Array.isArray(data)
          ? data
          : [];
        if (!alive) return;
        dispatch(setLikes(list));
      } catch (e) {
        console.error("내 장소 초기 로딩 실패:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dispatch]);

  return likedPlaces; // 컴포넌트에서 바로 사용 가능
}
