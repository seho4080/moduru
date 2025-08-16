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

  // onToast 최신 참조 유지
  const onToastRef = useRef(onToast);
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
          setLoading(true);
          setButtonDisabled(true);
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
  }, [roomId]);

  return { loading, buttonDisabled, error, setError };
}
