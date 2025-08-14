// src/features/travelTime/ui/useTravelResultSocket.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { subscribeTravel } from "../../webSocket/travelSocket";
import { upsertDayEtas, upsertDayTotals } from "../../../redux/slices/etaSlice";

export default function useTravelResultSocket(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId) return;

    const off = subscribeTravel(
      roomId,
      (body) => {
        if (!body) return;
        const {
          day,
          transport, // "driving" | "transit" | "walking"
          totalDistanceMeters,
          totalDurationMinutes,
          legs,
          updatedAt,
        } = body;

        if (!day || !transport || !Array.isArray(legs)) return;

        const items = legs.map((l) => ({
          fromWantId: Number(l.fromWantId),
          toWantId: Number(l.toWantId),
          distanceMeters: Number(l.distanceMeters),
          durationMinutes: Number(l.durationMinutes),
        }));
        dispatch(upsertDayEtas({ day, transport, items }));

        if (
          typeof totalDistanceMeters === "number" &&
          typeof totalDurationMinutes === "number"
        ) {
          dispatch(
            upsertDayTotals({
              day,
              transport,
              totalDistanceMeters,
              totalDurationMinutes,
              updatedAt,
            })
          );
        }
      },
      { key: "travel-result/main" } // ✅ 중복 방지용 key
    );

    return off;
  }, [roomId, dispatch]);
}
