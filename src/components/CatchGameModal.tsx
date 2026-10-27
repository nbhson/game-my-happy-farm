// ===== MINIGAME BẮT RAU VÀNG — 30 giây, bắt rơi đổi điểm lấy xu =====
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../game/store';
import { sfx } from '../game/audio';

const GAME_DUR = 30; // giây
const BASKET_W = 88;
const ITEM_R = 18;
const SPAWN_MS = 700; // trung bình ms giữa các lần spawn

interface CatchItem {
  id: number;
  x: number; y: number;
  vy: number; // pixels/frame
  type: 'carrot' | 'tomato' | 'corn' | 'eggplant' | 'gem' | 'rotten';
  /** 1 = normal (+1), 2 = gem (+3), -2 = rotten */
  pts: number;
  /** emoji hiển thị */
  label: string;
}

const ITEM_TYPES: Array<{ type: CatchItem['type']; pts: number; label: string }> = [
  { type: 'carrot', pts: 1, label: '🥕' },
  { type: 'tomato', pts: 1, label: '🍅' },
  { type: 'corn', pts: 1, label: '🌽' },
  { type: 'eggplant', pts: 1, label: '🍆' },
  { type: 'gem', pts: 3, label: '💎' },
  { type: 'rotten', pts: -2, label: '💀' },
];

export default function CatchGameModal() {
  const s = useGame();
  const catchGameResult = useGame((st) => st.catchGameResult);
  const catchGameCooldown = s.catchGameCooldown;
  const now = Date.now();

  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DUR);
  const [items, setItems] = useState<CatchItem[]>([]);
  const [result, setResult] = useState<{ xu: number; gem: number; best: boolean } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const basketRef = useRef(180);
  const rafRef = useRef<number>(0);
  const spawnRef = useRef(0);
  const startRef = useRef(0);
  const idRef = useRef(0);
  const lastTimeRef = useRef(0);
  const feedRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0); // tránh stale closure trong RAF

  // Đang trong cooldown?
  if (catchGameCooldown > now && !playing && !result) {
    const secs = Math.ceil((catchGameCooldown - now) / 1000);
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">⏳</div>
        <div className="font-bold text-lg">Chờ {secs}s rồi chơi lại…</div>
        <div className="text-sm text-gray-500 mt-1">Best: {s.catchGameBest} điểm · +{s.catchGameBest * 8} xu</div>
      </div>
    );
  }

  const startGame = () => {
    setScore(0); setTimeLeft(GAME_DUR); setItems([]); setResult(null); setFeedback(null);
    scoreRef.current = 0;
    basketRef.current = 180;
    spawnRef.current = 0; lastTimeRef.current = performance.now(); startRef.current = Date.now();
    setPlaying(true);
  };

  // Game loop
  useEffect(() => {
    if (!playing) return;
    const W = 380;
    const H = 340;

    const tick = (now: number) => {
      const dt = Math.min(now - lastTimeRef.current, 50); // cap dt
      lastTimeRef.current = now;
      const elapsed = (Date.now() - startRef.current) / 1000;
      setTimeLeft(Math.max(0, Math.ceil(GAME_DUR - elapsed)));

      // Spawn items
      if (now - spawnRef.current > SPAWN_MS + Math.random() * 400) {
        spawnRef.current = now;
        const itDef = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        const newItem: CatchItem = {
          id: idRef.current++,
          x: ITEM_R + Math.random() * (W - ITEM_R * 2),
          y: -ITEM_R,
          vy: 1.2 + Math.random() * 1.8, // px per 16ms frame ≈ 75-190 px/s
          ...itDef,
        };
        setItems((prev) => [...prev.slice(-20), newItem]);
      }

      // Move items + collision
      const bx = basketRef.current;
      const by = H - 52;
      let caught = false;
      let caughtPts = 0;
      setItems((prev) => {
        const next: CatchItem[] = [];
        for (const item of prev) {
          item.y += item.vy * (dt / 16);
          // Fell off bottom without catch
          if (item.y > H + ITEM_R) continue;
          // Collision with basket
          if (item.y + ITEM_R >= by && item.y <= by + 36 && item.x >= bx - BASKET_W / 2 && item.x <= bx + BASKET_W / 2) {
            caught = true; caughtPts = item.pts;
            continue; // eaten
          }
          next.push(item);
        }
        return next;
      });

      if (caught) {
        scoreRef.current = Math.max(0, scoreRef.current + caughtPts);
        setScore(scoreRef.current);
        setFeedback(caughtPts > 0 ? `+${caughtPts}` : `${caughtPts}`);
        if (caughtPts > 0) sfx.pop(); else sfx.ick();
        if (feedRef.current) clearTimeout(feedRef.current);
        feedRef.current = setTimeout(() => setFeedback(null), 400);
      }

      if (elapsed >= GAME_DUR) {
        cancelAnimationFrame(rafRef.current);
        const r = catchGameResult(Math.max(0, scoreRef.current));
        setResult(r);
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame((t) => { lastTimeRef.current = t; tick(t); });
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Timer countdown
  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing]);

  // Mouse/touch/keys move basket
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!playing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    basketRef.current = Math.max(BASKET_W / 2, Math.min(rect.width - BASKET_W / 2, x));
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!playing) return;
      const step = 14;
      if (e.key === 'ArrowLeft') basketRef.current = Math.max(BASKET_W / 2, basketRef.current - step);
      if (e.key === 'ArrowRight') basketRef.current = Math.min(380 - BASKET_W / 2, basketRef.current + step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing]);

  // Game Over screen
  if (result) {
    return (
      <div className="text-center py-4 space-y-3">
        <div className="text-5xl">{result.best ? '🏆' : '🎉'}</div>
        <div className="font-black text-2xl">{result.best ? 'KỶ LỤC MỚI!' : 'Kết thúc!'}</div>
        <div className="text-3xl font-black text-amber-600">{score} điểm</div>
        <div className="bg-amber-100 border-2 border-amber-400 rounded-lg py-2 px-4 text-lg font-bold text-amber-800">
          +{result.xu} xu{result.gem ? ` +${result.gem} gem` : ''}
        </div>
        <div className="text-sm text-gray-500">Kỷ lục cá nhân: {Math.max(s.catchGameBest, score)} điểm</div>
        <button onClick={() => { setResult(null); setPlaying(false); }} className="pixel-btn">Đóng</button>
      </div>
    );
  }

  // Chưa chơi
  if (!playing) {
    return (
      <div className="text-center py-4 space-y-3">
        <div className="text-5xl">🧺</div>
        <div className="font-bold text-lg">Bắt rau rơi · 30 giây</div>
        <p className="text-sm text-gray-600">Di chuyển rổ bằng chuột / phím ← → để bắt rau<br />💎 = 3 điểm · 💀 = -2 điểm</p>
        <div className="text-sm text-gray-500">Kỷ lục: {s.catchGameBest} điểm · +{s.catchGameBest * 8} xu</div>
        <button onClick={startGame} className="pixel-btn bg-green-500 text-white border-black">BẮT ĐẦU</button>
      </div>
    );
  }

  const pct = (timeLeft / GAME_DUR) * 100;

  return (
    <div className="space-y-1">
      {/* HUD */}
      <div className="flex justify-between items-center px-1">
        <div className="font-black text-xl text-amber-700">🧺 {score} điểm</div>
        <div className={`font-black text-lg ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>{timeLeft}s</div>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      {/* Play area */}
      <div
        ref={containerRef}
        className="relative bg-gradient-to-b from-sky-200 to-green-100 border-4 border-[#2b2117] rounded-b-lg overflow-hidden select-none cursor-none"
        style={{ height: 340, maxWidth: '100%' }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      >
        {/* Items */}
        {items.map((it) => (
          <div
            key={it.id}
            className="absolute text-3xl select-none"
            style={{ left: it.x - 16, top: it.y - 16, width: 32, height: 32 }}
          >
            {it.label}
          </div>
        ))}
        {/* Basket */}
        <div
          className="absolute bottom-2 text-4xl select-none"
          style={{ left: basketRef.current - BASKET_W / 2, width: BASKET_W, textAlign: 'center' }}
        >
          🧺
        </div>
        {/* Feedback popup */}
        {feedback && (
          <div
            className="absolute left-1/2 text-3xl font-black pointer-events-none"
            style={{ top: 80, transform: 'translateX(-50%)', color: feedback.startsWith('+') ? '#16a34a' : '#dc2626' }}
          >
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
