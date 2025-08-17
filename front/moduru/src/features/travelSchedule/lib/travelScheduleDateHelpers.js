/**
 * "YYYY-MM-DD" → Date
 */
export function parseYMD(ymd) {
  if (!ymd || typeof ymd !== "string") return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * startDate(YYYY-MM-DD) ~ dateKey(YYYY-MM-DD)의 여행 일차(1-base)를 계산한다.
 * 음수면 null을 반환한다.
 */
export function calcDayNumber(startDateYMD, dateKeyYMD) {
  const s = parseYMD(startDateYMD);
  const t = parseYMD(dateKeyYMD);
  if (!s || !t) return null;
  const ms = t.setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0);
  const diff = Math.floor(ms / (24 * 60 * 60 * 1000));
  return diff >= 0 ? diff + 1 : null;
}
