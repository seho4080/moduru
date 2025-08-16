// src/features/tripPlan/model/useScheduleCommit.js
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { commitSchedules } from "../../tripPlan/lib/scheduleApi";
import { replaceDayFromServer } from "../../../redux/slices/itinerarySlice";
import {
  setDraftVersion,
  clearDraftVersions,
  replaceVersions,
} from "../../../redux/slices/scheduleDraftSlice";

// "YYYY-MM-DD" → 로컬 자정 Date (타임존 안정)
function parseYmdLocal(isoYmd) {
  if (!isoYmd || typeof isoYmd !== "string") return null;
  const m = isoYmd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [_, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0);
}

export default function useScheduleCommit(roomId) {
  const dispatch = useDispatch();
  const versionsByDay = useSelector(
    (s) => s.scheduleDraft?.versionsByDay ?? {}
  );
  const startDate = useSelector((s) => s.tripRoom?.startDate);

  const [msg, setMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 값이 1 이상인 day가 하나라도 있으면 draft 존재로 판단
  const hasAnyDraft = useMemo(
    () => Object.values(versionsByDay).some((v) => Number(v) > 0),
    [versionsByDay]
  );

  // YYYY-MM-DD → day(1-based)
  const dayFromDate = useCallback(
    (dateISO) => {
      if (!startDate || !dateISO) return null;
      const s = parseYmdLocal(startDate);
      const d = parseYmdLocal(dateISO);
      if (!s || !d) return null;
      const diff = Math.floor((d.getTime() - s.getTime()) / 86400000);
      return Number.isFinite(diff) ? diff + 1 : null;
    },
    [startDate]
  );

  const commit = useCallback(async () => {
    setMsg("");

    if (!roomId) {
      setMsg("방 정보가 없습니다.");
      return { ok: false, code: "NO_ROOM" };
    }
    if (!hasAnyDraft) {
      setMsg("저장할 변경이 없습니다.");
      return { ok: false, code: "NO_DRAFT" };
    }
    if (isSaving) {
      return { ok: false, code: "BUSY" };
    }

    setIsSaving(true);
    try {
      const res = await commitSchedules(roomId, { versions: versionsByDay });
      console.log("[commit res]", res.status, res.data);

      // 200 OK — 서버가 확정 일정 목록을 반환
      if (res.status === 200 && Array.isArray(res.data)) {
        const list = res.data; // [{ day, date, events: [...] }, ...]

        const committedDays = new Set();

        list.forEach(({ day, date, events }) => {
          // 화면 일정 갈아끼우기
          if (date && Array.isArray(events)) {
            dispatch(replaceDayFromServer({ dateKey: date, events }));
          }
          // 커밋된 day 계산 (우선 순위: 응답 day → date 환산)
          let dnum = Number(day);
          if (!Number.isFinite(dnum)) dnum = dayFromDate(date);
          if (Number.isFinite(dnum)) {
            committedDays.add(dnum);
            // 커밋 완료 → draftVersion 0으로 초기화(선택) 또는 제거
            // 여기서는 제거 대신 명시적으로 0 세팅 후, clear로 없애 줌
            dispatch(setDraftVersion({ day: dnum, draftVersion: 0 }));
          }
        });

        if (committedDays.size > 0) {
          dispatch(clearDraftVersions(Array.from(committedDays)));
        }

        // 내보내기 버튼 무장 UX: 전역 이벤트
        try {
          window.dispatchEvent(
            new CustomEvent("schedule:commit:ok", { detail: { roomId } })
          );
        } catch {}

        setMsg("저장 완료!");
        setIsSaving(false);
        return { ok: true, code: "OK" };
      }

      // 409 CONFLICT — 서버 최신 버전/일정 동봉
      if (res.status === 409 && res.data) {
        const { latestVersions, latestSchedules } = res.data;

        // 1) 버전 테이블 최신으로 교체
        if (latestVersions && typeof latestVersions === "object") {
          dispatch(replaceVersions(latestVersions));
        }

        // 2) 화면 일정도 서버 스냅샷으로 교체
        if (Array.isArray(latestSchedules)) {
          latestSchedules.forEach(({ date, events }) => {
            if (!date || !Array.isArray(events)) return;
            dispatch(replaceDayFromServer({ dateKey: date, events }));
          });
        }

        // (선택) 충돌 알림 이벤트
        try {
          window.dispatchEvent(
            new CustomEvent("schedule:commit:conflict", {
              detail: { roomId, latestVersions },
            })
          );
        } catch {}

        setMsg(
          "버전 충돌이 발생했습니다. 서버 최신 일정으로 갱신되었어요. 변경사항 확인 후 다시 저장해 주세요."
        );
        setIsSaving(false);
        return { ok: false, code: "CONFLICT" };
      }

      // 기타 상태코드
      if (res.status === 400) {
        setMsg("저장할 draft가 없습니다.");
        setIsSaving(false);
        return { ok: false, code: "BAD_REQUEST" };
      }
      if (res.status === 401) {
        setMsg("로그인이 필요합니다.");
        setIsSaving(false);
        return { ok: false, code: "UNAUTHORIZED" };
      }

      console.warn("[commit error]", res.status, res.data);
      setMsg(`서버 오류(${res.status}). 관리자에게 문의하세요.`);
      setIsSaving(false);
      return { ok: false, code: "SERVER_ERROR", status: res.status };
    } catch (e) {
      console.warn("[commit exception]", e);
      setMsg(e?.message || "네트워크 오류가 발생했습니다.");
      setIsSaving(false);
      return { ok: false, code: "NETWORK_ERROR" };
    }
  }, [roomId, hasAnyDraft, versionsByDay, dayFromDate, dispatch, isSaving]);

  return { commit, hasAnyDraft, isSaving, msg };
}
