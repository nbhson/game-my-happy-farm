// ============================================================
// NÔNG TRẠI PIXEL — LAN server: 1 lệnh cho cả mạng cùng chơi
//   npm run lan   → build web + serve + realtime + DB local
// Không cần Supabase, không cần mạng internet.
// DB local: file JSON (server/data/db.json), đủ cho quy mô LAN party.
// Sau này cần scale: thay DB file bằng SQLite/Postgres, socket giữ nguyên.
// ============================================================
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { promises as fs, writeFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
// logic game casino thuần — tách sang games.js để unit test không cần chạy server
import {
  touchDeadline, casinoStartRoom, casinoFinishBaiCao, casinoSkipTurn, casinoAction, casinoAutoTimeout,
  casinoMax, casinoMin, codeFromName,
  tlBotPick, caroBotPick, xdBotAuto, chBot, chAnyMove, chApply,
} from './games.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8931);
const DIST = path.join(__dirname, '..', 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// ---------- DB local (JSON file, ghi debounced) ----------
// accounts: username (viết thường) -> { username, name, avatar, code, data, updatedAt }
// Toàn bộ farm của 1 username nằm ở đây: reload/tab khác/máy khác chỉ cần
// nhập đúng username là lấy lại được.
let db = { accounts: {} };

/**
 * Ghi DB ĐỒNG BỘ trước khi trả response (await flushDb trong handler).
 * Trước đây debounce 1s: mua xe xong restart server ngay là mất bản ghi
 * trong RAM chưa kịp flush — đúng bug "mua xe rồi restart là mất".
 * Quy mô LAN party (vài write/s, file nhỏ) thì ghi thẳng tay vô tư.
 */
async function flushDb() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db));
  } catch (e) { console.error('[db] write failed:', e.message); }
}
// thoát server (Ctrl+C / restart) mà còn gì chưa ghi thì ghi nốt rồi mới tắt
function flushDbSync() {
  try { writeFileSync(DB_FILE, JSON.stringify(db)); } catch { /* ignore */ }
}
process.on('SIGINT', () => { flushDbSync(); process.exit(0); });
process.on('SIGTERM', () => { flushDbSync(); process.exit(0); });

const keyOf = (u) => String(u || '').trim().toLowerCase().slice(0, 12);

async function loadDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // migrate db cũ { profiles, farms } -> { accounts } (best-effort)
      if (parsed.accounts) db = { accounts: parsed.accounts };
      else {
        db = { accounts: {} };
        for (const [code, snap] of Object.entries(parsed.farms || {})) {
          const uname = keyOf(snap?.name || '');
          if (uname) db.accounts[uname] = { username: uname, name: snap.name, avatar: 0, code, data: snap, updatedAt: snap.updatedAt || Date.now() };
        }
      }
    }
    console.log(`[db] loaded ${Object.keys(db.accounts).length} account(s) from ${DB_FILE}`);
  } catch {
    console.log('[db] fresh database (no db.json yet)');
  }
}
function saveDbSoon() {
  // giữ tên hàm cũ cho mọi chỗ gọi, nhưng ghi ngay + chờ xong (không debounce nữa)
  return flushDb();
}

// ---------- App ----------
const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: 'lan', accounts: true, players: players.size, farms: Object.keys(db.accounts).length });
});

// ---- ACCOUNT: nhập đúng username là lấy lại toàn bộ farm ----
app.get('/api/players/:username', (req, res) => {
  const acc = db.accounts[keyOf(req.params.username)];
  if (!acc) return res.status(404).json({ error: 'not found' });
  res.json(acc);
});

function saveAccount(username, body = {}) {
  const key = keyOf(username);
  if (!key) return null;
  const acc = {
    username: key,
    name: String(body.name || key).slice(0, 12),
    avatar: Number(body.avatar ?? db.accounts[key]?.avatar ?? 0),
    code: codeFromName(key),
    data: body.data && typeof body.data === 'object' ? body.data : (db.accounts[key]?.data || null),
    updatedAt: Date.now(),
  };
  db.accounts[key] = acc;
  saveDbSoon();
  return acc;
}
app.put('/api/players/:username', async (req, res) => {
  const acc = saveAccount(req.params.username, req.body);
  if (!acc) return res.status(400).json({ error: 'bad username' });
  await saveDbSoon(); // ghi đĩa xong mới báo ok — restart ngay cũng không mất
  res.json({ ok: true, code: acc.code });
});
// sendBeacon (unload) chỉ POST được
app.post('/api/players/:username', async (req, res) => {
  const acc = saveAccount(req.params.username, req.body);
  if (!acc) return res.status(400).json({ error: 'bad username' });
  await saveDbSoon();
  res.json({ ok: true, code: acc.code });
});

// thăm farm bạn bằng mã 6 ký tự (kể cả chủ offline) — trả về dạng FarmSnapshot
app.get('/api/farms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const acc = Object.values(db.accounts).find((a) => a.code === code);
  if (!acc || !acc.data) return res.status(404).json({ error: 'not found' });
  res.json({ ...acc.data, code, name: acc.name, avatar: acc.avatar, updatedAt: acc.updatedAt });
});

// hái trộm khi chủ offline: trừ cây chín ở ô plot trong farm đã lưu
// body { plot, crop } → { ok:true } nếu trừ được, { ok:false, reason } nếu ô đã trống/khác
app.post('/api/farms/:code/steal', async (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  const acc = Object.values(db.accounts).find((a) => a.code === code);
  if (!acc || !acc.data || !Array.isArray(acc.data.plots)) return res.status(404).json({ ok: false, reason: 'not found' });
  const plot = Number(req.body?.plot);
  const crop = String(req.body?.crop || '');
  if (!Number.isInteger(plot) || plot < 0 || plot >= 200) return res.status(400).json({ ok: false, reason: 'invalid plot' });
  const pl = acc.data.plots[plot];
  if (!pl || pl.locked || pl.state !== 'ready' || pl.crop !== crop) {
    return res.json({ ok: false, reason: 'plot not ready' });
  }
  acc.data.plots[plot] = { ...pl, state: 'soil', crop: null, progress: 0, watered: false, waterLeft: 0, pest: false };
  acc.updatedAt = Date.now();
  await saveDbSoon();
  res.json({ ok: true });
});

// serve game đã build
app.use(express.static(DIST));
app.use((_req, res) => res.sendFile(path.join(DIST, 'index.html')));

// ---------- Realtime (làng chung) ----------
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

/** id -> { id, v, name, avatar, code, x, y, dir, moving, bubble, bubbleAt, map, emote, emoteAt, visit, updatedAt } */
const players = new Map();
/** socket.id -> presence id (để chuyển tiếp sự kiện trộm tới đúng chủ farm) */
const socketUser = new Map();
/** socket.id -> epoch ms tin chat gần nhất (anti-spam) */
const lastChatAt = new Map();
let broadcastTimer = null;

function publicList() {
  return [...players.values()].map(({ id, v, name, avatar, code, x, y, dir, moving, bubble, bubbleAt, map, emote, emoteAt, visit }) => (
    { id, v: v ?? 1, name, avatar, code, x, y, dir, moving, bubble, bubbleAt, map, emote, emoteAt, visit: visit ?? null, updatedAt: Date.now() }
  ));
}
function emitPlayers() {
  io.emit('players', publicList());
}
function emitSoon() {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => { broadcastTimer = null; emitPlayers(); }, 300);
}

// ================= CASINO rooms (authoritative, LAN) =================
// bet 10..10000 xu/ván. Server giữ bài + lượt + thắng thua; client tự trừ/cộng xu theo kết quả.
const casinoRooms = new Map(); // roomId -> room
const socketToRoom = new Map(); // socket.id -> roomId
const CASINO_IDCHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function casinoRoomId() {
  let s = '';
  for (let i = 0; i < 4; i++) s += CASINO_IDCHARS[Math.floor(Math.random() * CASINO_IDCHARS.length)];
  if (casinoRooms.has(s)) return casinoRoomId();
  return s;
}
function pidOf(myId) { return myId || 'anon'; }
// pid casino: client gửi kèm trong từng sự kiện (kết nối casino là socket riêng,
// không gửi hello nên myId của nó luôn null — không được dùng myId ở đây).
// Nhớ pid theo socket để dọn phòng khi mất kết nối.
const casinoPidBySocket = new Map(); // socket.id -> pid
function ccPid(socket, myId, p) {
  const direct = String(p?.pid || '').trim().slice(0, 80);
  if (direct) { casinoPidBySocket.set(socket.id, direct); return direct; }
  return casinoPidBySocket.get(socket.id) || pidOf(myId);
}
function casinoPlayerFrom(socket, myId, p = {}) {
  const pid = ccPid(socket, myId, p);
  const pl = players.get(pid) || players.get(myId);
  return {
    pid,
    sid: socket.id,
    name: String(p.name || pl?.name || 'Bạn').slice(0, 12),
    avatar: Number(p.avatar ?? pl?.avatar ?? 0),
    bot: false,
  };
}
function casinoPublic() {
  return [...casinoRooms.values()].map((r) => ({
    id: r.id, game: r.game, bet: r.bet, status: r.status,
    players: r.players.map((x) => ({ pid: x.pid, name: x.name, avatar: x.avatar, bot: !!x.bot })),
    hostPid: r.hostPid, updatedAt: r.updatedAt,
  }));
}
function casinoNewRoom(game, bet, me) {
  const id = casinoRoomId();
  return { id, game, bet, hostPid: me.pid, players: [me], status: 'waiting', state: null, winners: null, createdAt: Date.now(), updatedAt: Date.now() };
}
function leaveCasinoRoom(socket, pid) {
  const roomId = socketToRoom.get(socket.id);
  if (!roomId) return;
  const room = casinoRooms.get(roomId);
  socketToRoom.delete(socket.id);
  try { socket.leave('casino:' + roomId); } catch { /* ignore */ }
  if (!room) return;
  room.players = room.players.filter((x) => x.pid !== pid);
  if (!room.players.length) { casinoRooms.delete(roomId); }
  else {
    if (room.hostPid === pid) room.hostPid = room.players[0].pid;
    // đang chơi mà còn 1 người → người đó thắng (đối thủ bỏ cuộc)
    // riêng xì dách: còn 1 người thì ván tiếp tục với nhà cái (coi người rời đã dằn non)
    if (room.status === 'playing' && room.players.length === 1 && room.game !== 'xidach') {
      room.status = 'finished';
      room.winners = [room.players[0].pid];
      if (room.state) { room.state.winner = room.players[0].pid; }
    }
    // bỏ lượt của người rời nếu đang tới lượt họ
    if (room.status === 'playing' && room.state?.turn === pid) {
      casinoSkipTurn(room, pid);
    }
    // xì dách: loại người rời khỏi cuộc (không chia pot); hết người đứng thì nhà cái xử
    if (room.status === 'playing' && room.game === 'xidach' && room.state) {
      xdRemovePlayer(room.state, pid);
      if (room.state.phase === 'done') {
        room.status = 'finished';
        room.winners = room.state.winners || [];
      }
    }
    if (room.status === 'playing' && room.state) touchDeadline(room);
    room.updatedAt = Date.now();
    io.to('casino:' + roomId).emit('casino:state', room);
  }
  io.emit('casino:rooms', casinoPublic());
}
// ---- bài ----
io.on('connection', (socket) => {
  let myId = null;

  socket.on('hello', (p = {}) => {
    // id: ép string + giới hạn — chặn client độc hại nhồi object/chuỗi khổng lồ làm key Map
    myId = String(p.id || socket.id).slice(0, 64) || socket.id;
    socketUser.set(socket.id, myId);
    const prev = players.get(myId);
    players.set(myId, {
      id: myId,
      v: Number(p.v ?? prev?.v ?? 1),
      name: String(p.name || prev?.name || 'Bạn').slice(0, 12),
      avatar: Number(p.avatar ?? prev?.avatar ?? 0),
      // mã farm 6 ký tự — chặn 8 để thoáng nhưng không cho nhồi dữ liệu broadcast
      code: String(p.code || prev?.code || '').slice(0, 8),
      x: Number(p.x ?? prev?.x ?? 700), y: Number(p.y ?? prev?.y ?? 600),
      dir: prev?.dir ?? 1, moving: false,
      bubble: prev?.bubble, bubbleAt: prev?.bubbleAt,
      map: (p.map === 'farm' || p.map === 'town') ? p.map : (prev?.map ?? 'farm'),
      emote: prev?.emote, emoteAt: prev?.emoteAt,
      visit: typeof p.visit === 'string' ? p.visit.toUpperCase().slice(0, 6) : (prev?.visit ?? null),
      updatedAt: Date.now(),
    });
    socket.emit('players', publicList());
    emitSoon();
  });

  socket.on('pos', (p = {}) => {
    if (!myId || !players.has(myId)) return;
    const pl = players.get(myId);
    // validate toạ độ: ép số, chặn NaN — client lỗi/kẻ xấu không được làm mọi client vẽ rác
    const nx = Number(p.x), ny = Number(p.y);
    if (Number.isFinite(nx)) pl.x = Math.max(-5000, Math.min(50000, nx));
    if (Number.isFinite(ny)) pl.y = Math.max(-5000, Math.min(50000, ny));
    pl.dir = p.dir === -1 ? -1 : 1; pl.moving = !!p.moving;
    if (p.v != null) pl.v = Number(p.v) || 1;
    if (p.bubble) { pl.bubble = String(p.bubble).slice(0, 80); pl.bubbleAt = Date.now(); }
    if (p.map === 'farm' || p.map === 'town') pl.map = p.map;
    if (p.emote) { pl.emote = String(p.emote).slice(0, 20); pl.emoteAt = Date.now(); }
    // client mới luôn gửi visit (mã farm đang thăm hoặc null) → gán trực tiếp;
    // client cũ không gửi key này (undefined) → giữ nguyên
    if (p.visit !== undefined) pl.visit = (typeof p.visit === 'string' && p.visit) ? p.visit.toUpperCase().slice(0, 6) : null;
    pl.updatedAt = Date.now();
    emitSoon();
  });

  socket.on('chat', (p = {}) => {
    if (!myId || !players.has(myId)) return;
    // anti-spam: tối đa 1 tin / 300ms / socket
    const now = Date.now();
    if (now - (lastChatAt.get(socket.id) || 0) < 300) return;
    lastChatAt.set(socket.id, now);
    const text = String(p.text || '').slice(0, 80);
    if (!text) return;
    const pl = players.get(myId);
    pl.bubble = text; pl.bubbleAt = Date.now();
    io.emit('chat', { id: `${Date.now()}-${myId}`, fromId: myId, fromName: pl.name, text, at: Date.now() });
    emitSoon();
  });

  socket.on('farm:save', (snap = {}) => {
    // giới hạn kích thước: socket event không qua express.json limit
    // giữ nguyên event name + wire format — chỉ cắt bớt data nếu quá lớn
    const raw = JSON.stringify(snap);
    if (raw.length > 256_000) {
      console.warn(`[farm:save] rejecting oversized save (${raw.length} bytes) from ${myId}`);
      return;
    }
    // client gửi { username, name, avatar, data } — upsert account
    if (snap.username) saveAccount(snap.username, snap);
    else if (snap.code) {
      // tương thích client cũ: tìm account theo code
      const acc = Object.values(db.accounts).find((a) => a.code === String(snap.code).toUpperCase());
      if (acc) saveAccount(acc.username, { ...snap, data: snap });
    }
  });

  // hái trộm: chuyển tiếp cho (các) tab đang giữ farm nạn nhân
  // { code, plot, crop, thief, caught } — chủ farm tự trừ cây + cho chó sủa
  socket.on('farm:steal', (p = {}) => {
    const code = String(p.code || '').toUpperCase().slice(0, 6);
    if (!code) return;
    const ev = {
      code,
      plot: Number(p.plot),
      crop: String(p.crop || ''),
      thief: String(p.thief || 'Ai đó').slice(0, 12),
      caught: !!p.caught,
    };
    for (const [sid, pid] of socketUser) {
      const pl = players.get(pid);
      if (pl && (pl.code || '').toUpperCase() === code) io.to(sid).emit('farm:stolen', ev);
    }
  });

  // ================= CASINO (phòng chơi realtime) =================
  socket.on('casino:list', () => {
    socket.emit('casino:rooms', casinoPublic());
  });
  socket.on('casino:create', (p = {}) => {
    const game = ['tienlen', 'baicao', 'caro', 'xidach', 'chess'].includes(p.game) ? p.game : 'tienlen';
    const bet = Math.max(10, Math.min(10000, Number(p.bet) || 10));
    const me = casinoPlayerFrom(socket, myId, { ...(p.player || {}), pid: p.pid });
    leaveCasinoRoom(socket, me.pid);
    const room = casinoNewRoom(game, bet, me);
    casinoRooms.set(room.id, room);
    socket.join('casino:' + room.id);
    socketToRoom.set(socket.id, room.id);
    socket.emit('casino:state', room);
    io.emit('casino:rooms', casinoPublic());
  });
  socket.on('casino:join', (p = {}) => {
    const room = casinoRooms.get(String(p.roomId || '').toUpperCase());
    const me = casinoPlayerFrom(socket, myId, { ...(p.player || {}), pid: p.pid });
    if (!room) { socket.emit('casino:error', { msg: 'Phòng không tồn tại' }); return; }
    if (room.status !== 'waiting') { socket.emit('casino:error', { msg: 'Phòng đang chơi rồi' }); return; }
    if (room.players.length >= casinoMax(room.game)) { socket.emit('casino:error', { msg: 'Phòng đầy' }); return; }
    if (room.players.some((x) => x.pid === me.pid)) {
      socket.join('casino:' + room.id);
      socketToRoom.set(socket.id, room.id);
      socket.emit('casino:state', room);
      return;
    }
    leaveCasinoRoom(socket, me.pid);
    room.players.push(me);
    room.updatedAt = Date.now();
    socket.join('casino:' + room.id);
    socketToRoom.set(socket.id, room.id);
    io.to('casino:' + room.id).emit('casino:state', room);
    io.emit('casino:rooms', casinoPublic());
  });
  socket.on('casino:leave', (p = {}) => {
    leaveCasinoRoom(socket, ccPid(socket, myId, p));
    socket.emit('casino:state', null);
  });
  socket.on('casino:addbot', (p = {}) => {
    const roomId = socketToRoom.get(socket.id);
    const room = roomId && casinoRooms.get(roomId);
    if (!room) return;
    if (room.hostPid !== ccPid(socket, myId, p)) { socket.emit('casino:error', { msg: 'Chỉ chủ phòng thêm máy' }); return; }
    if (room.status !== 'waiting') return;
    if (room.players.length >= casinoMax(room.game)) return;
    const n = room.players.filter((x) => x.bot).length + 1;
    room.players.push({ pid: `bot-${room.id}-${Date.now() % 100000}-${n}`, sid: null, name: ['Máy Lan', 'Máy Tèo', 'Máy Đào', 'Máy Bờm'][n % 4] || ('Máy ' + n), avatar: n % 4, bot: true });
    room.updatedAt = Date.now();
    io.to('casino:' + room.id).emit('casino:state', room);
    io.emit('casino:rooms', casinoPublic());
  });
  socket.on('casino:start', (p = {}) => {
    const roomId = socketToRoom.get(socket.id);
    const room = roomId && casinoRooms.get(roomId);
    if (!room) return;
    if (room.hostPid !== ccPid(socket, myId, p)) { socket.emit('casino:error', { msg: 'Chỉ chủ phòng bắt đầu' }); return; }
    const err = casinoStartRoom(room);
    if (err) { socket.emit('casino:error', { msg: err }); return; }
    touchDeadline(room);
    io.to('casino:' + room.id).emit('casino:state', room);
    io.emit('casino:rooms', casinoPublic());
    casinoMaybeBot(room);
  });
  socket.on('casino:action', (p = {}) => {
    const roomId = socketToRoom.get(socket.id);
    const room = roomId && casinoRooms.get(roomId);
    if (!room || room.status !== 'playing') return;
    const pid = ccPid(socket, myId, p);
    const err = casinoAction(room, pid, p);
    if (err) { socket.emit('casino:error', { msg: err }); return; }
    if (room.status === 'playing' && room.state) touchDeadline(room);
    io.to('casino:' + room.id).emit('casino:state', room);
    io.emit('casino:rooms', casinoPublic());
    casinoMaybeBot(room);
  });
  socket.on('casino:rematch', (p = {}) => {
    const roomId = socketToRoom.get(socket.id);
    const room = roomId && casinoRooms.get(roomId);
    if (!room) return;
    if (room.hostPid !== ccPid(socket, myId, p)) { socket.emit('casino:error', { msg: 'Chỉ chủ phòng mở ván mới' }); return; }
    if (room.status !== 'finished') return;
    room.status = 'waiting';
    room.state = null;
    room.winners = null;
    room.updatedAt = Date.now();
    io.to('casino:' + room.id).emit('casino:state', room);
    io.emit('casino:rooms', casinoPublic());
  });

  socket.on('disconnect', () => {
    socketUser.delete(socket.id);
    const cpid = casinoPidBySocket.get(socket.id);
    if (cpid) { leaveCasinoRoom(socket, cpid); casinoPidBySocket.delete(socket.id); }
    else leaveCasinoRoom(socket, pidOf(myId));
    if (myId) { players.delete(myId); myId = null; emitSoon(); }
  });
});

// dọn người mất kết nối
setInterval(() => {
  const now = Date.now();
  let drop = false;
  for (const [id, p] of players) {
    if (now - (p.updatedAt || 0) > 12000) { players.delete(id); drop = true; }
  }
  if (drop) emitPlayers();
}, 3000);

// casino: hết giờ lượt → trọng tài tự đánh (1s kiểm tra 1 lần)
setInterval(() => {
  const now = Date.now();
  for (const room of casinoRooms.values()) {
    if (room.status !== 'playing' || !room.state || room.state.deadline == null) continue;
    if (now < room.state.deadline) continue;
    // bỏ qua nếu tới lượt bot (bot loop riêng sẽ đánh trong ~1s)
    if (room.state.turn) {
      const cur = room.players.find((x) => x.pid === room.state.turn);
      if (cur?.bot) continue;
    }
    if (casinoAutoTimeout(room)) {
      io.to('casino:' + room.id).emit('casino:state', room);
      io.emit('casino:rooms', casinoPublic());
      casinoMaybeBot(room);
    } else if (room.status === 'playing' && room.state) {
      // không xử được (vd chờ bot) → gia hạn thêm để khỏi lặp vô hạn
      touchDeadline(room);
    }
  }
}, 1000);

// ---------- Start ----------
function lanIps() {
  const out = [];
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const n of nets || []) {
      if (n.family === 'IPv4' && !n.internal) out.push(n.address);
    }
  }
  return out;
}

await loadDb();
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('\n🌾 NÔNG TRẠI PIXEL — LAN server running!');
  console.log(`   Local:  http://localhost:${PORT}/`);
  for (const ip of lanIps()) console.log(`   LAN:    http://${ip}:${PORT}/  ← cho cả mạng vào link này`);
  console.log(`   DB:     ${DB_FILE}`);
  console.log('   (điện thoại + máy khác cùng WiFi mở link LAN là chơi chung)\n');
});

// export pure casino helpers để test parity client/server (thân thật nằm ở games.js)
export {
  xdNewGame, xdHit, xdStand, xdBotAuto, xdRemovePlayer, xdValue, xdStrength, cDeck,
  chNewGame, chApply, chResign, chBot, chLegal, chSAN,
} from './games.js';
