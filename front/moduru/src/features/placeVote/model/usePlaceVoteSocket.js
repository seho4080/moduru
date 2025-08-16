// src/features/placeVote/model/usePlaceVoteSocket.js
import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";
import { upsertVoteState } from "../../../redux/slices/placeVoteSlice";

export default function usePlaceVoteSocket(roomId) {
  const dispatch = useDispatch();

  const subKeys = useMemo(() => {
    if (!roomId) return [];
    return [
      `${roomId}|/topic/room/${roomId}/place-vote`,
      `${roomId}|/user/queue/place-vote`,
    ];
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    connectWebSocket(roomId, [
      // 1) 방 전체 브로드캐스트
      {
        dest: `/topic/room/${roomId}/place-vote`,
        callback: (msg) => {
          // { wantId or wantPlaceId, voteCnt, receiverId? }
          const wantId = msg.wantId ?? msg.wantPlaceId;
          const { voteCnt } = msg;
          if (wantId == null) return;
          dispatch(upsertVoteState({ wantId, voteCnt }));
        },
      },
      // 2) 개인 큐 (서버 convertAndSendToUser)
      {
        dest: `/user/queue/place-vote`,
        // 또는 personal: "place-vote" 만 넘겨도 됨
        // personal: "place-vote",
        callback: (msg) => {
          // { roomId, wantId, isVoted, receiverId }
          const wantId = msg.wantId ?? msg.wantPlaceId;
          const { isVoted } = msg;
          if (wantId == null) return;
          dispatch(upsertVoteState({ wantId, isVoted }));
        },
      },
    ]);

    return () => {
      if (subKeys.length) unsubscribeKeys?.(subKeys);
    };
  }, [roomId, subKeys, dispatch]);
}
