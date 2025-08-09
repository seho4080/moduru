import { useState, useEffect } from "react";
import api from '../../../lib/axios';


// NOTE: 서버에서 허용하는 카테고리 매핑
const categoryMap = {
  전체: "all",
  음식점: "restaurant",
  명소: "spot",
  축제: "festival",
};

// export const usePlaceSearch = (roomId, selectedCategory) => {
//   const [places, setPlaces] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchPlaces = async () => {
//       if (!roomId || !selectedCategory) return;

//       setLoading(true);

//       try {
//         const categoryCode = categoryMap[selectedCategory];
//         const url = `http://localhost:8080/places/${roomId}?category=${categoryCode}`;

//         const res = await fetch(url, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           credentials: "include", // 쿠키 전송을 위해 필수
//         });

//         const raw = await res.text();
//         console.log("[응답 상태]", res.status);
//         console.log("[응답 원문]", raw);

//         if (res.status === 404) {
//           console.warn("해당 카테고리에 매핑된 장소가 없습니다.");
//           setPlaces([]);
//           return;
//         }

//         if (!res.ok) {
//           throw new Error(`API 요청 실패 (status ${res.status})`);
//         }

//         const data = JSON.parse(raw);
//         const rawPlaces = Array.isArray(data.places) ? data.places : [];

//         const filteredPlaces =
//           categoryCode === "all"
//             ? rawPlaces
//             : rawPlaces.filter(
//                 (place) => place.category?.trim() === selectedCategory
//               );

//         setPlaces(filteredPlaces);
//       } catch (err) {
//         console.error("장소 API 호출 실패:", err.message);
//         setPlaces([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPlaces();
//   }, [roomId, selectedCategory]);

//   return { places, loading };
// };


export const usePlaceSearch = (roomId, selectedCategory) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController(); // 최신 요청만 반영
    const fetchPlaces = async () => {
      if (!roomId || !selectedCategory) {
        setPlaces([]);
        setLoading(false);   // ✅ early return 시 로딩 해제
        return;
      }

      setLoading(true);

      try {
        const categoryCode = categoryMap[selectedCategory];
        if (!categoryCode) {
          // 매핑 안 되면 빈 리스트로
          setPlaces([]);
          return;
        }

        const res = await api.get(`/places/${roomId}`, {
          params: { category: categoryCode },
          withCredentials: true,
          // useToken: true, // 필요하면 켜기
          signal: controller.signal, // ✅ 취소 신호
        });

        const rawPlaces = Array.isArray(res.data?.places) ? res.data.places : [];

        // 서버가 이미 category=...로 필터해서 주는 경우가 대부분이므로
        // 'all'이면 그대로, 아니면 혹시 몰라서 categoryCode로 한 번 더 필터
        const filtered =
          categoryCode === "all"
            ? rawPlaces
            : rawPlaces.filter((p) => p.category?.trim() === categoryCode); // ✅ 여기!

        setPlaces(filtered);
      } catch (err) {
        if (controller.signal.aborted) return; // 최신 요청만 반영
        if (err.response?.status === 404) {
          console.warn("해당 카테고리에 매핑된 장소가 없습니다.");
          setPlaces([]);
        } else {
          console.error("장소 API 호출 실패:", err.response?.data?.message || err.message);
          setPlaces([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchPlaces();
    return () => controller.abort(); // 언마운트/변경 시 이전 요청 취소
  }, [roomId, selectedCategory]);

  return { places, loading };
};
