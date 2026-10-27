// ===== ULTRA graphics layer — phủ điện ảnh lên trên renderer 2D vẽ tay =====
// Triết lý: không sửa art hiện có, chỉ thêm 3 lớp phủ screen-space chạy khi
// quality === 'ultra': (1) color grading theo giờ, (2) ánh sáng thể tích
// (god rays / lens flare / quầng trăng / bóng mây trôi), (3) hạt sự sống
// (bụi nắng, cánh hoa, chim, đom đóm, mưa bắn tóe / tuyết sâu, sao băng).
// Toàn bộ dùng hình khối rẻ (fillRect/arc/ellipse), số lượng có chặn trên,
// không cấp phát mảng mỗi frame — máy khỏe mới nên bật.
import type { WeatherKind } from './types';

export function isUltra(q: string | undefined): boolean {
  return q === 'ultra';
}
export function isHigh(q: string | undefined): boolean {
  return q === 'high';
}

export interface UltraEnv {
  dayTime: number; // 0..1 (0 = nửa đêm)
  weather?: WeatherKind;
  night?: boolean;
  /** trong nhà: bỏ nắng/mưa/chim, chỉ giữ bụi đèn + vignette điện ảnh */
  indoor?: boolean;
}

function hash2(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return (((h ^ (h >> 16)) >>> 0) % 1000) / 1000;
}

/** 0..1: trưa gắt nhất lúc 0.5, tắt dần về sáng/tối */
function sunUp(dayTime: number): number {
  if (dayTime < 0.22 || dayTime > 0.8) return 0;
  if (dayTime < 0.32) return (dayTime - 0.22) / 0.1;
  if (dayTime > 0.68) return Math.max(0, 1 - (dayTime - 0.68) / 0.12);
  return 1;
}

function isDawn(dayTime: number): boolean {
  return dayTime >= 0.18 && dayTime <= 0.34;
}
function isDusk(dayTime: number): boolean {
  return dayTime >= 0.66 && dayTime <= 0.86;
}

/** Lớp 1 — color grading điện ảnh theo giờ (alpha thấp, phủ toàn màn hình) */
function grade(ctx: CanvasRenderingContext2D, W: number, H: number, dayTime: number, night: boolean, indoor: boolean) {
  if (indoor) {
    ctx.fillStyle = 'rgba(255,190,110,.05)';
    ctx.fillRect(0, 0, W, H);
    return;
  }
  if (isDawn(dayTime)) {
    ctx.fillStyle = 'rgba(255,150,80,.17)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,120,160,.09)';
    ctx.fillRect(0, 0, W, H * 0.5);
  } else if (isDusk(dayTime)) {
    ctx.fillStyle = 'rgba(150,80,200,.17)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,120,60,.12)';
    ctx.fillRect(0, H * 0.35, W, H * 0.65);
  } else if (night) {
    ctx.fillStyle = 'rgba(40,70,180,.17)';
    ctx.fillRect(0, 0, W, H);
    // chân trời đêm hơi tím cho sâu
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    g.addColorStop(0, 'rgba(90,60,180,.17)');
    g.addColorStop(1, 'rgba(90,60,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.5);
  } else {
    // ban ngày: teal nhẹ vùng tối + ấm vùng sáng (kiểu phim)
    ctx.fillStyle = 'rgba(255,240,200,.07)';
    ctx.fillRect(0, 0, W, H);
  }
}

/** Lớp 2a — tia nắng thể tích (god rays) xiên từ mặt trời + vệt sáng quét */
function godRays(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, strength: number) {
  if (strength <= 0.02) return;
  const sx = W - 60, sy = 44;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 4; k++) {
    const sway = Math.sin(t * 0.4 + k * 1.7) * 30;
    const spread = (k - 1.5) * 90 + sway;
    const a = 0.085 * strength + (k === 1 ? 0.05 * strength : 0);
    ctx.fillStyle = `rgba(255,246,210,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(sx - 24 + spread * 0.15, sy);
    ctx.lineTo(sx + 24 + spread * 0.15, sy);
    ctx.lineTo(sx + spread + 150, H);
    ctx.lineTo(sx + spread - 150, H);
    ctx.closePath();
    ctx.fill();
  }
  // vệt sáng quét ngang rất chậm cho cảm giác "không khí đang thở"
  const sweepX = ((t * 40) % (W + 600)) - 300;
  const g = ctx.createLinearGradient(sweepX - 120, 0, sweepX + 120, 0);
  g.addColorStop(0, 'rgba(255,255,240,0)');
  g.addColorStop(0.5, `rgba(255,255,240,${(0.085 * strength).toFixed(3)})`);
  g.addColorStop(1, 'rgba(255,255,240,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Lớp 2b — lens flare ma (ghost) + streak ngang cạnh mặt trời */
function lensFlare(ctx: CanvasRenderingContext2D, W: number, t: number, strength: number) {
  if (strength <= 0.02) return;
  const sx = W - 60, sy = 44;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // streak ngang
  ctx.fillStyle = `rgba(180,220,255,${(0.16 * strength).toFixed(3)})`;
  ctx.fillRect(sx - 190, sy - 1.5, 380, 3);
  ctx.fillStyle = `rgba(255,240,200,${(0.12 * strength).toFixed(3)})`;
  ctx.fillRect(sx - 120, sy - 4, 240, 8);
  // ghost tròn dọc theo đường chéo qua tâm màn hình
  for (let k = 1; k <= 5; k++) {
    const gx = sx - k * (W * 0.16), gy = sy + k * 52 + Math.sin(t * 0.8 + k) * 4;
    const r = 28 - k * 4;
    const a = 0.14 * strength - k * 0.018 * strength;
    if (a <= 0) continue;
    const g = ctx.createRadialGradient(gx, gy, 1, gx, gy, r);
    g.addColorStop(0, `rgba(255,250,230,${a.toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx, gy, r, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/** Lớp 2c — bóng mây khổng lồ trôi ngang mặt đất */
function cloudShadows(ctx: CanvasRenderingContext2D, W: number, H: number, camX: number, t: number, strength: number) {
  if (strength <= 0.02) return;
  ctx.save();
  for (let k = 0; k < 3; k++) {
    const span = W + 700;
    const cx = (((k * 613 + t * (26 + k * 9) - camX * 0.25) % span) + span) % span - 350;
    const cy = H * (0.45 + k * 0.2) + Math.sin(t * 0.3 + k * 2) * 24;
    const r = 200 + k * 60;
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, r);
    g.addColorStop(0, `rgba(25,55,45,${(0.13 * strength).toFixed(3)})`);
    g.addColorStop(1, 'rgba(25,55,45,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/** Lớp 3a — bụi nắng lơ lửng trong tia sáng */
function dustMotes(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, n: number, night: boolean) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const h = hash2(i, 913);
    const px = (h * (W + 80) + t * (8 + (i % 5) * 5)) % (W + 80) - 40;
    const py = (hash2(i, 517) * H + Math.sin(t * 0.9 + i * 1.3) * 26 + H) % H;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 2 + i * 2.1));
    const r = 1 + (i % 3) * 0.7;
    ctx.fillStyle = night ? `rgba(255,255,170,${(0.5 * tw).toFixed(3)})` : `rgba(255,252,230,${(0.55 * tw).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/** Lớp 3b — cánh hoa anh đào rơi (đặc sản ultra ngoài trời) */
function petals(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, n: number) {
  ctx.save();
  const cols = ['#ffd3e2', '#ffc0d6', '#ffffff', '#ffb1cd'];
  for (let i = 0; i < n; i++) {
    const h = hash2(i, 331);
    const fall = 26 + (i % 4) * 12;
    const py = ((h * (H + 60) + t * fall) % (H + 60)) - 30;
    const px = (hash2(i, 77) * (W + 60) + Math.sin(t * 1.1 + i * 2.4) * 46 + W + 60) % (W + 60) - 30;
    const rot = t * (1 + (i % 3) * 0.6) + i;
    const s = 3.4 + (i % 3) * 1.2;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.fillStyle = cols[i % cols.length];
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.55, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** Lớp 3c — chim bay ngang trời (ngày) */
function birds(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(40,50,70,.75)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const speed = 46 + i * 12;
    const span = W + 240;
    const px = W + 120 - ((t * speed + i * 420) % span);
    const py = H * (0.1 + i * 0.055) + Math.sin(t * 1.4 + i * 2) * 10;
    const flap = Math.sin(t * 9 + i * 2.2) * 5;
    const s = 9 + (i % 2) * 3;
    ctx.beginPath();
    ctx.moveTo(px - s, py - flap * 0.4);
    ctx.quadraticCurveTo(px - s * 0.3, py - 3, px, py);
    ctx.quadraticCurveTo(px + s * 0.3, py - 3, px + s, py - flap * 0.4);
    ctx.stroke();
  }
  ctx.restore();
}

/** Lớp 3d — đêm ultra: sao dày + sao băng + đom đóm đặc */
function nightSky(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  ctx.save();
  // sao dày twinkle
  for (let i = 0; i < 70; i++) {
    const sx = hash2(i, 11) * W;
    const sy = hash2(i, 13) * H * 0.45;
    const tw = Math.sin(t * (1.5 + (i % 4) * 0.7) + i * 1.9);
    if (tw < -0.2) continue;
    const a = 0.25 + 0.65 * tw;
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    const big = i % 9 === 0;
    ctx.fillRect(sx, sy, big ? 2.4 : 1.6, big ? 2.4 : 1.6);
    if (big && tw > 0.7) {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(sx - 4, sy + 0.7, 10, 1);
      ctx.fillRect(sx + 0.7, sy - 4, 1, 10);
    }
  }
  // sao băng mỗi ~9s, vệt 1.1s
  const period = 9, life = 1.1;
  const ph = t % period;
  if (ph < life) {
    const p = ph / life;
    const hx = W * 0.75 - p * W * 0.4, hy = H * 0.08 + p * H * 0.2;
    const g = ctx.createLinearGradient(hx, hy, hx + 90, hy - 45);
    g.addColorStop(0, `rgba(255,255,255,${(0.9 * (1 - p)).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 90, hy - 45); ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${(1 - p).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, 7); ctx.fill();
  }
  // đom đóm đặc quầng sáng
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 34; i++) {
    const px = (hash2(i, 257) * (W + 100) + t * (12 + (i % 5) * 6)) % (W + 100) - 50;
    const py = H * 0.35 + ((hash2(i, 173) * H * 0.65 + Math.sin(t * 1.2 + i) * 34 + H) % (H * 0.65));
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.6 + i * 1.7));
    const g = ctx.createRadialGradient(px, py, 0.5, px, py, 12);
    g.addColorStop(0, `rgba(255,255,170,${(0.9 * tw).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,255,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/** Lớp 3e — quầng trăng lớn */
function moonHalo(ctx: CanvasRenderingContext2D, W: number) {
  const mx = W - 60, my = 44;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(mx, my, 8, mx, my, 120);
  g.addColorStop(0, 'rgba(220,230,255,.35)');
  g.addColorStop(0.4, 'rgba(180,200,255,.14)');
  g.addColorStop(1, 'rgba(180,200,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(mx, my, 120, 0, 7); ctx.fill();
  ctx.restore();
}

/** Lớp thời tiết ultra — mưa xiên dày + tóe nước + chớp; tuyết sâu nhiều lớp */
function ultraWeather(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, weather: WeatherKind) {
  if (weather === 'rain') {
    ctx.save();
    ctx.strokeStyle = 'rgba(170,210,255,.5)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 110; i++) {
      const h = hash2(i, 41);
      const px = ((h * (W + 200) + t * (900 + (i % 5) * 120)) % (W + 200)) - 100;
      const py = ((hash2(i, 43) * (H + 120) + t * (1100 + (i % 7) * 90)) % (H + 120)) - 60;
      ctx.globalAlpha = 0.35 + (i % 4) * 0.15;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 7, py + 22);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // vòng tóe nước nở trên mặt đất
    for (let i = 0; i < 26; i++) {
      const px = hash2(i, 61) * W;
      const py = H * 0.45 + hash2(i, 63) * H * 0.55;
      const ph = (t * 2.2 + hash2(i, 67) * 3) % 1;
      ctx.strokeStyle = `rgba(190,225,255,${(0.55 * (1 - ph)).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(px, py, 3 + ph * 13, 1.5 + ph * 4.5, 0, 0, 7); ctx.stroke();
    }
    // chớp: nháy 2 nhịp mỗi ~12s
    const cyc = t % 12;
    if ((cyc > 6.9 && cyc < 7.05) || (cyc > 7.25 && cyc < 7.33)) {
      ctx.fillStyle = 'rgba(235,242,255,.28)';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  } else if (weather === 'snow') {
    ctx.save();
    for (let i = 0; i < 90; i++) {
      const depth = i % 3; // 0 xa nhỏ, 2 gần to
      const h = hash2(i, 71);
      const px = ((h * (W + 100) + Math.sin(t * (0.6 + depth * 0.3) + i) * 40 + W + 100) % (W + 100)) - 50;
      const py = ((hash2(i, 73) * (H + 60) + t * (34 + depth * 30)) % (H + 60)) - 30;
      const r = 1 + depth * 1.3;
      ctx.fillStyle = depth === 2 ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.65)';
      ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
      if (depth === 2 && Math.sin(t * 3 + i) > 0.6) {
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.fillRect(px - 4, py, 8, 1);
        ctx.fillRect(px, py - 4, 1, 8);
      }
    }
    ctx.restore();
  } else {
    // nắng gắt ultra: 2 chuồn chuồn lượn vùng thấp + lấp lánh nhiệt trên mặt đất
    ctx.save();
    for (let i = 0; i < 2; i++) {
      const px = (hash2(i, 91) * W + t * (60 + i * 25)) % W;
      const py = H * 0.6 + Math.sin(t * 2.2 + i * 3) * 40 + i * 30;
      const flap = Math.abs(Math.sin(t * 30 + i * 2));
      ctx.fillStyle = 'rgba(120,200,255,.8)';
      ctx.beginPath(); ctx.ellipse(px - 5 - flap * 3, py - 3, 6, 2.2, -0.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px + 5 + flap * 3, py - 3, 6, 2.2, 0.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b6cb0';
      ctx.beginPath(); ctx.ellipse(px, py, 2, 6, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
}

/** Lớp cuối — vignette điện ảnh + grain phim (giữ HUD canvas nổi vì gọi trước HUD) */
function cinematic(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, night: boolean) {
  ctx.save();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, night ? 'rgba(4,4,20,.5)' : 'rgba(70,40,10,.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  // dải letterbox cực mỏng tạo chất điện ảnh mà không che gameplay
  const bar = ctx.createLinearGradient(0, 0, 0, H);
  bar.addColorStop(0, 'rgba(0,0,0,.24)');
  bar.addColorStop(0.07, 'rgba(0,0,0,0)');
  bar.addColorStop(0.93, 'rgba(0,0,0,0)');
  bar.addColorStop(1, 'rgba(0,0,0,.24)');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, W, H);
  // grain phim: 60 hạt li ti trôi theo thời gian
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  const f = Math.floor(t * 12);
  for (let i = 0; i < 60; i++) {
    const gx = hash2(i, f % 97) * W;
    const gy = hash2(f % 89, i) * H;
    ctx.fillRect(gx, gy, 1.4, 1.4);
  }
  ctx.restore();
}

/** Trong nhà ultra: bụi bay trong quầng đèn + ấm điện ảnh (không nắng/mưa/chim) */
function indoorGlow(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, night: boolean) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // quầng đèn treo giữa trần thở nhẹ
  const flick = 0.85 + Math.sin(t * 3.2) * 0.05 + Math.sin(t * 7.7) * 0.02;
  const g = ctx.createRadialGradient(W / 2, H * 0.12, 10, W / 2, H * 0.12, 260 * flick);
  g.addColorStop(0, `rgba(255,215,140,${(night ? 0.20 : 0.12) * flick})`);
  g.addColorStop(1, 'rgba(255,215,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.7);
  // bụi bay trong luồng đèn
  for (let i = 0; i < 30; i++) {
    const px = W / 2 + (hash2(i, 5) - 0.5) * 420 + Math.sin(t * 0.7 + i) * 18;
    const py = H * 0.1 + ((hash2(i, 9) * H * 0.7 + t * (10 + (i % 4) * 5)) % (H * 0.7));
    const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.8 + i * 2.2));
    ctx.fillStyle = `rgba(255,230,180,${(0.5 * tw).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(px, py, 1.4, 0, 7); ctx.fill();
  }
  ctx.restore();
  // vệt nắng qua cửa sổ ban ngày
  if (!night) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,244,200,.06)';
    ctx.beginPath();
    ctx.moveTo(W * 0.2, H * 0.1);
    ctx.lineTo(W * 0.34, H * 0.1);
    ctx.lineTo(W * 0.5, H * 0.85);
    ctx.lineTo(W * 0.36, H * 0.85);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ================= API chính: gọi 1 dòng cuối mỗi renderer =================
export function drawUltraPost(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  cam: { x: number; y: number }, t: number, env: UltraEnv,
): void {
  const night = env.night ?? (env.dayTime < 0.2 || env.dayTime > 0.82);
  if (env.indoor) {
    indoorGlow(ctx, W, H, t, night);
    cinematic(ctx, W, H, t, night);
    return;
  }
  const weather = env.weather ?? 'sunny';
  const sun = sunUp(env.dayTime);
  grade(ctx, W, H, env.dayTime, night, false);
  cloudShadows(ctx, W, H, cam.x, t, night ? 0.25 : 0.8);
  godRays(ctx, W, H, t, night ? 0 : Math.max(0.25, sun));
  lensFlare(ctx, W, t, night ? 0 : sun);
  if (!night) birds(ctx, W, H, t);
  else {
    moonHalo(ctx, W);
    nightSky(ctx, W, H, t);
  }
  // bụi nắng ban ngày / hạt ma trơi ban đêm đều có
  dustMotes(ctx, W, H, t, night ? 30 : 52, night);
  if (!night && weather === 'sunny') petals(ctx, W, H, t, isDusk(env.dayTime) ? 24 : 18);
  if (weather !== 'sunny') ultraWeather(ctx, W, H, t, weather);
  else if (!night) ultraWeather(ctx, W, H, t, 'sunny');
  cinematic(ctx, W, H, t, night);
}

// ================= HIGH GRAPHICS — phủ nhẹ hơn Ultra =================
// Chỉ giữ: color grading + bóng mây + bụi/hoa thưa + vignette ấm.
// Bỏ god rays / lens flare / chim / sao / đom đóm / mưa tóe (máy khỏe mới bật Ultra).
export function drawHighPost(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  cam: { x: number; y: number }, t: number, env: UltraEnv,
): void {
  const night = env.night ?? (env.dayTime < 0.2 || env.dayTime > 0.82);
  if (env.indoor) {
    // trong nhà cấp cao: chỉ ấm nhẹ + vignette (không bụi đèn/grain như ultra)
    grade(ctx, W, H, env.dayTime, night, true);
    vignette(ctx, W, H, night);
    return;
  }
  const weather = env.weather ?? 'sunny';
  grade(ctx, W, H, env.dayTime, night, false);
  cloudShadows(ctx, W, H, cam.x, t, night ? 0.15 : 0.5);
  // bụi nắng thưa ban ngày / vài ma trơi ban đêm
  dustMotes(ctx, W, H, t, night ? 14 : 22, night);
  if (!night && weather === 'sunny') petals(ctx, W, H, t, 8);
  vignette(ctx, W, H, night);
}

/** Vignette đơn giản (không grain/letterbox như cinematic) — dùng cho high + indoor */
function vignette(ctx: CanvasRenderingContext2D, W: number, H: number, night: boolean) {
  ctx.save();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, night ? 'rgba(4,4,20,.38)' : 'rgba(70,40,10,.2)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
