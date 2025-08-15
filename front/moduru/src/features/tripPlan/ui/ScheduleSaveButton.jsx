import React from "react";
import { useDispatch, useSelector } from "react-redux";
import useScheduleCommit from "../../tripPlan/model/useScheduleCommit";

import {
  addPlaceToDay,
  removeItem,
  setTimes,
} from "@/redux/slices/itinerarySlice";
import { setDraftVersion } from "@/redux/slices/scheduleDraftSlice";

export default function ScheduleSaveButton() {
  const dispatch = useDispatch();

  const roomId = useSelector((s) => s.tripRoom?.id ?? s.tripRoom?.roomId);
  const daysMap = useSelector((s) => s.itinerary?.days ?? {});
  const versionsByDay = useSelector(
    (s) => s.scheduleDraft?.versionsByDay ?? {}
  );

  const { commit, hasAnyDraft, msg } = useScheduleCommit(roomId);

  const [busy, setBusy] = React.useState(false);
  const [localMsg, setLocalMsg] = React.useState("");

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

  // 409일 때: 서버가 내려 준 최신 버전 반영
  const applyLatestVersions = React.useCallback(
    (latestVersions = {}) => {
      Object.entries(latestVersions).forEach(([dayStr, ver]) => {
        const dayNum = Number(dayStr);
        const verNum = Number(ver);
        if (Number.isFinite(dayNum) && Number.isFinite(verNum)) {
          dispatch({
            type: setDraftVersion.type,
            payload: { day: dayNum, draftVersion: verNum },
            meta: { fromWs: true }, // 🔇 미들웨어 재방송 방지
          });
        }
      });
    },
    [dispatch]
  );

  // 409일 때: 최신 스케줄(날짜별)로 보드를 동기화
  const reconcileLatestSchedules = React.useCallback(
    (latestSchedules = []) => {
      for (const dayBlock of latestSchedules) {
        const dateKey = dayBlock?.date;
        if (!dateKey) continue;

        const currentItems = Array.isArray(daysMap[dateKey])
          ? [...daysMap[dateKey]]
          : [];

        // 1) 해당 날짜 기존 카드 전부 제거
        for (const it of currentItems) {
          if (it?.entryId != null) {
            dispatch({
              type: removeItem.type,
              payload: { dateKey, entryId: it.entryId },
              meta: { fromWs: true }, // 🔇
            });
          }
        }

        // 2) 서버 최신 순서(eventOrder 0-based)대로 다시 추가 + 시간 반영
        const events = Array.isArray(dayBlock?.events) ? dayBlock.events : [];
        const ordered = [...events].sort(
          (a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0)
        );

        ordered.forEach((ev, idx) => {
          const wid = Number(ev?.wantId);
          if (!Number.isFinite(wid)) return;

          const place = {
            wantId: wid,
            placeId: wid,
            placeName: ev.placeName ?? "",
            imgUrl: ev.placeImg ?? null,
            category: null,
            address: null,
            lat: ev.lat ?? null,
            lng: ev.lng ?? null,
          };

          dispatch({
            type: addPlaceToDay.type,
            payload: { date: dateKey, place, index: idx },
            meta: { fromWs: true }, // 🔇
          });

          if (ev.startTime || ev.endTime) {
            dispatch({
              type: setTimes.type,
              payload: {
                dateKey,
                wantId: wid,
                startTime: ev.startTime ?? "",
                endTime: ev.endTime ?? "",
              },
              meta: { fromWs: true }, // 🔇
            });
          }
        });
      }
    },
    [daysMap, dispatch]
  );

  const onClick = async () => {
    if (!roomId) return;
    setLocalMsg("");
    setBusy(true);
    try {
      // 기존 훅 사용 (성공 시 훅 내부 메시지/상태 사용)
      await commit();
      setLocalMsg("저장되었습니다.");
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;

      if (status === 409) {
        // ✅ 충돌: 서버 최신본으로 동기화 후 사용자에게 재저장 안내
        const latestVersions = data?.latestVersions || {};
        const latestSchedules = data?.latestSchedules || [];

        applyLatestVersions(latestVersions);
        reconcileLatestSchedules(latestSchedules);

        setLocalMsg(
          "다른 변경 사항이 있어 최신 내용으로 동기화했습니다. 다시 저장을 눌러주세요."
        );
      } else {
        const errMsg =
          data?.message || e?.message || "일정 저장에 실패했습니다.";
        setLocalMsg(errMsg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={onClick}
        disabled={!hasAnyDraft || busy || !roomId}
        className="px-3 py-2 rounded border"
      >
        {busy ? "저장 중..." : "일정 저장(커밋)"}
      </button>

      {(msg || localMsg) && (
        <div className="text-sm mt-2">{msg || localMsg}</div>
      )}
    </div>
  );
}
