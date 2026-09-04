# ADR-0006 · Mở một ván cụ thể qua tham số địa chỉ `?van=<seed>`

> **Ngày:** 2026-09-04
> **Trạng thái:** accepted
> **Liên quan:** FR-13 · FR-09 · ADR-0001 · ADR-0005

## 1. Bối cảnh

Ván đã là hàm thuần của một seed (ADR-0001) và số hiệu ván đã hiện trên màn hình, nhưng chưa có cách nào mở lại đúng ván đó sau khi đóng tab — ADR-0005 đã chốt là không lưu gì trên máy người dùng.

Cùng lúc, bộ E2E cần một thế bài xác định. Không có cách đặt seed, mọi test đầu-cuối hoặc phải chấp nhận thế bài ngẫu nhiên (rồi chỉ kiểm được những khẳng định chung chung), hoặc phải có một lối vào chỉ dành cho test — thứ tệ hơn hẳn, vì nó là code sản phẩm tồn tại chỉ để phục vụ test.

## 2. Quyết định

Trang đọc `?van=<số>` khi tải. Có tham số hợp lệ thì chia đúng ván đó; không có hoặc không hợp lệ thì chia ngẫu nhiên như cũ. Bấm **Ván mới** cập nhật địa chỉ bằng `history.replaceState` để người chơi luôn sao chép được ván đang chơi.

## 3. Phương án đã loại

| Phương án | Vì sao loại |
| --- | --- |
| Một lối vào chỉ dành cho test (`window.__setSeed`) | Code sản phẩm tồn tại vì test là nợ vĩnh viễn, và nó không phục vụ người dùng thật lấy một lần |
| Ô nhập số hiệu ván trong giao diện | Giải được cùng vấn đề nhưng thêm một thành phần giao diện, và không chia sẻ được bằng cách dán đường dẫn |
| Chấp nhận E2E chạy trên ván ngẫu nhiên | Test chỉ còn khẳng định được những điều chung chung; một lỗi luật ở thế bài cụ thể sẽ không tái tạo được |

## 4. Hệ quả

**Được:**
- Chia sẻ và mở lại một ván chỉ bằng đường dẫn, mà vẫn không lưu gì trên máy người dùng — không mâu thuẫn với ADR-0005.
- E2E chạy trên thế bài cố định, nên một lỗi luật tái tạo được y hệt.
- Không có lối vào nào chỉ dành cho test.

**Mất / phải chấp nhận:**
- Seed trở thành một phần giao diện công khai: đổi thuật toán chia bài hay PRNG sẽ làm mọi đường dẫn cũ trỏ sang ván khác. Chấp nhận vì không có gì phụ thuộc vào đường dẫn cũ ngoài sự tò mò của người chơi.
- Phải xử lý tham số rác (`?van=abc`, số âm, quá lớn) — rơi về ván ngẫu nhiên, không báo lỗi.

**Điều kiện xem lại quyết định này:** nếu có tính năng thống kê hay bảng xếp hạng, vì lúc đó một ván mở sẵn từ đường dẫn trở thành đường gian lận.
