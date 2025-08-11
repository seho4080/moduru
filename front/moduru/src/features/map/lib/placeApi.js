// src/features/map/lib/placeApi.js
import axios from "../../../lib/axios";

/** 카카오 키워드 장소 검색 */
export async function searchKakaoPlaces(keyword) {
  try {
    const res = await axios.get("/kakao/search", { params: { keyword } });
    console.log("[kakao/search 응답]", { keyword, data: res.data });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("[kakao/search 에러]", { keyword, status, data });
    return [];
  }
}

/** 커스텀 장소 등록 (쿠키 인증) */
export async function createCustomPlace({ roomId, name, lat, lng, address }) {
  const payload = {
    roomId: Number(roomId),
    name: String(name ?? "").trim(),
    lat: typeof lat === "number" ? lat : Number(lat),
    lng: typeof lng === "number" ? lng : Number(lng),
    address: address ? String(address) : "",
  };
  console.log("[createCustomPlace 요청]", payload);

  try {
    const res = await axios.post("/rooms/custom-place", payload);
    console.log("[createCustomPlace 성공]", res.status, res.data);
    return { success: true, data: res.data, status: res.status };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("❌ [createCustomPlace 실패]", { status, data });
    const message =
      data?.message ||
      (status === 404
        ? "해당 roomId에 해당하는 여행 방이 없습니다."
        : status === 400
        ? "요청 데이터가 올바르지 않습니다."
        : status === 401
        ? "인증이 필요합니다. 로그인 상태를 확인하세요."
        : "서버 내부 오류가 발생했습니다.");
    return { success: false, status, message };
  }
}
