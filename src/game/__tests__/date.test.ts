// Unit test: logic ngày (todayKey/yesterdayKey) — cốt lõi của daily streak
import { describe, it, expect } from 'vitest';
import { todayKey, yesterdayKey, daysBetweenKeys } from '../date';

describe('todayKey / yesterdayKey', () => {
  it('định dạng YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayKey(new Date(2026, 10, 3))).toBe('2026-11-03');
  });

  it('hôm qua: qua ranh giới cuối tháng', () => {
    expect(yesterdayKey(new Date(2026, 2, 1))).toBe('2026-02-28'); // 2026 không nhuận
    expect(yesterdayKey(new Date(2024, 2, 1))).toBe('2024-02-29'); // 2024 nhuận
    expect(yesterdayKey(new Date(2026, 0, 1))).toBe('2025-12-31'); // cuối năm
    expect(yesterdayKey(new Date(2026, 11, 31))).toBe('2026-12-30');
  });

  it('yesterdayKey(todayKey(d)) lệch đúng 1 ngày cho mọi ngày trong năm 2026', () => {
    for (let m = 0; m < 12; m++) {
      const last = new Date(2026, m + 1, 0).getDate();
      for (let dd = 1; dd <= last; dd++) {
        const d = new Date(2026, m, dd);
        expect(daysBetweenKeys(yesterdayKey(d), todayKey(d))).toBe(1);
      }
    }
  });

  it('todayKey(d) - yesterdayKey(d) == 1 ngày kể cả năm nhuận', () => {
    expect(daysBetweenKeys(yesterdayKey(new Date(2024, 2, 1)), todayKey(new Date(2024, 2, 1)))).toBe(1);
    expect(daysBetweenKeys('2025-12-31', '2026-01-01')).toBe(1);
  });
});
