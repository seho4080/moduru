// src/features/sharedPlace/model/useSharedPlaceSocket.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { connectWebSocket } from "../../webSocket/coreSocket";
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

    connectWebSocket(roomId, [
      {
        handler: "place-want",
        action: "add",
        callback: (message) => {
          dispatch(addSharedPlace(message));
        },
        key: "shared-place/add",
      },
      {
        handler: "place-want",
        action: "remove",
        callback: (message) => {
          const key = message?.wantId ?? message?.id ?? message?.placeId;
          if (key == null) return;
          dispatch(removeSharedPlace(Number(key)));
        },
        key: "shared-place/remove",
      },
    ]);
  }, [roomId, dispatch]);
}
