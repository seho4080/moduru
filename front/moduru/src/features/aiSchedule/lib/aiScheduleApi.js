// ============================================================================
// 3. API: src/features/aiSchedule/lib/aiScheduleApi.js
// ============================================================================

import api from "../../../lib/axios";

/**
 * AI 일정 추천 트리거
 * @param {string|number} roomId
 * @param {number[]} placeList  // wantId 배열
 * @param {number} days         // (여행 종료 - 시작) + 1
 * @param {{ force?: boolean }} [opts]  // 서버가 지원하면 강제옵션 등 확장
 */
export async function requestAiSchedule(roomId, placeList, days, opts = {}) {
  console.log("🚀 [AI API] Starting request:", {
    roomId,
    placeList,
    days,
    opts,
  });

  if (!roomId) {
    console.error("❌ [AI API] roomId is required");
    throw new Error("roomId is required");
  }
  if (!Array.isArray(placeList)) {
    console.error(
      "❌ [AI API] placeList must be an array, got:",
      typeof placeList
    );
    throw new Error("placeList must be an array");
  }
  if (typeof days !== "number") {
    console.error("❌ [AI API] days must be a number, got:", typeof days);
    throw new Error("days must be a number");
  }

  if (placeList.length === 0) {
    console.warn("⚠️ [AI API] placeList is empty");
  }

  const url = `/rooms/${roomId}/ai-schedule`;
  const payload = { placeList, days, ...opts };

  console.log("📤 [AI API] Sending request to:", url, "with payload:", payload);

  try {
    const response = await api.post(url, payload);
    console.log("✅ [AI API] Request successful:", response.data);

    // 성공 시: STATUS/RESULT는 WebSocket으로 들어옴 (화면은 소켓 구독 훅이 처리)
    return { ok: true, data: response.data };
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const message =
      body?.message || body?.error || err?.message || "요청이 거절되었습니다.";

    console.error("💥 [AI API] Request failed:", {
      status,
      message,
      body,
      url,
      payload,
    });

    // 서버에서 '진행중 충돌' 같은 상황을 409로 주는 경우가 많음
    if (status === 409) {
      console.warn("⚠️ [AI API] Conflict detected (409):", body);
      const e = new Error(message);
      e.code = "AI_SCHEDULE_CONFLICT";
      e.status = 409;
      e.payload = body || null; // { currentJobId, reason } 등 있으면 여기에
      throw e;
    }

    // 400 Bad Request
    if (status === 400) {
      console.error("❌ [AI API] Bad Request (400):", body);
      const e = new Error(message);
      e.code = "AI_SCHEDULE_BAD_REQUEST";
      e.status = 400;
      e.payload = body || null;
      throw e;
    }

    // 401 Unauthorized
    if (status === 401) {
      console.error("🔒 [AI API] Unauthorized (401):", body);
      const e = new Error("인증이 필요합니다.");
      e.code = "AI_SCHEDULE_UNAUTHORIZED";
      e.status = 401;
      throw e;
    }

    // 500 Internal Server Error
    if (status >= 500) {
      console.error("🔥 [AI API] Server Error (5xx):", body);
      const e = new Error(
        "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
      e.code = "AI_SCHEDULE_SERVER_ERROR";
      e.status = status;
      throw e;
    }

    throw err;
  }
}
