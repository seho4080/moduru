// src/hooks/useUnsavedGuard.js
import { useEffect } from "react";

/**
 * 페이지 이탈(새로고침/닫기) 경고 훅
 * - enabled === true일 때만 동작
 * - 모든 브라우저/환경에서 시도 (모바일/웹뷰 포함)
 * - 경고 문구는 브라우저 기본(커스텀 메시지 없음)
 */
export default function useUnsavedGuard(enabled) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const onBeforeUnload = (e) => {
      // 일부 브라우저는 커스텀 문구를 무시하거나 beforeunload 자체를 막을 수 있음
      e.preventDefault();
      e.returnValue = ""; // 기본 경고 표시를 위한 표준 방식
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled]);
}
