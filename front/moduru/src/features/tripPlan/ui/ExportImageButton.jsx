// src/features/tripPlan/ui/ExportImageButton.jsx
import { useState } from "react";

/**
 * 내보내기 버튼
 * - armed === true 일 때만 활성화 (저장 성공 신호)
 * - 클릭하여 내보내기 완료되면 onDisarm() 호출해서 다시 비활성화
 */
export default function ExportImageButton({
  armed = false,
  onExport,
  onDisarm,
  small = false,
}) {
  const [exporting, setExporting] = useState(false);
  const disabled = !armed || exporting;

  const handleClick = async () => {
    if (disabled) return;
    setExporting(true);
    try {
      await onExport?.(); // 실제 캡처/다운로드 로직
    } catch (e) {
      console.error("[export-image] failed:", e);
    } finally {
      setExporting(false);
      onDisarm?.(); // ✅ 내보내기 후 즉시 비활성화
    }
  };

  return (
    <button
      type="button"
      className={`btn ${small ? "small" : ""} ${disabled ? "ghost" : ""}`}
      disabled={disabled}
      onClick={handleClick}
      title={
        armed
          ? exporting
            ? "내보내는 중…"
            : "이미지로 내보내기"
          : "저장 완료 후 내보낼 수 있습니다"
      }
      style={{
        height: small ? 28 : 32,
        padding: small ? "0 10px" : "0 12px",
        fontSize: small ? 12 : 13,
        borderRadius: 6,
      }}
    >
      {exporting ? "내보내는 중…" : "이미지 내보내기"}
    </button>
  );
}
