// PARITY TEST: giá trị bài xì dách + bài cào — client (TS) vs server (JS)
// Client hiển thị điểm, server quyết định thắng/thua. Nếu 2 bản lệch,
// người chơi thấy điểm khác kết quả thật → mất lòng tin. Phải khớp 100%.
import { describe, it, expect } from 'vitest';
import { xiDachValue as cliXdValue, xiDachStrength as cliXdStrength } from '../src/game/casino/xidach';
import { cardPoint as cliBcPoint, scoreHand as cliBcScore } from '../src/game/casino/baicao';
import { xdValue as srvXdValue, xdStrength as srvXdStrength, bcPoint as srvBcPoint, bcScore as srvBcScore } from '../server/games.js';

const C = (r: number, s = 0) => ({ r, s, id: `${r}-${s}` });

// Thứ hạng: 2 3 4 5 6 7 8 9 10 J Q K A | 2 (r=15)
const HANDS: number[][] = [
  [],                    // tay rỗng
  [14],                  // xì đơn
  [14, 14],              // xì bàng
  [14, 13],              // A + K = 21 (xì dách)
  [14, 6],               // A mềm = 17
  [14, 14, 6],           // 2 xì + 6 = 18 (gập 1 xì)
  [14, 14, 14, 6],       // 3 xì + 6 = 19
  [13, 12, 10],          // K Q 10 = 30 quắc
  [10, 9, 5],            // 24 quắc
  [15, 15],              // hai lá 2 = 4
  [15, 14],              // 2 + A = 13
  [5, 5, 5, 5, 5],       // 25 quắc
  [2, 3, 4, 5, 6],       // 20
  [11, 11],              // J J = 20
  [15, 13, 12],          // 2 + K + Q = 22 quắc
];

describe('parity xì dách: xiDachValue (client) === xdValue (server)', () => {
  it('mọi tổ hợp bài cho cùng giá trị', () => {
    for (const rs of HANDS) {
      const hand = rs.map((r, i) => C(r, i % 4));
      expect(cliXdValue(hand), JSON.stringify(rs)).toBe(srvXdValue(hand));
    }
  });

  it('giá trị đúng theo luật: A=11 mềm, JQK=10, 2=2, quắc > 21', () => {
    expect(srvXdValue([C(14), C(6)])).toBe(17);      // A mềm
    expect(srvXdValue([C(14), C(13)])).toBe(21);     // xì dách
    expect(srvXdValue([C(14), C(14)])).toBe(12);     // 2 xì: 22 → gập 1 xì còn 12 (bonus xì bàng nằm ở strength=600)
    expect(srvXdValue([C(13), C(12), C(10)])).toBe(30); // quắc
    expect(srvXdValue([C(15)])).toBe(2);             // lá 2
  });

  it('xì bàng phải là tay mạnh nhất (strength parity)', () => {
    for (const rs of HANDS) {
      if (rs.length === 0) continue;
      const hand = rs.map((r, i) => C(r, i % 4));
      const cli = cliXdStrength(hand);
      const srv = srvXdStrength(hand);
      // strength trả về mảng [kind, ...] — so sánh toàn phần
      expect(cli, JSON.stringify(rs)).toEqual(srv);
    }
  });
});

describe('parity bài cào: cardPoint/scoreHand (client) === bcPoint/bcScore (server)', () => {
  it('điểm từng lá khớp', () => {
    for (const r of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
      expect(cliBcPoint(r), `r=${r}`).toBe(srvBcPoint(r));
    }
  });

  it('điểm tay khớp (score + top)', () => {
    const hands = [
      [C(14), C(5), C(5)],       // 1+5+5 = 11 → 1
      [C(13), C(12), C(11)],     // 3 tây = cào (10)
      [C(9), C(9), C(9)],        // 27 → 7
      [C(15), C(15), C(15)],     // 6
      [C(14), C(14), C(14)],     // 3
    ];
    for (const hand of hands) {
      const cli = cliBcScore(hand);
      const srv = srvBcScore(hand);
      expect(cli.score, JSON.stringify(hand.map((c) => c.r))).toBe(srv.score);
      expect(cli.top, JSON.stringify(hand.map((c) => c.r))).toEqual(srv.top);
    }
  });

  it('3 tây luôn là cào (score 10) trên cả 2 bản', () => {
    const threeFaces = [C(11, 0), C(12, 1), C(13, 2)];
    expect(cliBcScore(threeFaces).score).toBe(10);
    expect(srvBcScore(threeFaces).score).toBe(10);
  });
});
