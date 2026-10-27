// ===== Key ngày thực (pure, test được không cần DOM/localStorage) =====
/** Key ngày thực local YYYY-MM-DD — nhiệm vụ ngày refresh lúc 00:00 */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
/** Key ngày hôm qua (an toàn DST — dựng tại 12:00 để tránh lệch 1 tiếng ở midnight) */
export function yesterdayKey(d: Date = new Date()): string {
  const noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  return todayKey(new Date(noon.getTime() - 86400000));
}
/** Số ngày giữa 2 key YYYY-MM-DD (b - a) */
export function daysBetweenKeys(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000);
}
