// ===== MINIGAME ĐUỔI CHUỘT KHO LÚA — 20s, dập đầu chuột đổi điểm lấy xu =====
// Whack-a-mole 3x3 bằng React thuần: chuột nhòe ra ngẫu nhiên, bấm trúng +1,
// chuột vàng (trùm) +3, bấm trúng bẫy nấm độc -2. Điểm = 12 xu, >=20 điểm +1 gem.
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { sfx } from '../game/audio';

const GAME_DUR = 20; // giây
const CELL_MS = 900; // chuột đổi chỗ mỗi ~0.9s

interface Mole {
  cell: number; // 0..8
  kind: 'normal' | 'gold' | 'trap';
  until: number; // epoch ms ẩn đi
}

/** Chọn 1 ô trống + loại chuột (normal 70%, gold 15%, trap 15%) */
function spawnMole(occupied: Set<number>): Mole | null {
  const free = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => !occupied.has(c));
  if (!free.length) return null;
  const cell = free[Math.floor(Math.random() * free.length)];
  const r = Math.random();
  const kind = r < 0.7 ? 'normal' : r < 0.85 ? 'gold' : 'trap';
  const until = Date.now() + (kind === 'gold' ? 700 : CELL_MS);
  return { cell, kind, until };
}

export default function MoleModal() {
  const moleResult = useGame((s) => s.moleResult);
  const moleBest = useGame((s) => s.moleBest);
  const moleCooldown = useGame((s) => s.moleCooldown);
  const toast = useGame((s) => s.toast);

  const now = Date.now();
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DUR);
  const [moles, setMoles] = useState<Mole[]>([]);
  const [result, setResult] = useState<{ xu: number; gem: number; best: boolean } | null>(null);
  const [hit, setHit] = useState<{ cell: number; ok: boolean } | null>(null);
  const scoreRef = useRef(0);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimers = () => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    spawnTimerRef.current = null; tickTimerRef.current = null;
  };
  useEffect(() => stopTimers, []);

  const endGame = () => {
    stopTimers();
    setPlaying(false);
    setMoles([]);
    const r = moleResult(scoreRef.current);
    setResult(r);
  };

  const start = () => {
    if (moleCooldown > Date.now()) { toast('⏳ Chuột còn sợ hãi — đợi chút rồi chơi tiếp!'); return; }
    scoreRef.current = 0;
    setScore(0); setTimeLeft(GAME_DUR); setMoles([]); setResult(null);
    setPlaying(true);
    // spawn chuột: 1-2 con cùng lúc, giữ đến hết hạn
    spawnTimerRef.current = setInterval(() => {
      setMoles((prev) => {
        const live = prev.filter((m) => m.until > Date.now());
        const occupied = new Set(live.map((m) => m.cell));
        const want = Math.random() < 0.35 ? 2 : 1;
        const next = [...live];
        for (let k = 0; k < want - live.length && k < 2; k++) {
          const m = spawnMole(occupied);
          if (m) { next.push(m); occupied.add(m.cell); }
        }
        return next;
      });
    }, 550);
    // đồng hồ đếm ngược
    tickTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { return 0; }
        return t - 1;
      });
    }, 1000);
    sfx.click();
  };

  // hết giờ → kết thúc
  useEffect(() => {
    if (playing && timeLeft <= 0) endGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, playing]);

  const whack = (cell: number) => {
    if (!playing) return;
    const m = moles.find((x) => x.cell === cell && x.until > Date.now());
    if (!m) { sfx.error(); return; }
    const pts = m.kind === 'gold' ? 3 : m.kind === 'trap' ? -2 : 1;
    scoreRef.current = Math.max(0, scoreRef.current + pts);
    setScore(scoreRef.current);
    setHit({ cell, ok: pts > 0 });
    setTimeout(() => setHit(null), 220);
    if (m.kind === 'gold') sfx.golden();
    else if (m.kind === 'trap') sfx.error();
    else sfx.plant();
    setMoles((prev) => prev.filter((x) => x.cell !== cell));
  };

  // ---- màn hình cooldown ----
  if (!playing && !result && moleCooldown > now) {
    const secs = Math.ceil((moleCooldown - now) / 1000);
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">⏳</div>
        <p className="font-black text-sm">Bầy chuột trốn đi rồi!</p>
        <p className="text-[12px] font-bold opacity-70">Chơi lại sau {secs}s — kho lúa cần nghỉ ngơi</p>
      </div>
    );
  }

  // ---- màn hình kết quả ----
  if (result) {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-5xl">{result.best ? '🥇' : '🐭'}</p>
        <p className="font-black text-lg">{result.best ? 'KỶ LỤC MỚI!' : 'Hết giờ!'}</p>
        <p className="font-extrabold text-sm">Điểm: {scoreRef.current} · Kỷ lục: {Math.max(moleBest, scoreRef.current)}</p>
        <p className="font-extrabold text-sm text-green-700">
          Nhận: +{result.xu} xu{result.gem ? ' +1 gem 💎' : ''}
        </p>
        <button onClick={start} className="px-6 py-2.5 rounded-xl border-[3px] border-black bg-amber-300 font-black hover:bg-amber-200 active:scale-95">
          🐭 Chơi lại
        </button>
      </div>
    );
  }

  // ---- màn hình chờ ----
  if (!playing) {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-5xl">🐭</p>
        <p className="font-black text-sm">Đuổi chuột kho lúa</p>
        <p className="text-[12px] font-bold opacity-70 leading-relaxed">
          20 giây — bấm trúng chuột thường +1, chuột vàng +3.<br />
          Trúng bẫy nấm độc -2 (trừ điểm, đừng ham!).<br />
          Điểm × 12 xu, đạt 20 điểm +1 gem. Kỷ lục: <b>{moleBest}</b>
        </p>
        <button onClick={start} className="px-6 py-2.5 rounded-xl border-[3px] border-black bg-green-400 font-black hover:bg-green-300 active:scale-95">
          ▶ Bắt đầu
        </button>
      </div>
    );
  }

  // ---- đang chơi ----
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between font-black text-sm">
        <span>⏱ {timeLeft}s</span>
        <span>🐭 {score} điểm</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, cell) => {
          const m = moles.find((x) => x.cell === cell && x.until > Date.now());
          const isHit = hit?.cell === cell;
          return (
            <button
              key={cell}
              onClick={() => whack(cell)}
              className={`aspect-square rounded-xl border-[3px] text-4xl flex items-center justify-center transition-transform active:scale-90 ${
                isHit ? (hit!.ok ? 'border-green-600 bg-green-100 scale-95' : 'border-red-500 bg-red-50 scale-95') : 'border-[#2b2117] bg-amber-50'
              }`}
            >
              {isHit ? (hit!.ok ? '💥' : '💢') : m ? (m.kind === 'gold' ? '🐭✨' : m.kind === 'trap' ? '🍄' : '🐭') : '🌾'}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] font-bold opacity-60 text-center">Chuột thường +1 · Vàng +3 · Nấm độc -2</p>
    </div>
  );
}
