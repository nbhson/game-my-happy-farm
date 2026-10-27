// ===== HỆ THỐNG THÀNH TỰU — tạo mục tiêu dài hạn cho người chơi =====
// Mỗi thành tựu: id duy nhất + icon + tên + mô tả + điều kiện + phần thưởng.
// Reward xu/gem được thêm NGAY khi đạt (không cần claim — real-game feel).
import type { Stats } from './types';

export interface AchExtra {
  level: number;
  streak: number;
  goldenHarvests: number;
  animalCount: number;
  uniqueCrops: Set<string>;
  xu: number;
}

export interface AchDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
  /** Kiểm tra đạt mốc dựa trên stats hiện tại + state bổ sung. Trả về true nếu đạt. */
  check: (s: Stats, extra: AchExtra) => boolean;
  reward: { xu?: number; gem?: number };
}

/** Các thành tựu — sắp xếp theo độ hiếm (phổ biến → huyền thoại) */
export const ACHIEVEMENTS: AchDef[] = [
  // ── Thu hoạch ──
  { id: 'harv10', icon: '🌾', name: 'Nông dân mới', desc: 'Thu hoạch 10 lần', check: (s) => s.harvested >= 10, reward: { xu: 50 } },
  { id: 'harv50', icon: '🌻', name: 'Thu hoạch thuần thục', desc: 'Thu hoạch 50 lần', check: (s) => s.harvested >= 50, reward: { xu: 300 } },
  { id: 'harv200', icon: '🏆', name: 'Thu hoạch chuyên nghiệp', desc: 'Thu hoạch 200 lần', check: (s) => s.harvested >= 200, reward: { xu: 1200, gem: 1 } },
  { id: 'harv1000', icon: '👑', name: 'Bậc thầy thu hoạch', desc: 'Thu hoạch 1000 lần', check: (s) => s.harvested >= 1000, reward: { xu: 8000, gem: 3 } },
  // ── Cấp độ ──
  { id: 'lv5', icon: '⭐', name: 'Lên Lv5', desc: 'Đạt cấp 5', check: (_s, e) => e.level >= 5, reward: { xu: 100 } },
  { id: 'lv10', icon: '🌟', name: 'Nông trại trung bình', desc: 'Đạt cấp 10', check: (_s, e) => e.level >= 10, reward: { xu: 500, gem: 1 } },
  { id: 'lv20', icon: '💫', name: 'Nông trại lớn', desc: 'Đạt cấp 20', check: (_s, e) => e.level >= 20, reward: { xu: 2000, gem: 2 } },
  { id: 'lv50', icon: '🌈', name: 'Huyền thoại nông trại', desc: 'Đạt cấp 50', check: (_s, e) => e.level >= 50, reward: { xu: 15000, gem: 5 } },
  // ── Kinh tế ──
  { id: 'earn10k', icon: '💰', name: 'Túi tiền đầu tiên', desc: 'Tổng thu nhập đạt 10.000 xu', check: (s) => s.earned >= 10000, reward: { xu: 200 } },
  { id: 'earn100k', icon: '💎', name: 'Triệu phú nông trại', desc: 'Tổng thu nhập đạt 100.000 xu', check: (s) => s.earned >= 100000, reward: { xu: 2000, gem: 2 } },
  { id: 'earn500k', icon: '🪙', name: 'Tỷ phú nông trại', desc: 'Tổng thu nhập đạt 500.000 xu', check: (s) => s.earned >= 500000, reward: { xu: 10000, gem: 5 } },
  // ── Cá ──
  { id: 'fish10', icon: '🐟', name: 'Ngư dân tập sự', desc: 'Thả 10 con cá xuống ao', check: (s) => s.stockedFish >= 10, reward: { xu: 80 } },
  { id: 'fish50', icon: '🐠', name: 'Ngư dân lành nghề', desc: 'Thả 50 con cá xuống ao', check: (s) => s.stockedFish >= 50, reward: { xu: 400, gem: 1 } },
  { id: 'fish200', icon: '🦈', name: 'Bậc thầy ngư nghiệp', desc: 'Thả 200 con cá xuống ao', check: (s) => s.stockedFish >= 200, reward: { xu: 2000, gem: 2 } },
  // ── Vật nuôi ──
  { id: 'animal10', icon: '🐄', name: 'Trại chăn nuôi', desc: 'Sở hữu 10 vật nuôi cùng lúc', check: (_s, e) => e.animalCount >= 10, reward: { xu: 300 } },
  { id: 'collect100', icon: '🥛', name: 'Người thu gom', desc: 'Thu gom 100 sản phẩm động vật', check: (s) => s.collectedAnimal >= 100, reward: { xu: 500, gem: 1 } },
  // ── Chuỗi đăng nhập ──
  { id: 'streak7', icon: '🔥', name: 'Một tuần liên tiếp', desc: 'Đăng nhập 7 ngày liên tục', check: (_s, e) => e.streak >= 7, reward: { xu: 700, gem: 1 } },
  { id: 'streak30', icon: '⚡', name: 'Tháng nông dân', desc: 'Đăng nhập 30 ngày liên tục', check: (_s, e) => e.streak >= 30, reward: { xu: 5000, gem: 3 } },
  // ── Sự kiện vàng ──
  { id: 'golden10', icon: '✨', name: 'Thu hoạch vàng', desc: 'Thu hoạch 10 lần cây vàng', check: (_s, e) => e.goldenHarvests >= 10, reward: { xu: 500, gem: 2 } },
  // ── Đa dạng ──
  { id: 'allCrops', icon: '🌈', name: 'Thu hoạch viên mãn', desc: 'Thu hoạch đủ 5 loại cây khác nhau', check: (_s, e) => e.uniqueCrops.size >= 5, reward: { xu: 1000, gem: 2 } },
];

/** Tính tiến độ hoàn thành (0..1) dựa trên stats hiện tại */
export function achProgress(stats: Stats, extra: AchExtra): { total: number; done: number; pct: number } {
  const done = ACHIEVEMENTS.filter((a) => a.check(stats, extra)).length;
  return { total: ACHIEVEMENTS.length, done, pct: done / ACHIEVEMENTS.length };
}

/** Trả về các thành tựu MỚI đạt được (chưa có trong danh sách đã nhận) */
export function newAchievements(stats: Stats, extra: AchExtra, claimed: Set<string>): AchDef[] {
  return ACHIEVEMENTS.filter((a) => !claimed.has(a.id) && a.check(stats, extra));
}
