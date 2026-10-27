# legacy-vanilla/ — Bản gốc vanilla JS (KHÔNG build, KHÔNG deploy)

> ⚠️ **LEGACY — tham khảo, không dùng trong production.**

## Đây là gì?
Bản game "Nông Trại Pixel" **đầu tiên** viết bằng vanilla JS thuần (916 dòng `main.js` + canvas 2D) — phiên bản single-player, lưu localStorage, trước khi cả dự án được viết lại bằng React + TypeScript.

## Vai trò hiện tại
- **Tham khảo logic gameplay gốc**: dữ liệu cây/cá/vật nuôi gốc (`CROPS`, `FISHES`, `ANIMALS`), cơ chế trồng-tưới-thu hoạch, cân bằng giá ban đầu.
- Bản React (`src/`) đã thay thế hoàn toàn về tính năng + thêm multiplayer (LAN server), casino, làng chung, sự kiện...
- **Không được import vào app chính**, không build vào `dist/`, server không serve thư mục này.

## Nếu muốn chạy thử (thủ công)
```bash
# chỉ mở file tĩnh, không cần build
open legacy-vanilla/index.html
```

## Chính sách bảo trì
- **Không sửa** trừ khi phát hiện dữ liệu bản quyền/lỗi nghiêm trọng.
- Khi cần đối chiếu logic (kinh tế, thời gian lớn) — dùng làm tài liệu so sánh.
- Candidate để xoá khi bản React đã ổn định ≥ 2 version (ghi nhận trong plan).
