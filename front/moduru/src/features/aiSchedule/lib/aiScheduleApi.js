// POST /rooms/{roomId}/ai-schedule
// body: { placeList: number[], days: number }
// 결과는 WebSocket(STATUS/RESULT)으로 수신

import api from "../../../lib/axios";

/**
 * @param {string|number} roomId
 * @param {number[]} placeList  // wantId 배열
 * @param {number} days         // (여행 종료 - 시작) + 1
 */
export async function requestAiSchedule(roomId, placeList, days) {
  if (!roomId) throw new Error("roomId is required");
  if (!Array.isArray(placeList)) throw new Error("placeList must be an array");
  if (typeof days !== "number") throw new Error("days must be a number");

  const url = `/rooms/${roomId}/ai-schedule`;
  await api.post(url, { placeList, days });
}
