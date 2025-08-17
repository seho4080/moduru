import { useEffect, useState } from "react";

/** HH:MM 24h 검증 */
const isHHMM = (v) =>
  typeof v === "string" &&
  /^\d{2}:\d{2}$/.test(v) &&
  Number(v.slice(0, 2)) < 24 &&
  Number(v.slice(3, 5)) < 60;

/**
 * TimeEditor
 * props:
 * - initialStart: string | "" (HH:MM)
 * - initialEnd: string | "" (HH:MM)
 * - onConfirm: ({ startTime, endTime }) => void
 * - onCancel: () => void
 */
export default function TimeEditor({
  initialStart = "",
  initialEnd = "",
  onConfirm,
  onCancel,
}) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const valid = (!start || isHHMM(start)) && (!end || isHHMM(end));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 shadow-md">
      <div className="flex items-center gap-2">
        <label className="text-xs w-14">시작</label>
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs w-14">종료</label>
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded"
          onClick={onCancel}
        >
          취소
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={!valid}
          onClick={() =>
            onConfirm?.({ startTime: start || null, endTime: end || null })
          }
        >
          적용
        </button>
      </div>
    </div>
  );
}
