// src/features/itinerary/ui/components/DayTotals.jsx
import React from "react";
import { useSelector, shallowEqual } from "react-redux";
import { selectDayTotals } from "@/redux/slices/etaSlice";

const TRANSPORT_LABEL = {
  driving: "운전",
  transit: "대중교통",
  walking: "도보",
  null: "미지정",
};
const labelOf = (m) => TRANSPORT_LABEL[m ?? "null"] || "미지정";

export default function DayTotals({
  day,
  requestedTransport,
  cardWidth = 240,
}) {
  const data = useSelector((s) => {
    const tryTotals = (t) => selectDayTotals(s, { day, transport: t });

    let t = tryTotals(requestedTransport);
    if (t) {
      return {
        mode: requestedTransport,
        totalDurationMinutes: Number(t.totalDurationMinutes ?? 0),
        totalDistanceMeters: Number(t.totalDistanceMeters ?? 0),
        updatedAt: t.updatedAt ?? null,
      };
    }

    // 대중교통 요청 시에는 대중교통 또는 도보 데이터만 사용 (운전 데이터 폴백 제거)
    if (requestedTransport === "transit") {
      t = tryTotals("walking");
      if (t) {
        return {
          mode: "walking",
          totalDurationMinutes: Number(t.totalDurationMinutes ?? 0),
          totalDistanceMeters: Number(t.totalDistanceMeters ?? 0),
          updatedAt: t.updatedAt ?? null,
        };
      }
      // 대중교통과 도보 데이터가 모두 없으면 null 반환 (운전 데이터 사용 안함)
      return null;
    }

    // 운전 요청 시에만 운전 데이터 폴백 사용
    if (requestedTransport === "driving") {
      t = tryTotals("driving");
      if (t) {
        return {
          mode: "driving",
          totalDurationMinutes: Number(t.totalDurationMinutes ?? 0),
          totalDistanceMeters: Number(t.totalDistanceMeters ?? 0),
          updatedAt: t.updatedAt ?? null,
        };
      }
    }

    // totals가 전혀 없을 때 leg 합산 폴백
    const modesToTry =
      requestedTransport === "transit"
        ? ["transit", "walking", "driving"]
        : [requestedTransport, "driving"];
    for (const m of modesToTry) {
      let dur = 0,
        dist = 0,
        any = false;
      const prefix = `day:${day}|${m}|`;
      for (const [k, v] of Object.entries(s.eta?.byLeg || {})) {
        if (k.startsWith(prefix)) {
          dur += Number(v.durationMinutes || 0);
          dist += Number(v.distanceMeters || 0);
          any = true;
        }
      }
      if (any) {
        return {
          mode: m,
          totalDurationMinutes: dur,
          totalDistanceMeters: dist,
          updatedAt: null,
        };
      }
    }
    return null;
  }, shallowEqual);

  if (!data) return null;

  const km =
    data.totalDistanceMeters != null
      ? (data.totalDistanceMeters / 1000).toFixed(1)
      : null;
  const min = Math.round(data.totalDurationMinutes ?? 0);

  return (
    <div
      className="mt-1 text-xs px-2 py-1 border rounded bg-emerald-50 text-emerald-700 border-emerald-200"
      style={{ width: cardWidth }}
      title={`업데이트: ${data.updatedAt ?? "-"}`}
    >
      합계 · {labelOf(data.mode)} · {min}분{km ? ` · ${km}km` : ""}
    </div>
  );
}
