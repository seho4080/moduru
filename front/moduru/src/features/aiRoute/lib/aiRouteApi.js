import api from "../../../lib/axios";
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";

const HANDLER = "ai-route";

/**
 * 스냅샷(현재 상태) 조회
 * GET /rooms/{roomId}/ai-route/snapshot
 * 응답 예:
 * {
 *   "roomId": 42,
 *   "status": "STARTED"|"PROGRESS"|"DONE"|"ERROR"|"INVALIDATED"|"IDLE",
 *   "jobId": "uuid",
 *   "progress": 0,
 *   "message": "string",
 *   "reason": "string",
 *   "updatedAt": "2025-08-16T22:11:20.257Z",
 *   "result": {...} // DONE일 때만 존재할 수 있음
 * }
 */
export async function getAiRouteSnapshot(roomId) {
  if (!roomId) {
    const e = new Error("roomId is required");
    e.code = "AI_ROUTE_BAD_PARAM";
    throw e;
  }
  const url = `/rooms/${roomId}/ai-route/snapshot`;
  try {
    const res = await api.get(url, {
      headers: { "Cache-Control": "no-store" },
    });
    return { ok: true, data: res.data };
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const message =
      body?.message ||
      body?.error ||
      err?.message ||
      "스냅샷 조회에 실패했습니다.";
    const e = new Error(message);
    e.status = status ?? -1;
    e.payload = body ?? null;
    throw e;
  }
}

/**
 * AI 경로 추천 트리거
 * - 409(진행중)는 예외로 던지지 않고, 스냅샷을 즉시 조회해 soft-success로 돌려줍니다.
 *
 * @param {string|number} roomId
 * @param {number[]} placeList  // 해당 일차의 wantId 배열
 * @param {number} day          // 몇 일차인지
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<{ok: true, data?: any, resumed?: true, snapshot?: any}>}
 */
export async function requestAiRoute(roomId, placeList, day, opts = {}) {
  console.log('requestAiRoute called:', { roomId, placeList, day, opts });
  // 파라미터 검증
  if (!roomId) throw new Error("roomId is required");
  if (!Array.isArray(placeList)) throw new Error("placeList must be an array");
  if (!Number.isFinite(day)) throw new Error("day must be a number");

  const url = `/rooms/${roomId}/ai-route`;
  const payload = {
    placeList: Array.from(
      new Set(placeList.map(Number).filter(Number.isFinite))
    ),
    day: Number(day),
    ...opts,
  };
  console.log('AI Route API request:', { url, payload });

  try {
    const res = await api.post(url, payload);
    // 정상 수락 (상태/결과는 소켓으로 들어옴)
    return { ok: true, data: res.data };
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const message =
      body?.message || body?.error || err?.message || "요청이 거절되었습니다.";

    // ✅ 409(진행중): 스냅샷을 조회해서 soft-success 로 전환
    if (status === 409) {
      try {
        const snapRes = await getAiRouteSnapshot(roomId);
        return { ok: true, resumed: true, snapshot: snapRes.data };
      } catch {
        const e = new Error(message);
        e.code = "AI_ROUTE_CONFLICT";
        e.status = 409;
        e.payload = body || null;
        throw e;
      }
    }

    // 400 Bad Request
    if (status === 400) {
      const e = new Error(message);
      e.code = "AI_ROUTE_BAD_REQUEST";
      e.status = 400;
      e.payload = body || null;
      throw e;
    }

    // 401 Unauthorized
    if (status === 401) {
      const e = new Error("인증이 필요합니다.");
      e.code = "AI_ROUTE_UNAUTHORIZED";
      e.status = 401;
      throw e;
    }

    // 5xx
    if (status >= 500) {
      const e = new Error(
        "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
      e.code = "AI_ROUTE_SERVER_ERROR";
      e.status = status;
      throw e;
    }

    // 그 외는 원본 에러 rethrow
    throw err;
  }
}

/** 진행중 판단 유틸 */
export function isAiRouteBusy(status) {
  const s = String(status || "").toUpperCase();
  return s === "STARTED" || s === "PROGRESS";
}

/**
 * WebSocket 구독 (상태/결과)
 * topics:
 *  - /topic/room/{roomId}/ai-route/status
 *  - /topic/room/{roomId}/ai-route/result
 *
 * @param {string|number} roomId
 * @param {{ onStatus?:(msg:any)=>void, onResult?:(msg:any)=>void, keyPrefix?: string }} handlers
 * @returns {() => void} cleanup
 */
export function subscribeAiRoute(roomId, handlers = {}) {
  if (!roomId) return () => {};

  const makeTopic = (action) => `/topic/room/${roomId}/${HANDLER}/${action}`;
  const makeKey = (action) =>
    (handlers.keyPrefix ? `${handlers.keyPrefix}|` : "") +
    `${roomId}|${makeTopic(action)}`;

  const subs = [];

  if (handlers.onStatus) {
    subs.push({
      handler: HANDLER,
      action: "status",
      topic: makeTopic("status"),
      callback: handlers.onStatus,
      key: makeKey("status"),
    });
  }

  if (handlers.onResult) {
    subs.push({
      handler: HANDLER,
      action: "result",
      topic: makeTopic("result"),
      callback: handlers.onResult,
      key: makeKey("result"),
    });
  }

  if (subs.length) connectWebSocket(roomId, subs);

  return () => {
    unsubscribeKeys(subs.map((s) => s.key));
  };
}
