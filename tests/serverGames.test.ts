// Unit test: logic casino server (games.js) — import TRỰC TIẾP không cần chạy server
// File này nằm ngoài tsconfig (include: src) nên không cần @ts-ignore cho import .js
import { describe, it, expect } from 'vitest';
import {
  cDeck, touchDeadline,
  casinoStartRoom, casinoSkipTurn, casinoAutoTimeout,
  xdValue, xdNewGame, xdHit, xdStand, xdRemovePlayer,
  caroWin, bcScore,
  chNewGame, chApply, chResign, chLegal, chMaterial,
} from '../server/games.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mkRoom = (game = 'tienlen', pids: string[] = ['p1', 'p2', 'p3']): any => ({
  id: 'TEST', game, bet: 10, hostPid: 'p1',
  players: pids.map((pid, i) => ({ pid, name: pid, avatar: i, bot: false })),
  status: 'waiting', state: null as any, winners: null as any, pot: 0, createdAt: 0, updatedAt: 0,
});

// ---- xì dách ----
describe('xdValue', () => {
  it('A=11 mềm: A+6 = 17', () => {
    expect(xdValue([{ r: 14, s: 0 }, { r: 6, s: 1 }])).toBe(17);
    const v = xdValue([{ r: 14, s: 0 }, { r: 13, s: 1 }]); // A + K = 21
    expect(v).toBe(21);
  });
  it('quắc khi tổng > 21', () => {
    expect(xdValue([{ r: 13, s: 0 }, { r: 12, s: 1 }, { r: 5, s: 2 }])).toBeGreaterThan(21);
  });
});

describe('xdNewGame', () => {
  it('chia đủ 2 lá mỗi người + nhà cái 2 lá, phase=play', () => {
    const st = xdNewGame(['p1', 'p2'], cDeck());
    expect(st.phase).toBe('play');
    expect(st.hands.p1).toHaveLength(2);
    expect(st.hands.p2).toHaveLength(2);
    expect(st.dealer).toHaveLength(2); // nhà cái giữ 2 lá
    expect(st.turn).toBeTruthy();
  });
});

describe('xdHit / xdStand', () => {
  it('xdHit tăng hand', () => {
    const st = xdNewGame(['p1', 'p2'], cDeck());
    const before = st.hands.p1.length;
    const next = xdHit(st, 'p1');
    expect(next.hands.p1.length).toBeGreaterThan(before);
  });

  it('xdStand đổi turn', () => {
    const st = xdNewGame(['p1', 'p2'], cDeck());
    const turnBefore = st.turn;
    const next = xdStand(st, 'p1');
    expect(next.turn).not.toBe(turnBefore);
  });

  it('xdRemovePlayer rời phòng', () => {
    const st = xdNewGame(['p1', 'p2', 'p3'], cDeck());
    st.phase = 'play'; st.turn = 'p1';
    const after = xdRemovePlayer(st, 'p1');
    expect(after.order).not.toContain('p1');
  });
});

// ---- cờ vua ----
describe('chNewGame', () => {
  // Quy ước server: TRẮNG ở hàng 0-1 (đi TĂNG chỉ số hàng), đen ở hàng 6-7
  it('bàn khởi tạo đúng: vua trắng e1(hàng0), vua đen e8(hàng7)', () => {
    const st = chNewGame(['a', 'b']);
    expect(st.turn).toBe('a'); // trắng đi trước
    expect(st.board[0][4]).toEqual({ t: 'k', c: 'w' });
    expect(st.board[7][4]).toEqual({ t: 'k', c: 'b' });
    expect(st.board[0][0]).toEqual({ t: 'r', c: 'w' }); // xe trắng
    expect(st.history).toEqual([]);
  });

  it('chLegal: đầu ván có đúng 20 nước cho trắng', () => {
    const st = chNewGame(['a', 'b']);
    expect(chLegal(st.board, 'w', st.castling, st.ep)).toHaveLength(20);
  });

  it('chApply: tốt trắng e2-e4 (hàng1 → hàng3) hợp lệ, đổi lượt', () => {
    const st = chNewGame(['a', 'b']);
    const next = chApply(st, 'a', [1, 4], [3, 4], null); // e2-e4
    expect(next).not.toBeNull();
    expect(next.turn).toBe('b');
    expect(next.history).toContain('e4');
  });

  it('chApply: từ chối nước không hợp lệ', () => {
    const st = chNewGame(['a', 'b']);
    expect(chApply(st, 'a', [4, 4], [5, 4], null)).toBeNull(); // đứng yên
    expect(chApply(st, 'b', [1, 4], [3, 4], null)).toBeNull(); // lượt trắng mà đen đi
  });

  it('chResign: đối thủ thắng', () => {
    const st = chNewGame(['a', 'b']);
    const after = chResign(st, 'a');
    expect(after.winner).toBe('b');
    expect(after.winReason).toBe('resign');
  });

  it('chMaterial: v-không-quân = hòa', () => {
    const bd = Array.from({ length: 8 }, () => Array(8).fill(null));
    bd[7][4] = { t: 'k', c: 'w' }; bd[0][4] = { t: 'k', c: 'b' };
    expect(chMaterial(bd)).toBe(true);
    // có thêm tốt = đấu được
    bd[3][3] = { t: 'p', c: 'w' };
    expect(chMaterial(bd)).toBe(false);
  });
});

// ---- casino phòng ----
describe('casinoStartRoom', () => {
  it('thiếu người → báo lỗi', () => {
    const room = mkRoom('tienlen', ['p1']);
    const err = casinoStartRoom(room);
    expect(err).toBeTruthy();
    expect(typeof err).toBe('string');
  });

  it('tiến lên 2 người → chia 13 lá mỗi người, pot=bet*2', () => {
    const room = mkRoom('tienlen', ['p1', 'p2']);
    expect(casinoStartRoom(room)).toBeNull();
    expect(room.status).toBe('playing');
    expect(room.state.hands.p1).toHaveLength(13);
    expect(room.state.hands.p2).toHaveLength(13);
    expect(room.pot).toBe(20);
  });

  it('cờ vua cần đúng 2 người', () => {
    const room = mkRoom('chess', ['p1', 'p2']);
    expect(casinoStartRoom(room)).toBeNull();
    expect(room.state.order).toHaveLength(2);
  });

  it('cờ vua 3 người → báo lỗi', () => {
    const room = mkRoom('chess', ['p1', 'p2', 'p3']);
    expect(casinoStartRoom(room)).toBeTruthy();
    expect(casinoStartRoom(room)).not.toBeNull();
  });
});

describe('casinoSkipTurn', () => {
  it('người rời không còn turn', () => {
    const room = mkRoom('tienlen', ['p1', 'p2', 'p3']);
    casinoStartRoom(room);
    const loser = room.state.turn;
    casinoSkipTurn(room, loser);
    expect(room.state.turn).not.toBe(loser);
  });
});

// ---- helpers ----
describe('caroWin', () => {
  // caroWin trả về MẢNG 5 toạ độ thắng (hoặc null) — không phải boolean
  it('5 quân liên tiếp ngang = thắng (trả về line)', () => {
    const b = Array.from({ length: 12 }, () => Array(12).fill(null));
    for (let c = 3; c < 8; c++) b[5][c] = 'X';
    const line = caroWin(b, 5, 5);
    expect(line).not.toBeNull();
    expect(line).toHaveLength(5);
  });
  it('chưa đủ 5 → null', () => {
    const b = Array.from({ length: 12 }, () => Array(12).fill(null));
    b[0][0] = 'X'; b[0][1] = 'X'; b[0][2] = 'X';
    expect(caroWin(b, 0, 1)).toBeNull();
  });
});

describe('bcScore (bài cào 3 lá) — trả { score, top }', () => {
  it('3 Tây (J Q K) = cào (score 10)', () => {
    expect(bcScore([{ r: 13, s: 0 }, { r: 12, s: 1 }, { r: 11, s: 2 }]).score).toBe(10);
  });
  it('A+5+5 = 1 điểm', () => {
    expect(bcScore([{ r: 14, s: 0 }, { r: 5, s: 1 }, { r: 5, s: 2 }]).score).toBe(1);
  });
});

describe('touchDeadline', () => {
  it('không crash khi room chưa có state', () => {
    expect(() => touchDeadline({ game: 'tienlen', state: null })).not.toThrow();
  });
  it('đặt deadline hợp lệ cho mỗi game type', () => {
    const r = { game: 'tienlen', state: { deadline: 0 as unknown } };
    touchDeadline(r);
    expect(typeof r.state.deadline).toBe('number');
    expect(r.state.deadline).toBeGreaterThan(Date.now());
  });
});
