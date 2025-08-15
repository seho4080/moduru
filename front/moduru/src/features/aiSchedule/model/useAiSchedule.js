//aiSchedule/model/useAiSchedule.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { subscribeAiSchedule } from "../lib/aiScheduleSocket";
import {
  openAiModal,
  applyAiStatusStarted,
  applyAiStatusProgress,
  applyAiStatusDone,
  applyAiStatusError,
  applyAiStatusInvalidated,
  applyAiResult,
} from "../../../redux/slices/aiScheduleSlice";

/**
 * 상태/결과 소켓 구독 → Redux 반영
 * (모달 오픈은 이벤트 수신 시마다 보장)
 */
export default function useAiSchedule(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId) return;

    const off = subscribeAiSchedule(roomId, {
      onStatus: (msg) => {
        console.log("📩 [AI STATUS 수신]", msg); // 수신 로그
        const s = (msg?.status || "").toUpperCase();
        if (s === "STARTED") {
          dispatch(applyAiStatusStarted({ msg }));
          dispatch(openAiModal());
        } else if (s === "PROGRESS") {
          dispatch(applyAiStatusProgress({ msg }));
          dispatch(openAiModal());
        } else if (s === "DONE") {
          dispatch(applyAiStatusDone({ msg }));
          dispatch(openAiModal());
        } else if (s === "ERROR") {
          dispatch(applyAiStatusError({ msg }));
          dispatch(openAiModal());
        } else if (s === "INVALIDATED") {
          dispatch(applyAiStatusInvalidated({ msg }));
          dispatch(openAiModal());
        } else {
          // Unknown status: 무시하거나 로그 남기기
          // console.warn("[AI SCHEDULE] Unknown status:", msg);
        }
      },
      onResult: (msg) => {
        console.log("📩 [AI RESULT 수신]", msg); // 수신 로그
        dispatch(applyAiResult({ msg }));
        dispatch(openAiModal());
      },
    });

    return () => off();
  }, [roomId, dispatch]);
}
