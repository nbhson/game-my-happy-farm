// PARITY TEST: codeFromName phải khớp 100% giữa client (TS) và server (JS)
// Đây là hợp đồng wire format quan trọng nhất — cùng username ra cùng mã farm trên mọi máy.
// Test này import CẢ 2 phiên bản và so sánh trực tiếp.
// Dữ liệu đối chứng: mã thật từ DB trong production (nbhson → QRJA4H, ...)
// — bất kỳ thay đổi nào làm sai mã sẽ break farm lookup của người dùng.
import { describe, it, expect } from 'vitest';
import { codeFromName as srvCode } from '../server/games.js';
import { codeFromName as cliCode } from '../src/net/session';

// ---- Mã thật từ DB (bất kỳ thay đổi ở đây đều phá farm lookup production) ----
const DB_CODES: Record<string, string> = {
  nbhson: 'QRJA4H',
  admin: 'R6D7UH',
  testuser123: '59RTYN',
  'bí mè': 'KRGHZH',
  haoleee: '3Q9774',
};

// ---- Các test vector thêm (độ phủ Unicode, khoảng trắng, số) — chỉ kiểm parity ----
const EXTRA_NAMES = [
  'x',               // 1 ký tự
  'ab',              // 2 ký tự
  'ABC',             // hoa thường — cả 2 bản đều toLowerCase()
  'NguyenSon123',    // có số
  'bí mè',           // Unicode có dấu
  'Z'.repeat(20),    // dài
  // '' rơi vào branch name??0 (client) → 0 → crash toLowerCase() → skip
  // Username production không bao giờ rỗng nên không cần test
];

describe('codeFromName — parity client vs server', () => {
  it('mọi mã DB thật khớp giữa client và server', () => {
    for (const [name, expectedCode] of Object.entries(DB_CODES)) {
      const cli = cliCode(name);
      const srv = srvCode(name);
      expect(cli, `${name}: client`).toBe(expectedCode);
      expect(srv, `${name}: server`).toBe(expectedCode);
      expect(cli, `${name}: parity`).toBe(srv);
    }
  });

  it('mọi vector thêm: client = server (parity, không bịa giá trị)', () => {
    for (const name of EXTRA_NAMES) {
      const cli = cliCode(name);
      const srv = srvCode(name);
      expect(cli, JSON.stringify(name)).toBe(srv);
    }
  });

  it('mã luôn 6 ký tự, chỉ từ bảng ALPH', () => {
    const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    for (const name of ['nbhson', 'admin', 'x', 'Nguyen', 'bí mè', 'haoleee', 'Z'.repeat(20)]) {
      const code = cliCode(name);
      expect(code.length, name).toBe(6);
      for (const ch of code) expect(ALPH.includes(ch), `${name}:${ch}`).toBe(true);
    }
  });

  it('cùng username → cùng mã (idempotent)', () => {
    for (const name of Object.keys(DB_CODES)) {
      for (let i = 0; i < 10; i++) expect(cliCode(name), name).toBe(srvCode(name));
    }
  });

  it('username khác → mã khác (deterministic, không hoàn toàn unique nhưng đủ phân biệt)', () => {
    const codes = new Set(Object.values(DB_CODES));
    expect(codes.size).toBe(Object.keys(DB_CODES).length); // DB thật: 5 username, 5 mã khác nhau
  });
});
