import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { subscribeSchedule } from "@/features/webSocket/scheduleSocket";
import { replaceDayFromServer } from "@/redux/slices/itinerarySlice";

export default function useScheduleBroadcast(roomId) {
  const dispatch = useDispatch();
  useEffect(() => {
    if (!roomId) return;
    return subscribeSchedule(
      roomId,
      (msg) => {
        // 권장 프로토콜: type으로 분기
        const t = (msg?.type || "").toUpperCase();

        // 서버가 완성된 하루 events를 방송해줄 때:
        if (
          t === "CHANGED" ||
          t === "REPLACE_DAY" ||
          t === "UPDATE_ORDER_APPLIED"
        ) {
          // payload 예: { roomId, dateKey, events: [...] }
          dispatch(
            replaceDayFromServer({
              dateKey: msg.dateKey,
              events: msg.events || [],
            })
          );
        }

        // 서버가 type 없이 항상 {dateKey, events}만 쏘면:
        if (!t && msg?.dateKey && Array.isArray(msg?.events)) {
          dispatch(
            replaceDayFromServer({ dateKey: msg.dateKey, events: msg.events })
          );
        }
      },
      { key: "itinerary-broadcast" }
    );
  }, [roomId, dispatch]);
}
