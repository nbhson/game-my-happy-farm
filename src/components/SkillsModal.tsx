// ===== MODAL KỸ NĂNG: 3 thanh XP Nông/Chăn/Câu + perk hiện tại =====
import { SKILL_MAX_LV, SKILL_NAMES, skillProgress, skillXpFor, type SkillKind } from '../game/skills';
import { useGame } from '../game/store';

const SKILL_ACTIONS: Record<SkillKind, string> = {
  farm: 'Cuốc +2 · Gieo +3 · Tưới +2 · Bón phân +3 · Thu hoạch +5',
  animal: 'Cho ăn +2 · Thu sản phẩm +4',
  fish: 'Cá ao lớn ra +3 · Cá sông dính câu +6',
};

const BAR_COLOR: Record<SkillKind, string> = {
  farm: '#66bb6a',
  animal: '#ef8a62',
  fish: '#4fc3f7',
};

export default function SkillsModal() {
  const skills = useGame((s) => s.skills);
  const kinds: SkillKind[] = ['farm', 'animal', 'fish'];

  return (
    <div className="space-y-3">
      <p className="text-[12px] font-bold opacity-70">
        Làm gì nhiều thì giỏi việc đó — XP kỹ năng tự tích từ hành động, lên cấp nhận perk vĩnh viễn (tối đa Lv{SKILL_MAX_LV}). Mỗi cấp: +100 xu +1 gem!
      </p>
      {kinds.map((k) => {
        const def = SKILL_NAMES[k];
        const p = skillProgress(skills[k]);
        const maxed = p.lv >= SKILL_MAX_LV;
        const pct = maxed ? 100 : Math.min(100, (p.cur / Math.max(1, p.need)) * 100);
        return (
          <div key={k} className="border-[3px] border-[#2b2117] rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{def.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-[13px] leading-tight">
                  {def.name} <span className="text-[11px] font-extrabold text-amber-700">Lv{p.lv}{maxed ? ' (TỐI ĐA)' : ''}</span>
                </p>
                <p className="text-[11px] text-stone-500 font-bold leading-tight">{def.desc}</p>
              </div>
              <span className="text-[11px] font-extrabold text-stone-600 shrink-0">
                {maxed ? '⭐' : `${p.cur}/${p.need} XP`}
              </span>
            </div>
            {/* thanh tiến trình */}
            <div className="h-3.5 rounded-full bg-stone-200 border-2 border-[#2b2117]/70 overflow-hidden mb-1.5">
              <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: BAR_COLOR[k] }} />
            </div>
            <p className="text-[11px] font-extrabold text-green-800">🎓 {def.perk}</p>
            <p className="text-[11px] text-stone-500 font-bold">Cách tích: {SKILL_ACTIONS[k]}</p>
          </div>
        );
      })}
      <p className="text-[11px] font-bold opacity-60 text-center">
        Mẹo: tổng XP tích được ở mức {skillXpFor('farm', 'harvest')} XP/thu hoạch — trồng + thu đều tay là lên cấp nhanh nhất!
      </p>
    </div>
  );
}
