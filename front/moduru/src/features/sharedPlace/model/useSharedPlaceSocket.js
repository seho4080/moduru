// src/features/sharedPlace/model/useSharedPlaceSocket.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { connectWebSocket } from "../../webSocket/socket";
import {
  addSharedPlace,
  removeSharedPlace,
} from "../../../redux/slices/sharedPlaceSlice";

export default function useSharedPlaceSocket(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId) {
      console.warn("[useSharedPlaceSocket] roomId 없음, 구독 생략");
      return;
    }
    console.log("[useSharedPlaceSocket] mount, roomId:", roomId);

    connectWebSocket(roomId, [
      {
        handler: "place-want",
        action: "add",
        callback: (message) => {
          console.log("[WS add] msg:", message);
          // slice가 정규화/업서트 처리
          dispatch(addSharedPlace(message));
        },
      },
      {
        handler: "place-want",
        action: "remove",
        callback: (message) => {
          const key = message?.wantId ?? message?.id ?? message?.placeId;
          if (key == null) {
            console.warn("[WS remove] key 없음, skip:", message);
            return;
          }
          console.log("[WS remove] key:", key);
          dispatch(removeSharedPlace(Number(key)));
        },
      },
    ]);
  }, [roomId, dispatch]);
}
