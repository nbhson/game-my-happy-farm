// ===== MODAL THÀNH TỰU — xem tiến độ + lịch sử đã nhận =====
import { useGame } from '../game/store';
import { ACHIEVEMENTS, achProgress } from '../game/achievements';

export default function AchModal() {
  const s = useGame();
  const claimed = new Set(s.achSeen);
  const uniqueCrops = new Set(
    Object.keys(s.inv).filter(
      (k) => !k.startsWith('seed:') && !k.startsWith('bait:') && k !== 'feed' && k !== 'pesticide' && (s.inv[k] ?? 0) > 0,
    ),
  );
  const extra = {
    level: s.level, streak: s.daily.streak ?? 1,
    goldenHarvests: s.goldenHarvests, animalCount: s.animals.length,
    uniqueCrops, xu: s.xu,
  };
  const { total, done, pct } = achProgress(s.stats, extra);

  return (
    <div className="space-y-3">
      {/* ── Thanh tiến độ tổng ── */}
      <div className="bg-amber-100 border-2 border-[#2b2117] rounded-lg p-3">
        <div className="flex justify-between text-sm font-bold mb-1">
          <span>Tiến độ thành tựu</span>
          <span className="text-amber-700">{done}/{total}</span>
        </div>
        <div className="h-3 bg-black/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
            style={{ width: `${(pct * 100).toFixed(1)}%` }}
          />
        </div>
      </div>
      {/* ── Lưới thành tựu ── */}
      <div className="grid grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto pr-1">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = claimed.has(a.id) || a.check(s.stats, extra);
          return (
            <div
              key={a.id}
              className={`border-2 rounded-lg p-2 text-center transition-all ${
                unlocked
                  ? 'bg-amber-50 border-amber-400'
                  : 'bg-gray-100 border-gray-300 opacity-70'
              }`}
            >
              <div className={`text-2xl mb-0.5 ${unlocked ? '' : 'grayscale'}`}>{a.icon}</div>
              <div className={`text-[11px] font-bold leading-tight ${unlocked ? 'text-amber-800' : 'text-gray-500'}`}>
                {a.name}
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">{a.desc}</div>
              {unlocked && (
                <div className="mt-1 text-[10px] text-green-700 font-bold">
                  {[a.reward.xu ? `+${a.reward.xu} xu` : '', a.reward.gem ? `+${a.reward.gem} gem` : '']
                    .filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
