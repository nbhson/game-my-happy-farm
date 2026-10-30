// ===== SỔ ĐƠN HÀNG: 3 đơn NPC/ngày — giao đủ vật phẩm ăn thưởng to =====
import { useEffect } from 'react';
import { itemName, sellPrice } from '../game/data';
import { ORDER_NPCS, ORDER_REROLL_COST, orderBaseValue } from '../game/orders';
import { useGame } from '../game/store';
import type { FarmOrder } from '../game/types';
import { GameIcon, iconForPid } from './GameIcon';
import { sfx } from '../game/audio';

const NPC_EMOJI: Record<string, string> = Object.fromEntries(ORDER_NPCS.map((n) => [n.name, n.emoji]));

export default function OrdersModal() {
  const s = useGame();
  const touchOrders = useGame((st) => st.touchOrders);
  // mở modal → đảm bảo đơn hôm nay đúng ngày (qua 00:00 → đơn mới)
  useEffect(() => { touchOrders(); }, [touchOrders]);
  return <OrdersPanel />;
}

/** Panel đơn hàng — dùng chung cho modal riêng và tab "Đơn" trong cửa hàng */
export function OrdersPanel() {
  const s = useGame();
  const orders = s.orders;

  if (!orders.length) {
    return (
      <div className="text-center space-y-2 py-6">
        <p className="text-4xl">📦</p>
        <p className="font-black text-sm">Đã giao hết đơn hôm nay!</p>
        <p className="text-[12px] font-bold opacity-70">Sáng mai NPC lại tới đặt đơn mới — nhớ lên kho nông sản nhé!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-bold opacity-70">
        Mỗi ngày 3 đơn — giao đủ nhận <b>150–180% giá bán</b> + XP, đơn hiếm có gem 💎. Đổi đơn khác tốn {ORDER_REROLL_COST} xu.
      </p>
      {orders.map((o) => (
        <OrderCard key={o.id} o={o} />
      ))}
    </div>
  );
}

function OrderCard({ o }: { o: FarmOrder }) {
  const s = useGame();
  const base = orderBaseValue(o);
  const profit = o.xu - base;
  const canDeliver = Object.entries(o.items).every(([pid, n]) => (s.inv[pid] || 0) >= n);

  return (
    <div className={`border-[3px] rounded-lg p-2.5 ${canDeliver ? 'border-green-600 bg-green-50' : 'border-[#2b2117] bg-white'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-2xl">{NPC_EMOJI[o.npc] ?? '🧑‍🌾'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[13px] truncate">{o.npc} đặt đơn</p>
          <p className="text-[11px] text-stone-500 font-bold">Thưởng: {o.xu.toLocaleString('vi-VN')} xu + {o.xp} XP {o.xu - base > 0 ? <span className="text-green-700">(+{(o.xu - base).toLocaleString('vi-VN')} lãi)</span> : null}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {Object.entries(o.items).map(([pid, n]) => {
          const have = s.inv[pid] || 0;
          const [nm] = itemName(pid);
          return (
            <span
              key={pid}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 text-[12px] font-extrabold ${have >= n ? 'border-green-600 bg-green-100' : 'border-red-400 bg-red-50'}`}
              title={`${nm} — đang có ${have}/${n} (bán lẻ ${sellPrice(pid)} xu/cái)`}
            >
              <GameIcon name={iconForPid(pid)} size={18} />{nm} {have}/{n}
            </span>
          );
        })}
        {o.gem > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-cyan-500 bg-cyan-50 text-[12px] font-extrabold">
            💎 +{o.gem} gem
          </span>
        )}
      </div>
      <div className="flex gap-1.5">
        <button
          disabled={!canDeliver}
          onClick={() => { const r = s.deliverOrder(o.id); if (r.ok) sfx.coin(); else { sfx.error(); s.toast(r.msg); } }}
          className={`flex-1 py-2 rounded-lg border-[3px] border-black font-black text-[13px] active:scale-95 ${canDeliver ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-gray-300 text-gray-600'}`}
        >
          {canDeliver ? '📦 Giao hàng' : 'Chưa đủ hàng'}
        </button>
        <button
          onClick={() => { const r = s.rerollOrder(o.id); if (!r.ok) { sfx.error(); s.toast(r.msg); } }}
          className="px-3 py-2 rounded-lg border-[3px] border-black bg-sky-300 font-black text-[13px] hover:bg-sky-200 active:scale-95"
          title={`Đổi đơn khác (-${ORDER_REROLL_COST} xu)`}
        >
          🔄 Đổi đơn
        </button>
      </div>
    </div>
  );
}
