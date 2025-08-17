// src/features/placeVote/lib/placeVoteApi.js
import api from "../../../lib/axios";

/** 투표 토글 요청: /rooms/{roomId}/votes/{wantId} */
export async function postPlaceVote(roomId, wantId) {
  if (!roomId || !wantId) throw new Error("roomId/wantId is required");
  return api.post(`/rooms/${roomId}/votes/${wantId}`);
}