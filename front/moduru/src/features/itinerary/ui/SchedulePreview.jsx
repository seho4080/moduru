import React from "react";
import useRoomSchedule from "../model/useRoomSchedule";

const fmt = (s) => (s == null ? "" : s);

export default function SchedulePreview({ room, onClose }) {
  const roomId = room?.id ?? room?.travelRoomId ?? room?.roomId;
  const title = room?.title ?? "";
  const period =
    room?.startDate && room?.endDate ? `${room.startDate} ~ ${room.endDate}` : null;

  const { days, rows, loading, error, shape, reload } = useRoomSchedule(roomId, {
    from: room?.startDate,
    to: room?.endDate,
    includeImages: true,
  });

  if (!roomId) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="일정 조회"
    >
      <div className="bg-white rounded-xl w-[740px] max-h-[80vh] overflow-auto shadow-xl">
        <header className="sticky top-0 bg-white/90 backdrop-blur px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">일정 조회 · {title}</h2>
            {period && <p className="text-xs text-gray-500 mt-1">{period}</p>}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded" onClick={reload}>새로고침</button>
            <button className="px-3 py-1 border rounded" onClick={onClose}>닫기</button>
          </div>
        </header>

        {loading && <div className="py-10 text-center">불러오는 중…</div>}

        {error && !loading && (
          <div className="py-10 text-center text-red-600">
            로드 실패: {String(error?.response?.data?.message || error.message || error)}
          </div>
        )}

        {!loading && !error && (
          <div className="p-6 space-y-6">
            {/* 1) 날짜 그룹이 있으면 날짜별로 */}
            {Object.keys(days || {}).length > 0 ? (
              Object.entries(days).map(([date, items]) => (
                <section key={date}>
                  <h3 className="font-medium mb-2">{date}</h3>
                  <ul className="divide-y border rounded">
                    {items.map((it) => (
                      <li key={it.entryId ?? `${date}-${it.placeId}-${it.eventOrder}`} className="p-3">
                        <div className="font-medium">{it.placeName}</div>
                        <div className="text-sm text-gray-500">
                          {fmt(it.startTime)}{it.startTime && it.endTime ? " ~ " : ""}{fmt(it.endTime)}
                          {it.category ? ` · ${it.category}` : ""}
                          {it.address ? ` · ${it.address}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            ) : rows?.length > 0 ? (
              // 2) 날짜가 없으면 장소명/주소 표로 표시 (이번 API 스펙)
              <section>
                <div className="text-sm text-gray-500 mb-2">
                  장소명/주소 목록 (총 {rows.length}건, shape: {shape})
                </div>
                <div className="border rounded overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 w-12">#</th>
                        <th className="text-left px-3 py-2">장소명</th>
                        <th className="text-left px-3 py-2">주소</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={r.entryId ?? `${r.placeName}-${i}`} className="border-t">
                          <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                          <td className="px-3 py-2">{r.placeName}</td>
                          <td className="px-3 py-2 text-gray-600">{r.address || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <div className="text-center text-gray-500 py-12">표시할 일정이 없습니다.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
