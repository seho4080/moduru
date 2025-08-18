// src/features/tripPlan/ui/ExportBoardButton.jsx
import { useState } from "react";

/**
 * 보드를 PNG로 내보내기 (html2canvas 동적 로드)
 * props:
 *  - targetSelector: 캡쳐할 DOM 선택자 (기본 "#itinerary-board-root")
 *  - enabled: 버튼 활성 여부
 */
export default function ExportBoardButton({
  enabled = false,
  targetSelector = "#itinerary-board-root",
  small = false,
}) {
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    const el = document.querySelector(targetSelector);
    if (!el) {
      (window.toast?.error || alert)("보드 영역을 찾을 수 없습니다.");
      return;
    }
    setBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas"); // 필요 시 `npm i html2canvas`
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: window.devicePixelRatio || 2,
        useCORS: true,
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          (window.toast?.error || alert)("이미지 생성 실패");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `itinerary_board.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (e) {
      console.error("[export board] failed:", e);
      (window.toast?.error || alert)("내보내기 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={doExport}
      disabled={!enabled || busy}
      className={small ? "btn" : "btn"}
      style={
        small
          ? { height: 28, padding: "0 10px", fontSize: 12, borderRadius: 6 }
          : undefined
      }
      title={!enabled ? "저장 후 내보내기 가능" : "보드 이미지 저장"}
    >
      {busy ? "내보내는 중…" : "내보내기"}
    </button>
  );
}
