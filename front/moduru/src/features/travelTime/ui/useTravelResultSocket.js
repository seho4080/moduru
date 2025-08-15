import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  subscribeTravel,
  getLastRequestedTransport,
} from "../../webSocket/travelSocket";
import { upsertDayEtas, upsertDayTotals } from "../../../redux/slices/etaSlice";

/**
 * /topic/room/{roomId}/travel/result 수신
 * - transport가 null이어도 처리 (마지막 요청 모드 fallback)
 * - legs가 없고 totals만 있어도 저장
 * - driver → driving 정규화
 */
export default function useTravelResultSocket(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId) return;

    const off = subscribeTravel(
      roomId,
      (body) => {
        if (!body) return;

        let {
          day,
          transport,
          totalDistanceMeters,
          totalDurationMinutes,
          legs,
          updatedAt,
          // 후보 키들
          mode,
          transportType,
          requestedTransport,
          fallbackTransport,
        } = body;

        if (!day) return;
        const dayNum = Number(day);
        if (!Number.isFinite(dayNum)) return;

        const pick = (...vals) =>
          vals.find((v) => typeof v === "string" && v.length > 0) || null;

        let t =
          pick(
            transport,
            mode,
            transportType,
            fallbackTransport,
            requestedTransport
          ) ||
          getLastRequestedTransport(roomId, dayNum) ||
          "transit";

        t = String(t).toLowerCase();
        if (t === "driver") t = "driving";

        if (Array.isArray(legs) && legs.length > 0) {
          const items = legs.map((l) => ({
            fromWantId: Number(l.fromWantId ?? l.fromId),
            toWantId: Number(l.toWantId ?? l.toId),
            distanceMeters: Number(l.distanceMeters ?? l.distance ?? 0),
            durationMinutes: Number(l.durationMinutes ?? l.duration ?? 0),
            updatedAt: l.updatedAt ?? updatedAt,
          }));
          dispatch(upsertDayEtas({ day: dayNum, transport: t, items }));
        }

        if (
          typeof totalDistanceMeters === "number" &&
          typeof totalDurationMinutes === "number"
        ) {
          dispatch(
            upsertDayTotals({
              day: dayNum,
              transport: t,
              totalDistanceMeters,
              totalDurationMinutes,
              updatedAt,
            })
          );
        }
      },
      { key: "travel-result/main" }
    );

    return off;
  }, [roomId, dispatch]);
}
