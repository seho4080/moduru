import { useEffect, useRef, useState } from "react";
import { subscribeTravelStatus } from "../../webSocket/travelStatusSocket";

/**
 * 날짜 배열 단위로 계산 상태/에러/타임아웃을 관리
 * - /topic/room/{roomId}/travel/status (단일 토픽) 구독
 * - STARTED / ALREADY_RUNNING / DONE / FAILED 처리
 * - ✅ result가 왔는데 DONE이 안 오는 서버를 위한 보조 API: markResolvedFromResult
 */
export default function useCalcStatusByDate(
  roomId,
  dates,
  { notify, timeoutMs = 30000 } = {}
) {
  const [loadingByDate, setLoadingByDate] = useState({});
  const [errorByDate, setErrorByDate] = useState({});
  const timersRef = useRef({}); // { [dateKey]: timeoutId }

  // payload(day 또는 date)로 dateKey를 찾아낸다.
  const resolveDateKey = (payload) => {
    const dateStr = payload?.date;
    if (dateStr && dates.includes(dateStr)) return dateStr;
    const dayNum = Number(payload?.day);
    if (Number.isFinite(dayNum) && dayNum > 0 && dayNum <= dates.length) {
      return dates[dayNum - 1];
    }
    return null;
  };

  // dates 변경 시 상태/타이머 정리
  useEffect(() => {
    setLoadingByDate((prev) => {
      const next = {};
      dates.forEach((dk) => (next[dk] = !!prev[dk]));
      return next;
    });
    setErrorByDate((prev) => {
      const next = {};
      dates.forEach((dk) => (next[dk] = prev[dk] ?? null));
      return next;
    });

    const live = new Set(dates);
    Object.keys(timersRef.current).forEach((dk) => {
      if (!live.has(dk)) {
        clearTimeout(timersRef.current[dk]);
        delete timersRef.current[dk];
      }
    });
  }, [dates]);

  const startTimeout = (dateKey, ms = timeoutMs) => {
    const prev = timersRef.current[dateKey];
    if (prev) clearTimeout(prev);
    timersRef.current[dateKey] = setTimeout(() => {
      setLoadingByDate((p) => ({ ...p, [dateKey]: false }));
      setErrorByDate((p) => ({ ...p, [dateKey]: "계산 시간 초과입니다." }));
      delete timersRef.current[dateKey];
    }, ms);
  };

  const clearTimeoutFor = (dateKey) => {
    const t = timersRef.current[dateKey];
    if (t) {
      clearTimeout(t);
      delete timersRef.current[dateKey];
    }
  };

  // 버튼 클릭 직후 낙관적 로딩 시작 (STARTED 지연 대비)
  const markOwnRequestAndStart = (dateKey) => {
    setLoadingByDate((p) => ({ ...p, [dateKey]: true }));
    setErrorByDate((p) => ({ ...p, [dateKey]: null }));
    startTimeout(dateKey);
  };

  // ✅ result 수신만으로도 로딩 종료 (DONE 누락 대비)
  const markResolvedFromResult = (payload) => {
    const dk = resolveDateKey(payload);
    if (!dk) return;
    setLoadingByDate((p) => ({ ...p, [dk]: false }));
    setErrorByDate((p) => ({ ...p, [dk]: null }));
    clearTimeoutFor(dk);
  };

  // status 단일 토픽 구독
  useEffect(() => {
    if (!roomId) return;

    const off = subscribeTravelStatus(roomId, ({ status, body }) => {
      const dk = resolveDateKey(body);
      if (!dk) return;

      switch (status) {
        case "STARTED":
          setLoadingByDate((p) => ({ ...p, [dk]: true }));
          setErrorByDate((p) => ({ ...p, [dk]: null }));
          startTimeout(dk);
          break;
        case "ALREADY_RUNNING":
          setLoadingByDate((p) => ({ ...p, [dk]: true }));
          setErrorByDate((p) => ({ ...p, [dk]: null }));
          if (notify) notify("다른 사용자가 계산 중입니다.");
          startTimeout(dk);
          break;
        case "DONE":
          setLoadingByDate((p) => ({ ...p, [dk]: false }));
          setErrorByDate((p) => ({ ...p, [dk]: null }));
          clearTimeoutFor(dk);
          break;
        case "FAILED":
          setLoadingByDate((p) => ({ ...p, [dk]: false }));
          setErrorByDate((p) => ({
            ...p,
            [dk]: body?.message || "경로를 계산할 수 없습니다.",
          }));
          clearTimeoutFor(dk);
          break;
        default:
          break;
      }
    });

    return () => {
      off?.();
      // 모든 타이머 정리
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, [roomId, dates, notify, timeoutMs]);

  return {
    loadingByDate,
    errorByDate,
    markOwnRequestAndStart,
    markResolvedFromResult, // 🔹 ItineraryBoard에서 사용할 것
  };
}
