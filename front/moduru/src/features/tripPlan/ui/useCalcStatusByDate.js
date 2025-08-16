// src/features/itinerary/ui/useCalcStatusByDate.js
import { useEffect, useRef, useState } from "react";
import { subscribeTravelStatus } from "../../webSocket/travelStatusSocket";

/**
 * 날짜 배열 단위로 계산 상태/에러/타임아웃을 관리
 * - /topic/room/{roomId}/travel/status (단일 토픽) 구독
 * - STARTED / ALREADY_RUNNING / DONE / FAILED 처리
 * - 결과(result)만 와도 로딩을 풀 수 있도록 markResolvedFromResult 제공
 */
export default function useCalcStatusByDate(roomId, dates, { notify } = {}) {
  const [loadingByDate, setLoadingByDate] = useState({});
  const [errorByDate, setErrorByDate] = useState({});
  const timersRef = useRef({}); // { [dateKey]: timeoutId }

  // dates 바뀔 때 존재하지 않는 키 정리
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

  const startTimeout = (dateKey, ms = 30000) => {
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

  // 내 버튼 클릭 직후 낙관적 로딩 처리 (status STARTED가 늦을 수 있어서)
  const markOwnRequestAndStart = (dateKey) => {
    setLoadingByDate((p) => ({ ...p, [dateKey]: true }));
    setErrorByDate((p) => ({ ...p, [dateKey]: null }));
    startTimeout(dateKey);
  };

  // result만 도착(DONE 누락)하는 서버 대응
  const markResolvedFromResult = (resultBody) => {
    const dayNum = Number(resultBody?.day);
    const dk = Number.isFinite(dayNum) && dayNum > 0 ? dates[dayNum - 1] : null;
    if (!dk) return;
    setLoadingByDate((p) => ({ ...p, [dk]: false }));
    setErrorByDate((p) => ({ ...p, [dk]: null }));
    clearTimeoutFor(dk);
  };

  // 단일 토픽 구독
  useEffect(() => {
    if (!roomId) return;

    const off = subscribeTravelStatus(roomId, ({ status, body }) => {
      const dayNum = Number(body?.day);
      const dk =
        Number.isFinite(dayNum) && dayNum > 0 ? dates[dayNum - 1] : null;
      if (!dk) return;

      switch (status) {
        case "STARTED": {
          setLoadingByDate((p) => ({ ...p, [dk]: true }));
          setErrorByDate((p) => ({ ...p, [dk]: null }));
          startTimeout(dk);
          break;
        }
        case "ALREADY_RUNNING": {
          setLoadingByDate((p) => ({ ...p, [dk]: true }));
          setErrorByDate((p) => ({ ...p, [dk]: null }));
          if (notify) notify("다른 사용자가 계산 중입니다.");
          startTimeout(dk);
          break;
        }
        case "DONE": {
          setLoadingByDate((p) => ({ ...p, [dk]: false }));
          setErrorByDate((p) => ({ ...p, [dk]: null }));
          clearTimeoutFor(dk);
          break;
        }
        case "FAILED": {
          setLoadingByDate((p) => ({ ...p, [dk]: false }));
          setErrorByDate((p) => ({
            ...p,
            [dk]: body?.message || "경로를 계산할 수 없습니다.",
          }));
          clearTimeoutFor(dk);
          break;
        }
        default:
          break;
      }
    });

    return () => {
      off?.();
      // 안전하게 모든 타이머 제거
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, [roomId, dates, notify]);

  return {
    loadingByDate,
    errorByDate,
    markOwnRequestAndStart,
    markResolvedFromResult,
  };
}
