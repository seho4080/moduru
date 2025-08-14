// src/features/sharedPlace/lib/sharedPlaceSocket.js
import { publishMessage } from "../../webSocket/coreSocket";

/** 장소 공유 추가 */
export function sendSharedPlaceAdd({ roomId, type, id }) {
  if (!roomId || !type || id == null) {
    console.warn("⚠️ sendSharedPlaceAdd 파라미터 누락");
    return;
  }
  publishMessage(roomId, "place-want", "add", { roomId, type, id });
}

/** 장소 공유 제거 */
export function sendSharedPlaceRemove({ roomId, wantId }) {
  if (!roomId || wantId == null) {
    console.warn("⚠️ sendSharedPlaceRemove 파라미터 누락");
    return;
  }
  publishMessage(roomId, "place-want", "remove", { roomId, wantId });
}
