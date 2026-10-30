// ===== SỔ ĐƠN HÀNG: NPC trong làng đặt nông sản — giao đủ ăn thưởng to =====
// Pure module (không đụng store) để test được không cần DOM.
// Nguyên tắc cân bằng:
// - Đơn chỉ chứa vật phẩm NGƯỜI CHƠI Ở CẤP ĐÓ kiếm được (giá bán <= cap theo level).
// - Thưởng xu = 1.5-1.8x tổng giá bán → giao đơn luôn lãi hơn bán lẻ.
// - 15% đơn có gem (1-2) để endgame vẫn có động lực giao.
import { CROPS, FISHES, PRODUCT_NAMES, sellPrice } from './data';
import { RECIPES } from './interiors';
import type { FarmOrder } from './types';

/** NPC đặt đơn + icon trong modal */
export const ORDER_NPCS: { name: string; emoji: string; flavor: string }[] = [
  { name: 'cô Ba', emoji: '👵', flavor: 'Cần nguyên liệu nấu ăn gấp lắm!' },
  { name: 'chú Tám', emoji: '👴', flavor: 'Chế đồ xong thèm mỉa miệng quá!' },
  { name: 'anh Tý gara', emoji: '🔧', flavor: 'Đem đi tiếp khách xa đây!' },
  { name: 'bác Thợ Rèn', emoji: '🔨', flavor: 'Lò hồng hun bụng thăm thẳm!' },
  { name: 'chị Hoa quán cafe', emoji: '☕', flavor: 'Quán đông khách, hết nguyên liệu!' },
  { name: 'ông Chánh hội quán', emoji: '📜', flavor: 'Chuẩn bị tiệc làng cuối tuần!' },
  { name: 'dì Bé tạp hóa', emoji: '🛒', flavor: 'Kệ hàng trống trơn rồi!' },
  { name: 'cậu Bảy ngư quán', emoji: '🎣', flavor: 'Bàn ăn cá dựng sẵn chờ hàng!' },
];

/** Số đơn mở cùng lúc */
export const ORDER_SLOTS = 3;
/** Giá đổi 1 đơn khác (reroll) */
export const ORDER_REROLL_COST = 50;

/** RNG seedable (mulberry32) — sinh đơn deterministic theo (ngày, slot) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** hash key ngày 'YYYY-MM-DD' + slot -> số seed ổn định */
export function dateSeed(date: string, slot: number): number {
  let h = 2166136261;
  const s = date + ':' + slot;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Pool pid có thể xuất hiện trong đơn ở level hiện tại:
 *  cây/cá theo lv mở khóa, sản phẩm chăn nuôi + món nấu theo giá bán (vẽ lại đường cong level) */
export function orderPool(level: number): string[] {
  const cap = 220 * level; // ~đường giá bán của cây theo level
  const pool: string[] = [];
  for (const id in CROPS) if (CROPS[id].lv <= level) pool.push(id);
  for (const id in FISHES) if (FISHES[id].lv <= level) pool.push(id);
  for (const pid in PRODUCT_NAMES) {
    if (['feed', 'feedPro', 'bait', 'baitPro', 'pesticide', 'fert', 'fertPro', 'ung', 'rong'].includes(pid)) continue;
    if (sellPrice(pid) <= cap) pool.push(pid);
  }
  return pool;
}

/** Số lượng cần cho 1 pid: đồ rẻ cần nhiều, đồ đắt cần ít (400/sell, chặn 1..6) */
export function qtyFor(sell: number): number {
  return Math.max(1, Math.min(6, Math.round(400 / sell)));
}

/** Sinh 1 đơn theo seed — trả về null nếu pool trống (level quá thấp vẫn có lúa nên hiếm khi null) */
export function genOrder(level: number, date: string, slot: number): FarmOrder | null {
  const pool = orderPool(level);
  if (!pool.length) return null;
  const rng = mulberry32(dateSeed(date, slot) + level);
  const npc = ORDER_NPCS[Math.floor(rng() * ORDER_NPCS.length) % ORDER_NPCS.length];
  // 1-2 loại vật phẩm: 70% 1 loại, 30% 2 loại
  const two = pool.length >= 2 && rng() < 0.3;
  const items: Record<string, number> = {};
  let total = 0;
  const pick = () => {
    let pid = pool[Math.floor(rng() * pool.length) % pool.length];
    // tránh trùng pid khi chọn 2 loại
    if (items[pid] != null && two) pid = pool[(pool.indexOf(pid) + 1 + Math.floor(rng() * (pool.length - 1))) % pool.length];
    const n = qtyFor(sellPrice(pid));
    items[pid] = n;
    total += sellPrice(pid) * n;
  };
  pick();
  if (two) pick();
  const mult = 1.5 + rng() * 0.3; // 1.5x..1.8x
  const gemR = rng();
  return {
    id: `o_${date}_${slot}`,
    npc: npc.name,
    items,
    xu: Math.max(50, Math.round((total * mult) / 10) * 10),
    xp: Math.max(6, Math.round(total / 12)),
    gem: gemR < 0.15 ? (rng() < 0.25 ? 2 : 1) : 0,
  };
}

/** Sinh bộ đơn hôm nay (ORDER_SLOTS đơn) */
export function genOrders(level: number, date: string): FarmOrder[] {
  const out: FarmOrder[] = [];
  for (let slot = 0; slot < ORDER_SLOTS; slot++) {
    const o = genOrder(level, date, slot);
    if (o) out.push(o);
  }
  return out;
}

/** Đơn mới thay đơn vừa đổi (reroll) — seed lệch slot gốc để ra đơn khác */
export function rerollGen(level: number, date: string, oldId: string): FarmOrder | null {
  const base = dateSeed(date, 99) ^ (oldId.length * 7919 + (oldId.charCodeAt(oldId.length - 1) || 0) * 104729);
  const pool = orderPool(level);
  if (!pool.length) return null;
  const rng = mulberry32(base + level * 31 + Math.floor(Date.now() / 86400000));
  const npc = ORDER_NPCS[Math.floor(rng() * ORDER_NPCS.length) % ORDER_NPCS.length];
  const items: Record<string, number> = {};
  let total = 0;
  const two = pool.length >= 2 && rng() < 0.3;
  const pick = () => {
    let pid = pool[Math.floor(rng() * pool.length) % pool.length];
    if (items[pid] != null && two) pid = pool[(pool.indexOf(pid) + 1 + Math.floor(rng() * (pool.length - 1))) % pool.length];
    const n = qtyFor(sellPrice(pid));
    items[pid] = n;
    total += sellPrice(pid) * n;
  };
  pick();
  if (two) pick();
  const mult = 1.5 + rng() * 0.3;
  return {
    id: `o_${date}_r${(base % 99999) | 0}`,
    npc: npc.name,
    items,
    xu: Math.max(50, Math.round((total * mult) / 10) * 10),
    xp: Math.max(6, Math.round(total / 12)),
    gem: rng() < 0.15 ? (rng() < 0.25 ? 2 : 1) : 0,
  };
}

/** Tổng giá bán lẻ của các món trong đơn (so với thưởng để hiện "lãi +x%") */
export function orderBaseValue(o: FarmOrder): number {
  let t = 0;
  for (const [pid, n] of Object.entries(o.items)) t += sellPrice(pid) * n;
  return t;
}
