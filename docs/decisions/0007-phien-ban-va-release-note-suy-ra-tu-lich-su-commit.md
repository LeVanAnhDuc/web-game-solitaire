# ADR-0007 · Số phiên bản và release note suy ra từ lịch sử commit

> **Ngày:** 2026-09-04
> **Trạng thái:** accepted
> **Liên quan:** NFR-PERF-05 · NFR-SEC-05

## 1. Bối cảnh

Repo đẩy thẳng lên `main` rồi GitHub Pages phục vụ `out/`. Cần một cách phát hành có số phiên bản và ghi chú, mà không phụ thuộc vào việc ai đó nhớ làm gì. Ràng buộc thật của dự án này: công việc thường được **merge nhánh ở máy rồi push**, không phải lúc nào cũng qua pull request, và không có nhãn (label) nào trên PR.

Bốn game cùng thư mục đã thử hai cách. `web-game-gomoku` viết toàn bộ logic bằng shell nhúng thẳng trong workflow và dùng `gh release create --generate-notes`; `web-game-minesweeper` tách ra thành script trong repo và tự dựng ghi chú từ commit.

## 2. Quyết định

Theo cách của minesweeper. Ba workflow tách bạch — `ci.yml` (mọi PR và mọi push), `deploy.yml` (Pages), `release.yml` (tag + release) — và hai script nằm trong repo:

- `scripts/next-version.sh` quyết định tag kế tiếp từ tiền tố Conventional Commit kể từ tag trước, có `--explain` để in lý do.
- `scripts/release-notes.sh` dựng thân release note bằng cách gom **subject** của các commit theo tiền tố.

Cả hai chạy được ở máy qua `yarn release:next` và `yarn release:notes`.

Kèm theo, hai ngưỡng trong `nfr.md` chuyển từ "review bằng mắt" sang cổng chặn trong CI: `scripts/check-bundle-size.mjs` (NFR-PERF-05) và `scripts/check-audit.mjs` (NFR-SEC-05).

## 3. Phương án đã loại

| Phương án | Vì sao loại |
| --- | --- |
| `gh release create --generate-notes` | Nó liệt kê **pull request đã merge**. Merge nhánh ở máy rồi push thì nó không thấy gì — gomoku phát hành v1.0.0 đến v1.0.2 với ghi chú chỉ có mỗi một đường link. Thứ dự án này thật sự có là subject theo Conventional Commits trên mọi commit |
| Nhúng shell thẳng trong workflow (cách gomoku) | Chỉ kiểm chứng được bằng cách push lên `main`. Một quy trình phát hành mà không thử được ở máy là quy trình không ai thử |
| Sinh ghi chú bằng `--generate-notes` rồi nối thêm phần từ commit (cách gomoku bản sau) | Cho ra hai danh sách nói cùng một chuyện theo hai giọng khác nhau, và thứ tự phụ thuộc việc công việc vào bằng PR hay bằng push |
| `semantic-release` | Kéo theo cả một cây phụ thuộc và một tệp cấu hình để làm đúng thứ mà 90 dòng shell đã làm, cho một dự án phát hành một trang tĩnh |

## 4. Hệ quả

**Được:**
- Phát hành không cần ai nhớ gì: push `main` là có tag và ghi chú.
- Cả số phiên bản lẫn ghi chú thử được ở máy trước khi push.
- Commit không theo Conventional Commits vẫn được liệt kê ở mục "Other" thay vì bị nuốt mất — một ghi chú phát hành nuốt commit là ghi chú đã bắt đầu nói dối.
- Hai ngưỡng phi chức năng có cổng chặn thật thay vì lời hứa.

**Mất / phải chấp nhận:**
- Chất lượng ghi chú phụ thuộc hoàn toàn vào chất lượng subject của commit. Đây vừa là giá phải trả vừa là áp lực đúng hướng.
- Ba workflow chạy song song trên mỗi lần push `main`, và cả `deploy` lẫn `release` đều chạy lại test thay vì tin vào `ci`. Tốn thêm vài phút máy; đổi lại không có workflow nào giả định một kết quả xanh mà nó không tự nhìn thấy.
- `scripts/check-audit.mjs` được sửa so với bản gốc của minesweeper: bản gốc in "no high or critical advisory (0 total)" và **thoát 0 khi `yarn audit` không chạy được** (hết thời gian chờ registry chẳng hạn). Bản ở đây đỏ trong trường hợp đó. Một cổng an ninh xanh lúc nó chưa hề chạy còn tệ hơn là không có cổng.

**Điều kiện xem lại quyết định này:** nếu dự án chuyển hẳn sang làm việc qua pull request có nhãn, vì lúc đó `--generate-notes` mới thật sự có dữ liệu.
