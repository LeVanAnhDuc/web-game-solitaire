# Tổng quan sản phẩm

> **Trả lời:** Sản phẩm này là gì, cho ai, và **KHÔNG** làm gì?
> **Trạng thái:** 🟢 đủ
> **Cập nhật:** 2026-09-04 · commit —
> **Cập nhật khi:** định vị đổi · thêm/bớt một Non-Goal · trần chi phí đổi

## 1. Một câu định vị

Một ván Klondike Solitaire chơi ngay trong trình duyệt, không đăng nhập, không quảng cáo, không xin quyền gì — mở là chơi được trên cả điện thoại lẫn máy tính.

## 2. Vấn đề đang giải

Solitaire miễn phí trên web hiện nay hoặc chèn quảng cáo giữa ván, hoặc đòi tài khoản để lưu tiến độ, hoặc chỉ chơi được bằng kéo thả nên trên điện thoại rất khó thao tác. Người muốn giết mười phút không có lựa chọn nào sạch sẽ.

Về phía dự án, đây còn là bài kiểm chứng: một game có luật chặt chẽ là chỗ tốt nhất để thử tách hoàn toàn engine thuần khỏi tầng React, và để đo xem bộ tài liệu hai tầng của workspace này có giữ được mạch khi một dự án đi từ số không đến chạy được.

## 3. Người dùng mục tiêu

Người chơi giải trí ngắn, đã biết luật Klondike, mở game trong lúc rảnh. Nhóm chính là **người dùng điện thoại** — họ vào nhiều hơn và bị phục vụ tệ hơn. Nhóm phụ là người dùng máy tính quen kéo thả bằng chuột. Không có nhóm quản trị, không có người dùng nội bộ.

## 4. Non-Goals — dứt khoát không làm

- **Không có tài khoản, không có server, không có backend.** Toàn bộ chạy trên máy người dùng dưới dạng trang tĩnh; thêm server là đổi cả mô hình chi phí lẫn mô hình bảo mật để đổi lấy một thứ chưa ai cần.
- **Không lưu ván đang chơi.** Tải lại trang là ván mới. Đã cân nhắc và loại ở giai đoạn brainstorm — xem [`ADR-0005`](../decisions/0005-khong-luu-van-dang-choi.md).
- **Không có biến thể nào ngoài Klondike.** Không Spider, không FreeCell, không Pyramid. Mỗi biến thể là một bộ luật riêng, và bộ luật thứ hai sẽ kéo theo một lớp trừu tượng mà bản đầu không cần.
- **Không đồng hồ, không điểm, không thống kê, không bảng xếp hạng.** Đây là những thứ nghe rất hợp lý và vẫn bị từ chối: chúng biến một trò thư giãn thành một trò để đo, và kéo theo localStorage, di trú dữ liệu, chống gian lận.
- **Không gợi ý nước đi (hint).** Cần một bộ xếp hạng nước đi mà bản đầu không có việc gì khác để dùng lại.
- **Không đảm bảo ván nào cũng thắng được.** Khoảng 20% ván Klondike chia ngẫu nhiên là vô nghiệm; đó là bản chất của trò chơi, không phải lỗi.
- **Không âm thanh.** Một hệ tài nguyên nữa để tải, một nút tắt tiếng nữa để làm, đổi lại gần như không thêm gì.
- **Không đa ngôn ngữ.** UI chỉ tiếng Việt.

## 5. Mô hình

| Câu hỏi | Trả lời |
| --- | --- |
| Ai trả tiền | Không ai — dự án học tập |
| Trả bằng gì | — |
| **Trần chi phí hạ tầng / tháng** | **0 đ.** Trang tĩnh trên GitHub Pages. Ràng buộc này là lý do Non-Goal đầu tiên tồn tại: không có ngân sách cho bất kỳ tiến trình nào chạy thường trực |

## 6. Thế nào là thành công

1. Chơi trọn một ván Klondike từ lúc chia đến lúc thắng mà không gặp thế bài kẹt do lỗi luật — kiểm bằng bộ test luật cộng một lượt E2E đi hết ván.
2. Trên điện thoại 375px, mọi nước đi thực hiện được **chỉ bằng chạm**, không cần kéo, không cần phóng to.
3. Cùng một seed luôn cho ra cùng một thế bài, và undo về nước thứ *n* luôn ra đúng thế bài của nước thứ *n* — kiểm bằng property test.
