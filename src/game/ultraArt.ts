// ===== ULTRA ART — vẽ chi tiết đỉnh cao cho từng element (chỉ chạy quality === 'ultra') =====
// Khác với hạt hiệu ứng không khí (ultra.ts), module này NÂNG CẤP TRỰC TIẾP
// từng element khi vẽ: thảm cỏ dày, sương sớm trên cây trồng, lông óng ánh vật
// nuôi, vân nước caustic, tán cây xếp lớp sâu. Không hề có lớp phủ màu toàn màn
// hình — mọi nét đều nằm đúng trên element nên hình vẽ tay luôn rõ nét.
// Deterministic theo toạ độ (không sinh mảng mỗi frame), chi phí rẻ có chặn trên.

function uh(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return (((h ^ (h >> 16)) >>> 0) % 1000) / 1000;
}

// ------------------------------------------------------------------
// 1. THẢM CỎ ULTRA — bổ sung bụi cỏ 3 lá gradient + hoa li ti + cỏ 4 lá
//    ngay trên nền cỏ, né đúng các khu chức năng (truyền vào qua `avoid`).
// ------------------------------------------------------------------
export function ultraGrassDetail(
  ctx: CanvasRenderingContext2D,
  cam: { x: number; y: number }, W: number, H: number, t: number,
  avoid: (wx: number, wy: number) => boolean,
): void {
  const step = 64;
  const x0 = Math.floor(cam.x / step) * step, y0 = Math.floor(cam.y / step) * step;
  for (let wx = x0; wx < cam.x + W + step; wx += step) {
    for (let wy = y0; wy < cam.y + H + step; wy += step) {
      const h = uh(wx, wy);
      if (h < 0.42) continue;
      if (avoid(wx, wy)) continue;
      const X = wx + h * 44 - cam.x, Y = wy + uh(wy, wx) * step - cam.y;
      if (X < -24 || Y < -24 || X > W + 20 || Y > H + 20) continue;
      const kind = uh(wx * 3, wy * 7);
      if (kind < 0.52) {
        // chùm 3 lá cỏ cong: viền tối + thân sáng + gân lá, đung đưa
        for (let b = 0; b < 3; b++) {
          const ang = -Math.PI / 2 + (b - 1) * 0.44 + Math.sin(t * 1.7 + b * 2.1 + wx) * 0.09;
          const len = 8 + uh(wx + b, wy) * 5;
          const ex = X + Math.cos(ang) * len, ey = Y + Math.sin(ang) * len;
          const mx = X + Math.cos(ang) * len * 0.5, my = Y + Math.sin(ang) * len * 0.6 - 3;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(30,90,30,.7)'; ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
          ctx.strokeStyle = b === 1 ? '#5dbb46' : '#4aa93b'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
          ctx.strokeStyle = 'rgba(200,255,180,.5)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(mx, my, (X + ex) / 2, (Y + ey) / 2); ctx.stroke();
        }
      } else if (kind < 0.78) {
        // hoa cỏ dại li ti 5 cánh xoay nhẹ theo gió
        const petal = ['#ffffff', '#ffd9ec', '#fff3a8', '#e3c2ff'][Math.floor(kind * 40) % 4];
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 + t * 0.15 + wx;
          ctx.fillStyle = petal;
          ctx.beginPath(); ctx.ellipse(X + Math.cos(a) * 2.6, Y - 5 + Math.sin(a) * 2.6, 1.7, 1.3, a, 0, 7); ctx.fill();
        }
        ctx.fillStyle = '#ffe082';
        ctx.beginPath(); ctx.arc(X, Y, 1.4, 0, 7); ctx.fill();
      } else {
        // cụm cỏ 4 lá + chấm sương
        ctx.fillStyle = 'rgba(38,120,45,.85)';
        for (let c = 0; c < 4; c++) {
          const a = (c / 4) * Math.PI * 2 + 0.79;
          ctx.beginPath(); ctx.ellipse(X + Math.cos(a) * 3, Y - 2 + Math.sin(a) * 2.2, 2.6, 1.7, a, 0, 7); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath(); ctx.arc(X - 1, Y - 4.5, 1, 0, 7); ctx.fill();
      }
    }
  }
}

// ------------------------------------------------------------------
// 2. CÂY TRỒNG ULTRA — sương sớm đọng trên lá + cỏ non mọc quanh gốc
//    (gọi cuối drawCropPlantInner, cùng hệ toạ độ gốc cây)
// ------------------------------------------------------------------
export function ultraCropDetail(
  ctx: CanvasRenderingContext2D, cx: number, baseY: number, stage: number, t: number, seed: number,
): void {
  if (stage < 1) return;
  // 3 giọt sương bám thân: quả cầu thủy tinh + chấm sáng + lấp lánh
  for (let k = 0; k < 3; k++) {
    const h = uh(seed * 97 + k, 41);
    const dx = cx + (h - 0.5) * 26;
    const dy = baseY - 4 - h * (stage >= 3 ? 30 : 16);
    ctx.fillStyle = 'rgba(190,235,255,.75)';
    ctx.beginPath(); ctx.ellipse(dx, dy, 1.7, 2.4, 0.2, 0, 7); ctx.fill();
    ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath(); ctx.arc(dx - 0.5, dy - 0.7, 0.6, 0, 7); ctx.fill();
    if (Math.sin(t * 3 + h * 9) > 0.85) {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fillRect(dx - 3, dy - 0.5, 6, 0.8);
      ctx.fillRect(dx - 0.4, dy - 3, 0.8, 3);
    }
  }
  // cỏ non viền gốc: 2 bụi 3 lá lắc nhẹ
  for (const s of [-1, 1]) {
    const bx = cx + s * (14 + (Math.floor(seed) % 3) * 3);
    for (let b = -1; b <= 1; b++) {
      const ang = -Math.PI / 2 + b * 0.5 + Math.sin(t * 1.8 + b + seed) * 0.09;
      ctx.strokeStyle = 'rgba(46,125,50,.85)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, baseY + 1);
      ctx.quadraticCurveTo(bx + Math.cos(ang) * 5, baseY - 5, bx + Math.cos(ang) * 8, baseY - 8 + Math.sin(ang) * 4);
      ctx.stroke();
    }
  }
  // sheen nắng trượt trên tán (chỉ cây lớn)
  if (stage >= 3) {
    const sh = 0.5 + 0.5 * Math.sin(t * 1.4 + seed * 2);
    ctx.fillStyle = `rgba(255,255,220,${(0.14 + sh * 0.1).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(cx - 6, baseY - 26 + Math.sin(t * 1.1 + seed) * 2, 13, 4.5, -0.35, 0, 7);
    ctx.fill();
  }
}

// ------------------------------------------------------------------
// 3. VẬT NUÔI ULTRA — lông óng ánh: viền nắng dọc lưng + bụi lông bay
// ------------------------------------------------------------------
export function ultraAnimalDetail(
  ctx: CanvasRenderingContext2D, X: number, Y: number, sc: number, t: number, uid: number,
): void {
  // dải sáng óng dọc sống lưng (nét cong mảnh, không che hình)
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 2.2 * sc; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(X, Y - 4 * sc, 17 * sc, 12 * sc, 0, Math.PI * 1.12, Math.PI * 1.92);
  ctx.stroke();
  ctx.restore();
  // bụi lông lấp lánh bồng bềnh quanh thân
  for (let k = 0; k < 3; k++) {
    const h = uh(uid * 31 + k, 17);
    const px = X + Math.sin(t * 1.3 + k * 2.1 + uid) * 16 * sc;
    const py = Y - 10 * sc - ((t * 9 + h * 26 + k * 9) % 26);
    const a = 0.5 * (1 - (Y - 10 * sc - py) / 34);
    if (a <= 0.04) continue;
    ctx.fillStyle = `rgba(255,252,235,${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(px, py, Math.max(0.6, 1.1 * sc), 0, 7); ctx.fill();
  }
}

// ------------------------------------------------------------------
// 4. MẶT NƯỚC ULTRA — lưới caustic nắng dưới đáy + lấp lánh trôi
//    (vẽ trong rect nước, tự clip — dùng chung cho ao + sông)
// ------------------------------------------------------------------
export function ultraWaterDetail(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number,
): void {
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  // lưới caustic: các cung chồng khớp trôi chậm, alpha rất mỏng
  ctx.strokeStyle = 'rgba(255,255,255,.13)';
  ctx.lineWidth = 1.6;
  const cell = 56;
  const ox = ((t * 10) % cell) - cell, oy = ((t * 6) % (cell * 0.6)) - cell * 0.6;
  for (let cx = x + ox; cx < x + w + cell; cx += cell) {
    for (let cy = y + cell * 0.6; cy < y + h + cell; cy += cell * 0.6) {
      const off = Math.sin(t * 1.4 + cx * 0.05 + cy * 0.09) * 5;
      ctx.beginPath(); ctx.arc(cx, cy + off, 14, 0.3, 2.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + cell / 2, cy + 16 + off, cell * 0.34, Math.PI * 0.9, Math.PI * 2.05); ctx.stroke();
    }
  }
  // lấp lánh phân bố dày: chấm + chữ thập nhỏ
  for (let i = 0; i < 16; i++) {
    const gx = x + uh(i * 13, 7) * w;
    const gy = y + uh(i, 91) * h;
    const tw = Math.sin(t * 5 + i * 2.7);
    if (tw < 0.2) continue;
    ctx.fillStyle = `rgba(255,255,245,${(0.3 + 0.5 * tw).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(gx, gy, 1.3, 0, 7); ctx.fill();
    if (tw > 0.9) {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillRect(gx - 3.2, gy - 0.5, 5, 1);
      ctx.fillRect(gx - 0.5, gy - 3.2, 1, 5);
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------
// 5. TÁN CÂY ULTRA — cụm lá non viền sáng + đốm nắng xuyên tán rơi
// ------------------------------------------------------------------
export function ultraTreeDetail(
  ctx: CanvasRenderingContext2D, x: number, y: number, sc: number, sway: number, t: number,
): void {
  // 6 cụm lá non viền sáng rìa tán (to nhỏ so le cho tự nhiên)
  for (let k = 0; k < 6; k++) {
    const h = uh(k * 17, 5);
    const lx = x + Math.cos(h * 6) * (12 + h * 12) * sc * 0.9 + sway;
    const ly = y - 64 * sc + Math.sin(h * 9) * 10 * sc - (h - 0.5) * 16;
    ctx.fillStyle = k % 2 ? 'rgba(92,184,92,.92)' : 'rgba(120,200,110,.92)';
    ctx.beginPath(); ctx.ellipse(lx, ly, 5.5 * sc, 4.2 * sc, h * 3, 0, 7); ctx.fill();
    ctx.lineWidth = 1.2 * sc; ctx.strokeStyle = 'rgba(30,70,35,.75)'; ctx.stroke();
    ctx.fillStyle = 'rgba(225,255,215,.6)';
    ctx.beginPath(); ctx.ellipse(lx - 1.2 * sc, ly - 1.4 * sc, 1.6 * sc, 1 * sc, -0.4, 0, 7); ctx.fill();
  }
  // đốm nắng xuyên tán rơi chậm (3 hạt, không phủ màn hình)
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.5 + k * 0.37) % 1;
    const dx = x + Math.sin(t * 0.9 + k * 2.4) * 26 * sc;
    const dy = y - 46 * sc + ph * 52 * sc;
    ctx.fillStyle = `rgba(255,255,200,${(0.5 * (1 - Math.abs(ph - 0.5) * 1.4)).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(dx, dy, 2.2, 0, 7); ctx.fill();
  }
}
