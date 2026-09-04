# Đang làm · Việc tiếp theo · Nợ

> **Trả lời:** Đang làm gì, tiếp theo làm gì, và đang nợ những gì?
> **Trạng thái:** 🟢 đủ
> **Cập nhật:** 2026-09-04 · commit —
> **Cập nhật khi:** bắt đầu/kết thúc một việc · brainstorm ra việc mới · cố ý đi đường tắt

## Đang làm

Không có việc nào đang dở. Feature `klondike` đã xong trên nhánh `feat/klondike`:
FR-01 → FR-13 đều `xong`, 208 test Vitest và 85 test Playwright (4 bề rộng) xanh,
`yarn typecheck` / `yarn lint` / `yarn build` xanh, first-load JS đo được 110KB.

CI/CD đã dựng theo khuôn của `web-game-minesweeper` (ADR-0007): `ci.yml`, `deploy.yml`,
`release.yml`, cùng bốn script chạy được ở máy. Chưa workflow nào chạy lần nào — chúng
chỉ khởi động ở lần push đầu tiên lên `main`.

## Việc tiếp theo

| Việc | Liên quan | Ưu tiên | Vì sao ưu tiên đó |
| --- | --- | --- | --- |
| Bật GitHub Pages cho repo (Settings → Pages → Source: GitHub Actions) | — | cao | Đây là bước duy nhất phải làm bằng tay. Ba workflow đã sẵn nhưng `deploy.yml` sẽ đỏ cho tới khi Pages được bật |
| Merge `feat/klondike` vào `main` | — | cao | Push đầu tiên lên `main` sẽ chạy CI, deploy, và phát hành `v1.0.0` |
| E2E chơi hết một ván **bằng kéo thả** | FR-04 | trung bình | Hiện kéo thả chỉ được kiểm ở mức một nước; hai lối vào phải cho cùng kết quả, và đó đúng là thứ dễ trôi ra khỏi nhau |
| Đo NFR-PERF-02 trên máy thật, có throttle CPU | NFR-PERF-02 | trung bình | Ngưỡng 100ms mỗi nước chưa từng được đo; mọi thứ khác trong `nfr.md` đã có số |
| Xem lại `--overlap-up` ở 320px | FR-11 | thấp | Ở 320px lá bài rộng ~41px, dải nhìn thấy của lá bị che còn 18px — chơi được nhưng chật |

## Nợ kỹ thuật — cố ý làm tạm

| Chỗ nào | Đã đánh đổi gì | Vì sao chấp nhận | Khi nào buộc phải trả |
| --- | --- | --- | --- |
| nhánh `feat/klondike` trong chính repo, không dùng git worktree | `feature-flow` §3 yêu cầu worktree tách khỏi `main` | Lúc bắt đầu repo chưa có `origin`, và một worktree riêng buộc phải cài lại `node_modules` lần hai cho một dự án chưa có dòng code nào | Ở feature thứ hai, hoặc ngay khi có hai nhánh chạy song song |
| chưa có mockup trên canvas Claude Design | `feature-flow` §1 bước 2 yêu cầu ba artboard mỗi màn hình | Người dùng yêu cầu chạy một mạch không dừng ở cổng duyệt nào; canvas chỉ có nghĩa khi có người xem và duyệt. Bù lại: wireframe ASCII trong `design.md` §3, token đo tương phản thật trong `MASTER.md`, và ảnh chụp app thật ở 320/375/768/1440 | Trước feature UI tiếp theo, hoặc khi bố cục đổi lớn |
| `scripts/find-winnable.ts` tìm được lời giải nhưng rất chậm | Tìm kiếm DFS thuần với bảng chuyển vị, không có heuristic mạnh | Nó chỉ cần chạy một lần để sinh fixture, và fixture đã được commit. Không nằm trên đường CI | Khi cần thêm ván mẫu thứ hai, hoặc khi luật/PRNG đổi làm fixture cũ hết đúng |
| `e2e/fixtures/winnable.json` gắn chặt với thuật toán chia bài | Đổi `mulberry32`, thứ tự `createDeck`, hay cách xáo là fixture trỏ sang ván khác và `win.spec.ts` đỏ | Đây là tính chất mong muốn: cùng seed phải cho cùng ván (ADR-0001), nên fixture đỏ chính là cảnh báo đúng | Khi nào thật sự đổi cách chia bài — lúc đó sinh lại fixture |
