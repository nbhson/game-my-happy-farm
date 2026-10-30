// ===== THÂN THIẾT NPC (Đợt 4) — pure module, test được =====
// Giao đơn cho NPC nào thì thân thiết với NPC đó tăng. Thân thiết càng cao:
// - Đơn của NPC đó được trả hậu hĩnh hơn (mỗi mức +4%).
// - Tặng quà NPC được (50 xu / lần / ngày / NPC) → +15 điểm thân thiết.
// - Giao hết đơn trong ngày → NPC thân thiết nhất ghé thăm cảm ơn (quà theo mức).
export interface FriendDef {
  name: string;
  level: number; // 0..3
  label: string; // "Cháu mới" / "Người quen" / "Bạn tốt" / "Tri kỷ"
  hearts: string; // '♡' x n
}

/** Mốc điểm lên mức thân thiết: 0 / 15 / 40 / 80 */
export const FRIEND_THRESHOLDS = [0, 15, 40, 80];
export const FRIEND_LABELS = ['Cháu mới', 'Người quen', 'Bạn tốt', 'Tri kỷ'];
/** Điểm nhận khi giao 1 đơn cho NPC */
export const FRIEND_DELIVER_POINTS = 8;
/** Điểm nhận khi tặng quà (tốn xu) */
export const FRIEND_GIFT_POINTS = 15;
/** Giá 1 lần tặng quà */
export const FRIEND_GIFT_COST = 50;

/** Mức thân thiết (0..3) theo điểm */
export function friendLevel(points: number): number {
  let lv = 0;
  for (let i = 0; i < FRIEND_THRESHOLDS.length; i++) {
    if (points >= FRIEND_THRESHOLDS[i]) lv = i;
  }
  return lv;
}

/** Thông tin hiển thị của 1 NPC theo điểm thân thiết */
export function friendInfo(points: number): FriendDef {
  const lv = friendLevel(points);
  return {
    name: '',
    level: lv,
    label: FRIEND_LABELS[lv],
    hearts: '❤️'.repeat(lv) + '♡'.repeat(3 - lv),
  };
}

/** Hệ số thưởng đơn hàng theo thân thiết (mỗi mức +4%, tối đa +12%) */
export function friendMul(points: number): number {
  return 1 + 0.04 * friendLevel(points);
}

/** Quà NPC ghé thăm cảm ơn (khi giao hết đơn trong ngày): xu + gem theo mức */
export function visitGift(points: number): { xu: number; gem: number } {
  const lv = friendLevel(points);
  return { xu: 50 + lv * 60, gem: lv >= 3 ? 1 : 0 };
}

/** Câu chào của NPC theo mức thân thiết (hội thoại động trong sổ đơn) */
export function friendGreeting(npcName: string, points: number): string {
  const lv = friendLevel(points);
  switch (lv) {
    case 0: return `${npcName}: "Cháu là ai vậy? Ừ thì... đặt đơn thử"`;
    case 1: return `${npcName}: "À cháu đấy! Lần này nhớ giao đủ nhé"`;
    case 2: return `${npcName}: "Cháu làm ăn đấy chứ! Cô/Chú tin cháu lắm"`;
    default: return `${npcName}: "Tri kỷ của làng đây rồi! Có gì tốt cô/chú để dành cho cháu"`;
  }
}
