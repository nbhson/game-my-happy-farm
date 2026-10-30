// Unit test: thân thiết NPC (friendship.ts) — mốc mức, hệ số thưởng, quà ghé thăm
import { describe, it, expect } from 'vitest';
import {
  FRIEND_THRESHOLDS, FRIEND_LABELS, FRIEND_DELIVER_POINTS, FRIEND_GIFT_POINTS, FRIEND_GIFT_COST,
  friendLevel, friendInfo, friendMul, visitGift, friendGreeting,
} from '../friendship';

describe('friendLevel — mốc 0/15/40/80', () => {
  it('0 điểm = Cháu mới (lv0)', () => {
    expect(friendLevel(0)).toBe(0);
    expect(friendLevel(14)).toBe(0);
  });
  it('15/40/80 điểm lên mức kế', () => {
    expect(friendLevel(15)).toBe(1);
    expect(friendLevel(39)).toBe(1);
    expect(friendLevel(40)).toBe(2);
    expect(friendLevel(79)).toBe(2);
    expect(friendLevel(80)).toBe(3);
    expect(friendLevel(999)).toBe(3); // chặn mức cao nhất
  });
  it('điểm âm coi như 0 (không crash)', () => {
    expect(friendLevel(-5)).toBe(0);
  });
});

describe('friendMul — thưởng theo thân thiết', () => {
  it('lv0 = x1, mỗi mức +4%, tối đa +12%', () => {
    expect(friendMul(0)).toBe(1);
    expect(friendMul(15)).toBeCloseTo(1.04, 5);
    expect(friendMul(40)).toBeCloseTo(1.08, 5);
    expect(friendMul(80)).toBeCloseTo(1.12, 5);
    expect(friendMul(1000)).toBeCloseTo(1.12, 5);
  });
});

describe('friendInfo — nhãn + tim hiển thị', () => {
  it('4 mức có đúng nhãn, tim tăng dần', () => {
    for (let lv = 0; lv < 4; lv++) {
      const info = friendInfo(FRIEND_THRESHOLDS[lv]);
      expect(info.label).toBe(FRIEND_LABELS[lv]);
      expect(info.level).toBe(lv);
    }
    expect(friendInfo(0).hearts).toBe('♡♡♡');
    expect(friendInfo(80).hearts).toBe('❤️❤️❤️');
  });
});

describe('visitGift — quà NPC ghé thăm', () => {
  it('tăng theo mức: 50 → 110 → 170 → 230 (+1 gem ở Tri kỷ)', () => {
    expect(visitGift(0)).toEqual({ xu: 50, gem: 0 });
    expect(visitGift(15)).toEqual({ xu: 110, gem: 0 });
    expect(visitGift(40)).toEqual({ xu: 170, gem: 0 });
    expect(visitGift(80)).toEqual({ xu: 230, gem: 1 });
  });
});

describe('hằng số cân bằng', () => {
  it('giao đơn +8, tặng quà +15 (tốn 50 xu) — tặng rẻ hơn giao nhưng tốn tiền', () => {
    expect(FRIEND_DELIVER_POINTS).toBe(8);
    expect(FRIEND_GIFT_POINTS).toBe(15);
    expect(FRIEND_GIFT_COST).toBe(50);
  });
});

describe('friendGreeting — hội thoại động theo mức', () => {
  it('mỗi mức một câu khác nhau, có tên NPC', () => {
    const lines = [0, 15, 40, 80].map((pts) => friendGreeting('cô Ba', pts));
    expect(new Set(lines).size).toBe(4);
    for (const l of lines) expect(l).toContain('cô Ba');
  });
});
