# Đang làm · Việc tiếp theo · Nợ

> **Trả lời:** Đang làm gì, tiếp theo làm gì, và đang nợ những gì?
> **Trạng thái:** 🟢 đủ
> **Cập nhật:** 2026-09-04 · commit —
> **Cập nhật khi:** bắt đầu/kết thúc một việc · brainstorm ra việc mới · cố ý đi đường tắt

## Đang làm

Feature `klondike` — toàn bộ bản đầu của game, trên nhánh `feat/klondike`.
Tài liệu tier-1 và năm ADR đã xong; `docs/specs/klondike/design.md` và `plan.md` đã viết.
Đang ở giai đoạn hiện thực theo `plan.md` — trạng thái từng việc xem checkbox trong file đó.

## Việc tiếp theo

| Việc | Liên quan | Ưu tiên | Vì sao ưu tiên đó |
| --- | --- | --- | --- |
| Hoàn tất `plan.md` của feature `klondike` | FR-01 → FR-12 | cao | Chưa có gì chạy được cho tới khi xong |
| Dựng workflow GitHub Actions build + deploy Pages | — | trung bình | Trang tĩnh chỉ có ích khi có người mở được. Làm sau khi game chạy |
| Đặt `origin` trên GitHub | — | trung bình | Repo hiện chỉ có local, `feature-flow` giả định có `origin/main` |
| Rà lại NFR-PERF-05 bằng số thật từ `next build` | NFR-PERF-05 | thấp | Ngưỡng 150KB hiện là ước lượng, chưa đo |

## Nợ kỹ thuật — cố ý làm tạm

| Chỗ nào | Đã đánh đổi gì | Vì sao chấp nhận | Khi nào buộc phải trả |
| --- | --- | --- | --- |
| nhánh `feat/klondike` trong chính repo, không dùng git worktree | `feature-flow` §3 yêu cầu worktree tách khỏi `main` | Repo chưa có `origin` để lấy `origin/main`, và một worktree riêng buộc phải cài lại `node_modules` lần hai cho một dự án chưa có gì | Ngay khi repo có remote, hoặc khi có feature thứ hai chạy song song |
| chưa có mockup trên canvas Claude Design | `feature-flow` §1 bước 2 yêu cầu ba artboard mỗi màn hình | Người dùng đã yêu cầu chạy một mạch không dừng ở cổng duyệt nào; canvas chỉ có nghĩa khi có người xem và duyệt nó | Trước feature UI tiếp theo, hoặc khi bố cục cần thay đổi lớn |
