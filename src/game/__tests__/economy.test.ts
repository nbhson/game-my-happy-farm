// Unit test: kinh tế (sellPrice) — ràng buộc "không phá kinh tế đã cân bằng"
import { describe, it, expect } from 'vitest';
import { sellPrice, CROPS, FISHES, ANIMALS } from '../data';

describe('sellPrice — hợp đồng kinh tế', () => {
  it('cây rẻ nhất (Lúa 28) < đắt nhất, giá tăng theo cấp', () => {
    const prices = Object.values(CROPS).map((c) => c.sell);
    expect(Math.min(...prices)).toBe(28); // Lúa
    expect(Math.max(...prices)).toBeGreaterThan(1000); // cây cao cấp
  });

  it('mọi loại cây có giá bán > giá hạt (lợi nhuận dương)', () => {
    for (const c of Object.values(CROPS)) {
      expect(c.sell).toBeGreaterThan(c.seedPrice);
    }
  });

  it('sản phẩm vật nuôi: giá theo đúng bảng đã cân bằng (bug fix cũ)', () => {
    // các mốc đã chỉnh theo level (không được đổi — phá cân bằng)
    expect(sellPrice('trung')).toBe(45);
    expect(sellPrice('trungvit')).toBe(110); // vịt lv6 > gà lv2
    expect(sellPrice('sua')).toBe(140);
    expect(sellPrice('thit')).toBe(420);
    expect(sellPrice('len')).toBe(360);
    expect(sellPrice('suatrau')).toBe(700); // trâu lv22 mạnh nhất
    expect(sellPrice('trungngong')).toBe(200);
  });

  it('cá đắt nhất bán được nhiều hơn cá rẻ nhất', () => {
    const sells = Object.values(FISHES).map((f) => f.sell);
    expect(Math.min(...sells)).toBeGreaterThan(0);
    expect(Math.max(...sells)).toBeGreaterThan(Math.min(...sells) * 3);
  });

  it('sellPrice của cây = CROPS.sell (không bonus ẩn)', () => {
    for (const [id, c] of Object.entries(CROPS)) {
      expect(sellPrice(id)).toBe(c.sell);
    }
  });

  it('mọi def có đầy đủ name/giá/xp hợp lệ (emoji là optional — cây vẽ pixel-art)', () => {
    for (const [id, c] of Object.entries(CROPS)) {
      expect(c.name, id).toBeTruthy();
      expect(c.seedPrice, id).toBeGreaterThan(0);
      expect(c.grow, id).toBeGreaterThan(0);
      expect(c.xp, id).toBeGreaterThan(0);
      expect(c.sell, id).toBeGreaterThan(c.seedPrice); // luôn có lãi
    }
    for (const [id, f] of Object.entries(FISHES)) {
      expect(f.name, id).toBeTruthy();
      expect(f.babyPrice, id).toBeGreaterThan(0);
      expect(f.sell, id).toBeGreaterThan(f.babyPrice); // nuôi lãi
    }
    for (const [id, a] of Object.entries(ANIMALS)) {
      expect(a.babyPrice, id).toBeGreaterThan(0);
      expect(a.cycle, id).toBeGreaterThan(0);
    }
  });
});
