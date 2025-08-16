// src/features/myLikedPlace/lib/likedPlaceApi.js
import api from "../../../lib/axios";

/**
 * 내가 좋아요한 장소 목록 조회
 * @param {Object} [opts]
 * @param {number} [opts.region]   - 선택 시 해당 지역만 필터링
 * @param {boolean} [opts.useToken=false] - 토큰 헤더를 쓸지 여부(쿠키 세션만이면 false)
 * @returns {Promise<Array<{
 *   placeId:number, placeName:string, placeImg:string,
 *   categoryId:number, category:string, address:string,
 *   latitude:number, longitude:number, isLiked:boolean, isWanted:boolean
 * }>>}
 */
export async function fetchMyLikedPlacesApi({ region, useToken = false } = {}) {
  const res = await api.get("/my-places", {
    withCredentials: true, // 쿠키 세션 유지
    useToken,              // 필요 시만 토큰 헤더 포함
    params: region != null ? { region } : undefined,
    headers: { Accept: "*/*" },
  });

  // 응답이 배열 또는 { data: [...] } 형태 모두 대응
  const list = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];

  // 필드 정규화(빈값 방어)
  return (list || []).map((it) => ({
    placeId: it.placeId ?? it.id ?? 0,
    placeName: it.placeName ?? "",
    placeImg: it.placeImg ?? "",
    categoryId: it.categoryId ?? 0,
    category: it.category ?? "",
    address: it.address ?? "",
    latitude: it.latitude ?? 0,
    longitude: it.longitude ?? 0,
    isLiked: Boolean(it.isLiked),
    isWanted: Boolean(it.isWanted),
  }));
}


