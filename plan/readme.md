# PLAN — Chiến dịch "Lột xác" 8 giờ · game-my-happy-farm

> Mục tiêu: đưa toàn bộ repo lên chuẩn enterprise: main app (React+TS) + server LAN + legacy.
> Quy trình: plan → update → build/test/lint xanh → commit → self-review → loop.
> Baseline tại 00:50 (bắt đầu chiến dịch): tests 11/11 ✅ · tsc ✅ · lint ✅ · build ✅ · 20 file modified chưa commit.

## Phạm vi thực tế
Folder `github-refactor/game` chỉ chứa **1 git repo** duy nhất (`game-my-happy-farm`) gồm 3 phần:

| Phần | Quy mô | Trạng thái ban đầu |
|---|---|---|
| `src/` — main app (React 18 + TS + Canvas) | ~60 file | Đã nâng cấp trước đó (thành tựu, minigame, juice, tests) — **chưa commit** |
| `server/index.js` — Express + socket.io LAN server | 1507 dòng | **Chưa từng audit**; logic casino/chess pure, có `__test` export nhưng 0 test |
| `legacy-vanilla/` — bản vanilla JS cũ | 916 dòng + html/css | Không build, không doc, không rõ vai trò |

## Các mốc công việc (8 giờ)

### H1 — Chốt hiện tại + plan
- [x] Audit xong `server/index.js` (toàn bộ 1507 dòng)
- [x] Viết plan này
- [ ] Commit batch nâng cấp main app (20 file) — tách lịch sử rõ ràng

### H2–H3 — Server enterprise
Kết quả audit server (cụ thể, đã đọc toàn bộ file):
1. **`server/data/db.json` bị track trong git** — dữ liệu người chơi (username, farm) vào lịch sử git. → Thêm `.gitignore`, `git rm --cached`, seed DB trống nếu cần.
2. **`pos` handler không validate** — `pl.x = p.x; pl.y = p.y` nhận mọi thứ (NaN, chuỗi, object, toạ độ âm/trillions) → lan vào publicList cho mọi client. Sửa: ép `Number()`, giới hạn trong WORLD bounds, fallback giá trị cũ khi NaN.
3. **`/api/farms/:code/steal`** — `plot` chỉ qua `Number()`: chấp nhận `0.5`, `-1`, `1e9`. Sửa: `Number.isInteger`, 0 ≤ plot < 200.
4. **`farm:save` qua socket không giới hạn kích thước** (socket event không đi qua `express.json`). Sửa: giới hạn JSON depth/size cơ bản, reject data > ~256KB.
5. **Rate-limit nhẹ** cho `chat` (anti-spam bubble) — 1 msg/300ms/socket.
6. **Dead code**: nhánh `players.length < 1` (dòng 252) + `if (notify)` rỗng (dòng 274) → dọn.
7. **Tests cho logic casino/chess** qua `__test` đã export: xì dách value/bust, chess legal/checkmate/SAN/castling — đưa server logic vào vitest.
8. Giữ nguyên hợp đồng client↔server: `codeFromName` deterministic, event names, payload shapes. **Không đổi bất kỳ wire format nào.**

### H4 — Legacy triage
- `legacy-vanilla/`: đọc nhanh, đánh dấu trong README (định hướng: giữ làm tham khảo, thêm README giải thích + không build vào dist). Không refactor sâu — chi phí/ích lợi thấp.

### H5–H6 — Main app hardening
- [ ] React **ErrorBoundary** bọc GameCanvas (crash 1 frame không giết cả app)
- [ ] Tests bổ sung: `sellPrice`, payout minigame, quest logic (nếu pure)
- [ ] README cập nhật: kiến trúc, scripts, server LAN, cách test
- [ ] CI: GitHub Actions — tsc + lint + test + build

### H7 — Loop audit
- Chạy lại toàn bộ gate sau mỗi commit; self-review diff; sửa hết warning.

### H8 — Final report
- Tổng kết trước/sau từng phần, số liệu bundle, số test, backlog còn lại.

## Ràng buộc không được phá
- Kinh tế đã cân bằng (giá nền, sellPrice, casino bet 10..10000)
- 60fps; bundle ≤ +20%
- TS strict, no `any`
- Tiếng Việt cho UI/comment
- Wire format client↔server giữ nguyên 100%

## Tiêu chí dừng vòng lặp
Không còn (a) lỗi tsc/lint/test, (b) bug logic đã biết, (c) cải thiện cấu trúc có ROI rõ — trong 2 vòng audit liên tiếp.
