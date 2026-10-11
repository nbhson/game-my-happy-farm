// ===== Hand-drawn icon set — thay toàn bộ emoji font trong canvas =====
// Triết lý: vẽ bằng vector canvas 2D (ellipse/rect/arc), đồng bộ art-style farm,
// không phụ thuộc font emoji của thiết bị → nhìn chân thực, sắc nét mọi DPI.
// Art-style: viền nâu #4a3226, fill pastel, highlight trắng, bóng mềm.

const INK = '#4a3226';

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill();
}

/** Lấp lánh 4 cánh (thay ✨) */
/// Cấp FX toàn cục: 0 = Thấp (bỏ hết tia lửa), 1 = Trung bình (vẽ thưa 1/2), 2 = Cao (đủ)
// renderWorld/renderTown đặt mỗi frame theo quality.
let FX_LEVEL = 2;
let fxTick = 0;
export function setFxLevel(v: number) { FX_LEVEL = v; }
export function setFxLow(v: boolean) { FX_LEVEL = v ? 0 : 2; }
export function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r = 7, alpha = 1) {
  if (FX_LEVEL <= 0) return;
  if (FX_LEVEL === 1) { fxTick++; if (fxTick % 2 === 1) return; }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fffde7';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.22, y - r * 0.22, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.22, y + r * 0.22, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.22, y + r * 0.22, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.22, y - r * 0.22, x, y - r);
  ctx.fill();
  // cánh phụ mảnh theo trục chéo — chỉ thêm nét vẽ, không gradient
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y - r * 0.55); ctx.lineTo(x + r * 0.55, y + r * 0.55);
  ctx.moveTo(x + r * 0.55, y - r * 0.55); ctx.lineTo(x - r * 0.55, y + r * 0.55);
  ctx.stroke();
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - r * 0.06, y - r * 0.08, r * 0.1, 0, 7); ctx.fill();
  ctx.restore();
}

/** Phong bì thư (thay ✉️) */
export function drawEnvelope(ctx: CanvasRenderingContext2D, x: number, y: number, w = 18) {
  const h = w * 0.7;
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ell(ctx, x, y + h / 2 + 2, w / 2, 2.5);
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  // highlight giấy
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillRect(x - w / 2 + 1.5, y - h / 2 + 1.5, w - 3, 2);
  // nắp thư
  ctx.fillStyle = '#d7e3ea';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x, y + 1);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#7d8b96'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x, y + 1); ctx.lineTo(x + w / 2, y - h / 2); ctx.stroke();
  // mép dưới + con dấu sáp
  ctx.strokeStyle = 'rgba(125,139,150,.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - w / 2 + 2, y + h / 2 - 2.5); ctx.lineTo(x - 2, y + 1.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w / 2 - 2, y + h / 2 - 2.5); ctx.lineTo(x + 2, y + 1.5); ctx.stroke();
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x, y + 1, 2.6, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x - 0.8, y + 0.2, 0.9, 0, 7); ctx.fill();
  // tem đỏ
  ctx.fillStyle = '#e53935'; ctx.fillRect(x + w / 2 - 6, y - h / 2 + 2, 4, 5);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8;
  ctx.strokeRect(x + w / 2 - 6, y - h / 2 + 2, 4, 5);
}

/** Ổ khóa đồng mini — nhỏ gọn, viền trắng nổi trên nền cỏ */
export function drawLock(ctx: CanvasRenderingContext2D, x: number, y: number, s = 15) {
  const w = s, h = s * 0.85;
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ell(ctx, x + 1.5, y + h / 2 + 2, w / 2, 3.5);
  // càng khóa mảnh
  ctx.strokeStyle = '#eceff1'; ctx.lineWidth = Math.max(2, s * 0.14);
  ctx.beginPath(); ctx.arc(x, y - h * 0.12, w * 0.32, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath(); ctx.arc(x, y - h * 0.12, w * 0.32, Math.PI * 1.05, Math.PI * 1.5); ctx.stroke();
  // thân khóa đồng + viền trắng mỏng cho nổi
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - w / 2 - 1, y - h * 0.12 - 1, w + 2, h + 4);
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#a67c3a'); g.addColorStop(0.5, '#f0d48a'); g.addColorStop(1, '#8b5f22');
  ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h * 0.12, w, h + 2);
  ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2, y - h * 0.12, w, h + 2);
  // lỗ khóa
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(x, y + h * 0.22, s * 0.11, 0, 7); ctx.fill();
  ctx.fillRect(x - 1.2, y + h * 0.22, 2.4, s * 0.18);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - w / 2 + 3, y - h * 0.12 + 2, 2.5, h - 4);
  // highlight cạnh phải + đinh tán
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x + w / 2 - 3.5, y - h * 0.12 + 2, 1.4, h - 4);
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath(); ctx.arc(x - w / 2 + 2, y + h * 0.62, 1, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w / 2 - 2, y + h * 0.62, 1, 0, 7); ctx.fill();
}

/** Cuốc chim mini (thay ⛏️) */
export function drawHoeMini(ctx: CanvasRenderingContext2D, x: number, y: number, s = 16) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
  // bóng cán
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = s * 0.22; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(1.2, -s * 0.5 + 1); ctx.lineTo(1.2, s * 0.5 + 1); ctx.stroke();
  // cán gỗ 2 tone + vân
  ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = s * 0.22;
  ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(0, s * 0.5); ctx.stroke();
  ctx.strokeStyle = '#c98f4e'; ctx.lineWidth = s * 0.07;
  ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.45); ctx.lineTo(-s * 0.05, s * 0.45); ctx.stroke();
  // lưỡi cuốc + viền nâu + lưỡi sáng
  ctx.fillStyle = '#78909c';
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, -s * 0.35); ctx.lineTo(s * 0.1, -s * 0.62); ctx.lineTo(s * 0.05, -s * 0.3); ctx.lineTo(-s * 0.45, -s * 0.1);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, -s * 0.35); ctx.lineTo(s * 0.1, -s * 0.62); ctx.lineTo(s * 0.05, -s * 0.3); ctx.lineTo(-s * 0.45, -s * 0.1);
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#eceff1';
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.36); ctx.lineTo(-s * 0.1, -s * 0.55); ctx.lineTo(-s * 0.12, -s * 0.47); ctx.lineTo(-s * 0.44, -s * 0.3);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b0bec5'; ctx.fillRect(-s * 0.45, -s * 0.55, s * 0.3, s * 0.1);
  ctx.restore();
}

/** Giỏ thu hoạch (thay 🧺) */
export function drawBasket(ctx: CanvasRenderingContext2D, x: number, y: number, s = 18) {
  const w = s, h = s * 0.7;
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(ctx, x, y + h / 2, w / 2, 3);
  // thân giỏ nền
  ctx.fillStyle = '#a06830';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2 - 3, y + h / 2); ctx.lineTo(x - w / 2 + 3, y + h / 2);
  ctx.closePath(); ctx.fill();
  // nan dọc đan
  ctx.fillStyle = 'rgba(93,58,26,.55)';
  for (let i = -2; i <= 2; i++) {
    const bx = x + i * (w / 5.4);
    ctx.fillRect(bx - 1, y - h / 2 + 1, 2, h - 2);
  }
  // nan ngang xen kẽ sáng/tối
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 ? '#c98f4e' : '#7c4d21';
    ctx.fillRect(x - w / 2 + 2, y - h / 2 + 3 + i * 5, w - 4, 2.4);
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2 - 3, y + h / 2); ctx.lineTo(x - w / 2 + 3, y + h / 2);
  ctx.closePath(); ctx.stroke();
  // vành miệng + highlight
  ctx.fillStyle = '#7c4d21';
  ctx.fillRect(x - w / 2 - 1.5, y - h / 2 - 2.5, w + 3, 4);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  ctx.strokeRect(x - w / 2 - 1.5, y - h / 2 - 2.5, w + 3, 4);
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.fillRect(x - w / 2 + 1, y - h / 2 - 2, w - 2, 1.2);
  // quai kép
  ctx.strokeStyle = '#5d3a1a'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(x, y - h / 2 + 2, w / 2 - 1, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#c98f4e'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y - h / 2 + 2, w / 2 - 3, Math.PI, 0); ctx.stroke();
  // rau quả trong giỏ + gloss
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x - 4, y - h / 2 - 1, 4, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x - 5.2, y - h / 2 - 2.4, 1.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(x + 4, y - h / 2 - 2, 4.4, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x + 2.6, y - h / 2 - 3.6, 1.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#fdd835'; ctx.beginPath(); ctx.arc(x, y - h / 2 - 4, 3.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#2e7d32'; ctx.fillRect(x - 1, y - h / 2 - 9, 2, 4);
}

/** Giọt nước (thay 💧) */
export function drawDrop(ctx: CanvasRenderingContext2D, x: number, y: number, s = 15) {
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, x, y + s * 0.45, s * 0.32, 2);
  const g = ctx.createLinearGradient(0, y - s / 2, 0, y + s / 2);
  g.addColorStop(0, '#b3e5fc'); g.addColorStop(1, '#0288d1');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.55);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 0.05, x + s * 0.32, y + s * 0.4, x, y + s * 0.45);
  ctx.bezierCurveTo(x - s * 0.32, y + s * 0.4, x - s * 0.45, y - s * 0.05, x, y - s * 0.55);
  ctx.fill();
  ctx.strokeStyle = 'rgba(1,87,155,.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.55);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 0.05, x + s * 0.32, y + s * 0.4, x, y + s * 0.45);
  ctx.bezierCurveTo(x - s * 0.32, y + s * 0.4, x - s * 0.45, y - s * 0.05, x, y - s * 0.55);
  ctx.stroke();
  // gloss kép + đáy cong phản chiếu
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ell(ctx, x - s * 0.12, y + s * 0.02, s * 0.09, s * 0.14);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + s * 0.08, y - s * 0.24, s * 0.045, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(x, y + s * 0.3, s * 0.16, 0.4, Math.PI - 0.4); ctx.stroke();
}

/** Hạt giống (thay 🌰) */
export function drawSeedDot(ctx: CanvasRenderingContext2D, x: number, y: number, s = 13) {
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(ctx, x, y + s * 0.4, s * 0.4, 2.4);
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.42, s * 0.5, 0.4, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.42, s * 0.5, 0.4, 0, 7); ctx.stroke();
  ctx.fillStyle = '#d7b56d';
  ctx.beginPath(); ctx.ellipse(x - s * 0.1, y - s * 0.12, s * 0.16, s * 0.24, 0.4, 0, 7); ctx.fill();
  // rãnh nứt vỏ + gloss kép
  ctx.strokeStyle = '#5d3a1a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + s * 0.02, y - s * 0.34); ctx.quadraticCurveTo(x + s * 0.2, y, x + s * 0.02, y + s * 0.36); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.ellipse(x - s * 0.18, y - s * 0.2, s * 0.05, s * 0.1, 0.4, 0, 7); ctx.fill();
  // đáy cong phản chiếu
  ctx.strokeStyle = 'rgba(255,235,200,.6)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.3, s * 0.38, 0.4, 0.5, Math.PI - 0.6); ctx.stroke();
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath(); ctx.arc(x + s * 0.14, y - s * 0.28, s * 0.09, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.beginPath(); ctx.arc(x + s * 0.12, y - s * 0.3, s * 0.03, 0, 7); ctx.fill();
}

/** Mầm non 2 lá (thay 🌱 — icon trong ảnh [Image 1]) */
export function drawSprout(ctx: CanvasRenderingContext2D, x: number, y: number, s = 22, t = 0) {
  const sway = Math.sin(t * 2 + x * 0.05) * 1.2;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, x, y + 2, s * 0.4, 2.4);
  // ụ đất
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath(); ctx.ellipse(x, y + 1, s * 0.22, s * 0.09, 0, 0, 7); ctx.fill();
  // thân + highlight thân
  ctx.strokeStyle = '#33691e'; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sway * 0.4, y - s * 0.35, x + sway, y - s * 0.6); ctx.stroke();
  ctx.strokeStyle = '#7cc47a'; ctx.lineWidth = s * 0.045;
  ctx.beginPath(); ctx.moveTo(x - 0.8, y - 1); ctx.quadraticCurveTo(x + sway * 0.4 - 0.8, y - s * 0.35, x + sway - 0.8, y - s * 0.58); ctx.stroke();
  // lá trái / phải — 2 tone + gân
  const leaf = (dir: 1 | -1) => {
    const lx = x + dir * s * 0.32 + sway * 0.6, ly = y - s * 0.42;
    ctx.fillStyle = dir > 0 ? '#43a047' : '#388e3c';
    ctx.beginPath();
    ctx.ellipse(lx, ly, s * 0.3, s * 0.15, dir * 0.5, 0, 7);
    ctx.fill();
    ctx.fillStyle = dir > 0 ? '#81c784' : '#66bb6a';
    ctx.beginPath();
    ctx.ellipse(lx - dir * s * 0.04, ly - s * 0.05, s * 0.2, s * 0.07, dir * 0.5, 0, 7);
    ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(lx, ly, s * 0.3, s * 0.15, dir * 0.5, 0, 7);
    ctx.stroke();
    // gân chính + gân phụ
    ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + sway * 0.5, y - s * 0.42); ctx.lineTo(x + dir * s * 0.55 + sway * 0.6, y - s * 0.42 + dir * 0.06 * s); ctx.stroke();
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - dir * s * 0.08, ly - s * 0.09); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx + dir * s * 0.06, ly + dir * 0.02 * s); ctx.lineTo(lx + dir * s * 0.02, ly + s * 0.08); ctx.stroke();
  };
  leaf(-1); leaf(1);
  // búp non + viền + giọt sương
  ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.arc(x + sway, y - s * 0.64, s * 0.1, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x + sway, y - s * 0.64, s * 0.1, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.arc(x + s * 0.28 + sway * 0.6, y - s * 0.48, 1.1, 0, 7); ctx.fill();
}

/** Badge chấm than (thay ❗) */
export function drawExclaimBadge(ctx: CanvasRenderingContext2D, x: number, y: number, s = 20, t = 0) {
  const pulse = 1 + Math.sin(t * 5 + x) * 0.08;
  const r = (s / 2) * pulse;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(ctx, x, y + r + 2, r, 3);
  const g = ctx.createLinearGradient(0, y - r, 0, y + r);
  g.addColorStop(0, '#ff5252'); g.addColorStop(1, '#b71c1c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r - 1.6, 0, 7); ctx.stroke();
  // gloss trên + thân chấm than nổi
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ell(ctx, x - r * 0.3, y - r * 0.42, r * 0.26, r * 0.14);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 1.8, y - r * 0.55, 3.6, r * 0.75);
  ctx.beginPath(); ctx.arc(x, y + r * 0.45, 2.2, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillRect(x - 1.8, y - r * 0.55, 1.2, r * 0.75);
}

/** Bát thức ăn (thay 🍽️) */
export function drawFeedBowl(ctx: CanvasRenderingContext2D, x: number, y: number, s = 18) {
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(ctx, x, y + s * 0.35, s * 0.5, 3);
  // chân bát
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(x - s * 0.22, y + s * 0.26, s * 0.44, s * 0.1);
  // thân bát gradient + viền nâu
  const bg = ctx.createLinearGradient(0, y - s * 0.3, 0, y + s * 0.35);
  bg.addColorStop(0, '#1e88e5'); bg.addColorStop(1, '#0d47a1');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.06, s * 0.5, s * 0.32, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.06, s * 0.5, s * 0.32, 0, 0, 7); ctx.stroke();
  // miệng bát
  ctx.fillStyle = '#1565c0';
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.5, s * 0.32, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath(); ctx.ellipse(x, y - 2, s * 0.42, s * 0.24, 0, 0, 7); ctx.fill();
  // viền miệng sáng
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(x, y - 1, s * 0.46, s * 0.28, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  // hạt cám nổi từng viên: nền + chấm sáng
  const kibble = (kx: number, ky: number, krx: number, kry: number, col: string) => {
    ctx.fillStyle = col;
    ell(ctx, kx, ky, krx, kry);
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath(); ctx.arc(kx - krx * 0.3, ky - kry * 0.35, Math.max(0.7, krx * 0.28), 0, 7); ctx.fill();
  };
  kibble(x - 4, y - 3, 2.4, 1.8, '#ffca28');
  kibble(x + 1, y - 4, 2.4, 1.8, '#ffb300');
  kibble(x + 5, y - 2, 2.2, 1.6, '#ffca28');
  kibble(x - 1, y - 2, 1.8, 1.4, '#8b5a2b');
  kibble(x + 4, y - 4, 1.6, 1.2, '#6d4c41');
  // hơi nóng
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x - 3, y - 9); ctx.quadraticCurveTo(x - 4, y - 12, x - 2, y - 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 3, y - 9); ctx.quadraticCurveTo(x + 4, y - 12, x + 2, y - 14); ctx.stroke();
}

/** Đầu gà (thay 🐔 — icon trong ảnh [Image 1], cửa sổ chuồng, shop) */
export function drawChickenHead(ctx: CanvasRenderingContext2D, x: number, y: number, s = 22) {
  const r = s / 2;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ell(ctx, x, y + r + 2, r * 0.9, 3);
  // chùm lông đuôi gáy
  ctx.fillStyle = '#f5f5f5';
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const a = Math.PI * (0.75 + i * 0.25);
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.8, r * 0.22, r * 0.34, a, 0, 7);
    ctx.fill(); ctx.stroke();
  }
  // mặt
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  // mảng lông má
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath(); ctx.ellipse(x - r * 0.4, y + r * 0.2, r * 0.5, r * 0.4, -0.4, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(74,50,38,.25)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(x - r * 0.4, y + r * 0.2, r * 0.3, r * 0.24, -0.4, 0, 7); ctx.stroke();
  // mào đỏ 3 múi + viền + gloss
  const comb: [number, number, number][] = [[-0.3, -0.95, 0.28], [0.05, -1.05, 0.3], [0.38, -0.9, 0.26]];
  for (const [cx, cy, cr] of comb) {
    ctx.fillStyle = '#e53935';
    ctx.beginPath(); ctx.arc(x + r * cx, y + r * cy, r * cr, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x + r * cx, y + r * cy, r * cr, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.arc(x + r * 0.0, y - r * 1.12, r * 0.08, 0, 7); ctx.fill();
  // mỏ 2 mảng + bóng
  ctx.fillStyle = '#ffb300';
  ctx.beginPath(); ctx.moveTo(x + r * 0.55, y - r * 0.1); ctx.lineTo(x + r * 1.15, y + r * 0.12); ctx.lineTo(x + r * 0.55, y + r * 0.38); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(x + r * 0.55, y - r * 0.1); ctx.lineTo(x + r * 1.15, y + r * 0.12); ctx.lineTo(x + r * 0.55, y + r * 0.38); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = '#e65100'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + r * 0.55, y + r * 0.12); ctx.lineTo(x + r * 1.1, y + r * 0.12); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.beginPath(); ctx.moveTo(x + r * 0.62, y - r * 0.02); ctx.lineTo(x + r * 0.85, y + r * 0.06); ctx.lineTo(x + r * 0.62, y + r * 0.08); ctx.closePath(); ctx.fill();
  // tích đỏ + highlight
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.55, r * 0.2, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.55, r * 0.2, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x + r * 0.29, y + r * 0.49, r * 0.06, 0, 7); ctx.fill();
  // mắt long lanh: viền + catchlight kép
  ctx.fillStyle = '#4a3226'; ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.24, 0, 7); ctx.fill();
  ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + r * 0.37, y - r * 0.22, r * 0.07, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x + r * 0.22, y - r * 0.07, r * 0.035, 0, 7); ctx.fill();
}

/** Đầu bò sữa (thay 🐄) */
export function drawCowHead(ctx: CanvasRenderingContext2D, x: number, y: number, s = 26) {
  const r = s / 2;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ell(ctx, x, y + r + 2, r, 3);
  // sừng + highlight sừng
  ctx.fillStyle = '#d7ccc8';
  ctx.fillRect(x - r * 0.75, y - r * 1.15, r * 0.22, r * 0.45);
  ctx.fillRect(x + r * 0.55, y - r * 1.15, r * 0.22, r * 0.45);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.1;
  ctx.strokeRect(x - r * 0.75, y - r * 1.15, r * 0.22, r * 0.45);
  ctx.strokeRect(x + r * 0.55, y - r * 1.15, r * 0.22, r * 0.45);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillRect(x - r * 0.73, y - r * 1.13, r * 0.06, r * 0.4);
  ctx.fillRect(x + r * 0.57, y - r * 1.13, r * 0.06, r * 0.4);
  // tai + lòng tai hồng
  ctx.fillStyle = '#fafafa';
  ell(ctx, x - r * 0.85, y - r * 0.35, r * 0.32, r * 0.22);
  ell(ctx, x + r * 0.85, y - r * 0.35, r * 0.32, r * 0.22);
  ctx.fillStyle = '#f8bbd0';
  ell(ctx, x - r * 0.85, y - r * 0.35, r * 0.17, r * 0.11);
  ell(ctx, x + r * 0.85, y - r * 0.35, r * 0.17, r * 0.11);
  // mặt trắng + viền
  ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, 7); ctx.stroke();
  // chỏm lông trán
  ctx.fillStyle = '#efebe9';
  ctx.beginPath(); ctx.ellipse(x, y - r * 0.68, r * 0.34, r * 0.2, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(74,50,38,.3)'; ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(x + i * r * 0.14, y - r * 0.8); ctx.lineTo(x + i * r * 0.18, y - r * 0.6); ctx.stroke();
  }
  // đốm + đốm phụ
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.25, r * 0.28, r * 0.22, 0.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#424242';
  ctx.beginPath(); ctx.ellipse(x + r * 0.42, y - r * 0.42, r * 0.13, r * 0.1, -0.4, 0, 7); ctx.fill();
  // mõm hồng + bóng + lỗ mũi gloss
  ctx.fillStyle = '#f8bbd0'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.45, r * 0.5, r * 0.35, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.45, r * 0.5, r * 0.35, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.2, y + r * 0.32, r * 0.2, r * 0.1, -0.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#ad1457';
  ctx.beginPath(); ctx.arc(x - r * 0.18, y + r * 0.45, r * 0.08, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.18, y + r * 0.45, r * 0.08, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.beginPath(); ctx.arc(x - r * 0.2, y + r * 0.42, r * 0.025, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.16, y + r * 0.42, r * 0.025, 0, 7); ctx.fill();
  // miệng
  ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.52); ctx.lineTo(x, y + r * 0.66); ctx.stroke();
  // mắt long lanh kép
  const cowEye = (ex: number, ey: number, er: number) => {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex, ey, er * 1.25, 0, 7); ctx.fill();
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + er * 0.3, ey - er * 0.3, er * 0.35, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(ex - er * 0.3, ey + er * 0.3, er * 0.18, 0, 7); ctx.fill();
  };
  cowEye(x - r * 0.32, y - r * 0.05, r * 0.13);
  cowEye(x + r * 0.38, y - r * 0.08, r * 0.13);
}

// ---------- cá vẽ tay: 8 loại phân biệt rõ (thay 🐟🐠🦐🦀🐡🎏🐙🦈) ----------
export type FishIconId = 'caro' | 'cachep' | 'tom' | 'cua' | 'caloc' | 'cakoi' | 'bachtuoc' | 'camap' | 'cadieu' | 'catre' | 'luon' | 'ech' | 'cahoi' | 'tomhum' | 'cavang' | string;

// Thân cá phẳng 2 tone (KHÔNG gradient — ao vẽ hàng chục con/frame).
// 3 ops: nền lưng + bụng sáng + highlight lưng.
function fishBody(ctx: CanvasRenderingContext2D, len: number, h: number, top: string, belly: string) {
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(0, 0, len / 2, h / 2, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(0, h * 0.2, len * 0.42, h * 0.28, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.24, len * 0.34, h * 0.12, 0, 0, 7);
  ctx.fill();
}

// Đuôi 2 lớp: lớp ngoài + lõi sáng trong. 2 fills.
function fishTail(ctx: CanvasRenderingContext2D, x: number, len: number, h: number, col: string) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x - len * 0.28, -h * 0.55);
  ctx.lineTo(x - len * 0.2, 0);
  ctx.lineTo(x - len * 0.28, h * 0.55);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath();
  ctx.moveTo(x - len * 0.02, 0);
  ctx.lineTo(x - len * 0.2, -h * 0.34);
  ctx.lineTo(x - len * 0.15, 0);
  ctx.lineTo(x - len * 0.2, h * 0.34);
  ctx.closePath(); ctx.fill();
}

// Mang cá: 1 arc. Đường bên hông lấp lánh: 1 line + 1 dot.
function fishGill(ctx: CanvasRenderingContext2D, gx: number, r: number) {
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(gx, 0, r, -1.1, 1.1); ctx.stroke();
}
function fishLateral(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.beginPath(); ctx.arc((x1 + x2) / 2, y, 0.9, 0, 7); ctx.fill();
}
// Hàng vảy cong: 3 arcs rẻ.
function fishScales(ctx: CanvasRenderingContext2D, col: string) {
  ctx.strokeStyle = col; ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 6, 1, 5, 0.4, Math.PI - 0.4); ctx.stroke(); }
}
// Vây lưng gradient-less: fill phẳng + 2 tia vây.
function fishFin(ctx: CanvasRenderingContext2D, col: string, dark: string) {
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(4, -13); ctx.lineTo(6, -6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(1, -7); ctx.lineTo(3, -12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3.4, -6.6); ctx.lineTo(4.6, -11); ctx.stroke();
}

/** Vẽ cá mini nhìn ngang (mặt hướng phải). Caller flip qua scale nếu cần. */
export function drawFish(ctx: CanvasRenderingContext2D, x: number, y: number, len = 30, id: FishIconId = 'caro', t = 0) {
  const wig = Math.sin(t * 6 + x * 0.1) * 1.5;
  ctx.save(); ctx.translate(x, y + wig * 0.3);
  const eye = (ex: number, ey: number, r: number) => {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex, ey, r * 1.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#102027'; ctx.beginPath(); ctx.arc(ex, ey, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + r * 0.3, ey - r * 0.3, r * 0.35, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(ex - r * 0.25, ey + r * 0.3, r * 0.16, 0, 7); ctx.fill();
  };
  switch (id) {
    case 'cachep': { // chép vàng
      fishTail(ctx, -len / 2, len, 14, '#ef6c00');
      fishBody(ctx, len, 15, '#ffb300', '#ffe082');
      fishScales(ctx, 'rgba(180,100,0,.5)');
      fishGill(ctx, len * 0.18, 5);
      fishLateral(ctx, -len * 0.28, len * 0.28, 2);
      fishFin(ctx, '#ef6c00', '#bf360c');
      eye(len * 0.32, -2, 2.6);
      // râu chép
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(len * 0.48, 3); ctx.quadraticCurveTo(len * 0.58, 5, len * 0.55, 8); ctx.stroke();
      break;
    }
    case 'tom': { // tôm cong
      ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 2, len * 0.28, 0.3, 5.4); ctx.stroke();
      ctx.strokeStyle = '#ffab91'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 2, len * 0.28, 0.5, 5.0); ctx.stroke();
      // highlight dọc sống lưng tôm
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 2, len * 0.28, 1.1, 2.6); ctx.stroke();
      ctx.strokeStyle = '#bf360c'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 6, -6); ctx.lineTo(-4 + i * 6, 2); ctx.stroke(); }
      // đầu + râu dài + đuôi quạt
      ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(len * 0.32, -2, 5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(len * 0.32 - 1.4, -3.4, 1.4, 0, 7); ctx.fill();
      eye(len * 0.36, -3, 1.8);
      ctx.strokeStyle = '#ffccbc'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(len * 0.4, -4); ctx.lineTo(len * 0.7, -12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len * 0.4, -2); ctx.lineTo(len * 0.68, -6); ctx.stroke();
      ctx.fillStyle = '#d84315';
      ctx.beginPath(); ctx.moveTo(-len * 0.32, 4); ctx.lineTo(-len * 0.5, -2); ctx.lineTo(-len * 0.48, 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.beginPath(); ctx.moveTo(-len * 0.36, 4); ctx.lineTo(-len * 0.46, 0); ctx.lineTo(-len * 0.44, 7); ctx.closePath(); ctx.fill();
      break;
    }
    case 'cua': { // cua đỏ
      ctx.fillStyle = '#d32f2f';
      ctx.beginPath(); ctx.ellipse(0, 0, len * 0.32, 10, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ef5350';
      ctx.beginPath(); ctx.ellipse(-2, -3, len * 0.24, 6, 0, 0, 7); ctx.fill();
      // gloss mai cua
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.ellipse(-3, -5, len * 0.12, 2.2, -0.3, 0, 7); ctx.fill();
      // đốm mai
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath(); ctx.arc(-4, 2, 1.4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(3, 3, 1.2, 0, 7); ctx.fill();
      // càng + khớp càng
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath(); ctx.arc(len * 0.42, -6, 5.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(len * 0.42, 6, 5.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#7f0000'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(len * 0.42, -6); ctx.lineTo(len * 0.42, -1); ctx.stroke();
      ctx.fillStyle = '#ff8a80';
      ctx.beginPath(); ctx.arc(len * 0.44, -7, 2, 0, 7); ctx.fill();
      // chân
      ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 1.8;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.moveTo(-8 + k * 7, 8); ctx.lineTo(-11 + k * 7, 14); ctx.stroke();
      }
      eye(-3, -3, 2); eye(4, -3, 2);
      break;
    }
    case 'caloc': { // lóc xanh đen dài
      fishTail(ctx, -len / 2, len, 12, '#37474f');
      fishBody(ctx, len * 1.15, 12, '#455a64', '#b0bec5');
      fishGill(ctx, len * 0.24, 4.4);
      fishLateral(ctx, -len * 0.32, len * 0.32, 1.5);
      ctx.fillStyle = '#263238';
      for (let i = 0; i < 4; i++) ell(ctx, -8 + i * 7, -1, 2.4, 1.8);
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath(); ctx.arc(-8, -1.5, 0.8, 0, 7); ctx.fill();
      fishFin(ctx, '#37474f', '#102027');
      eye(len * 0.4, -2, 2.4);
      ctx.strokeStyle = '#263238'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(len * 0.5, 1); ctx.lineTo(len * 0.58, 1); ctx.stroke();
      break;
    }
    case 'cakoi': { // koi trắng đốm đỏ
      fishTail(ctx, -len / 2, len, 14, '#e53935');
      fishBody(ctx, len, 14, '#fafafa', '#ffebee');
      ctx.fillStyle = '#e53935';
      ctx.beginPath(); ctx.ellipse(-2, -3, 5, 3.4, 0.3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(8, 2, 3.4, 2.4, -0.3, 0, 7); ctx.fill();
      // viền đốm + gloss đốm
      ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.ellipse(-2, -3, 5, 3.4, 0.3, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.ellipse(-3, -4, 2, 1.1, 0.3, 0, 7); ctx.fill();
      fishGill(ctx, len * 0.18, 4.6);
      fishLateral(ctx, -len * 0.26, len * 0.26, 2.5);
      ctx.fillStyle = '#ff8a80';
      ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(2, -12); ctx.lineTo(5, -6); ctx.closePath(); ctx.fill();
      eye(len * 0.33, -2, 2.4);
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(len * 0.46, 2); ctx.quadraticCurveTo(len * 0.56, 3, len * 0.55, 6); ctx.stroke();
      break;
    }
    case 'bachtuoc': { // bạch tuộc tím
      ctx.fillStyle = '#7b1fa2';
      ctx.beginPath(); ctx.arc(4, -4, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#ab47bc';
      ctx.beginPath(); ctx.arc(1, -7, 5, 0, 7); ctx.fill();
      // gloss đầu + đốm
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.ellipse(1, -8, 3.4, 1.8, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#ce93d8';
      ctx.beginPath(); ctx.arc(7, -1, 1.2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -2, 1, 0, 7); ctx.fill();
      // 5 xúc tu + giác hút
      ctx.strokeStyle = '#7b1fa2'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const sx = -4 + k * 4;
        ctx.beginPath(); ctx.moveTo(sx, 3);
        ctx.quadraticCurveTo(sx + Math.sin(t * 5 + k) * 3, 8, sx - 2 + Math.cos(t * 4 + k) * 3, 12);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-3 + k * 4, 8, 0.9, 0, 7); ctx.fill(); }
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, -6, 3.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -6, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(6.6, -6, 1.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7.1, -6.5, 0.6, 0, 7); ctx.fill();
      break;
    }
    case 'camap': { // mập xám
      fishTail(ctx, -len / 2, len * 1.1, 15, '#546e7a');
      fishBody(ctx, len * 1.1, 15, '#78909c', '#eceff1');
      // vây lưng + vây ngực có tia
      ctx.fillStyle = '#455a64';
      ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(3, -15); ctx.lineTo(8, -6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2, 6); ctx.lineTo(8, 11); ctx.lineTo(10, 5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#263238'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(1, -7); ctx.lineTo(4, -13); ctx.stroke();
      // mang + răng
      ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(6 + i * 3, -4); ctx.lineTo(6 + i * 3, 3); ctx.stroke(); }
      fishLateral(ctx, -len * 0.3, len * 0.24, 0);
      eye(len * 0.36, -3, 2.4);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(len * 0.42, 3); ctx.lineTo(len * 0.52, 3); ctx.lineTo(len * 0.47, 5.5); ctx.closePath(); ctx.fill();
      break;
    }
    case 'cadieu': { // diêu hồng: thân hồng, vây đỏ
      fishTail(ctx, -len / 2, len, 13, '#d81b60');
      fishBody(ctx, len, 14, '#f48fb1', '#fce4ec');
      fishFin(ctx, '#d81b60', '#880e4f');
      fishScales(ctx, 'rgba(173,20,87,.4)');
      fishGill(ctx, len * 0.18, 4.6);
      fishLateral(ctx, -len * 0.3, len * 0.3, 1);
      eye(len * 0.32, -2, 2.6);
      break;
    }
    case 'catre': { // trê xám + râu dài 2 bên
      fishTail(ctx, -len / 2, len * 1.05, 12, '#424242');
      fishBody(ctx, len * 1.05, 12, '#616161', '#bdbdbd');
      fishGill(ctx, len * 0.22, 4.2);
      fishLateral(ctx, -len * 0.3, len * 0.28, 1.5);
      ctx.fillStyle = '#424242';
      ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(2, -11); ctx.lineTo(6, -5); ctx.closePath(); ctx.fill();
      // râu trê
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(len * 0.46, 0); ctx.quadraticCurveTo(len * 0.62, -2, len * 0.66, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len * 0.46, 2); ctx.quadraticCurveTo(len * 0.62, 4, len * 0.64, 9); ctx.stroke();
      eye(len * 0.36, -2, 2.2);
      break;
    }
    case 'luon': { // lươn: thân dài uốn, vây nhỏ
      ctx.strokeStyle = '#558b2f'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-len * 0.42, 4); ctx.quadraticCurveTo(0, -4 + Math.sin(t * 5) * 2, len * 0.4, 2); ctx.stroke();
      ctx.strokeStyle = '#9ccc65'; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(-len * 0.42, 4); ctx.quadraticCurveTo(0, -4 + Math.sin(t * 5) * 2, len * 0.4, 2); ctx.stroke();
      // highlight sống lưng + vằn
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-len * 0.36, 2); ctx.quadraticCurveTo(0, -5 + Math.sin(t * 5) * 2, len * 0.34, 0); ctx.stroke();
      ctx.fillStyle = '#33691e';
      ctx.beginPath(); ctx.arc(-4, -1, 1.3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(3, -3, 1.3, 0, 7); ctx.fill();
      // vây lưng mỏng + đầu
      ctx.fillStyle = '#33691e';
      ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(2, -9); ctx.lineTo(4, -5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7cb342'; ctx.beginPath(); ctx.arc(len * 0.42, 1, 4.4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(len * 0.42 - 1, 0, 1.2, 0, 7); ctx.fill();
      eye(len * 0.44, 0, 1.8);
      break;
    }
    case 'ech': { // ếch: ngồi trong ao — thân tròn, mắt lồi 2 bên, chân sau
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath(); ctx.ellipse(-len * 0.3, 7, 7, 3.4, 0.4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(len * 0.3, 7, 7, 3.4, -0.4, 0, 7); ctx.fill();
      // ngón chân sau
      ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 1.2;
      for (const sx of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sx * len * 0.3, 9); ctx.lineTo(sx * len * 0.3 - 2, 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx * len * 0.3 + 2, 9); ctx.lineTo(sx * len * 0.3 + 2, 11); ctx.stroke();
      }
      // thân phẳng 2 tone (không gradient)
      ctx.fillStyle = '#43a047';
      ctx.beginPath(); ctx.ellipse(0, 0, len * 0.36, 9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#66bb6a';
      ctx.beginPath(); ctx.ellipse(-2, -3, len * 0.26, 5.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8e6c9';
      ctx.beginPath(); ctx.ellipse(0, 4, len * 0.22, 4.5, 0, 0, 7); ctx.fill();
      // đốm lưng
      ctx.fillStyle = '#1b5e20';
      ctx.beginPath(); ctx.arc(-6, -2, 1.3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -1, 1.1, 0, 7); ctx.fill();
      // mắt lồi trên đỉnh đầu + catchlight kép
      for (const sx of [-5, 5]) {
        ctx.fillStyle = '#43a047';
        ctx.beginPath(); ctx.arc(sx, -9, 4.6, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath(); ctx.arc(sx, -9, 3, 0, 7); ctx.fill();
        ctx.fillStyle = '#102027';
        ctx.beginPath(); ctx.arc(sx, -9, 1.5, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(sx + 0.5, -9.5, 0.6, 0, 7); ctx.fill();
      }
      // miệng cười + má hồng
      ctx.strokeStyle = '#10300f'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 1, 5, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = 'rgba(244,143,177,.6)';
      ctx.beginPath(); ctx.arc(-6, 2, 1.6, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(6, 2, 1.6, 0, 7); ctx.fill();
      break;
    }
    case 'cahoi': { // hồi: thân cam hồng + đốm đen + vây mỡ
      fishTail(ctx, -len / 2, len * 1.05, 13, '#e64a19');
      fishBody(ctx, len * 1.05, 14, '#ff8a65', '#fbe9e7');
      ctx.fillStyle = '#bf360c';
      for (let i = 0; i < 4; i++) ell(ctx, -10 + i * 7, -1, 2, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.arc(-10, -1.5, 0.7, 0, 7); ctx.fill();
      fishGill(ctx, len * 0.22, 4.4);
      fishLateral(ctx, -len * 0.3, len * 0.3, 1.5);
      fishFin(ctx, '#e64a19', '#7f0000');
      // vây mỡ đặc trưng cá hồi
      ctx.fillStyle = '#ffab91';
      ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(-8, -10); ctx.lineTo(-5, -6); ctx.closePath(); ctx.fill();
      eye(len * 0.36, -2, 2.4);
      break;
    }
    case 'tomhum': { // tôm hùm: đỏ đậm + càng to 2 bên + râu
      ctx.strokeStyle = '#7f0000'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 2, len * 0.26, 0.4, 5.3); ctx.stroke();
      ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.arc(0, 2, len * 0.26, 0.6, 4.9); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 2, len * 0.26, 1.2, 2.4); ctx.stroke();
      // càng khổng lồ phía trước + khớp
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath(); ctx.arc(len * 0.42, -7, 6.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(len * 0.42, 8, 6.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#7f0000'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(len * 0.42, -7); ctx.lineTo(len * 0.34, -1); ctx.stroke();
      ctx.fillStyle = '#ff8a80';
      ctx.beginPath(); ctx.arc(len * 0.44, -8, 2.4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(len * 0.44, 7, 2.4, 0, 7); ctx.fill();
      // đầu + mắt + râu dài
      ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(len * 0.3, 0, 5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(len * 0.3 - 1.4, -1.6, 1.3, 0, 7); ctx.fill();
      eye(len * 0.34, -1.5, 1.8);
      ctx.strokeStyle = '#ffccbc'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(len * 0.38, -3); ctx.lineTo(len * 0.68, -13); ctx.stroke();
      // đuôi quạt + tia
      ctx.fillStyle = '#7f0000';
      ctx.beginPath(); ctx.moveTo(-len * 0.3, 4); ctx.lineTo(-len * 0.5, -3); ctx.lineTo(-len * 0.47, 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ff8a80'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-len * 0.32, 4); ctx.lineTo(-len * 0.47, 3); ctx.stroke();
      break;
    }
    case 'cavang': { // cá vàng: cam + đuôi voan đôi chảy
      ctx.fillStyle = '#ffb74d';
      ctx.beginPath(); ctx.moveTo(-len * 0.3, 0); ctx.lineTo(-len * 0.62, -9 + Math.sin(t * 6) * 2); ctx.lineTo(-len * 0.5, 0); ctx.lineTo(-len * 0.62, 9 + Math.cos(t * 6) * 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.moveTo(-len * 0.34, 0); ctx.lineTo(-len * 0.58, -7 + Math.sin(t * 6) * 2); ctx.lineTo(-len * 0.5, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e65100'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-len * 0.3, 0); ctx.lineTo(-len * 0.6, -8); ctx.stroke();
      fishBody(ctx, len * 0.9, 15, '#ff9800', '#fff3e0');
      fishScales(ctx, 'rgba(230,81,0,.45)');
      fishGill(ctx, len * 0.16, 4.6);
      fishLateral(ctx, -len * 0.24, len * 0.24, 2);
      fishFin(ctx, '#e65100', '#bf360c');
      // bướu đầu cá vàng ranchu + gloss
      ctx.fillStyle = '#ffcc80'; ctx.beginPath(); ctx.arc(len * 0.28, -6, 3.4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(len * 0.28 - 1, -7, 1.1, 0, 7); ctx.fill();
      eye(len * 0.32, -1, 2.6);
      break;
    }
    default: { // cá thường + loài mới: nhuộm màu theo id để phân biệt trong ao
      let hh = 0;
      for (let k = 0; k < id.length; k++) hh = (hh * 31 + id.charCodeAt(k)) | 0;
      const PAL: [string, string, string][] = [
        ['#1565c0', '#42a5f5', '#e1f5fe'], // caro xanh
        ['#ad1457', '#f48fb1', '#fce4ec'], // diêu hồng
        ['#37474f', '#90a4ae', '#eceff1'], // trê xám
        ['#558b2f', '#9ccc65', '#f1f8e9'], // lươn rêu
        ['#1b5e20', '#43a047', '#c8e6c9'], // ếch xanh
        ['#bf360c', '#ff8a65', '#fbe9e7'], // hồi cam
        ['#7f0000', '#e53935', '#ffcdd2'], // tôm hùm đỏ
        ['#e65100', '#ffb74d', '#fff3e0'], // vàng cam
      ];
      const pal = id === 'caro' ? PAL[0] : PAL[1 + (Math.abs(hh) % (PAL.length - 1))];
      fishTail(ctx, -len / 2, len, 13, pal[0]);
      fishBody(ctx, len, 14, pal[1], pal[2]);
      fishScales(ctx, 'rgba(0,0,0,.25)');
      fishGill(ctx, len * 0.18, 4.6);
      fishLateral(ctx, -len * 0.3, len * 0.3, 1.5);
      ctx.fillStyle = pal[0];
      ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(3, -12); ctx.lineTo(6, -6); ctx.closePath(); ctx.fill();
      eye(len * 0.32, -2, 2.8);
      break;
    }
  }
  ctx.restore();
}

// ---------- quả trên cây (thay 🍎🍊🥭) ----------
export type TreeFruitKind = 'apple' | 'orange' | 'mango' | string;
export function drawTreeFruit(ctx: CanvasRenderingContext2D, x: number, y: number, r = 6, kind: TreeFruitKind = 'apple') {
  ctx.fillStyle = 'rgba(0,0,0,.2)';
  ell(ctx, x + 1, y + r * 0.9, r * 0.8, r * 0.3);
  if (kind === 'orange') {
    const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r + 1);
    g.addColorStop(0, '#ffe0b2'); g.addColorStop(0.5, '#fb8c00'); g.addColorStop(1, '#ef6c00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    // lỗ cam + chấm vỏ
    ctx.fillStyle = '#bf360c'; ctx.beginPath(); ctx.arc(x, y - r + 1, 1.4, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(191,54,12,.4)';
    ctx.beginPath(); ctx.arc(x + 2, y + 2, 0.8, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 2.5, y + 1, 0.7, 0, 7); ctx.fill();
  } else if (kind === 'mango') {
    const g = ctx.createRadialGradient(x - 2, y - 3, 1, x, y, r + 2);
    g.addColorStop(0, '#fff59d'); g.addColorStop(0.55, '#ffb300'); g.addColorStop(1, '#f4511e');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.85, r * 1.1, 0.3, 0, 7); ctx.fill();
    // má hồng xoài
    ctx.fillStyle = 'rgba(244,81,30,.45)';
    ctx.beginPath(); ctx.ellipse(x + r * 0.25, y + r * 0.3, r * 0.35, r * 0.45, 0.3, 0, 7); ctx.fill();
  } else {
    const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r + 1);
    g.addColorStop(0, '#ffcdd2'); g.addColorStop(0.5, '#e53935'); g.addColorStop(1, '#b71c1c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    // rãnh táo
    ctx.strokeStyle = 'rgba(183,28,28,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y - r + 1); ctx.quadraticCurveTo(x - 1, y, x, y + r - 1); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(74,50,38,.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  // cuống + lá có gân + gloss sao
  ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + 1, y - r - 3); ctx.stroke();
  ctx.fillStyle = '#43a047';
  ctx.beginPath(); ctx.ellipse(x + 3.5, y - r - 2.5, 3, 1.6, 0.5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x + 1.2, y - r - 2.2); ctx.lineTo(x + 5.6, y - r - 2.9); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ell(ctx, x - r * 0.35, y - r * 0.3, r * 0.28, r * 0.18);
  // sao gloss 4 cánh nhỏ
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1;
  const gx = x - r * 0.35, gy = y - r * 0.35;
  ctx.beginPath();
  ctx.moveTo(gx - 2, gy); ctx.lineTo(gx + 2, gy);
  ctx.moveTo(gx, gy - 2); ctx.lineTo(gx, gy + 2);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(gx, gy, 0.9, 0, 7); ctx.fill();
}

/** Bí ngô trang trí shop (thay 🎃) */
export function drawPumpkin(ctx: CanvasRenderingContext2D, x: number, y: number, s = 18) {
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(ctx, x, y + s * 0.42, s * 0.5, 3);
  const g = ctx.createLinearGradient(0, y - s / 2, 0, y + s / 2);
  g.addColorStop(0, '#ffb74d'); g.addColorStop(1, '#ef6c00');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.5, s * 0.42, 0, 0, 7); ctx.fill();
  // múi bí: rãnh dọc nhiều lớp
  ctx.strokeStyle = '#bf360c'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.42); ctx.quadraticCurveTo(x - 4, y, x, y + s * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.42); ctx.quadraticCurveTo(x + 4, y, x, y + s * 0.42); ctx.stroke();
  ctx.strokeStyle = 'rgba(191,54,12,.55)'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(x - s * 0.28, y - s * 0.36); ctx.quadraticCurveTo(x - s * 0.42, y, x - s * 0.28, y + s * 0.36); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + s * 0.28, y - s * 0.36); ctx.quadraticCurveTo(x + s * 0.42, y, x + s * 0.28, y + s * 0.36); ctx.stroke();
  // highlight múi giữa
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath(); ctx.ellipse(x - s * 0.14, y - s * 0.08, s * 0.08, s * 0.2, -0.15, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.5, s * 0.42, 0, 0, 7); ctx.stroke();
  // cuống xoắn 2 đoạn + lá
  ctx.strokeStyle = '#33691e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.42); ctx.quadraticCurveTo(x + 1, y - s * 0.42 - 3, x + 3, y - s * 0.42 - 4); ctx.stroke();
  ctx.strokeStyle = '#558b2f'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.42 - 1); ctx.quadraticCurveTo(x + 2, y - s * 0.42 - 4, x + 4.5, y - s * 0.42 - 3); ctx.stroke();
  ctx.fillStyle = '#43a047';
  ctx.beginPath(); ctx.ellipse(x + 5, y - s * 0.42 - 3, 2.6, 1.3, 0.5, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(ctx, x - s * 0.2, y - s * 0.15, 2.6, 1.8);
  // sao gloss
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - s * 0.22, y - s * 0.18, 1, 0, 7); ctx.fill();
}

/** Mặt trời / mặt trăng vẽ tay (thay ☀️🌙) */
export function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number, r = 15, t = 0) {
  const rot = t * 0.2;
  // quầng ngoài mờ
  ctx.fillStyle = 'rgba(255,183,0,.18)';
  ctx.beginPath(); ctx.arc(x, y, r + 12, 0, 7); ctx.fill();
  // tia kép: dài + ngắn xen kẽ
  ctx.strokeStyle = '#ffb300'; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = rot + (i / 8) * Math.PI * 2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r + 4), y + Math.sin(a) * (r + 4));
    ctx.lineTo(x + Math.cos(a) * (r + 9), y + Math.sin(a) * (r + 9));
    ctx.stroke();
    const b = a + Math.PI / 8;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(b) * (r + 3), y + Math.sin(b) * (r + 3));
    ctx.lineTo(x + Math.cos(b) * (r + 6), y + Math.sin(b) * (r + 6));
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r + 1);
  g.addColorStop(0, '#fffde7'); g.addColorStop(0.6, '#ffeb3b'); g.addColorStop(1, '#ff9800');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e65100'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  // gloss mặt trời
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.4, r * 0.22, r * 0.13, -0.4, 0, 7); ctx.fill();
  // mặt cười + má hồng
  ctx.fillStyle = 'rgba(244,143,177,.7)';
  ctx.beginPath(); ctx.arc(x - 8, y + 2, 2.2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 8, y + 2, 2.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#e65100';
  ctx.beginPath(); ctx.arc(x - 5, y - 2, 1.8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5, y - 2, 1.8, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - 4.5, y - 2.5, 0.6, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5.5, y - 2.5, 0.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e65100'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(x, y + 1, 6, 0.3, Math.PI - 0.3); ctx.stroke();
}
export function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r = 14) {
  // quầng
  ctx.strokeStyle = 'rgba(255,253,231,.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fffde7';
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  // miệng núi lửa có bóng trong + viền sáng
  const crater = (cx: number, cy: number, cr: number) => {
    ctx.fillStyle = 'rgba(8,8,50,.22)';
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(8,8,50,.18)';
    ctx.beginPath(); ctx.arc(cx - cr * 0.2, cy + cr * 0.2, cr * 0.7, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, cr, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
  };
  crater(x - 3, y - 3, 3);
  crater(x + 4, y + 2, 2.2);
  crater(x - 1, y + 6, 1.6);
  // lưỡi liềm sáng + viền
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.35, r * 0.3, r * 0.16, -0.5, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(74,50,38,.35)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
}

/** Zzz khi pet ngủ (thay 💤) */
export function drawSleepZ(ctx: CanvasRenderingContext2D, x: number, y: number, s = 13, t = 0) {
  const bob = Math.sin(t * 3) * 1.5;
  // bong bóng mờ sau chữ Z
  ctx.fillStyle = 'rgba(144,202,249,.25)';
  ctx.beginPath(); ctx.arc(x + 9, y - 9 + bob, 7, 0, 7); ctx.fill();
  ctx.textAlign = 'center';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)';
  const zs: [number, number, number, string][] = [
    [0, 0, 1, '#90caf9'],
    [9, -9 + bob, 0.8, '#64b5f6'],
    [16, -17 + bob * 1.4, 0.62, '#42a5f5'],
  ];
  for (const [dx, dy, sc, col] of zs) {
    ctx.font = `bold ${Math.round(s * sc)}px 'Be Vietnam Pro', monospace`;
    ctx.strokeText('Z', x + dx, y + dy);
    ctx.fillStyle = col;
    ctx.fillText('Z', x + dx, y + dy);
    // highlight chữ
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = `bold ${Math.max(4, Math.round(s * sc * 0.4))}px 'Be Vietnam Pro', monospace`;
    ctx.fillText('Z', x + dx - 0.5, y + dy - 1);
    ctx.fillStyle = col;
  }
}

/** Ngôi sao vàng (thay ★ text) */
export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r = 7) {
  ctx.fillStyle = '#ffca28';
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // highlight cánh + lõi (không gradient — giữ rẻ)
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ell(ctx, x - r * 0.2, y - r * 0.2, r * 0.16, r * 0.12);
  ctx.fillStyle = '#fff176';
  ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - 0.8, y - 0.8, r * 0.08, 0, 7); ctx.fill();
}

/** Rau mầm generic khi crop lạ (fallback, thay emoji crop) */
export function drawCropGeneric(ctx: CanvasRenderingContext2D, x: number, y: number, s = 18, t = 0) {
  drawSprout(ctx, x, y + 4, s + 6, t);
  // nụ hoa: viền nâu + cánh + nhụy + gloss
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath(); ctx.arc(x, y - s * 0.5, s * 0.28, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y - s * 0.5, s * 0.28, 0, 7); ctx.stroke();
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath(); ctx.arc(x, y - s * 0.5, s * 0.12, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.beginPath(); ctx.arc(x - s * 0.05, y - s * 0.55, s * 0.04, 0, 7); ctx.fill();
}
