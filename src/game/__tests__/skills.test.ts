// Unit test: kỹ năng người chơi (Nông/Chăn/Câu) — pure module skills.ts
// Ràng buộc: curve XP tăng dần, perk luôn >= 1 (không bao giờ làm tệ đi),
// level chặn ở SKILL_MAX_LV, tiến trình trong cấp nhất quán với level.
import { describe, it, expect } from 'vitest';
import {
  SKILL_MAX_LV, SKILL_NAMES, skillXpNeed, skillLv, skillProgress,
  farmGrowthMul, farmGoldenBonus, animalPriceMul, animalHungerMul,
  fishPriceMul, fishBiteWindowMul, skillXpFor,
} from '../skills';

describe('skillXpNeed — curve XP', () => {
  it('cấp 1 cần 120, tăng đều theo cấp', () => {
    expect(skillXpNeed(1)).toBe(120);
    expect(skillXpNeed(2)).toBe(240);
    expect(skillXpNeed(5)).toBe(600);
  });
  it('chặn ở SKILL_MAX_LV (không âm/không 0)', () => {
    expect(skillXpNeed(0)).toBe(120);
    expect(skillXpNeed(99)).toBe(SKILL_MAX_LV * 120);
    expect(skillXpNeed(99)).toBeGreaterThan(0);
  });
});

describe('skillLv / skillProgress — lên cấp', () => {
  it('0 XP = Lv1', () => {
    expect(skillLv(0)).toBe(1);
    const p = skillProgress(0);
    expect(p.lv).toBe(1);
    expect(p.cur).toBe(0);
    expect(p.need).toBe(120);
  });
  it('đủ 120 XP = Lv2; cấp dồn đều qua các mốc', () => {
    expect(skillLv(120)).toBe(2);
    expect(skillLv(120 + 240)).toBe(3);
    expect(skillLv(120 + 239)).toBe(2);
  });
  it('chặn ở Lv tối đa dù XP khổng lồ', () => {
    expect(skillLv(99999999)).toBe(SKILL_MAX_LV);
  });
  it('progress cur luôn < need khi chưa max, max thì cur=need=0', () => {
    for (let xp = 0; xp <= 10000; xp += 137) {
      const p = skillProgress(xp);
      if (p.lv >= SKILL_MAX_LV) expect(p.cur).toBe(0);
      else expect(p.cur).toBeLessThan(p.need);
    }
  });
});

describe('perk — luôn có lợi, tăng theo cấp, chặn max', () => {
  it('farm: growth >= 1, golden >= 0, tăng dần', () => {
    expect(farmGrowthMul(0)).toBe(1);
    expect(farmGoldenBonus(0)).toBe(0);
    expect(farmGrowthMul(500)).toBeGreaterThan(farmGrowthMul(100));
    expect(farmGoldenBonus(500)).toBeGreaterThan(farmGoldenBonus(100));
    // chặn: XP nhiều cỡ nào cũng không vượt trần perk
    expect(farmGrowthMul(9999999)).toBeCloseTo(1 + 0.03 * (SKILL_MAX_LV - 1), 5);
  });
  it('animal: giá bán >= 1, đói chậm hơn nhưng không dưới 0.55', () => {
    expect(animalPriceMul(0)).toBe(1);
    expect(animalPriceMul(8000)).toBeCloseTo(1 + 0.04 * (SKILL_MAX_LV - 1), 5);
    expect(animalHungerMul(0)).toBe(1);
    expect(animalHungerMul(9999999)).toBeGreaterThanOrEqual(0.55);
    expect(animalHungerMul(500)).toBeLessThan(animalHungerMul(100));
  });
  it('fish: giá bán + cửa sổ giật cần tăng dần', () => {
    expect(fishPriceMul(0)).toBe(1);
    expect(fishBiteWindowMul(0)).toBe(1);
    expect(fishPriceMul(1000)).toBeGreaterThan(fishPriceMul(200));
    expect(fishBiteWindowMul(1000)).toBeGreaterThan(fishBiteWindowMul(200));
    expect(fishPriceMul(9999999)).toBeCloseTo(1 + 0.05 * (SKILL_MAX_LV - 1), 5);
  });
});

describe('skillXpFor — XP mỗi hành động', () => {
  it('mọi hành động cho XP dương, thu hoạch/giật cá cao hơn cuốc đất', () => {
    for (const action of ['hoe', 'plant', 'water', 'fert', 'harvest']) {
      expect(skillXpFor('farm', action)).toBeGreaterThan(0);
    }
    for (const action of ['feed', 'collect']) expect(skillXpFor('animal', action)).toBeGreaterThan(0);
    for (const action of ['grown', 'catch']) expect(skillXpFor('fish', action)).toBeGreaterThan(0);
    expect(skillXpFor('farm', 'harvest')).toBeGreaterThan(skillXpFor('farm', 'hoe'));
    expect(skillXpFor('fish', 'catch')).toBeGreaterThan(skillXpFor('fish', 'grown'));
  });
});

describe('SKILL_NAMES — đủ 3 skill, mô tả không rỗng', () => {
  it('farm/animal/fish đều có tên + perk', () => {
    for (const k of ['farm', 'animal', 'fish'] as const) {
      expect(SKILL_NAMES[k].name.length).toBeGreaterThan(0);
      expect(SKILL_NAMES[k].perk.length).toBeGreaterThan(0);
      expect(SKILL_NAMES[k].icon.length).toBeGreaterThan(0);
    }
  });
});
