# ADR-0005 · Không lưu ván đang chơi; tải lại trang là ván mới

> **Ngày:** 2026-09-04
> **Trạng thái:** accepted
> **Liên quan:** FR-09 · NFR-DATA-01

## 1. Bối cảnh

Ván Klondike kéo dài năm đến mười phút. Lỡ tải lại trang giữa chừng là mất ván. Cơ chế `seed + Move[]` của ADR-0001 khiến việc lưu rất rẻ — chỉ một số nguyên và một mảng nước đi, ghi vào localStorage là xong.

## 2. Quyết định

Vẫn không lưu. Trạng thái ván sống trong bộ nhớ; đóng tab hay tải lại là bắt đầu ván mới. Dự án không chạm vào localStorage, cookie, hay bất kỳ kho lưu trữ nào của trình duyệt.

## 3. Phương án đã loại

| Phương án | Vì sao loại |
| --- | --- |
| Lưu `seed + Move[]` vào localStorage | Rẻ về code nhưng không rẻ về ràng buộc: mỗi lần đổi biểu diễn `Move` là bản lưu cũ thành rác, và phải có nhánh xử lý bản lưu hỏng. Đổi lại một tiện lợi mà người chơi giải trí ngắn hiếm khi cần |
| Lưu nguyên `GameState` | Cùng nhược điểm, dữ liệu to hơn, và gắn chặt hơn nữa vào cấu trúc nội bộ |

## 4. Hệ quả

**Được:**
- Không có trạng thái nào sống qua các phiên, nên không có lớp di trú dữ liệu và không có bug "chỉ xảy ra trên máy tôi".
- NFR-DATA-01 trở thành một khẳng định kiểm được bằng `grep`: dự án không đọc ghi gì trên máy người dùng.

**Mất / phải chấp nhận:**
- Tải lại trang giữa ván là mất ván. Đây là một nhược điểm thật, người chơi sẽ gặp, và nó được chấp nhận có ý thức chứ không phải bị bỏ sót.
- Số hiệu ván hiện trên UI để ai muốn giữ ván thì tự ghi lại — đó là toàn bộ phần bù đắp.

**Điều kiện xem lại quyết định này:** nếu có tính năng chia sẻ ván hoặc thống kê, vì lúc đó lưu trữ đã phải tồn tại vì lý do khác.
