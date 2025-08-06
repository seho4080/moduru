import { useEffect } from "react";
import { connectWebSocket, publishMessage } from "./socket";
import { useDispatch } from "react-redux";
import { addPin, removePin } from "../../redux/slices/pinSlice";

/**
 * WebSocket 수신 처리용 Hook (장소 공유용 place-want 핸들러)
 */
export const usePlaceSocket = (roomId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId) return;

    connectWebSocket(roomId, [
      {
        handler: "place-want",
        action: "add",
        callback: (message) => {
          const {
            type,
            id,
            roomId: msgRoomId,
            wantId,
            senderId,
            category,
            lat,
            lng,
            imgUrl,
            isVoted,
            voteCnt,
          } = message;

          dispatch(
            addPin({
              type,
              id,
              roomId: msgRoomId,
              wantId,
              senderId,
              category,
              lat,
              lng,
              imgUrl,
              isVoted,
              voteCnt,
            })
          );
        },
      },
      {
        handler: "place-want",
        action: "remove",
        callback: (message) => {
          const { wantId, roomId: msgRoomId } = message;

          dispatch(removePin({ wantId, roomId: msgRoomId }));
        },
      },
    ]);
  }, [roomId, dispatch]);
};

/**
 * WebSocket 송신 함수 (add/remove)
 * @param {object} params
 * @param {"add" | "remove"} params.action - 동작 종류
 * @param {string} [params.type] - 핀 유형 (place | custom) - add 전용
 * @param {number} [params.id] - 장소 ID 또는 custom 핀 ID - add 전용
 * @param {number} params.roomId - 방 ID
 * @param {number} [params.wantId] - 제거 대상의 wantId - remove 전용
 */
export const sendPlaceMessage = ({ action, type, id, roomId, wantId }) => {
  if (!roomId || !action) {
    console.warn("roomId 또는 action 누락");
    return;
  }

  if (action === "add") {
    if (!type || !id) {
      console.warn("add 동작에는 type과 id가 필요합니다.");
      return;
    }

    publishMessage(roomId, "place-want", "add", {
      type,
      id,
      roomId,
    });
  }

  if (action === "remove") {
    if (!wantId) {
      console.warn("remove 동작에는 wantId가 필요합니다.");
      return;
    }

    publishMessage(roomId, "place-want", "remove", {
      wantId,
      roomId,
    });
  }
};
