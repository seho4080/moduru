// src/features/schedule/api/scheduleApi.js
import api from "../../../lib/axios"; // 경로 맞춰서!

export async function commitSchedules(roomId, versionsByDay) {
  // day 키는 문자열, 값은 숫자로 정규화
  const versions = Object.fromEntries(
    Object.entries(versionsByDay || {}).flatMap(([day, ver]) => {
      const d = Number(day);
      const v = Number(ver);
      return Number.isFinite(d) && Number.isFinite(v) ? [[String(d), v]] : [];
    })
  );

  console.log("[commit payload]", { roomId, versions });

  // 인스턴스 사용: 토큰 주입 + 재발급 자동
  return api.post(
    `/rooms/${roomId}/schedules/commit`,
    { versions },
    { validateStatus: () => true } // 409도 throw하지 않게
  );
}
