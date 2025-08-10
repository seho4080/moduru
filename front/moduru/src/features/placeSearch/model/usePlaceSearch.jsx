// src/features/placeSearch/model/usePlaceSearch.js
import { useState, useEffect, useRef } from "react";
import api from "../../../lib/axios";
import { dummyPlaces } from "./dummyPlaces";

const KOR_TO_CODE = {
  전체: "all",
  음식점: "restaurant",
  명소: "spot",
  축제: "festival",
};

const envUseDummy =
  String(import.meta.env?.VITE_USE_PLACE_DUMMY || "").toLowerCase() === "true";

export const usePlaceSearch = (roomId, selectedCategory, options = {}) => {
  const forceDummy = options.useDummy ?? envUseDummy; // 우선순위: 훅 옵션 > ENV
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
        // ✅ My 장소: 좋아요 목록(id 리스트) 가져온 뒤, 소스(더미 or all)에서 필터
        if (selectedCategory === "My 장소") {
          // 1) 좋아요 ID 목록
          const likedRes = await api.get(`/my-places`, {
            withCredentials: true,
          });
          const likedList = Array.isArray(likedRes.data) ? likedRes.data : [];
          const likedIds = new Set(
            likedList
              .map((v) => Number(v?.placeId ?? v?.id))
              .filter((n) => Number.isFinite(n))
          );

          if (reqSeq.current !== mySeq) return;

          if (likedIds.size === 0) {
            setPlaces([]);
            return;
          }

          // 2) 소스 리스트 준비
          let source = [];
          if (forceDummy) {
            source = dummyPlaces;
          } else {
            // 전체에서 골라내기 위해 all 호출
            const { data, status } = await api.get(`/places/${roomId}`, {
              params: { category: "all" },
            });
            if (reqSeq.current !== mySeq) return;
            source =
              status === 200 && Array.isArray(data?.places) ? data.places : [];
          }

          // 3) 교집합 필터
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

        // ✅ 일반 카테고리 (전체/음식점/명소/축제)
        // 강제 더미 모드
        if (forceDummy) {
          const cat = KOR_TO_CODE[selectedCategory] ?? "all";
          const source =
            cat === "all"
              ? dummyPlaces
              : dummyPlaces.filter((d) => d.category === cat);
          if (reqSeq.current === mySeq) setPlaces(source);
          return;
        }

        // API 모드
        const category = KOR_TO_CODE[selectedCategory] ?? "all";
        const { data, status } = await api.get(`/places/${roomId}`, {
          params: { category },
        });

        if (reqSeq.current !== mySeq) return;

        let list =
          status === 200 && Array.isArray(data?.places) ? data.places : [];

        // API가 비면 자동 폴백(더미)
        if (!list.length) {
          const source =
            category === "all"
              ? dummyPlaces
              : dummyPlaces.filter((d) => d.category === category);
          list = source;
        }

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

        // My 장소 에러 시엔 그냥 빈 배열
        if (selectedCategory === "My 장소") {
          setPlaces([]);
        } else {
          // 일반 카테고리 에러 → 더미 폴백
          const category = KOR_TO_CODE[selectedCategory] ?? "all";
          const source =
            category === "all"
              ? dummyPlaces
              : dummyPlaces.filter((d) => d.category === category);
          setPlaces(source);
        }
      } finally {
        if (reqSeq.current === mySeq) setLoading(false);
      }
    })();
  }, [roomId, selectedCategory, forceDummy]);

  return { places, loading };
};
