// src/features/tripPlan/model/useScheduleCommit.js
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { commitSchedules } from "../../tripPlan/lib/scheduleApi";
import { replaceDayFromServer } from "../../../redux/slices/itinerarySlice";
import { setDraftVersion } from "../../../redux/slices/scheduleDraftSlice";

export default function useScheduleCommit(roomId) {
  const dispatch = useDispatch();
  const versionsByDay = useSelector(
    (s) => s.scheduleDraft?.versionsByDay ?? {}
  );
  const startDate = useSelector((s) => s.tripRoom?.startDate);
  const [msg, setMsg] = useState("");

  const hasAnyDraft = useMemo(
    () => Object.keys(versionsByDay).length > 0,
    [versionsByDay]
  );

  // YYYY-MM-DD + day(1-based) 매핑 헬퍼
  const dayFromDate = useCallback(
    (dateISO) => {
      if (!startDate || !dateISO) return null;
      const s = new Date(startDate),
        d = new Date(dateISO);
      s.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      const diff = Math.floor((d - s) / 86400000);
      return Number.isFinite(diff) ? diff + 1 : null;
    },
    [startDate]
  );

  const commit = useCallback(async () => {
    setMsg("");
    if (!roomId) {
      setMsg("방 정보가 없습니다.");
      return;
    }
    if (!hasAnyDraft) {
      setMsg("저장할 변경이 없습니다.");
      return;
    }

    const res = await commitSchedules(roomId, versionsByDay);

    // ✅ 바로 다음 줄에 디버그 출력
    console.log("[commit res]", res.status, res.data);
    // 200 OK — 확정 일정 목록(List) 반환
    if (res.status === 200 && Array.isArray(res.data)) {
      const list = res.data; // [{ day, date, events: [...] }, ...]
      list.forEach(({ date, events }) => {
        if (!date || !Array.isArray(events)) return;
        dispatch(replaceDayFromServer({ dateKey: date, events }));
        // 커밋 성공했으니 해당 일자의 draftVersion을 0으로 초기화(선택)
        const day = dayFromDate(date);
        if (Number.isFinite(day)) {
          dispatch(setDraftVersion({ day, draftVersion: 0 }));
        }
      });
      setMsg("저장 완료!");
      return;
    }

    // 409 CONFLICT — latestVersions + latestSchedules 반환
    if (res.status === 409 && res.data) {
      const { latestVersions, latestSchedules } = res.data;

      // 서버 최신 버전 반영
      if (latestVersions && typeof latestVersions === "object") {
        Object.entries(latestVersions).forEach(([dayStr, ver]) => {
          const day = Number(dayStr);
          const v = Number(ver);
          if (Number.isFinite(day) && Number.isFinite(v)) {
            dispatch(setDraftVersion({ day, draftVersion: v }));
          }
        });
      }

      // 서버 최신 일정으로 갈아끼우기
      if (Array.isArray(latestSchedules)) {
        latestSchedules.forEach(({ date, events }) => {
          if (!date || !Array.isArray(events)) return;
          dispatch(replaceDayFromServer({ dateKey: date, events }));
        });
      }

      setMsg(
        "버전 충돌이 발생했습니다. 서버 최신 일정으로 갱신되었어요. 다시 저장해 주세요."
      );
      return;
    }

    // 400 등 기타
    if (res.status === 400) {
      setMsg("저장할 draft가 없습니다.");
      return;
    }
    if (res.status === 401) {
      setMsg("로그인이 필요합니다.");
      return;
    }

    // 500 or 기타
    console.warn("[commit error]", res.status, res.data);
    setMsg(`서버 오류(${res.status}). 관리자에게 문의하세요.`);
  }, [roomId, hasAnyDraft, versionsByDay, dayFromDate, dispatch]);

  return { commit, hasAnyDraft, msg };
}
