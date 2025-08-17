import React, { useMemo, useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ScheduleDay from "./ScheduleDay";

// YYYY-MM-DD → 로컬 자정 Date
function parseLocalDate(dateStr) {
  const [y, m, d] = (dateStr || "").split("-").map(Number);
  const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function formatLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ScheduleEditor({
  startDate,
  endDate,
  scheduleByDate = {},
}) {
  // 날짜 배열 (1일차부터, 타임존 안전)
  const days = useMemo(() => {
    if (!startDate) return [];
    const s = parseLocalDate(startDate);
    const e = endDate ? parseLocalDate(endDate) : parseLocalDate(startDate);
    const out = [];
    for (let d = new Date(s), i = 0; d <= e; d.setDate(d.getDate() + 1), i++) {
      const iso = formatLocalISO(d);
      const ym = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      out.push({ nth: i + 1, iso, ym });
    }
    return out;
  }, [startDate, endDate]);

  // 고정 2칸
  const WINDOW_SIZE = Math.min(2, days.length || 1);
  const [startIndex, setStartIndex] = useState(0);

  // 날짜 바뀌면 항상 1일차·2일차로
  useEffect(() => {
    setStartIndex(0);
  }, [startDate, endDate, days.length]);

  const maxStart = Math.max(0, (days.length || 1) - WINDOW_SIZE);
  useEffect(() => {
    if (startIndex > maxStart) setStartIndex(maxStart);
  }, [maxStart, startIndex]);

  const canPrev = startIndex > 0;
  const canNext = startIndex < maxStart;

  const goPrev = () => {
    if (canPrev) setStartIndex((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    if (canNext) setStartIndex((i) => Math.min(maxStart, i + 1));
  };

  const pageDays = days.slice(startIndex, startIndex + WINDOW_SIZE);

  // 본문: 현재 2칸만 (폭 맞춤)
  return (
    <div className="flex h-full flex-col bg-white text-[13px]">
      {/* 상단 네비 */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 ${!canPrev ? "invisible" : ""
            }`}
          onClick={goPrev}
          aria-label="prev days"
        >
          <FaChevronLeft />
        </button>

        <div className="text-xs text-gray-600">
          {days.length > 0
            ? `${startIndex + 1}–${Math.min(
              startIndex + WINDOW_SIZE,
              days.length
            )} / ${days.length}일`
            : "0일"}
        </div>

        <div className="flex-1" />

        <button
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 ${!canNext ? "invisible" : ""
            }`}
          onClick={goNext}
          aria-label="next days"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* ✅ 여기 수정: 칼럼 폭 200px, 간격/패딩 축소, 가운데선 표시 */}
      <div className="flex flex-1 justify-between gap-2 px-2 pt-2 overflow-x-hidden">
        {pageDays.length > 0 ? (
          pageDays.map((d, idx) => (
            <React.Fragment key={d.iso}>
              <div className="flex w-[200px] flex-col items-center shrink-0">
                <div className="mb-2 w-[200px] rounded-md bg-blue-600 py-1.5 text-center text-white">
                  <div className="text-[10px] font-semibold">{d.nth}일차</div>
                  <div className="text-sm font-extrabold">{d.ym}</div>
                </div>
                <ScheduleDay items={scheduleByDate[d.iso] || []} />
              </div>

              {/* 칼럼 사이 점선 (마지막 제외) */}
              {idx < pageDays.length - 1 && (
                <div className="w-px bg-slate-300/60 self-stretch my-1" />
              )}
            </React.Fragment>
          ))
        ) : (
          <div className="flex items-center text-xs text-gray-500">
            표시할 일정이 없습니다.
          </div>
        )}
      </div>

      {/* 하단 버튼(컴팩트) */}
      <div className="flex items-end justify-between gap-2 border-t px-3 pb-3 pt-2">
        <button className="rounded-lg border border-blue-600 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50">
          경로 추천
        </button>
        <div className="flex flex-col gap-1.5">
          <button className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
            저장
          </button>
          <button className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
            내보내기
          </button>
        </div>
      </div>
    </div>
  );
}
