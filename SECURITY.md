# Security Posture — game-my-happy-farm

## Tổng quan
Repo là game web single-player + LAN server. Không phục vụ production internet công khai.

## Dependency vulnerabilities (npm audit)

| Package | Severity | Fixable | Lý do |
|---|---|---|---|
| `tinypool <= 2.1.0` (via vitest) | **CRITICAL** | ⚠️ vitest 5 = Vite 6 = breaking | Dev-only (vitest). Không ảnh hưởng production. |
| `esbuild <= 0.24.2` (via Vite 5) | MODERATE | ⚠️ Vite 8 = ESM breaking | Dev-only bundler. |
| `body-parser < 2.4.0` (server) | HIGH | ✅ `npm audit fix` | LAN server localhost. Không có attacker ngoài mạng LAN. |
| `qs < 6.16.1` | MODERATE | ⚠️ breaking change | Chỉ dùng parse body, có express.json limit. |
| `postcss-selector-parser` | MODERATE | ✅ `npm audit fix` | Dev-only. |

## Hành động

### Cần fix sớm (1 dòng, không break):
```bash
npm audit fix  # fix body-parser + postcss-selector-parser + qs (safe)
```

### Chờ release (Vite 6 stable):
```bash
# Khi Vite 6 stable: npx vitest upgrade --to 5.x
# Hoặc giữ vitest 2.1.9 + accept risk (dev-only, localhost)
```

## Server security (LAN)

- Server chỉ bind `0.0.0.0` trên mạng LAN (không internet).
- CORS `origin: *` — có thể chỉnh thành IP LAN cụ thể nếu cần.
- Không có authentication — thiết kế LAN party (trust network).
- `server/data/db.json` đã untracked khỏi git (user data riêng).
- `farm:save` có giới hạn kích thước 256KB.
- Socket `pos` được validate (NaN/overflow bị chặn).
- `/api/farms/:code/steal` yêu cầu plot là số nguyên dương.

## Khuyến nghị dài hạn
- Tách server production (`server/`) khỏi game client (migrate qua Supabase hoặc Auth0).
- Thêm `helmet` + rate-limit middleware khi lên production.
- Chạy `npm audit --production` để check dependencies của server.
