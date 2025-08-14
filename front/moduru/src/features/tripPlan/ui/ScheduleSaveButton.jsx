import React from "react";
import useScheduleCommit from "../../tripPlan/model/useScheduleCommit";
import { useSelector } from "react-redux";

export default function ScheduleSaveButton() {
  const roomId = useSelector((s) => s.tripRoom?.id ?? s.tripRoom?.roomId);
  const { commit, hasAnyDraft, msg } = useScheduleCommit(roomId);
  const [busy, setBusy] = React.useState(false);

  const versionsByDay = useSelector(
    (s) => s.scheduleDraft?.versionsByDay ?? {}
  );
  React.useEffect(() => {
    console.log(
      "[CommitBtn] roomId=",
      roomId,
      "hasAnyDraft=",
      hasAnyDraft,
      "busy=",
      busy,
      "versionsByDay=",
      versionsByDay
    );
  }, [roomId, hasAnyDraft, busy, versionsByDay]);
  return (
    <div>
      <button
        onClick={async () => {
          setBusy(true);
          await commit();
          setBusy(false);
        }}
        disabled={!hasAnyDraft || busy || !roomId}
        className="px-3 py-2 rounded border"
      >
        {busy ? "저장 중..." : "일정 저장(커밋)"}
      </button>
      {msg && <div className="text-sm mt-2">{msg}</div>}
    </div>
  );
}
