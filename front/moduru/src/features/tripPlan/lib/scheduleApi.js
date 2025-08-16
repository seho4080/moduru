// src/features/schedule/api/scheduleApi.js
import api from "../../../lib/axios";

/**
 * 일정 커밋
 * - day 키는 문자열, 값은 숫자로 정규화해서 전송
 * - 409(CONFLICT)도 throw하지 않도록 validateStatus 설정
 */
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

  return api.post(
    `/rooms/${roomId}/schedules/commit`,
    { versions },
    { validateStatus: () => true } // 409도 throw하지 않게
  );
}

/** 저장된 일정 조회 */
export async function getSchedules(roomId) {
  return api.get(`/rooms/${roomId}/schedules`, {
    validateStatus: () => true, // 200 외도 throw 안 함
  });
}
