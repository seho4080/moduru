// NOTE: 키워드 기반 장소 검색 API
import api from "../../../lib/axios";

/**
 * POST /places/search/{roomId}
 * body: { keyword: string }
 */
export async function searchPlacesByKeyword(roomId, keyword) {
  if (!roomId && roomId !== 0) {
    return { success: false, status: 400, error: "roomId가 필요합니다.", places: [] };
  }
  const kw = String(keyword ?? "").trim();
  if (!kw.length) {
    return { success: false, status: 400, error: "keyword가 비어 있습니다.", places: [] };
  }

  const url = `/places/search/${roomId}`;
  try {
    const res = await api.post(
      url,
      { keyword: kw },
      {
        withCredentials: true,
        useToken: true,
      }
    );

    const raw = res?.data;
    const places = Array.isArray(raw?.places) ? raw.places : [];

    // NOTE: 안정화: placeId 누락/중첩 방어
    const normalized = places.map((p, idx) => ({
      ...p,
      placeId: typeof p.placeId === "object" ? p.placeId?.placeId : p.placeId ?? p.id ?? idx,
    }));

    return { success: true, status: res?.status ?? 200, places: normalized };
  } catch (e) {
    const status = e?.response?.status ?? 500;
    const error =
      status === 401
        ? "인증 실패 (토큰 누락/만료)"
        : status === 404
        ? "해당 조건의 장소가 없습니다."
        : "서버 내부 오류";
    return { success: false, status, error, places: [] };
  }
}
