// PARITY TEST: caro — client (TS) vs server (JS)
// Client hiển thị đường thắng, server trọng tài công nhận thắng. Lệch = tranh cãi.
import { describe, it, expect } from 'vitest';
import { checkWin as cliCheckWin, emptyBoard as cliEmpty } from '../src/game/casino/caro';
import { caroWin as srvCheckWin } from '../server/games.js';

const SIZE = 12;
const mkBoard = () => Array.from({ length: SIZE }, () => Array<number | null>(SIZE).fill(null));

describe('parity caro: checkWin (client) === caroWin (server)', () => {
  const cases: Array<{ name: string; stones: Array<[number, number]>; at: [number, number]; win: boolean }> = [
    { name: '5 ngang', stones: [[5, 3], [5, 4], [5, 5], [5, 6], [5, 7]], at: [5, 5], win: true },
    { name: '5 dọc', stones: [[2, 4], [3, 4], [4, 4], [5, 4], [6, 4]], at: [4, 4], win: true },
    { name: '5 chéo ↘', stones: [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]], at: [3, 3], win: true },
    { name: '5 chéo ↗', stones: [[6, 2], [5, 3], [4, 4], [3, 5], [2, 6]], at: [4, 4], win: true },
    { name: '4 ngang — chưa thắng', stones: [[5, 3], [5, 4], [5, 5], [5, 6]], at: [5, 5], win: false },
    { name: 'ngắt ngang giữa (5,5 là X nhưng 5,6 là null)', stones: [[5, 3], [5, 4], [5, 5]], at: [5, 4], win: false },
    { name: '6 liên tiếp (thắng, line cắt 5)', stones: [[5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7]], at: [5, 4], win: true },
    { name: 'ô rỗng → null', stones: [], at: [0, 0], win: false },
    { name: 'gần biên: 5 ngang cuối bàn', stones: [[11, 3], [11, 4], [11, 5], [11, 6], [11, 7]], at: [11, 5], win: true },
  ];

  it('mọi ca: client === server (line win hoặc null)', () => {
    for (const tc of cases) {
      const b = mkBoard();
      for (const [r, c] of tc.stones) b[r][c] = 1; // X
      const cli = cliCheckWin(b, tc.at[0], tc.at[1]);
      const srv = srvCheckWin(b, tc.at[0], tc.at[1]);
      if (tc.win) {
        expect(cli, `${tc.name}: client`).not.toBeNull();
        expect(srv, `${tc.name}: server`).not.toBeNull();
        expect(cli, `${tc.name}: parity line`).toEqual(srv);
      } else {
        expect(cli, `${tc.name}: client null`).toBeNull();
        expect(srv, `${tc.name}: server null`).toBeNull();
      }
    }
  });

  it('line thắng trả về đúng 5 toạ độ thuộc đường thắng', () => {
    const b = mkBoard();
    for (const [r, c] of [[5, 3], [5, 4], [5, 5], [5, 6], [5, 7]] as Array<[number, number]>) b[r][c] = 1;
    const line = srvCheckWin(b, 5, 5)!;
    expect(line).toHaveLength(5);
    for (const [r, c] of line) expect(b[r][c]).toBe(1);
  });

  it('board client và server cùng tạo rỗng — kích thước khớp', () => {
    const cliB = cliEmpty(SIZE);
    expect(cliB.length).toBe(SIZE);
    expect(cliB[0].length).toBe(SIZE);
  });
});
