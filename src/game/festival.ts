// ===== LỄ HỘI MÙA VỤ (Đợt 3) — pure module, test được không cần DOM =====
// "Chợ lễ hội cuối tuần": ngày thực Thứ 7 + Chủ nhật, chợ đông khách →
// mọi thứ bán được giá hơn (x1.25), NPC trả đơn hàng hậu hĩnh hơn (x1.3).
// Lễ hội là buff toàn server (ai chơi cùng lúc cũng hưởng) — không cần lưu save.
import { todayKey } from './date';

/** Hệ số giá khi bán trong lễ hội */
export const FESTIVAL_SELL_MUL = 1.25;
/** Hệ số thưởng đơn hàng NPC trong lễ hội */
export const FESTIVAL_ORDER_MUL = 1.3;

/** Ngày YYYY-MM-DD có phải cuối tuần (T7/CN) không — dựng tại 12:00 để an toàn múi giờ */
export function isFestival(date: string): boolean {
  const t = Date.parse(`${date}T12:00:00`);
  if (Number.isNaN(t)) return false;
  const dow = new Date(t).getDay(); // 0 = CN, 6 = T7
  return dow === 0 || dow === 6;
}

/** Lễ hội hôm nay (theo ngày thực)? */
export function isFestivalToday(): boolean {
  return isFestival(todayKey());
}

/** Nhãn hiển thị khi đang lễ hội (rỗng nếu ngày thường) */
export function festivalLabel(date: string): string {
  return isFestival(date) ? '🎪 Chợ lễ hội cuối tuần' : '';
}
