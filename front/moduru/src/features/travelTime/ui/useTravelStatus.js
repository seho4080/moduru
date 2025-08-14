// src/features/travel/ui/useTravelStatus.js
import { useEffect, useState, useRef } from "react";
import { subscribeTravelStatus } from "../../webSocket/travelStatusSocket";

/**
 * @param {number|string} roomId
 * @param {{ onToast?: (msg: string) => void }} options
 */
export default function useTravelStatus(roomId, { onToast } = {}) {
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [error, setError] = useState(null);

  // onToast 함수가 리렌더링으로 인해 변경되더라도 참조를 유지하기 위해 useRef를 사용합니다.
  const onToastRef = useRef(onToast);

  // onToast prop이 변경될 때마다 ref의 값을 최신으로 업데이트합니다.
  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  useEffect(() => {
    if (!roomId) return;

    const off = subscribeTravelStatus(roomId, ({ status, body }) => {
      console.log("[TravelStatus] recv:", status, body);
      switch (status) {
        case "STARTED":
          setLoading(true);
          setButtonDisabled(true);
          setError(null);
          break;
        case "ALREADY_RUNNING":
          // ref에 저장된 최신 함수를 사용합니다.
          onToastRef.current?.("이미 계산 중입니다.");
          break;
        case "DONE":
          setLoading(false);
          setButtonDisabled(false);
          setError(null);
          break;
        case "FAILED":
          setLoading(false);
          setButtonDisabled(false);
          setError(body?.message || "소요시간 계산 실패");
          break;
        default:
          break;
      }
    });

    return off;
    // 이제 이 useEffect는 roomId가 변경될 때만 실행됩니다.
    // onToast 함수가 변경되어도 구독/해제를 반복하지 않습니다.
  }, [roomId]);

  return { loading, buttonDisabled, error, setError };
}