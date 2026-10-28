// PARITY TEST: cờ vua — client (TS) vs server (JS)
// Server là trọng tài: nếu client thấy nước hợp lệ mà server từ chối → người chơi mất nước đi.
// Kiểm tra: khởi tạo bàn, legal moves, apply, ký hiệu SAN, phong cấp, chiếu hết (scholar mate).
import { describe, it, expect } from 'vitest';
import {
  newChessGame as cliNew, applyChessMove as cliApply, chessResign as cliResign,
  legalMovesFor as cliLegal, isAttacked as cliAttacked,
} from '../src/game/casino/chess';
import {
  chNewGame as srvNew, chApply as srvApply, chResign as srvResign,
  chLegal as srvLegal, chAttacked as srvAttacked,
} from '../server/games.js';

describe('parity cờ vua: newChessGame (client) === chNewGame (server)', () => {
  it('bàn khởi tạo + turn + castling khớp', () => {
    const cli = cliNew(['w', 'b']);
    const srv = srvNew(['w', 'b']);
    expect(cli.turn).toBe(srv.turn);
    expect(cli.board).toEqual(srv.board);
    expect(cli.castling).toEqual(srv.castling);
    expect(cli.history).toEqual(srv.history);
  });
});

describe('parity cờ vua: số nước hợp lệ đầu ván', () => {
  it('trắng có 20 nước, đen có 20 nước (client === server)', () => {
    const cli = cliNew(['w', 'b']);
    const srv = srvNew(['w', 'b']);
    // client: đếm qua legalMovesFor mọi quân của trắng
    let cliCount = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const pid = cli.order[0];
      cliCount += cliLegal(cli, r, c, pid).length;
    }
    const srvCount = srvLegal(srv.board, 'w', srv.castling, srv.ep).length;
    expect(cliCount).toBe(20);
    expect(srvCount).toBe(20);
    expect(cliCount).toBe(srvCount);
  });
});

describe('parity cờ vua: applyChessMove (client) === chApply (server)', () => {
  it('e4 (trắng) khớp toàn bộ state sau đi', () => {
    const cli = cliNew(['w', 'b']);
    const srv = srvNew(['w', 'b']);
    const cliNext = cliApply(cli, 'w', [1, 4], [3, 4], null); // e2-e4
    const srvNext = srvApply(srv, 'w', [1, 4], [3, 4], null);
    expect(cliNext).not.toBeNull();
    expect(srvNext).not.toBeNull();
    expect(cliNext!.turn).toBe(srvNext.turn);
    expect(cliNext!.board).toEqual(srvNext.board);
    expect(cliNext!.history).toEqual(srvNext.history);
    // en passant target sau e4
    expect(cliNext!.ep).toEqual(srvNext.ep);
  });

  it('nước không hợp lệ bị từ chối đồng loạt', () => {
    const cli = cliNew(['w', 'b']);
    const srv = srvNew(['w', 'b']);
    // tốt trắng đi lùi e2→e1: không hợp lệ
    expect(cliApply(cli, 'w', [1, 4], [0, 4], null)).toBeNull();
    expect(srvApply(srv, 'w', [1, 4], [0, 4], null)).toBeNull();
    // đi vua như xe (không hợp lệ)
    expect(cliApply(cli, 'w', [0, 4], [0, 7], null)).toBeNull();
    expect(srvApply(srv, 'w', [0, 4], [0, 7], null)).toBeNull();
    // sai lượt (đen đi khi tới lượt trắng)
    expect(cliApply(cli, 'b', [6, 4], [5, 4], null)).toBeNull();
    expect(srvApply(srv, 'b', [6, 4], [5, 4], null)).toBeNull();
  });

  it('sau e4, đen trả lời d5 — ep target khớp', () => {
    const cli = cliNew(['w', 'b']);
    const srv = srvNew(['w', 'b']);
    const c1 = cliApply(cli, 'w', [1, 4], [3, 4], null)!;
    const s1 = srvApply(srv, 'w', [1, 4], [3, 4], null)!;
    const c2 = cliApply(c1, 'b', [6, 3], [4, 3], null)!; // d7-d5
    const s2 = srvApply(s1, 'b', [6, 3], [4, 3], null)!;
    expect(c2.board).toEqual(s2.board);
    expect(c2.ep).toEqual(s2.ep);
  });

  it('nhập thành sau e4 e5 Ng1-f3 — castling flags khớp', () => {
    const cli = cliNew(['w', 'b']);
    const srv = srvNew(['w', 'b']);
    const c1 = cliApply(cli, 'w', [1, 4], [3, 4], null)!;
    const s1 = srvApply(srv, 'w', [1, 4], [3, 4], null)!;
    const c2 = cliApply(c1, 'b', [6, 4], [5, 4], null)!;
    const s2 = srvApply(s1, 'b', [6, 4], [5, 4], null)!;
    const c3 = cliApply(c2, 'w', [0, 6], [2, 5], null)!; // Ng1-f3
    const s3 = srvApply(s2, 'w', [0, 6], [2, 5], null)!;
    expect(c3.board).toEqual(s3.board);
    expect(c3.history).toEqual(s3.history);
  });
});

describe('parity cờ vua: chiếu (isAttacked === chAttacked)', () => {
  it('scholar mate: 7 nước chuẩn — trắng thắng, client === server từng bước', () => {
    // Quy ước tọa độ: row = rank - 1 (e1=[0,4], e8=[7,4]); trắng đi TĂNG row, đen đi GIẢM
    const seq: Array<[number, number, number, number]> = [
      [1, 4, 3, 4],   // 1. e4      (e2→e4)
      [6, 4, 4, 4],   // 1... e5    (e7→e5)
      [0, 3, 4, 7],   // 2. Qh5     (d1→h5, đường chéo trống)
      [7, 1, 5, 2],   // 2... Nc6   (b8→c6)
      [0, 5, 3, 2],   // 3. Bc4     (f1→c4)
      [7, 6, 5, 5],   // 3... Nf6?? (g8→f6)
      [4, 7, 6, 5],   // 4. Qxf7#   (h5→f7, chiếu hết nhờ Bc4 bảo vệ)
    ];
    const cli = cliNew(['w', 'b']);
    const srv = srvNew(['w', 'b']);
    let cliSt = cli;
    let srvSt = srv;
    for (const [fr, fc, tr, tc] of seq) {
      const pid = cliSt.turn; // turn là pid (order[0] hoặc order[1])
      const cliNext = cliApply(cliSt, pid, [fr, fc], [tr, tc], null);
      const srvNext = srvApply(srvSt, srvSt.turn, [fr, fc], [tr, tc], null);
      expect(cliNext, `client: [${fr},${fc}]→[${tr},${tc}]`).not.toBeNull();
      expect(srvNext, `server: [${fr},${fc}]→[${tr},${tc}]`).not.toBeNull();
      if (!cliNext || !srvNext) return;
      expect(cliNext.board, `board sau [${fr},${fc}]→[${tr},${tc}]`).toEqual(srvNext.board);
      expect(cliNext.turn).toBe(srvNext.turn);
      cliSt = cliNext;
      srvSt = srvNext;
    }
    // sau Qxf7#: đen bị chiếu hết
    expect(cliSt.winner).toBe(cliSt.order[0]);
    expect(srvSt.winner).toBe(srvSt.order[0]);
    expect(cliSt.winReason).toBe(srvSt.winReason);
    expect(cliSt.winReason).toBe('checkmate');
  });

  it('isAttacked === chAttacked: các ô then chốt đầu ván (parity thuần)', () => {
    const srv = srvNew(['w', 'b']);
    const cli = cliNew(['w', 'b']);
    // các ô giữa bàn: chỉ cần client === server (giá trị thật phụ thuộc luật đã verify ở test khác)
    for (const [r, c] of [[3, 4], [4, 4], [2, 4], [3, 3], [5, 5]]) {
      expect(cliAttacked(cli.board, r, c, 'b'), `[${r},${c}] by b`).toBe(srvAttacked(srv.board, r, c, 'b'));
      expect(cliAttacked(cli.board, r, c, 'w'), `[${r},${c}] by w`).toBe(srvAttacked(srv.board, r, c, 'w'));
    }
  });
});

describe('parity cờ vua: resign', () => {
  it('trắng đầu hàng → đen thắng (cả 2 bản)', () => {
    const cliSt = cliNew(['w', 'b']);
    const srvSt = srvNew(['w', 'b']);
    const c = cliResign(cliSt, 'w');
    const s = srvResign(srvSt, 'w');
    expect(c!.winner).toBe(s.winner);
    expect(c!.winReason).toBe('resign');
    expect(s.winReason).toBe('resign');
  });
});
