// PARITY TEST: tiến lên — client (TS) vs server (JS)
// Client validate nước đi, server trọng tài. Lệch = client cho đi mà server từ chối (hoặc ngược lại).
import { describe, it, expect } from 'vitest';
import { comboOf as cliCombo, beats as cliBeats, nextTurn as cliNext } from '../src/game/casino/tienlen';
import { cCombo as srvCombo, cBeats as srvBeats, tlNext as srvNext } from '../server/games.js';

const C = (r: number, s = 0) => ({ r, s, id: `${r}-${s}` });

// ---- comboOf vs cCombo: mọi loại bài ----
const COMBO_CASES: number[][] = [
  [5],                    // single
  [7, 7],                 // pair
  [9, 9, 9],              // triple
  [10, 10, 10, 10],       // four (tứ quý)
  [3, 4, 5],              // straight 3
  [3, 4, 5, 6, 7],        // straight 5
  [10, 11, 12, 13, 14],   // straight J-A (10→A)
  [14, 15],               // A-2 KHÔNG phải sảnh (2 chặn sảnh)
  [3, 5, 7],              // không liên tiếp → null
  [5, 5],                 // pair
  [6, 6, 7],              // invalid
  [15, 15],               // đôi 2 (heo)
  [],                     // rỗng → null
  [2, 3, 4, 5, 6, 7],     // sảnh 6 lá
];

describe('parity tiến lên: comboOf (client) === cCombo (server)', () => {
  it('mọi tổ hợp cho cùng kết quả (type/len/topRank/topSuit)', () => {
    for (const rs of COMBO_CASES) {
      const hand = rs.map((r, i) => C(r, i % 4));
      const cli = cliCombo(hand);
      const srv = srvCombo(hand);
      expect(cli, JSON.stringify(rs)).toEqual(srv);
    }
  });

  it('luật đặc biệt: sảnh không chứa 2, tứ quý = 4 lá cùng rank', () => {
    expect(cliCombo([C(14), C(15)])).toBeNull(); // A-2 không sảnh
    expect(cliCombo([C(10), C(11), C(12), C(13), C(14)])?.type).toBe('straight');
    expect(cliCombo([C(15), C(15)])?.type).toBe('pair'); // đôi 2
  });
});

// ---- beats vs cBeats: chặt nhau ----
describe('parity tiến lên: beats (client) === cBeats (server)', () => {
  const mk = (rs: number[]) => cliCombo(rs.map((r, i) => C(r, i % 4)))!;

  const BEAT_CASES: Array<[number[], number[]]> = [
    [[9], [10]],              // đơn 9 < đơn 10 → true
    [[10], [9]],              // đơn 10 > đơn 9 → false
    [[15], [3]],              // 2 > 3 → false (2 là cao nhất)
    [[3], [15]],              // 3 < 2 → true (thường)
    [[15, 15], [5, 5]],       // đôi 2 > đôi 5 → false
    [[5, 5], [15, 15]],       // đôi 5 < đôi 2 → true
    [[3], [10, 10]],          // khác loại → false
    [[3, 4, 5], [5, 6, 7]],   // sảnh 3 < sảnh 3 (top cao hơn) → true
    [[5, 6, 7], [3, 4, 5]],   // sảnh top thấp hơn → false
    [[3, 4, 5, 6], [6, 7, 8, 9]], // sảnh 4 < sảnh 4 → true
    [[5, 5, 5], [8, 8, 8]],   // triple → true
    [[8, 8, 8], [5, 5, 5]],   // triple → false
    [[9, 9, 9, 9], [15]],     // tứ quý chặt 2 → true
    [[9, 9, 9, 9], [15, 15]], // tứ quý chặt đôi 2 → true
    [[9, 9, 9, 9], [5]],      // tứ quý chặt đơn thường → false
    [[13, 13, 13, 13], [9, 9, 9, 9]], // tứ quý > tứ quý → true
    [[9, 9, 9, 9], [13, 13, 13, 13]], // tứ quý < tứ quý → false
    [[10], [14]],             // đơn 10 < đơn A → true
  ];

  it('mọi cặp chặt cho cùng kết quả', () => {
    for (const [prevRs, nextRs] of BEAT_CASES) {
      const prev = mk(prevRs);
      const next = mk(nextRs);
      if (!prev || !next) continue;
      const cli = cliBeats(prev, next);
      const srv = srvBeats(prev, next);
      expect(cli, `${JSON.stringify(prevRs)} vs ${JSON.stringify(nextRs)}`).toBe(srv);
    }
  });

  it('luật tứ quý chặt 2/đôi 2 hoạt động cả 2 bản', () => {
    const four = mk([9, 9, 9, 9]);
    const two = mk([15]);
    const pairTwo = mk([15, 15]);
    expect(cliBeats(two, four)).toBe(true);
    expect(srvBeats(two, four)).toBe(true);
    expect(cliBeats(pairTwo, four)).toBe(true);
    expect(srvBeats(pairTwo, four)).toBe(true);
  });

  it('đồng chất chỉ thắng khi cùng rank + chất cao hơn (single)', () => {
    const prev = { type: 'single' as const, len: 1, topRank: 10, topSuit: 2 };
    const nextLowerSuit = { type: 'single' as const, len: 1, topRank: 10, topSuit: 1 };
    const nextHigherSuit = { type: 'single' as const, len: 1, topRank: 10, topSuit: 3 };
    expect(cliBeats(prev, nextLowerSuit)).toBe(srvBeats(prev, nextLowerSuit));
    expect(cliBeats(prev, nextLowerSuit)).toBe(false);
    expect(cliBeats(prev, nextHigherSuit)).toBe(srvBeats(prev, nextHigherSuit));
    expect(cliBeats(prev, nextHigherSuit)).toBe(true);
  });
});

// ---- nextTurn vs tlNext ----
describe('parity tiến lên: nextTurn (client) === tlNext (server)', () => {
  const mkSt = (order: string[], handLens: Record<string, number>) => ({
    order,
    hands: Object.fromEntries(order.map((id) => [id, Array.from({ length: handLens[id] ?? 0 }, (_, i) => C(i))])) as Record<string, ReturnType<typeof C>[]>,
  });

  const CASES: Array<[string[], Record<string, number>, string]> = [
    [['a', 'b', 'c'], { a: 3, b: 3, c: 3 }, 'a'],  // thường: a → b
    [['a', 'b', 'c'], { a: 3, b: 0, c: 3 }, 'a'],  // b hết bài → a → c
    [['a', 'b', 'c'], { a: 3, b: 0, c: 0 }, 'a'],  // chỉ còn a → a
    [['a', 'b'], { a: 0, b: 3 }, 'a'],             // a hết → b
  ];

  it('lượt kế tiếp khớp (bỏ người hết bài)', () => {
    for (const [order, lens, from] of CASES) {
      const st = mkSt(order, lens);
      expect(cliNext(st as never, from), JSON.stringify([order, lens])).toBe(srvNext(st as never, from));
    }
  });
});
