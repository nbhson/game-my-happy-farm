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
- [x] Commit batch nâng cấp main app (20 file) — commit `2426e36`

### H2–H3 — Server enterprise ✅ HOÀN TẤT (commit `2bece43`)
Kết quả audit server (cụ thể, đã đọc toàn bộ file):
1. ✅ **`server/data/db.json` untracked** — .gitignore + `git rm --cached`
2. ✅ **`pos` handler validate** — ép `Number()`, giới hạn bound, chặn NaN
3. ✅ **`/steal` plot validate** — `Number.isInteger`, 0..199
4. ✅ **`farm:save` cap 256KB** qua socket
5. ✅ **Rate-limit chat** 1 tin/300ms/socket
6. ✅ **Dead code dọn** (nhánh `< 1`, stub `notify`)
7. ✅ **Tách `server/games.js`** (1023 dòng logic pure) + **23 unit tests** qua vitest (chess legal/SAN/apply/resign, xì dách, casino room, caro, bài cào) — tổng 34/34
8. ✅ Wire format giữ nguyên 100% (smoke test: boot + health + PUT/POST + validate chặn plot '1.5')

### H4 — Legacy triage ✅ HOÀN TẤT (commit `b5cf8dc`)
- ✅ `legacy-vanilla/README.md`: đánh dấu LEGACY + chính sách + hướng dẫn chạy thủ công

### H5–H6 — Main app hardening ✅ HOÀN TẤT (commit `b5cf8dc`)
- ✅ ErrorBoundary bọc GameCanvas
- ✅ CI GitHub Actions (tsc + lint + vitest + build + node --check server)
- ✅ README đã có sẵn chi tiết (không cần viết lại)

### H7 — Loop audit (đang chạy)
- [ ] Rà lại các check sau mỗi commit
- [ ] Bonus: kiểm tra dead code toàn repo (loại trừ legacy)

### H8 — Final report
- [ ] Tổng kết trước/sau, số liệu, backlog

## Ràng buộc không được phá
- Kinh tế đã cân bằng (giá nền, sellPrice, casino bet 10..10000)
- 60fps; bundle ≤ +20%
- TS strict, no `any`
- Tiếng Việt cho UI/comment
- Wire format client↔server giữ nguyên 100%

## Tiêu chí dừng vòng lặp
Không còn (a) lỗi tsc/lint/test, (b) bug logic đã biết, (c) cải thiện cấu trúc có ROI rõ — trong 2 vòng audit liên tiếp.
