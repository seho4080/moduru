// src/features/schedule/ui/SchedulePreview.jsx
import React from "react";
import useRoomSchedule from "../model/useRoomSchedule";

const fmt = (s) => (s == null ? "" : s);
const timeRange = (s, e) => [fmt(s), fmt(e)].filter(Boolean).join(" ~ ");

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
      <div className="bg-white rounded-xl w-[780px] max-h-[80vh] overflow-auto shadow-xl">
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
          <div className="p-6 space-y-8">
            {/* 1) 날짜별 events 타임라인 */}
            {Object.keys(days || {}).length > 0 ? (
              Object.entries(days).map(([date, items]) => (
                <section key={date} className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold">{date}</h3>
                    <span className="text-xs text-gray-500">총 {items.length}개</span>
                  </div>

                  <ol className="space-y-2">
                    {items.map((it, idx) => (
                      <React.Fragment key={it.entryId ?? `${date}-${it.placeId}-${it.eventOrder}`}>
                        {/* 이벤트 카드 */}
                        <li className="flex items-start gap-3 p-3 border rounded-lg">
                          {/* 시간 */}
                          <div className="w-24 shrink-0 text-sm text-gray-600">
                            {timeRange(it.startTime, it.endTime) || "-"}
                          </div>

                          {/* 썸네일 */}
                          <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 shrink-0">
                            {it.imageUrl ? (
                              <img
                                src={it.imageUrl}
                                alt={it.placeName || "이미지"}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : null}
                          </div>

                          {/* 본문 */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                #{(it.eventOrder ?? idx) + 1}
                              </span>
                              <div className="font-medium truncate">{it.placeName || "(이름 없음)"}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {it.category ? `#${it.category}` : ""}
                              {it.category && (it.address ? " · " : "")}
                              {it.address || ""}
                            </div>
                          </div>
                        </li>

                        {/* 이동 시간(다음 이벤트까지) */}
                        {idx < items.length - 1 && Number(it.nextTravelTime) > 0 && (
                          <li className="pl-[6rem]">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="inline-block w-6 h-px bg-gray-300" />
                              <span>🚗 이동 {it.nextTravelTime}분</span>
                            </div>
                          </li>
                        )}
                      </React.Fragment>
                    ))}
                  </ol>
                </section>
              ))
            ) : rows?.length > 0 ? (
              // 2) 폴백: 장소명/주소 표
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
