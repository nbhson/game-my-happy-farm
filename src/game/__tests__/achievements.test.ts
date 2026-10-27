// Unit test: hệ thống thành tựu (pure logic)
import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, achProgress, newAchievements } from '../achievements';
import type { Stats } from '../types';

const freshStats = (): Stats => ({
  hoed: 0, planted: 0, watered: 0, harvested: 0,
  boughtAnimal: 0, fed: 0, collectedAnimal: 0,
  stockedFish: 0, earned: 0, fished: 0,
});

const extra = {
  level: 1, streak: 1, goldenHarvests: 0,
  animalCount: 0, uniqueCrops: new Set<string>(), xu: 0,
};

describe('ACHIEVEMENTS', () => {
  it('id duy nhất, mỗi cái có icon/name/desc/reward', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.icon.length).toBeGreaterThan(0);
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.desc.length).toBeGreaterThan(0);
      expect(a.reward.xu ?? a.reward.gem ?? 0).toBeGreaterThan(0);
    }
  });

  it('chưa đạt mốc thì không có thành tựu mới', () => {
    expect(newAchievements(freshStats(), extra, new Set())).toHaveLength(0);
  });

  it('harv10 đạt khi harvested >= 10', () => {
    const stats = { ...freshStats(), harvested: 10 };
    const ids = newAchievements(stats, extra, new Set()).map((a) => a.id);
    expect(ids).toContain('harv10');
    expect(ids).not.toContain('harv50');
  });

  it('đã nhận thì không báo mới lần nữa', () => {
    const stats = { ...freshStats(), harvested: 10 };
    expect(newAchievements(stats, extra, new Set(['harv10']))).toHaveLength(0);
  });

  it('level / streak / golden / animal dựa trên extra', () => {
    const e = { ...extra, level: 10, streak: 7, goldenHarvests: 10, animalCount: 10 };
    const ids = newAchievements(freshStats(), e, new Set()).map((a) => a.id);
    expect(ids).toContain('lv5');
    expect(ids).toContain('lv10');
    expect(ids).toContain('streak7');
    expect(ids).toContain('golden10');
    expect(ids).toContain('animal10');
  });

  it('allCrops cần đủ 5 loại nông sản khác nhau', () => {
    const crops = new Set(['lua', 'carrot', 'tomato', 'corn', 'eggplant']);
    const ids = newAchievements(freshStats(), { ...extra, uniqueCrops: crops }, new Set()).map((a) => a.id);
    expect(ids).toContain('allCrops');
    // 4 loại chưa đủ
    const few = new Set(['lua', 'carrot', 'tomato', 'corn']);
    expect(newAchievements(freshStats(), { ...extra, uniqueCrops: few }, new Set()).map((a) => a.id)).not.toContain('allCrops');
  });
});

describe('achProgress', () => {
  it('pct = done/total', () => {
    const stats = { ...freshStats(), harvested: 10 }; // đạt harv10
    const p = achProgress(stats, extra);
    expect(p.total).toBe(ACHIEVEMENTS.length);
    expect(p.done).toBeGreaterThanOrEqual(1);
    expect(p.pct).toBeCloseTo(p.done / p.total, 5);
  });
});
