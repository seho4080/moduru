// src/features/itinerary/ui/components/LegETA.jsx
import React from "react";
import { useSelector, shallowEqual } from "react-redux";
import { selectLegEta } from "@/redux/slices/etaSlice";

const TRANSPORT_LABEL = {
  driving: "운전",
  transit: "대중교통",
  walking: "도보",
  null: "미지정",
};
const labelOf = (m) => TRANSPORT_LABEL[m ?? "null"] || "미지정";

export default function LegETA({
  day,
  requestedTransport,
  fromId,
  toId,
  cardWidth = 240,
}) {
  const fromWantId = Number(fromId);
  const toWantId = Number(toId);

  const data = useSelector((s) => {
    const tryPick = (t) =>
      selectLegEta(s, { day, transport: t, fromWantId, toWantId });
    let hit = tryPick(requestedTransport);
    if (!hit && requestedTransport === "transit") hit = tryPick("walking");
    if (!hit) hit = tryPick("driving");
    return hit
      ? {
          mode: requestedTransport,
          durationMinutes: Number(hit.durationMinutes ?? 0),
          distanceMeters: Number(hit.distanceMeters ?? 0),
          updatedAt: hit.updatedAt ?? null,
        }
      : null;
  }, shallowEqual);

  if (!data) {
    return (
      <div
        className="text-xs px-2 py-1 border rounded bg-slate-50 text-slate-500 border-slate-200"
        style={{ width: cardWidth }}
        title="소요시간 계산 결과 대기 중"
      >
        {labelOf(requestedTransport)} · 계산 대기
      </div>
    );
  }

  const min = Math.round(data.durationMinutes);
  const km =
    data.distanceMeters != null
      ? (data.distanceMeters / 1000).toFixed(1)
      : null;

  return (
    <div
      className="text-xs px-2 py-1 border rounded bg-indigo-50 text-indigo-700 border-indigo-200"
      style={{ width: cardWidth }}
      title={`업데이트: ${data.updatedAt ?? "-"}`}
    >
      {labelOf(requestedTransport)} · {min}분{km ? ` · ${km}km` : ""}
    </div>
  );
}
