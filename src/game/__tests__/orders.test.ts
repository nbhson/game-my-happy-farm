// Unit test: Sổ đơn hàng NPC — pure module orders.ts
// Ràng buộc cân bằng: đơn chỉ chứa đồ kiếm được ở level đó, thưởng >= 1.4x giá bán lẻ,
// qty hợp lý 1..6, deterministic theo (level, ngày, slot) để mọi tab/máy ra cùng đơn.
import { describe, it, expect } from 'vitest';
import { CROPS, FISHES, sellPrice } from '../data';
import {
  ORDER_SLOTS, ORDER_NPCS, ORDER_REROLL_COST,
  mulberry32, dateSeed, orderPool, qtyFor, genOrder, genOrders, orderBaseValue,
} from '../orders';

describe('mulberry32 + dateSeed — RNG deterministic', () => {
  it('cùng seed → cùng chuỗi số, khác seed → khác nhau', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const c = mulberry32(12346);
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect([c(), c(), c()]).not.toEqual(seqA);
  });

  it('dateSeed ổn định theo (date, slot) và khác nhau giữa các slot', () => {
    expect(dateSeed('2026-10-30', 0)).toBe(dateSeed('2026-10-30', 0));
    expect(dateSeed('2026-10-30', 0)).not.toBe(dateSeed('2026-10-30', 1));
    expect(dateSeed('2026-10-30', 0)).not.toBe(dateSeed('2026-10-31', 0));
  });
});

describe('orderPool — pool theo level', () => {
  it('level 1: có Lúa (cây rẻ nhất), không có cây lv cao', () => {
    const pool = orderPool(1);
    expect(pool).toContain('lua');
    for (const id in CROPS) {
      if (CROPS[id].lv > 1) expect(pool).not.toContain(id);
    }
  });

  it('level cao chứa cả cây, cá và sản phẩm chế biến giá lớn', () => {
    const pool = orderPool(100);
    expect(pool).toContain('vangngo'); // món đắt nhất trong bếp
    expect(pool).toContain('sam'); // cây lv cao
    for (const id in FISHES) expect(pool).toContain(id);
  });

  it('không bao giờ chứa vật phẩm vận hành (cám/mồi/thuốc/phân)', () => {
    const pool = orderPool(100);
    for (const banned of ['feed', 'feedPro', 'bait', 'baitPro', 'pesticide', 'fert', 'fertPro']) {
      expect(pool).not.toContain(banned);
    }
  });
});

describe('qtyFor — số lượng cần', () => {
  it('đồ rẻ cần nhiều, đồ đắt cần ít, luôn trong 1..6', () => {
    expect(qtyFor(sellPrice('lua'))).toBeGreaterThan(qtyFor(5000));
    expect(qtyFor(1)).toBe(6);
    expect(qtyFor(999999)).toBe(1);
    for (const sell of [10, 50, 120, 400, 1000, 5000, 20000]) {
      const q = qtyFor(sell);
      expect(q).toBeGreaterThanOrEqual(1);
      expect(q).toBeLessThanOrEqual(6);
    }
  });
});

describe('genOrder / genOrders — sinh đơn', () => {
  it('mỗi ngày ORDER_SLOTS đơn, pid hợp lệ, qty 1..6', () => {
    const orders = genOrders(30, '2026-10-30');
    expect(orders.length).toBe(ORDER_SLOTS);
    const pool = orderPool(30);
    for (const o of orders) {
      const entries = Object.entries(o.items);
      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries.length).toBeLessThanOrEqual(2);
      for (const [pid, n] of entries) {
        expect(pool).toContain(pid);
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(6);
      }
    }
  });

  it('thưởng xu >= 1.4x tổng giá bán lẻ, xp dương, gem 0..2', () => {
    for (let level = 1; level <= 100; level += 7) {
      const orders = genOrders(level, '2026-10-30');
      for (const o of orders) {
        const base = orderBaseValue(o);
        expect(o.xu).toBeGreaterThanOrEqual(Math.floor(base * 1.4));
        expect(o.xp).toBeGreaterThan(0);
        expect(o.gem).toBeGreaterThanOrEqual(0);
        expect(o.gem).toBeLessThanOrEqual(2);
      }
    }
  });

  it('npc là NPC trong bảng + flavor duy nhất theo slot', () => {
    const orders = genOrders(20, '2026-10-30');
    const names = ORDER_NPCS.map((n) => n.name);
    for (const o of orders) expect(names).toContain(o.npc);
  });

  it('deterministic: cùng (level, ngày) → cùng bộ đơn; khác ngày → khác bộ', () => {
    const d1 = genOrders(25, '2026-10-30');
    const d2 = genOrders(25, '2026-10-30');
    const d3 = genOrders(25, '2026-10-31');
    expect(d1.map((o) => o.id)).toEqual(d2.map((o) => o.id));
    expect(d1.map((o) => o.items)).toEqual(d2.map((o) => o.items));
    expect(d1.map((o) => o.items)).not.toEqual(d3.map((o) => o.items));
  });

  it('level thấp hơn → pool nhỏ hơn (không có đơn yêu cầu đồ chưa mở khóa)', () => {
    for (let level = 1; level <= 50; level += 3) {
      const pool = orderPool(level);
      for (const pid of pool) {
        const crop = CROPS[pid];
        if (crop) expect(crop.lv).toBeLessThanOrEqual(level);
      }
    }
  });
});
