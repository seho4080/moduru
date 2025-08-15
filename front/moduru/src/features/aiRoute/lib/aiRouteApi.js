// src/features/aiRoute/lib/aiRouteApi.js
import api from "../../../lib/axios";

/**
 * @param {string|number} roomId
 * @param {number[]} placeList  // 해당 일차의 wantId 배열
 * @param {number} dayNumber    // 몇 일차인지 (스펙상 키 이름은 day)
 * @returns {Promise<{ok:boolean, code:number, data?:any, message?:string}>}
 */
export async function requestAiRoute(roomId, placeList, dayNumber) {
  // 파라미터 검증
  if (!roomId) {
    return { ok: false, code: 0, message: "roomId is required" };
  }
  if (!Array.isArray(placeList)) {
    return { ok: false, code: 0, message: "placeList must be an array" };
  }
  if (!Number.isFinite(dayNumber)) {
    return { ok: false, code: 0, message: "day(dayNumber) must be a number" };
  }

  const url = `/rooms/${roomId}/ai-route`;
  const payload = {
    placeList: Array.from(
      new Set(placeList.map(Number).filter(Number.isFinite))
    ),
    day: Number(dayNumber),
  };

  try {
    // axios 인스턴스(401 자동 재발급/재시도) 사용
    const res = await api.post(url, payload);
    return {
      ok: true,
      code: res.status,
      data: res.data ?? null,
    };
  } catch (err) {
    const status = err?.response?.status ?? -1;
    const data = err?.response?.data;
    const message =
      data?.message ||
      (status === 409
        ? "이미 이 일차 작업이 진행 중입니다."
        : status === 400
        ? "요청 형식 오류입니다."
        : status === 429
        ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
        : err?.message || "AI 경로 요청에 실패했습니다.");
    return { ok: false, code: status, message, data };
  }
}
