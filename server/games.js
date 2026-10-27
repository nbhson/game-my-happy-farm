// ============================================================
// NÔNG TRẠI PIXEL — LOGIC GAME THUẦN của casino (không io, không state server)
// Tách khỏi index.js để unit test được mà không cần khởi động server.
// Quy ước: mọi hàm nhận state (room/st) làm THAM SỐ — mutate/trả về trên đó,
// không đụng io / players / db. index.js import và gọi.
// Wire format không đổi — đây chỉ là sắp xếp lại code nội bộ server.
// ============================================================

function casinoMax(game) { return game === 'caro' || game === 'chess' ? 2 : 4; }
function casinoMin(game) { return 2; }
/** Mỗi lượt tiến lên/caro 30s, vòng lật bài cào 45s — hết giờ trọng tài tự đánh */
const TURN_MS = 30000;
const BAICAO_MS = 45000;
function touchDeadline(room) {
  if (!room.state) return;
  room.state.deadline = Date.now() + (room.game === 'baicao' ? BAICAO_MS : TURN_MS);
}
function cDeck() {
  const d = [];
  for (let r = 3; r <= 15; r++) for (let s = 0; s < 4; s++) d.push({ r, s, id: `${r}-${s}` });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function cCmp(a, b) { return a.r !== b.r ? a.r - b.r : a.s - b.s; }
function cCombo(cards) {
  if (!cards?.length) return null;
  const a = cards.slice().sort(cCmp);
  const n = a.length;
  if (n === 1) return { type: 'single', len: 1, topRank: a[0].r, topSuit: a[0].s };
  if (n === 2 && a[0].r === a[1].r) return { type: 'pair', len: 2, topRank: a[0].r, topSuit: Math.max(a[0].s, a[1].s) };
  if (n === 3 && a[0].r === a[1].r && a[1].r === a[2].r) return { type: 'triple', len: 3, topRank: a[0].r, topSuit: Math.max(a[0].s, a[1].s, a[2].s) };
  if (n === 4 && a[0].r === a[1].r && a[1].r === a[2].r && a[2].r === a[3].r) return { type: 'four', len: 4, topRank: a[0].r, topSuit: 3 };
  if (n >= 3) {
    for (let i = 1; i < n; i++) if (a[i].r !== a[i - 1].r + 1) return null;
    if (a[n - 1].r >= 15) return null;
    return { type: 'straight', len: n, topRank: a[n - 1].r, topSuit: a[n - 1].s };
  }
  return null;
}
function cBeats(prev, next) {
  if (next.type === 'four') {
    if (prev.type === 'single' && prev.topRank === 15) return true;
    if (prev.type === 'pair' && prev.topRank === 15) return true;
    if (prev.type === 'four') return next.topRank > prev.topRank;
  }
  if (prev.type !== next.type || prev.len !== next.len) return false;
  if (next.topRank !== prev.topRank) return next.topRank > prev.topRank;
  return next.topSuit > prev.topSuit;
}
function tlNext(st, from) {
  const n = st.order.length;
  const i = st.order.indexOf(from);
  for (let k = 1; k <= n; k++) {
    const id = st.order[(i + k) % n];
    if ((st.hands[id]?.length ?? 0) > 0) return id;
  }
  return from;
}
function tlAllPassed(st, me) {
  const others = st.order.filter((id) => id !== me && (st.hands[id]?.length ?? 0) > 0);
  return others.length > 0 && others.every((id) => st.passed.includes(id));
}
function casinoStartRoom(room) {
  const need = casinoMin(room.game);
  if (room.players.length < need) return `Cần ít nhất ${need} người (có thể thêm máy)`;
  const pids = room.players.map((x) => x.pid);
  room.pot = room.bet * room.players.length;
  if (room.game === 'tienlen') {
    const deck = cDeck();
    const hands = {};
    pids.forEach((id) => (hands[id] = []));
    for (let k = 0; k < 13; k++) for (const id of pids) { const c = deck.pop(); if (c) hands[id].push(c); }
    for (const id of pids) hands[id].sort(cCmp);
    let first = pids[0];
    let hasThree = false;
    for (const [id, h] of Object.entries(hands)) if (h.some((c) => c.r === 3 && c.s === 0)) { first = id; hasThree = true; }
    // 2-3 người chia 13 lá → 3♠ có thể nằm trong chồng dư, không ai có.
    // Khi đó cho chủ phòng đi trước tự do (không bắt buộc 3♠) để khỏi kẹt ván.
    room.state = { order: pids, hands, turn: first, leader: first, lastPlay: null, lastPlayer: null, passed: [], firstTurn: hasThree, winner: null, rank: [], deadline: null };
  } else if (room.game === 'baicao') {
    const deck = cDeck();
    const hands = {};
    pids.forEach((id) => (hands[id] = []));
    for (let k = 0; k < 3; k++) for (const id of pids) { const c = deck.pop(); if (c) hands[id].push(c); }
    room.state = { order: pids, hands, revealed: room.players.filter((x) => x.bot).map((x) => x.pid), winners: null, deadline: null };
    if (room.state.revealed.length >= pids.length) casinoFinishBaiCao(room);
  } else if (room.game === 'caro') {
    if (pids.length !== 2) return 'Caro cần đúng 2 người';
    room.state = { size: 12, board: Array.from({ length: 12 }, () => Array(12).fill(null)), order: pids, turn: pids[0], winner: null, winLine: null, draw: false, moveCount: 0, deadline: null };
  } else if (room.game === 'xidach') {
    room.state = xdNewGame(pids, cDeck());
  } else if (room.game === 'chess') {
    if (pids.length !== 2) return 'Cờ vua cần đúng 2 người';
    room.state = chNewGame([pids[0], pids[1]]);
  }
  room.status = 'playing';
  room.winners = null;
  room.updatedAt = Date.now();
  return null;
}
function bcPoint(r) { if (r === 14) return 1; if (r >= 11 && r <= 13) return 10; if (r === 15) return 2; return r; }
function bcScore(hand) {
  const faces = hand.filter((c) => c.r >= 11 && c.r <= 13).length;
  if (hand.length === 3 && faces === 3) return { score: 10, top: hand.slice().sort(cCmp)[2] };
  return { score: hand.reduce((a, c) => a + bcPoint(c.r), 0) % 10, top: hand.slice().sort(cCmp)[hand.length - 1] };
}
function casinoFinishBaiCao(room) {
  const st = room.state;
  let best = [];
  for (const id of st.order) {
    if (!best.length) { best = [id]; continue; }
    const a = bcScore(st.hands[best[0]]); const b = bcScore(st.hands[id]);
    if (b.score !== a.score) { if (b.score > a.score) best = [id]; }
    else {
      if (b.top.r !== a.top.r) { if (b.top.r > a.top.r) best = [id]; }
      else if (b.top.s !== a.top.s) { if (b.top.s > a.top.s) best = [id]; }
      else best.push(id);
    }
  }
  st.winners = best;
  st.deadline = null;
  room.status = 'finished';
  room.winners = best;
  room.updatedAt = Date.now();
}
function caroWin(board, r, c) {
  const v = board[r]?.[c];
  if (v == null) return null;
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    const line = [[r, c]];
    for (let k = 1; k < 5; k++) { const nr = r + dr * k, nc = c + dc * k; if (board[nr]?.[nc] !== v) break; line.push([nr, nc]); }
    for (let k = 1; k < 5; k++) { const nr = r - dr * k, nc = c - dc * k; if (board[nr]?.[nc] !== v) break; line.unshift([nr, nc]); }
    if (line.length >= 5) return line.slice(0, 5);
  }
  return null;
}
// ---- xì dách (server mirror của src/game/casino/xidach.ts) ----
function xdValue(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.r === 14) { aces++; total += 11; }
    else if (c.r >= 10 && c.r <= 13) total += 10;
    else if (c.r === 15) total += 2;
    else total += c.r;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}
function xdStrength(hand) {
  const v = xdValue(hand);
  if (v > 21) return -1;
  if (hand.length === 2 && hand.every((c) => c.r === 14)) return 600; // xì bàng
  if (hand.length === 2 && hand.some((c) => c.r === 14) && hand.some((c) => c.r >= 10 && c.r <= 13)) return 500; // xì dách
  if (hand.length >= 5) return 400 + v; // ngũ linh
  if (v < 16) return -1; // dằn non
  return v;
}
function xdNewGame(pids, deck) {
  const hands = {};
  pids.forEach((id) => (hands[id] = []));
  for (let k = 0; k < 2; k++) for (const id of pids) { const c = deck.pop(); if (c) hands[id].push(c); }
  const dealer = [];
  for (let k = 0; k < 2; k++) { const c = deck.pop(); if (c) dealer.push(c); }
  return { order: pids.slice(), hands, deck, stood: [], turn: pids[0] || '', dealer, phase: 'play', winners: null, deadline: null };
}
function xdNext(st, from) {
  const i = st.order.indexOf(from);
  for (let k = 1; k <= st.order.length; k++) {
    const id = st.order[(i + k) % st.order.length];
    if (!st.stood.includes(id)) return id;
  }
  return from;
}
function xdDealerFinish(st) {
  const dealer = st.dealer.slice();
  while (xdValue(dealer) < 16 && dealer.length < 5) {
    const c = st.deck.pop();
    if (!c) break;
    dealer.push(c);
  }
  const ds = xdStrength(dealer);
  const winners = st.order.filter((id) => {
    const ps = xdStrength(st.hands[id] || []);
    if (ps < 0) return false;
    return ps >= ds;
  });
  st.dealer = dealer; st.phase = 'done'; st.winners = winners; st.turn = ''; st.deadline = null;
  return st;
}
function xdHit(st, pid) {
  if (st.phase !== 'play' || st.turn !== pid || st.stood.includes(pid)) return null;
  const hand = st.hands[pid];
  if (!hand || hand.length >= 5) return null;
  const c = st.deck.pop();
  if (!c) return xdStand(st, pid);
  hand.push(c);
  if (xdValue(hand) > 21 || hand.length >= 5) st.stood.push(pid);
  st.turn = xdNext(st, pid);
  if (st.stood.length >= st.order.length) return xdDealerFinish(st);
  return st;
}
function xdStand(st, pid) {
  if (st.phase !== 'play' || st.turn !== pid || st.stood.includes(pid)) return null;
  st.stood.push(pid);
  st.turn = xdNext(st, pid);
  if (st.stood.length >= st.order.length) return xdDealerFinish(st);
  return st;
}
function xdBotAuto(st, pid) {
  const hand = st.hands[pid];
  if (!hand || st.phase !== 'play' || hand.length >= 5) return null;
  const v = xdValue(hand);
  const xb = hand.length === 2 && hand.every((c) => c.r === 14);
  const xd = hand.length === 2 && hand.some((c) => c.r === 14) && hand.some((c) => c.r >= 10 && c.r <= 13);
  if (xb || xd) return xdStand(st, pid);
  if (v < 16) return xdHit(st, pid);
  if (hand.length === 4 && v <= 17) return xdHit(st, pid);
  return xdStand(st, pid);
}
function xdRemovePlayer(st, pid) {
  if (st.phase !== 'play') return st;
  if (!st.stood.includes(pid)) st.stood.push(pid);
  st.order = st.order.filter((id) => id !== pid);
  if (!st.order.length) {
    st.turn = ''; st.phase = 'done'; st.winners = []; st.deadline = null;
    return st;
  }
  if (st.turn === pid || st.stood.includes(st.turn)) {
    st.turn = '';
    for (const id of st.order) if (!st.stood.includes(id)) { st.turn = id; break; }
  }
  if (st.order.every((id) => st.stood.includes(id))) return xdDealerFinish(st);
  return st;
}
// ---- cờ vua (server mirror của src/game/casino/chess.ts) ----
function chOpp(c) { return c === 'w' ? 'b' : 'w'; }
function chInB(r, c) { return r >= 0 && c >= 0 && r < 8 && c < 8; }
function chNewGame(ids) {
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { t: back[c], c: 'w' };
    board[1][c] = { t: 'p', c: 'w' };
    board[6][c] = { t: 'p', c: 'b' };
    board[7][c] = { t: back[c], c: 'b' };
  }
  const st = {
    board, order: [ids[0], ids[1]], turn: ids[0],
    castling: { wk: true, wq: true, bk: true, bq: true },
    ep: null, half: 0, full: 1, history: [], posCounts: {},
    lastMove: null, winner: null, winReason: null,
    draw: false, drawReason: null, inCheck: false, deadline: null,
  };
  st.posCounts[chPosKey(st)] = 1;
  return st;
}
function chColorOf(st, pid) { return pid === st.order[0] ? 'w' : pid === st.order[1] ? 'b' : null; }
function chPosKey(st) {
  let s = chColorOf(st, st.turn) || 'w';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = st.board[r][c];
    s += p ? (p.c === 'w' ? p.t.toUpperCase() : p.t) : '.';
  }
  const k = st.castling;
  s += (k.wk ? 'K' : '') + (k.wq ? 'Q' : '') + (k.bk ? 'k' : '') + (k.bq ? 'q' : '');
  s += st.ep ? `e${st.ep[0]}${st.ep[1]}` : '';
  return s;
}
function chFindKing(bd, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = bd[r][c];
    if (p && p.t === 'k' && p.c === color) return [r, c];
  }
  return null;
}
function chAttacked(bd, r, c, by) {
  const pr = by === 'w' ? r - 1 : r + 1;
  for (const dc of [-1, 1]) {
    const p = chInB(pr, c + dc) ? bd[pr][c + dc] : null;
    if (p && p.c === by && p.t === 'p') return true;
  }
  for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
    const p = chInB(r + dr, c + dc) ? bd[r + dr][c + dc] : null;
    if (p && p.c === by && p.t === 'n') return true;
  }
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const p = chInB(r + dr, c + dc) ? bd[r + dr][c + dc] : null;
    if (p && p.c === by && p.t === 'k') return true;
  }
  const rays = [
    { dirs: [[1, 1], [1, -1], [-1, 1], [-1, -1]], types: ['b', 'q'] },
    { dirs: [[1, 0], [-1, 0], [0, 1], [0, -1]], types: ['r', 'q'] },
  ];
  for (const { dirs, types } of rays) {
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      while (chInB(nr, nc)) {
        const p = bd[nr][nc];
        if (p) { if (p.c === by && types.includes(p.t)) return true; break; }
        nr += dr; nc += dc;
      }
    }
  }
  return false;
}
function chDoMove(bd, mv) {
  const [fr, fc] = mv.f, [tr, tc] = mv.t;
  const p = bd[fr][fc];
  let captured = bd[tr][tc];
  if (p.t === 'p' && fc !== tc && !captured) {
    captured = bd[fr][tc];
    bd[fr][tc] = null;
  }
  bd[tr][tc] = mv.pr ? { t: mv.pr, c: p.c } : p;
  bd[fr][fc] = null;
  if (p.t === 'k' && Math.abs(tc - fc) === 2) {
    const home = p.c === 'w' ? 0 : 7;
    if (tc === 6) { bd[home][5] = bd[home][7]; bd[home][7] = null; }
    else { bd[home][3] = bd[home][0]; bd[home][0] = null; }
  }
  return captured;
}
function chSafeAfter(bd, mv, color) {
  const copy = bd.map((row) => row.slice());
  chDoMove(copy, mv);
  const k = chFindKing(copy, color);
  return !!k && !chAttacked(copy, k[0], k[1], chOpp(color));
}
function chPseudo(bd, r, c, color, castling, ep) {
  const p = bd[r][c];
  if (!p || p.c !== color) return [];
  const out = [];
  const push = (tr, tc, pr) => { if (chInB(tr, tc)) out.push({ f: [r, c], t: [tr, tc], pr }); };
  const slide = (dirs) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      while (chInB(nr, nc)) {
        const q = bd[nr][nc];
        if (!q) push(nr, nc);
        else { if (q.c !== color) push(nr, nc); break; }
        nr += dr; nc += dc;
      }
    }
  };
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const LINE = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  if (p.t === 'p') {
    const dir = color === 'w' ? 1 : -1;
    const start = color === 'w' ? 1 : 6;
    const last = color === 'w' ? 7 : 0;
    if (chInB(r + dir, c) && !bd[r + dir][c]) {
      if (r + dir === last) { for (const pr of ['q', 'r', 'b', 'n']) push(r + dir, c, pr); }
      else {
        push(r + dir, c);
        if (r === start && !bd[r + 2 * dir][c]) push(r + 2 * dir, c);
      }
    }
    for (const dc of [-1, 1]) {
      const tr = r + dir, tc = c + dc;
      if (!chInB(tr, tc)) continue;
      const q = bd[tr][tc];
      if (q && q.c !== color) {
        if (tr === last) { for (const pr of ['q', 'r', 'b', 'n']) push(tr, tc, pr); }
        else push(tr, tc);
      } else if (!q && ep && ep[0] === tr && ep[1] === tc) push(tr, tc);
    }
  } else if (p.t === 'n') {
    for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
      if (!chInB(r + dr, c + dc)) continue;
      const q = bd[r + dr][c + dc];
      if (!q || q.c !== color) push(r + dr, c + dc);
    }
  } else if (p.t === 'b') slide(DIAG);
  else if (p.t === 'r') slide(LINE);
  else if (p.t === 'q') slide([...DIAG, ...LINE]);
  else if (p.t === 'k') {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (!chInB(r + dr, c + dc)) continue;
      const q = bd[r + dr][c + dc];
      if (!q || q.c !== color) push(r + dr, c + dc);
    }
    const home = color === 'w' ? 0 : 7;
    const kSide = color === 'w' ? castling.wk : castling.bk;
    const qSide = color === 'w' ? castling.wq : castling.bq;
    if (r === home && c === 4 && !chAttacked(bd, r, c, chOpp(color))) {
      if (kSide && !bd[home][5] && !bd[home][6] && bd[home][7]?.t === 'r' && bd[home][7]?.c === color
        && !chAttacked(bd, home, 5, chOpp(color)) && !chAttacked(bd, home, 6, chOpp(color))) push(home, 6);
      if (qSide && !bd[home][3] && !bd[home][2] && !bd[home][1] && bd[home][0]?.t === 'r' && bd[home][0]?.c === color
        && !chAttacked(bd, home, 3, chOpp(color)) && !chAttacked(bd, home, 2, chOpp(color))) push(home, 2);
    }
  }
  return out;
}
function chLegal(bd, color, castling, ep) {
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = bd[r][c];
    if (!p || p.c !== color) continue;
    for (const mv of chPseudo(bd, r, c, color, castling, ep)) {
      if (chSafeAfter(bd, mv, color)) out.push(mv);
    }
  }
  return out;
}
const chSqName = (s) => 'abcdefgh'[s[1]] + (s[0] + 1);
function chSAN(st, mv) {
  const [fr, fc] = mv.f, [tr, tc] = mv.t;
  const p = st.board[fr][fc];
  const color = p.c;
  let san;
  if (p.t === 'k' && Math.abs(tc - fc) === 2) {
    san = tc === 6 ? 'O-O' : 'O-O-O';
  } else {
    const target = st.board[tr][tc];
    const isEp = p.t === 'p' && fc !== tc && !target;
    const isCap = !!target || isEp;
    let s = '';
    if (p.t === 'p') {
      s = isCap ? 'abcdefgh'[fc] + 'x' : '';
      s += chSqName(mv.t);
      if (mv.pr) s += '=' + mv.pr.toUpperCase();
    } else {
      s = p.t.toUpperCase();
      const others = [];
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if (r === fr && c === fc) continue;
        const q = st.board[r][c];
        if (!q || q.c !== color || q.t !== p.t) continue;
        const ctx = { bd: st.board, color, castling: st.castling, ep: st.ep };
        void ctx;
        if (chPseudo(st.board, r, c, color, st.castling, st.ep).some((mm) => mm.t[0] === tr && mm.t[1] === tc && chSafeAfter(st.board, mm, color))) {
          others.push({ f: [r, c], t: [tr, tc] });
        }
      }
      if (others.length) {
        const sameFile = others.every((mm) => mm.f[1] === fc);
        const sameRank = others.every((mm) => mm.f[0] === fr);
        if (!sameFile) s += 'abcdefgh'[fc];
        else if (!sameRank) s += String(fr + 1);
        else s += chSqName(mv.f);
      }
      if (isCap) s += 'x';
      s += chSqName(mv.t);
    }
    san = s;
  }
  const after = st.board.map((row) => row.slice());
  chDoMove(after, mv);
  const ek = chFindKing(after, chOpp(color));
  if (ek && chAttacked(after, ek[0], ek[1], color)) {
    san += chLegal(after, chOpp(color), st.castling, null).length ? '+' : '#';
  }
  return san;
}
function chMaterial(bd) {
  const rest = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = bd[r][c];
    if (p && p.t !== 'k') rest.push({ t: p.t, c: p.c, r, c2: c });
  }
  if (!rest.length) return true;
  if (rest.length === 1 && (rest[0].t === 'b' || rest[0].t === 'n')) return true;
  if (rest.length === 2 && rest[0].t === 'b' && rest[1].t === 'b' && rest[0].c !== rest[1].c) {
    if ((rest[0].r + rest[0].c2) % 2 === (rest[1].r + rest[1].c2) % 2) return true;
  }
  return false;
}
function chApply(st, pid, f, t, pr) {
  if (st.winner || st.draw || st.turn !== pid) return null;
  const color = chColorOf(st, pid);
  if (!color) return null;
  if (!chInB(f[0], f[1]) || !chInB(t[0], t[1])) return null;
  const p = st.board[f[0]][f[1]];
  if (!p || p.c !== color) return null;
  const legal = chPseudo(st.board, f[0], f[1], color, st.castling, st.ep)
    .filter((mv) => chSafeAfter(st.board, mv, color));
  const needsPromo = p.t === 'p' && t[0] === (color === 'w' ? 7 : 0);
  if (needsPromo && !pr) return null;
  const mv = legal.find((mm) => mm.t[0] === t[0] && mm.t[1] === t[1] && (mm.pr || null) === (pr || null));
  if (!mv) return null;
  const san = chSAN(st, mv);
  const board = st.board.map((row) => row.slice());
  const captured = chDoMove(board, mv);
  const castling = { ...st.castling };
  if (p.t === 'k') {
    if (color === 'w') { castling.wk = false; castling.wq = false; }
    else { castling.bk = false; castling.bq = false; }
  }
  if (p.t === 'r') {
    if (color === 'w' && f[0] === 0 && f[1] === 0) castling.wq = false;
    if (color === 'w' && f[0] === 0 && f[1] === 7) castling.wk = false;
    if (color === 'b' && f[0] === 7 && f[1] === 0) castling.bq = false;
    if (color === 'b' && f[0] === 7 && f[1] === 7) castling.bk = false;
  }
  if (captured?.t === 'r') {
    if (t[0] === 0 && t[1] === 0) castling.wq = false;
    if (t[0] === 0 && t[1] === 7) castling.wk = false;
    if (t[0] === 7 && t[1] === 0) castling.bq = false;
    if (t[0] === 7 && t[1] === 7) castling.bk = false;
  }
  const ep = p.t === 'p' && Math.abs(t[0] - f[0]) === 2 ? [(f[0] + t[0]) / 2, f[1]] : null;
  const half = p.t === 'p' || captured ? 0 : st.half + 1;
  const nextPid = color === 'w' ? st.order[1] : st.order[0];
  const reply = chLegal(board, chOpp(color), castling, ep);
  const nk = chFindKing(board, chOpp(color));
  const check = !!nk && chAttacked(board, nk[0], nk[1], color);
  let winner = null, winReason = null, draw = false, drawReason = null;
  if (!reply.length) {
    if (check) { winner = pid; winReason = 'checkmate'; }
    else { draw = true; drawReason = 'stalemate'; }
  } else if (chMaterial(board)) { draw = true; drawReason = 'material'; }
  else if (half >= 100) { draw = true; drawReason = 'fifty'; }
  const history = [...st.history, san];
  const full = st.full + (color === 'b' ? 1 : 0);
  const posCounts = { ...st.posCounts };
  const tmpTurn = winner || draw ? st.turn : nextPid;
  const keyTmp = chPosKey({ ...st, board, castling, ep, turn: tmpTurn });
  posCounts[keyTmp] = (posCounts[keyTmp] || 0) + 1;
  if (!winner && !draw && posCounts[keyTmp] >= 3) { draw = true; drawReason = 'repetition'; }
  return {
    ...st, board, castling, ep, half, full, history,
    lastMove: { f: mv.f, t: mv.t },
    turn: tmpTurn, winner, winReason, draw, drawReason,
    inCheck: check && !winner && !draw,
    posCounts, deadline: winner || draw ? null : st.deadline,
  };
}
function chResign(st, pid) {
  const color = chColorOf(st, pid);
  if (!color || st.winner || st.draw) return null;
  const other = color === 'w' ? st.order[1] : st.order[0];
  return { ...st, winner: other, winReason: 'resign', inCheck: false, deadline: null };
}
const CH_VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const CH_PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 5, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};
function chEval(bd) {
  let s = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = bd[r][c];
    if (!p) continue;
    const idx = p.c === 'w' ? r * 8 + c : (7 - r) * 8 + c;
    const v = CH_VAL[p.t] + CH_PST[p.t][idx];
    s += p.c === 'w' ? v : -v;
  }
  return s;
}
function chOrder(bd, moves) {
  return moves
    .map((m) => {
      const target = bd[m.t[0]][m.t[1]];
      let s = 0;
      if (target) s = 10 * CH_VAL[target.t] - CH_VAL[bd[m.f[0]][m.f[1]].t];
      if (m.pr) s += CH_VAL[m.pr];
      return { m, s };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
}
function chSearch(bd, castling, depth, alpha, beta, color, budget) {
  if (budget.stopped) return 0;
  if (++budget.nodes > budget.limit || Date.now() > budget.deadline) {
    budget.stopped = true;
    return 0;
  }
  const all = chOrder(bd, chLegal(bd, color, castling, null));
  const moves = all.length > 18 && depth > 0 ? all.slice(0, depth >= 2 ? 12 : 18) : all;
  if (!moves.length) {
    const k = chFindKing(bd, color);
    if (!k) return 0;
    return chAttacked(bd, k[0], k[1], chOpp(color)) ? -100000 - depth : 0;
  }
  if (depth === 0) return (color === 'w' ? 1 : -1) * chEval(bd);
  let best = -Infinity;
  for (const mv of moves) {
    const nb = bd.map((row) => row.slice());
    chDoMove(nb, mv);
    const score = -chSearch(nb, castling, depth - 1, -beta, -alpha, chOpp(color), budget);
    if (budget.stopped) return 0;
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}
function chAnyMove(st, pid) {
  const color = chColorOf(st, pid);
  if (!color || st.turn !== pid || st.winner || st.draw) return null;
  const moves = chLegal(st.board, color, st.castling, st.ep);
  return moves[0] || null;
}
function chBot(st, pid) {
  const color = chColorOf(st, pid);
  if (!color || st.turn !== pid || st.winner || st.draw) return null;
  const moves = chOrder(st.board, chLegal(st.board, color, st.castling, st.ep));
  if (!moves.length) return null;
  if (moves.length === 1) return moves[0];
  let pieces = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (st.board[r][c]) pieces++;
  const depth = pieces <= 8 ? 3 : 2;
  const cands = moves.length > 16 ? moves.slice(0, 16) : moves;
  const budget = { nodes: 0, limit: 6000, deadline: Date.now() + 700, stopped: false };
  let best = [];
  let bestScore = -Infinity;
  for (const mv of cands) {
    const nb = st.board.map((row) => row.slice());
    chDoMove(nb, mv);
    const score = -chSearch(nb, st.castling, depth - 1, -Infinity, Infinity, chOpp(color), budget) + Math.random() * 12;
    if (budget.stopped) break;
    if (score > bestScore + 0.001) { bestScore = score; best = [mv]; }
    else if (Math.abs(score - bestScore) < 25) best.push(mv);
  }
  if (best.length) return best[(Math.random() * best.length) | 0];
  return cands[0] || moves[0] || null;
}
function casinoSkipTurn(room, pid) {
  const st = room.state;
  if (!st) return;
  if (room.game === 'tienlen') {
    if (st.turn !== pid) return;
    if (!st.lastPlay) {
      // đầu vòng mà rời → chuyển lượt
      st.turn = tlNext(st, pid);
      st.leader = st.turn; st.passed = [];
    } else {
      const passed = st.passed.includes(pid) ? st.passed : [...st.passed, pid];
      const alive = st.order.filter((id) => (st.hands[id]?.length ?? 0) > 0);
      const still = alive.filter((id) => !passed.includes(id));
      if (still.length === 1) { st.passed = []; st.lastPlay = null; st.lastPlayer = null; st.leader = still[0]; st.turn = still[0]; }
      else { st.passed = passed; st.turn = tlNext(st, pid); }
    }
  } else if (room.game === 'caro') {
    // bỏ lượt caro = đổi turn (coi như pass 1 nước)
    const i = st.order.indexOf(pid);
    if (st.turn === pid) st.turn = st.order[(i + 1) % st.order.length];
  } else if (room.game === 'xidach') {
    // rời giữa lượt → coi như dằn
    if (st.turn === pid && st.phase === 'play') xdStand(st, pid);
  } else if (room.game === 'chess') {
    // rời giữa lượt → máy đi giùm (không pass được trong cờ vua)
    if (st.turn === pid && !st.winner && !st.draw) {
      const mv = chBot(st, pid);
      if (mv) {
        const next = chApply(st, pid, mv.f, mv.t, mv.pr);
        if (next) Object.assign(st, next);
      }
    }
  }
}
function casinoAction(room, pid, p) {
  const st = room.state;
  if (!st) return 'Chưa bắt đầu';
  if (!room.players.some((x) => x.pid === pid)) return 'Bạn không trong phòng';
  if (room.game === 'tienlen') {
    if (st.winner) return 'Ván đã kết thúc';
    if (st.turn !== pid) return 'Chưa tới lượt';
    if (p.type === 'pass') {
      if (!st.lastPlay) return 'Đầu vòng phải ra bài';
      const passed = st.passed.includes(pid) ? st.passed : [...st.passed, pid];
      const alive = st.order.filter((id) => (st.hands[id]?.length ?? 0) > 0);
      const still = alive.filter((id) => !passed.includes(id));
      if (still.length === 1) { st.passed = []; st.lastPlay = null; st.lastPlayer = null; st.leader = still[0]; st.turn = still[0]; }
      else { st.passed = passed; st.turn = tlNext(st, pid); }
      room.updatedAt = Date.now();
      return null;
    }
    if (p.type === 'play') {
      const ids = new Set((p.cards || []).map(String));
      const hand = st.hands[pid] ?? [];
      const cards = hand.filter((c) => ids.has(c.id));
      if (cards.length !== ids.size || !cards.length) return 'Chọn bài trong tay';
      const info = cCombo(cards);
      if (!info) return 'Bộ không hợp lệ';
      // Tự chữa ván kẹt cũ: firstTurn=true nhưng không ai còn giữ 3♠ (chia 2-3 người,
      // 3♠ nằm ở chồng dư) → bỏ luật 3♠, cho đi tự do.
      if (st.firstTurn) {
        const anyoneHasThree = Object.values(st.hands).some((h) => (h || []).some((c) => c.r === 3 && c.s === 0));
        if (!anyoneHasThree) st.firstTurn = false;
        else if (!cards.some((c) => c.r === 3 && c.s === 0)) return 'Ván đầu phải ra 3♠';
      }
      const isLead = !st.lastPlay || st.lastPlayer === pid || tlAllPassed(st, pid);
      if (!isLead) {
        const prev = cCombo(st.lastPlay);
        if (!prev || !cBeats(prev, info)) return 'Bài nhỏ, không chặt được';
      }
      st.hands[pid] = hand.filter((c) => !ids.has(c.id));
      st.firstTurn = false;
      if (st.hands[pid].length === 0) {
        st.winner = pid; st.rank = [...(st.rank || []), pid];
        st.lastPlay = cards; st.lastPlayer = pid;
        st.deadline = null;
        room.status = 'finished'; room.winners = [pid];
      } else {
        st.lastPlay = cards; st.lastPlayer = pid; st.leader = pid;
        st.passed = st.passed.filter((id) => id !== pid);
        st.turn = tlNext(st, pid);
      }
      room.updatedAt = Date.now();
      return null;
    }
    return 'Hành động không hợp lệ';
  }
  if (room.game === 'baicao') {
    if (p.type === 'reveal') {
      if (!st.revealed.includes(pid)) st.revealed.push(pid);
      if (st.revealed.length >= st.order.length) casinoFinishBaiCao(room);
      else room.updatedAt = Date.now();
      return null;
    }
    return 'Hành động không hợp lệ';
  }
  if (room.game === 'caro') {
    if (st.winner || st.draw) return 'Ván đã kết thúc';
    if (st.turn !== pid) return 'Chưa tới lượt';
    if (p.type === 'move') {
      const r = Number(p.r), c = Number(p.c);
      if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= st.size || c >= st.size) return 'Ô không hợp lệ';
      if (st.board[r][c] !== null) return 'Ô đã đánh';
      const idx = st.order.indexOf(pid);
      st.board[r][c] = idx; st.moveCount++;
      const line = caroWin(st.board, r, c);
      if (line) { st.winner = pid; st.winLine = line; st.deadline = null; room.status = 'finished'; room.winners = [pid]; }
      else if (st.moveCount >= st.size * st.size) { st.draw = true; st.deadline = null; room.status = 'finished'; room.winners = []; }
      else st.turn = st.order[(idx + 1) % st.order.length];
      room.updatedAt = Date.now();
      return null;
    }
    return 'Hành động không hợp lệ';
  }
  if (room.game === 'xidach') {
    if (st.phase !== 'play') return 'Ván đã kết thúc';
    if (st.turn !== pid) return 'Chưa tới lượt';
    if (p.type === 'hit') {
      if (!xdHit(st, pid)) return 'Không rút được';
    } else if (p.type === 'stand') {
      if (!xdStand(st, pid)) return 'Không dằn được';
    } else return 'Hành động không hợp lệ';
    if (st.phase === 'done') {
      room.status = 'finished'; room.winners = st.winners || [];
      room.updatedAt = Date.now();
    } else {
      st.deadline = Date.now() + TURN_MS;
      room.updatedAt = Date.now();
    }
    return null;
  }
  if (room.game === 'chess') {
    if (st.winner || st.draw) return 'Ván đã kết thúc';
    if (p.type === 'resign') {
      const next = chResign(st, pid);
      if (!next) return 'Không đầu hàng được';
      Object.assign(st, next);
      room.status = 'finished'; room.winners = st.winner ? [st.winner] : [];
      room.updatedAt = Date.now();
      return null;
    }
    if (st.turn !== pid) return 'Chưa tới lượt';
    if (p.type === 'move') {
      const f = Array.isArray(p.f) ? p.f.map(Number) : null;
      const t = Array.isArray(p.t) ? p.t.map(Number) : null;
      const pr = ['q', 'r', 'b', 'n'].includes(p.promo) ? p.promo : undefined;
      if (!f || !t) return 'Nước đi không hợp lệ';
      const next = chApply(st, pid, f, t, pr);
      if (!next) return 'Nước đi không hợp lệ (sai luật / thiếu quân phong cấp)';
      Object.assign(st, next);
      if (st.winner || st.draw) {
        room.status = 'finished'; room.winners = st.winner ? [st.winner] : [];
        room.updatedAt = Date.now();
      } else {
        st.deadline = Date.now() + TURN_MS;
        room.updatedAt = Date.now();
      }
      return null;
    }
    return 'Hành động không hợp lệ';
  }
  return 'Game không hợp lệ';
}
/** Hết giờ mà chưa đi: trọng tài tự xử (tiến lên: bỏ qua hoặc ra nhỏ nhất; bài cào: tự lật; caro: tự đánh) */
function casinoAutoTimeout(room) {
  const st = room.state;
  if (!st || room.status !== 'playing') return false;
  if (room.game === 'tienlen') {
    if (st.winner) return false;
    const cur = st.turn;
    // Ván cũ đang kẹt (firstTurn=true mà không ai có 3♠) → mở khóa ngay để hết kẹt.
    if (st.firstTurn && !st.lastPlay) {
      const anyoneHasThree = Object.values(st.hands).some((h) => (h || []).some((c) => c.r === 3 && c.s === 0));
      if (!anyoneHasThree) st.firstTurn = false;
    }
    const mv = tlBotPick(st, cur);
    if (mv) casinoAction(room, cur, { type: 'play', cards: mv.map((c) => c.id) });
    else if (st.lastPlay) casinoAction(room, cur, { type: 'pass' });
    else {
      // đầu vòng mà không có nước hợp lệ (hiếm) → ra lá nhỏ nhất
      const h = (st.hands[cur] || []).slice().sort(cCmp);
      if (!h.length) return false;
      // ép đi tự do nếu luật 3♠ đang chặn (ván thiếu 3♠)
      st.firstTurn = false;
      casinoAction(room, cur, { type: 'play', cards: [h[0].id] });
    }
    if (room.status === 'playing') touchDeadline(room);
    room.updatedAt = Date.now();
    return true;
  }
  if (room.game === 'baicao') {
    let changed = false;
    for (const id of st.order) {
      if (!st.revealed.includes(id)) { st.revealed.push(id); changed = true; }
    }
    if (changed) {
      if (st.revealed.length >= st.order.length) casinoFinishBaiCao(room);
      else room.updatedAt = Date.now();
      return true;
    }
    return false;
  }
  if (room.game === 'caro') {
    if (st.winner || st.draw) return false;
    const mv = caroBotPick(st);
    if (!mv) return false;
    casinoAction(room, st.turn, { type: 'move', r: mv[0], c: mv[1] });
    if (room.status === 'playing') touchDeadline(room);
    room.updatedAt = Date.now();
    return true;
  }
  if (room.game === 'xidach') {
    if (st.phase !== 'play') return false;
    const before = st.turn;
    if (!xdBotAuto(st, before)) return false;
    if (st.phase === 'done') {
      room.status = 'finished'; room.winners = st.winners || [];
      room.updatedAt = Date.now();
    } else if (room.status === 'playing') touchDeadline(room);
    room.updatedAt = Date.now();
    return true;
  }
  if (room.game === 'chess') {
    if (st.winner || st.draw) return false;
    const mv = chBot(st, st.turn) || chAnyMove(st, st.turn);
    if (!mv) return false;
    const next = chApply(st, st.turn, mv.f, mv.t, mv.pr);
    if (!next) return false;
    Object.assign(st, next);
    if (st.winner || st.draw) {
      room.status = 'finished'; room.winners = st.winner ? [st.winner] : [];
      room.updatedAt = Date.now();
    } else if (room.status === 'playing') touchDeadline(room);
    room.updatedAt = Date.now();
    return true;
  }
  return false;
}
// ---- bot tự đánh (server) ----
function casinoMaybeBot(room) {
  if (room.status !== 'playing' || !room.state) return;
  const st = room.state;
  const botOf = (pid) => room.players.find((x) => x.pid === pid && x.bot);
  if (room.game === 'tienlen') {
    if (st.winner) return;
    const cur = room.players.find((x) => x.pid === st.turn);
    if (!cur?.bot) return;
    setTimeout(() => {
      if (room.status !== 'playing' || st.winner) return;
      if (st.turn !== cur.pid) return;
      const mv = tlBotPick(st, cur.pid);
      if (mv) casinoAction(room, cur.pid, { type: 'play', cards: mv.map((c) => c.id) });
      else if (st.lastPlay) casinoAction(room, cur.pid, { type: 'pass' });
      else {
        // đầu vòng mà bot không có nước (không xảy ra) → đánh lá nhỏ nhất
        const h = (st.hands[cur.pid] || []).slice().sort(cCmp);
        if (h.length) casinoAction(room, cur.pid, { type: 'play', cards: [h[0].id] });
      }
      if (room.status === 'playing' && room.state) touchDeadline(room);
      io.to('casino:' + room.id).emit('casino:state', room);
      io.emit('casino:rooms', casinoPublic());
      casinoMaybeBot(room);
    }, 800);
  } else if (room.game === 'caro') {
    const cur = room.players.find((x) => x.pid === st.turn);
    if (!cur?.bot || st.winner || st.draw) return;
    setTimeout(() => {
      if (room.status !== 'playing') return;
      const mv = caroBotPick(st);
      if (mv) casinoAction(room, cur.pid, { type: 'move', r: mv[0], c: mv[1] });
      if (room.status === 'playing' && room.state) touchDeadline(room);
      io.to('casino:' + room.id).emit('casino:state', room);
      io.emit('casino:rooms', casinoPublic());
      casinoMaybeBot(room);
    }, 700);
  } else if (room.game === 'xidach') {
    if (st.phase !== 'play') return;
    const cur = room.players.find((x) => x.pid === st.turn);
    if (!cur?.bot) return;
    setTimeout(() => {
      if (room.status !== 'playing' || st.phase !== 'play') return;
      if (st.turn !== cur.pid) return;
      if (!xdBotAuto(st, cur.pid)) xdStand(st, cur.pid); // phòng hờ: ép dằn để ván không kẹt
      if (st.phase === 'done') {
        room.status = 'finished'; room.winners = st.winners || [];
        room.updatedAt = Date.now();
      } else if (room.status === 'playing' && room.state) touchDeadline(room);
      io.to('casino:' + room.id).emit('casino:state', room);
      io.emit('casino:rooms', casinoPublic());
      casinoMaybeBot(room);
    }, 800);
  } else if (room.game === 'chess') {
    if (st.winner || st.draw) return;
    const cur = room.players.find((x) => x.pid === st.turn);
    if (!cur?.bot) return;
    setTimeout(() => {
      if (room.status !== 'playing' || st.winner || st.draw) return;
      if (st.turn !== cur.pid) return;
      const mv = chBot(st, cur.pid) || chAnyMove(st, cur.pid);
      if (mv) {
        const next = chApply(st, cur.pid, mv.f, mv.t, mv.pr);
        if (next) {
          Object.assign(st, next);
          if (st.winner || st.draw) {
            room.status = 'finished'; room.winners = st.winner ? [st.winner] : [];
            room.updatedAt = Date.now();
          } else if (room.status === 'playing' && room.state) touchDeadline(room);
        }
      }
      io.to('casino:' + room.id).emit('casino:state', room);
      io.emit('casino:rooms', casinoPublic());
      casinoMaybeBot(room);
    }, 700);
  } else if (room.game === 'baicao') {
    // bot bài cào: tự lật từng đứa cho khỏi chờ hết giờ
    const cur = room.players.find((x) => x.bot && !st.revealed.includes(x.pid));
    if (!cur) return;
    setTimeout(() => {
      if (room.status !== 'playing') return;
      if (!st.revealed.includes(cur.pid)) {
        st.revealed.push(cur.pid);
        if (st.revealed.length >= st.order.length) casinoFinishBaiCao(room);
        else room.updatedAt = Date.now();
      }
      io.to('casino:' + room.id).emit('casino:state', room);
      io.emit('casino:rooms', casinoPublic());
      casinoMaybeBot(room);
    }, 800);
  }
}
function tlBotPick(st, pid) {
  const hand = st.hands[pid] || [];
  if (!hand.length) return null;
  const byRank = new Map();
  for (const c of hand) {
    if (!byRank.has(c.r)) byRank.set(c.r, []);
    byRank.get(c.r).push(c);
  }
  const cands = [];
  for (const g of byRank.values()) {
    const s = g.slice().sort((a, b) => a.s - b.s);
    cands.push([s[0]]);
    if (s.length >= 2) cands.push(s.slice(0, 2));
    if (s.length >= 3) cands.push(s.slice(0, 3));
    if (s.length >= 4) cands.push(s.slice(0, 4));
  }
  const isLead = !st.lastPlay || st.lastPlayer === pid || tlAllPassed(st, pid);
  let list = cands;
  if (st.firstTurn) {
    const need = list.filter((c) => c.some((x) => x.r === 3 && x.s === 0));
    // chỉ ép 3♠ khi thật sự có nước chứa 3♠ (không thì ra nhỏ nhất để khỏi kẹt)
    if (need.length) list = need;
  }
  if (!list.length) return null;
  if (isLead) {
    list.sort((a, b) => { const ia = cCombo(a); const ib = cCombo(b); return ia.topRank - ib.topRank || ia.len - ib.len; });
    return list[0];
  }
  const prev = cCombo(st.lastPlay);
  const ok = list.filter((c) => { const i = cCombo(c); return i && cBeats(prev, i); });
  ok.sort((a, b) => { const ia = cCombo(a); const ib = cCombo(b); return ia.topRank - ib.topRank || ia.topSuit - ib.topSuit; });
  return ok[0] || null;
}
function caroBotPick(st) {
  const size = st.size;
  const meIdx = st.order.indexOf(st.turn);
  const me = meIdx; const opp = 1 - meIdx;
  // thu thập ô trống gần quân
  let has = false;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (st.board[r][c] !== null) { has = true; break; }
  if (!has) return [Math.floor(size / 2), Math.floor(size / 2)];
  const cand = new Map();
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (st.board[r][c] !== null) continue;
    let near = false;
    for (let dr = -2; dr <= 2 && !near; dr++) for (let dc = -2; dc <= 2; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < size && nc < size && st.board[nr][nc] !== null) { near = true; break; }
    }
    if (near) cand.set(r + ':' + c, [r, c]);
  }
  const list = [...cand.values()];
  const tryWin = (v) => {
    for (const [r, c] of list) { st.board[r][c] = v; const w = caroWin(st.board, r, c); st.board[r][c] = null; if (w) return [r, c]; }
    return null;
  };
  return tryWin(me) || tryWin(opp) || list[Math.floor(Math.random() * list.length)] || null;
}


// ---------- exports (index.js + unit tests dùng) ----------
export {
  casinoMax, casinoMin,
  TURN_MS, BAICAO_MS, touchDeadline,
  cDeck, cCmp, cCombo, cBeats, tlNext, tlAllPassed,
  casinoStartRoom, casinoFinishBaiCao, casinoSkipTurn, casinoAction, casinoAutoTimeout,
  bcPoint, bcScore, caroWin,
  xdValue, xdStrength, xdNewGame, xdNext, xdDealerFinish, xdHit, xdStand, xdBotAuto, xdRemovePlayer,
  chOpp, chInB, chNewGame, chColorOf, chPosKey, chFindKing, chAttacked, chDoMove, chSafeAfter,
  chPseudo, chLegal, chSAN, chMaterial, chApply, chResign, chEval, chOrder, chSearch, chAnyMove, chBot,
  tlBotPick, caroBotPick,
};
