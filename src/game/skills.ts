// ===== KỸ NĂNG NGƯỜI CHƠI (Đợt 2): Nông / Chăn / Câu — pure module, test được =====
// Mỗi skill có XP riêng, tích từ hành động trong game (không mua được):
// - farm:   cuốc / gieo / tưới / thu hoạch cây + bón phân
// - animal: cho ăn / thu sản phẩm vật nuôi
// - fish:   cá ao lớn ra / cá sông dính câu
// Level tối đa 10, mỗi cấp cho perk vĩnh viễn (không cần chọn — đậm chất idle farm).
export type SkillKind = 'farm' | 'animal' | 'fish';

/** 3 skill + tên/icon/mô tả (dùng cho modal) */
export const SKILL_NAMES: Record<SkillKind, { name: string; icon: string; desc: string; perk: string }> = {
  farm: { name: 'Nông nghiệp', icon: '🌾', desc: 'Cuốc, gieo, tưới, bón phân, thu hoạch', perk: '+3% tốc độ lớn cây, +0.8% tỉ lệ vàng / cấp' },
  animal: { name: 'Chăn nuôi', icon: '🐄', desc: 'Cho ăn, thu trứng/sữa/lông', perk: '+4% giá bán sản phẩm, đói chậm hơn / cấp' },
  fish: { name: 'Câu cá', icon: '🎣', desc: 'Cá ao lớn ra, cá sông dính câu', perk: '+5% giá bán cá, cửa sổ giật cần dài hơn / cấp' },
};

/** Cấp tối đa của mỗi skill */
export const SKILL_MAX_LV = 10;
/** XP cần để lên cấp kế tiếp (cấp 1→2 cần 120, 2→3 cần 240…) */
export function skillXpNeed(lv: number): number {
  return Math.max(1, Math.min(SKILL_MAX_LV, lv)) * 120;
}
/** Cấp hiện tại theo tổng XP (chặn ở SKILL_MAX_LV) */
export function skillLv(xp: number): number {
  let lv = 1, left = Math.max(0, xp);
  while (lv < SKILL_MAX_LV && left >= skillXpNeed(lv)) { left -= skillXpNeed(lv); lv++; }
  return lv;
}
/** Tiến trình trong cấp hiện tại: { lv, cur, need } (cur == need là sắp lên cấp) */
export function skillProgress(xp: number): { lv: number; cur: number; need: number } {
  const lv = skillLv(xp);
  if (lv >= SKILL_MAX_LV) return { lv, cur: 0, need: 0 }; // max: cần 0 để không hiện thanh
  let left = Math.max(0, xp), l = 1;
  while (l < SKILL_MAX_LV && left >= skillXpNeed(l)) { left -= skillXpNeed(l); l++; }
  return { lv, cur: left, need: skillXpNeed(l) };
}

// ---- Perk theo cấp (dùng trong store) ----
/** farm: cộng thêm vào tốc độ lớn cây theo level (skillLv của XP farm) */
export function farmGrowthMul(farmXp: number): number {
  return 1 + 0.03 * (skillLv(farmXp) - 1);
}
/** farm: cộng thêm tỉ lệ cây vàng (so với gốc 8%) */
export function farmGoldenBonus(farmXp: number): number {
  return 0.008 * (skillLv(farmXp) - 1);
}
/** animal: hệ số giá bán sản phẩm vật nuôi (trứng/sữa/lông…) */
export function animalPriceMul(animalXp: number): number {
  return 1 + 0.04 * (skillLv(animalXp) - 1);
}
/** animal: hệ số tốc độ đói (nhỏ hơn = chậm đói hơn) */
export function animalHungerMul(animalXp: number): number {
  return Math.max(0.55, 1 - 0.045 * (skillLv(animalXp) - 1));
}
/** fish: hệ số giá bán cá (ao + sông) */
export function fishPriceMul(fishXp: number): number {
  return 1 + 0.05 * (skillLv(fishXp) - 1);
}
/** fish: hệ số giãn cửa sổ bấm mũi tên khi cá cắn câu */
export function fishBiteWindowMul(fishXp: number): number {
  return 1 + 0.05 * (skillLv(fishXp) - 1);
}

/** XP skill được từ 1 hành động — gom về 1 chỗ để cân bằng/test */
export function skillXpFor(kind: SkillKind, action: string): number {
  switch (kind) {
    case 'farm':
      switch (action) {
        case 'hoe': return 2;
        case 'plant': return 3;
        case 'water': return 2;
        case 'fert': return 3;
        case 'harvest': return 5;
        default: return 1;
      }
    case 'animal':
      switch (action) {
        case 'feed': return 2;
        case 'collect': return 4;
        default: return 1;
      }
    case 'fish':
      switch (action) {
        case 'grown': return 3; // cá ao lớn ra
        case 'catch': return 6; // cá sông dính câu
        default: return 1;
      }
  }
}
