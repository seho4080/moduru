import React from "react";
import { useSelector } from "react-redux";
import useScheduleCommit from "../../tripPlan/model/useScheduleCommit";

/**
 * 저장 버튼 (commit)
 * - 저장 로직은 전부 useScheduleCommit 훅에서 처리
 * - 버튼은 commit() 결과 코드만 보고 메시지/콜백 처리
 *
 * props:
 *  - onSaved?: () => void         // 저장 성공 시 호출 (Export 버튼 무장 등에 사용)
 *  - small?: boolean              // 라벨 축약
 *  - className?: string
 *  - customStyle?: string         // 기존 사용 호환
 */
export default function ScheduleSaveButton({
  onSaved,
  small,
  className,
  customStyle,
}) {
  const roomId = useSelector((s) => s.tripRoom?.id ?? s.tripRoom?.roomId);
  const { commit, hasAnyDraft, isSaving, msg } = useScheduleCommit(roomId);
  const [localMsg, setLocalMsg] = React.useState("");

  const onClick = async () => {
    setLocalMsg("");
    const r = await commit(); // 훅이 throw하지 않고 { ok, code } 반환

    if (r?.ok) {
      onSaved?.(); // 필요 시 Export 버튼 무장 등
      setLocalMsg("저장되었습니다.");
      return;
    }

    // 결과 코드별 안내 (훅이 이미 화면/버전 동기화까지 수행)
    if (r?.code === "CONFLICT") {
      setLocalMsg(
        "최신 내용으로 동기화했어요. 변경 확인 후 다시 저장해 주세요."
      );
    } else if (r?.code === "NO_DRAFT") {
      setLocalMsg("저장할 변경이 없습니다.");
    } else if (r?.code === "NO_ROOM") {
      setLocalMsg("방 정보가 없습니다.");
    } else if (r?.code === "BUSY") {
      setLocalMsg("이미 저장 처리 중입니다.");
    } else if (r?.code === "UNAUTHORIZED") {
      setLocalMsg("로그인이 필요합니다.");
    } else if (r?.code === "BAD_REQUEST") {
      setLocalMsg("저장할 draft가 없습니다.");
    } else if (r?.code === "NETWORK_ERROR") {
      setLocalMsg("네트워크 오류가 발생했습니다.");
    } else if (r?.code === "SERVER_ERROR") {
      setLocalMsg(`서버 오류(${r.status}). 관리자에게 문의하세요.`);
    } else {
      setLocalMsg("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const btnClass = customStyle ?? className ?? "px-3 py-2 rounded border";

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={!hasAnyDraft || isSaving || !roomId}
        className={btnClass}
        aria-busy={isSaving}
        title={
          isSaving
            ? "저장 중…"
            : hasAnyDraft
            ? "변경사항 저장"
            : "저장할 변경 없음"
        }
      >
        {isSaving ? "저장 중..." : small ? "저장" : "일정 저장(커밋)"}
      </button>

      {(msg || localMsg) && (
        <div className="text-sm mt-2">{msg || localMsg}</div>
      )}
    </div>
  );
}
