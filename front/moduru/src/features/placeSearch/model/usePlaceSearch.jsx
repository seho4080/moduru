// src/features/placeSearch/model/usePlaceSearch.js
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../../lib/axios";
// import { dummyPlaces } from "./dummyPlaces"; // 더미 데이터 사용 주석 처리
import { selectRegionVersion } from "../../../redux/slices/tripRoomSlice";

const KOR_TO_CODE = {
  전체: "all",
  음식점: "restaurant",
  명소: "spot",
  축제: "festival",
};

const envUseDummy =
  String(import.meta.env?.VITE_USE_PLACE_DUMMY || "").toLowerCase() === "true";

export const usePlaceSearch = (roomId, selectedCategory, options = {}) => {
  const regionVersion = useSelector(selectRegionVersion);
  const forceDummy = options.useDummy ?? envUseDummy;
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const reqSeq = useRef(0);

  useEffect(() => {
    if (!roomId || !selectedCategory) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    const mySeq = ++reqSeq.current;
    setLoading(true);

    (async () => {
      try {
        // My 장소: 좋아요 목록(id 리스트) 기반 필터
        if (selectedCategory === "My 장소") {
          const likedRes = await api.get(`/my-places`, {
            withCredentials: true,
          });
          if (reqSeq.current !== mySeq) return;

          const likedList = Array.isArray(likedRes.data) ? likedRes.data : [];
          const likedIds = new Set(
            likedList
              .map((v) => Number(v?.placeId ?? v?.id))
              .filter((n) => Number.isFinite(n))
          );

          if (likedIds.size === 0) {
            setPlaces([]);
            return;
          }

          const { data, status } = await api.get(`/places/${roomId}`, {
            params: { category: "all" },
          });
          if (reqSeq.current !== mySeq) return;
          const source =
            status === 200 && Array.isArray(data?.places) ? data.places : [];

          const filtered = source.filter((p) =>
            likedIds.has(Number(p?.placeId ?? p?.id))
          );

          const patched = filtered.map((p) => ({
            ...p,
            placeId:
              typeof p.placeId === "number"
                ? p.placeId
                : Number(p.placeId ?? p.id),
            latitude:
              typeof p.latitude === "number" ? p.latitude : Number(p.latitude),
            longitude:
              typeof p.longitude === "number"
                ? p.longitude
                : Number(p.longitude),
          }));

          setPlaces(patched);
          return;
        }

        const category = KOR_TO_CODE[selectedCategory] ?? "all";
        const { data, status } = await api.get(`/places/${roomId}`, {
          params: { category },
        });
        if (reqSeq.current !== mySeq) return;

        let list =
          status === 200 && Array.isArray(data?.places) ? data.places : [];

        // API 비었을 때 더미 폴백
        // if (!list.length) {
        //   const source =
        //     category === "all"
        //       ? dummyPlaces
        //       : dummyPlaces.filter((d) => d.category === category);
        //   list = source;
        // }

        const patched = list.map((p) => ({
          ...p,
          placeId:
            typeof p.placeId === "number"
              ? p.placeId
              : Number(p.placeId ?? p.id),
          latitude:
            typeof p.latitude === "number" ? p.latitude : Number(p.latitude),
          longitude:
            typeof p.longitude === "number" ? p.longitude : Number(p.longitude),
        }));

        setPlaces(patched);
      } catch (e) {
        if (reqSeq.current !== mySeq) return;

        if (selectedCategory === "My 장소") {
          setPlaces([]);
        } else {
          // const category = KOR_TO_CODE[selectedCategory] ?? "all";
          // const source =
          //   category === "all"
          //     ? dummyPlaces
          //     : dummyPlaces.filter((d) => d.category === category);
          // setPlaces(source);
          setPlaces([]);
        }
      } finally {
        if (reqSeq.current === mySeq) setLoading(false);
      }
    })();
  }, [roomId, selectedCategory, forceDummy, regionVersion]);

  return { places, loading };
};
