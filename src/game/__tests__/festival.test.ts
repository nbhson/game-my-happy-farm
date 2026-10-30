// Unit test: Lễ hội mùa vụ (festival.ts) — lễ hội cuối tuần theo ngày thực
import { describe, it, expect } from 'vitest';
import { isFestival, festivalLabel, FESTIVAL_SELL_MUL, FESTIVAL_ORDER_MUL } from '../festival';

describe('isFestival — cuối tuần (T7/CN)', () => {
  it('2026-10-31 là Thứ 7, 2026-11-01 là Chủ nhật → lễ hội', () => {
    expect(isFestival('2026-10-31')).toBe(true);  // Saturday
    expect(isFestival('2026-11-01')).toBe(true);  // Sunday
  });
  it('ngày trong tuần thì không lễ hội', () => {
    expect(isFestival('2026-10-30')).toBe(false); // Friday
    expect(isFestival('2026-11-02')).toBe(false); // Monday
    expect(isFestival('2026-11-06')).toBe(false); // Friday
  });
  it('sai định dạng → false (không crash)', () => {
    expect(isFestival('')).toBe(false);
    expect(isFestival('not-a-date')).toBe(false);
  });
  it('cả 7 ngày của 1 tuần bất kỳ có đúng 2 ngày lễ hội', () => {
    // tuần 2026-11-09 (CN)... chọn tuần bắt đầu T2: 2026-11-09 là T2
    let count = 0;
    for (let d = 9; d <= 15; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      if (isFestival(date)) count++;
    }
    expect(count).toBe(2);
  });
});

describe('hệ số lễ hội — luôn có lợi nhưng không quá mạnh', () => {
  it('bán x1.25, đơn hàng x1.3 — trong khoảng 1..2', () => {
    expect(FESTIVAL_SELL_MUL).toBe(1.25);
    expect(FESTIVAL_ORDER_MUL).toBe(1.3);
    expect(FESTIVAL_SELL_MUL).toBeGreaterThan(1);
    expect(FESTIVAL_ORDER_MUL).toBeLessThan(2);
  });
  it('nhãn lễ hội: ngày thường rỗng, cuối tuần có tên', () => {
    expect(festivalLabel('2026-10-30')).toBe('');
    expect(festivalLabel('2026-10-31')).toContain('lễ hội');
  });
});
