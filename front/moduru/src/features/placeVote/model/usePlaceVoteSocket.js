// src/features/placeVote/model/usePlaceVoteSocket.js
import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";
import { updateVoteState } from "../../../redux/slices/sharedPlaceSlice";

export default function usePlaceVoteSocket(roomId) {
  const dispatch = useDispatch();

  console.log("[usePlaceVoteSocket] 호출됨, roomId:", roomId);

  const subKeys = useMemo(() => {
    if (!roomId) return [];
    return [
      `${roomId}|/topic/room/${roomId}/place-vote`,
    ];
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      console.log("[usePlaceVoteSocket] roomId 없음, 구독 생략");
      return;
    }

    console.log("[usePlaceVoteSocket] WebSocket 구독 시작, roomId:", roomId);
    connectWebSocket(roomId, [
      // 1) 방 전체 브로드캐스트 (voteCnt만)
      {
        handler: "place-vote",
        callback: (msg) => {
          // { wantId or wantPlaceId, voteCnt, receiverId? }
          const wantId = msg.wantId ?? msg.wantPlaceId;
          const { voteCnt } = msg;
          if (wantId == null) return;
          console.log("[WebSocket] 브로드캐스트 수신:", { wantId, voteCnt });
          dispatch(updateVoteState({ wantId, voteCnt }));
        },
      },
    ]);

    return () => {
      if (subKeys.length) {
        console.log("[usePlaceVoteSocket] 구독 해제:", subKeys);
        unsubscribeKeys?.(subKeys);
      }
    };
  }, [roomId, subKeys, dispatch]);
}
